import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const ADMIN_EMAIL = "samahn240@gmail.com";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow auth callback and login through unconditionally
  if (
    pathname === "/lab/login" ||
    pathname === "/login" ||
    pathname.startsWith("/auth/")
  ) {
    return NextResponse.next();
  }

  // Determine which section we're protecting
  const isLab = pathname.startsWith("/lab") || pathname.startsWith("/api/lab");
  const isAdmin = pathname.startsWith("/admin");

  if (!isLab && !isAdmin) {
    return NextResponse.next();
  }

  // Build a response we can attach refreshed session cookies to
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
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

  // getUser() validates the JWT with Supabase — safe against spoofed cookies
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // /lab routes: any authenticated user
  if (isLab) {
    if (!user) {
      if (pathname.startsWith("/api/")) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      return NextResponse.redirect(new URL("/lab/login", request.url));
    }
    return response;
  }

  // /admin routes: must be authenticated AND be the admin email
  if (isAdmin) {
    if (!user || user.email !== ADMIN_EMAIL) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    return response;
  }

  return response;
}

export const config = {
  matcher: ["/lab/:path*", "/api/lab/:path*", "/admin/:path*"],
};
