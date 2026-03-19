import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { ADMIN_EMAIL } from "@/lib/lab-auth";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow auth callback and login through unconditionally
  if (
    pathname === "/login" ||
    pathname.startsWith("/auth/")
  ) {
    return NextResponse.next();
  }

  // Determine which section we're protecting
  const isLab = pathname.startsWith("/lab") || pathname.startsWith("/api/lab");
  const isAdmin = pathname.startsWith("/admin") || pathname.startsWith("/api/admin");
  const isSession = pathname.startsWith("/session") || pathname.startsWith("/api/session");
  const isDashboard = pathname.startsWith("/dashboard") || pathname.startsWith("/api/teacher");
  const isTeacherReg = pathname.startsWith("/teacher");
  const isOrg = pathname.startsWith("/org") || pathname.startsWith("/api/org");

  if (!isLab && !isAdmin && !isSession && !isDashboard && !isTeacherReg && !isOrg) {
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
      return NextResponse.redirect(new URL("/login", request.url));
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

  // /session routes: any authenticated user (page handles role-based rendering)
  if (isSession) {
    if (!user) {
      if (pathname.startsWith("/api/")) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      return NextResponse.redirect(new URL("/login", request.url));
    }
    return response;
  }

  // /dashboard and /api/teacher: any authenticated user (page/handler does teacher check)
  if (isDashboard || isTeacherReg) {
    if (!user) {
      if (pathname.startsWith("/api/")) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      return NextResponse.redirect(new URL("/login", request.url));
    }
    return response;
  }

  // /org routes: any authenticated user (page handles member check)
  if (isOrg) {
    if (!user) {
      if (pathname.startsWith("/api/")) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      return NextResponse.redirect(new URL("/login", request.url));
    }
    return response;
  }

  return response;
}

export const config = {
  matcher: [
    "/lab/:path*",
    "/api/lab/:path*",
    "/admin/:path*",
    "/api/admin/:path*",
    "/session/:path*",
    "/api/session/:path*",
    "/dashboard/:path*",
    "/teacher/:path*",
    "/api/teacher/:path*",
    "/org/:path*",
    "/api/org/:path*",
  ],
};
