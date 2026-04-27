import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

/**
 * Next.js Proxy (formerly Middleware)
 * Handles session refresh and route protection for all matched requests.
 */
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

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
          response = NextResponse.next({ request });
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

  const { pathname } = request.nextUrl;

  const isAuthPage       = pathname.startsWith("/auth");
  const isProtectedRoute = pathname.startsWith("/protected");
  const isLandingPage    = pathname === "/";

  // Auth callback routes that must never be intercepted, even when the user
  // is already logged in — consuming the token requires the page to load fully
  const isAuthCallback =
    pathname === "/auth/confirm" ||
    pathname === "/auth/confirmed";

  // Unauthenticated users cannot access protected routes
  if (!user && isProtectedRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/auth/login";
    return NextResponse.redirect(url);
  }

  // Authenticated users are redirected away from landing and auth pages.
  // Exception: auth callback routes (/auth/confirm, /auth/confirmed) are always
  // allowed through so the confirmation token can be consumed correctly.
  if (user && !isAuthCallback && (isLandingPage || isAuthPage)) {
    const url = request.nextUrl.clone();
    url.pathname = "/protected";
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
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};