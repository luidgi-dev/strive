//proxy.ts
import * as Sentry from "@sentry/nextjs";
import { createServerClient } from "@supabase/ssr";
import type { User } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";

import { defaultLocale, locales, type Locale } from "@/i18n";

/**
 * Next.js Proxy (formerly Middleware)
 * Handles session refresh and route protection for all matched requests.
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const pathnameSegments = pathname.split("/").filter(Boolean);
  const maybeLocale = pathnameSegments[0];
  const hasLocalePrefix = locales.includes(maybeLocale as Locale);
  const locale = (hasLocalePrefix ? maybeLocale : defaultLocale) as Locale;
  const pathAfterLocale = hasLocalePrefix
    ? `/${pathnameSegments.slice(1).join("/")}` || "/"
    : pathname || "/";
  const withLocale = (targetPath: string) =>
    locale === defaultLocale ? targetPath : `/${locale}${targetPath}`;

  // Stamp the resolved locale on the request so server-side next-intl APIs
  // (getRequestConfig, getMessages, getTranslations) can read it without
  // relying on next-intl's auto-detection, which does not work reliably with
  // our custom rewrite below.
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-strive-locale", locale);

  let response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  // Keep English URLs clean with a rewrite while preserving locale-aware routes.
  if (!hasLocalePrefix) {
    const rewriteUrl = request.nextUrl.clone();
    rewriteUrl.pathname =
      pathname === "/" ? `/${defaultLocale}` : `/${defaultLocale}${pathname}`;
    response = NextResponse.rewrite(rewriteUrl, {
      request: {
        headers: requestHeaders,
      },
    });
  }

  // Initialize Supabase client with cookie handling for SSR session management
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );

          const rewritePath = response.headers.get("x-middleware-rewrite");
          response = NextResponse.next({
            request: { headers: requestHeaders },
          });
          if (rewritePath) {
            response.headers.set("x-middleware-rewrite", rewritePath);
          }

          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresh the session on every request — must use getUser() (not getSession())
  // to ensure the token is validated server-side and not just read from the cookie.
  // Wrapped in try/catch + manual Sentry capture: Next.js 16 does not forward
  // errors thrown inside proxy.ts to instrumentation's onRequestError
  // (see vercel/next.js#85261), so an unhandled auth failure here would otherwise
  // be invisible. On failure we degrade to an unauthenticated request (route
  // protection still applies) rather than 500 every page.
  let user: User | null = null;
  try {
    const result = await supabase.auth.getUser();
    user = result.data.user;
  } catch (error) {
    Sentry.captureException(error);
  }

  const isAuthPage = pathAfterLocale.startsWith("/auth");
  const isProtectedRoute = pathAfterLocale.startsWith("/protected");
  const isLandingPage = pathAfterLocale === "/";
  // `/protected` has no content of its own — it only forwards to the app home
  // (Rhythm). We forward here, before any render, so the protected layout is
  // never mounted on it (see the authenticated-redirect block below).
  const isProtectedHome = pathAfterLocale === "/protected";

  // Auth callback routes that must never be intercepted, even when the user
  // is already logged in — consuming the token requires the page to load fully
  const isAuthCallback =
    pathAfterLocale === "/auth/confirm" || pathAfterLocale === "/auth/confirmed";

  // Unauthenticated users cannot access protected routes
  if (!user && isProtectedRoute) {
    const url = request.nextUrl.clone();
    url.pathname = withLocale("/auth/login");
    return NextResponse.redirect(url);
  }

  // Authenticated users have no use for the landing page, auth pages, or the
  // bare `/protected` forwarder — send them straight to the app home with a
  // clean 307. Routing through `/protected` would render the protected layout
  // (and its unseen-nudge toast) on a throwaway page; on mount the toast fires
  // the markNudgesSeen server action, which then races the onward client
  // navigation to `/protected/flow` and breaks it — a standalone PWA surfaces
  // that as a native "This page couldn't load". Redirecting before any render
  // removes the race entirely.
  // Exception: auth callback routes (/auth/confirm, /auth/confirmed) are always
  // allowed through so the confirmation token can be consumed correctly.
  if (
    user &&
    !isAuthCallback &&
    (isLandingPage || isAuthPage || isProtectedHome)
  ) {
    const url = request.nextUrl.clone();
    url.pathname = withLocale("/protected/flow");
    return NextResponse.redirect(url);
  }

  return response;
}

/**
 * Matcher configuration.
 * Excludes static assets and Next.js internals to avoid unnecessary proxy runs.
 */
export const config = {
  matcher: [
    // sw.js and site.webmanifest must be served from the root unprefixed —
    // without these exclusions the locale rewrite turns /sw.js into /en/sw.js
    // (404), so the service worker can never register. `_vercel` is excluded for
    // the same reason: Vercel Web Analytics serves its script and beacons from
    // /_vercel/insights/* and the locale rewrite would break them.
    "/((?!_next/static|_next/image|_vercel|favicon.ico|sw\\.js|site\\.webmanifest|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};