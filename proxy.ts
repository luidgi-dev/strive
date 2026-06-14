//proxy.ts
import { createServerClient } from "@supabase/ssr";
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
  // to ensure the token is validated server-side and not just read from the cookie
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isAuthPage = pathAfterLocale.startsWith("/auth");
  const isProtectedRoute = pathAfterLocale.startsWith("/protected");
  const isLandingPage = pathAfterLocale === "/";

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

  // Authenticated users are redirected away from landing and auth pages.
  // Exception: auth callback routes (/auth/confirm, /auth/confirmed) are always
  // allowed through so the confirmation token can be consumed correctly.
  if (user && !isAuthCallback && (isLandingPage || isAuthPage)) {
    const url = request.nextUrl.clone();
    url.pathname = withLocale("/protected");
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
    // (404), so the service worker can never register.
    "/((?!_next/static|_next/image|favicon.ico|sw\\.js|site\\.webmanifest|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};