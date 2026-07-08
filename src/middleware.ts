import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const isAuthRoute = request.nextUrl.pathname.startsWith("/login");
  const isPasswordResetRoute =
    request.nextUrl.pathname.startsWith("/forgot-password") ||
    request.nextUrl.pathname.startsWith("/reset-password");
  const isPublicRoute = isAuthRoute || isPasswordResetRoute;

  let response = NextResponse.next({ request });
  let user = null;

  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
            response = NextResponse.next({ request });
            cookiesToSet.forEach(({ name, value, options }) =>
              response.cookies.set(name, value, options)
            );
          },
        },
      }
    );

    // The password-recovery email link lands on /reset-password?code=... --
    // exchange it for a session here (middleware is the only place that can
    // actually persist the resulting cookies before the page renders; a
    // Server Component render body can't mutate cookies, see server.ts).
    if (request.nextUrl.pathname === "/reset-password") {
      const code = request.nextUrl.searchParams.get("code");
      if (code) {
        await supabase.auth.exchangeCodeForSession(code);
      }
    }

    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();
    user = authUser;

    // A Supabase session can be valid (getUser() succeeds) for an account
    // with no matching `profiles` row — never provisioned, or an orphaned/
    // stale session. Left unchecked this loops forever: this middleware
    // sends an "authenticated" user away from /login to /dashboard, and the
    // dashboard layout's own profile check sends a profile-less user right
    // back to /login (ERR_TOO_MANY_REDIRECTS). Signing out here, on /login,
    // breaks the cycle instead of just relocating it.
    if (user && isAuthRoute) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("id", user.id)
        .maybeSingle();
      if (!profile) {
        await supabase.auth.signOut();
        user = null;
      }
    }
  } catch (error) {
    // Misconfigured env vars or Supabase unreachable — fail safe to
    // "unauthenticated" instead of crashing the request with a 500. This is
    // exactly the case that previously surfaced as a raw Internal Server
    // Error: a bad/missing NEXT_PUBLIC_SUPABASE_URL threw inside
    // createServerClient before any redirect logic ran.
    console.error("middleware: failed to resolve Supabase session", error);
  }

  if (!user && !isPublicRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (user && isAuthRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api/health|brand/).*)"],
};
