import { createServerClient } from "@supabase/ssr";
import { cookies, headers } from "next/headers";
import { getSupabase } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";

/**
 * The founder email. Centralised here so middleware and API routes
 * import from one place instead of duplicating the string.
 */
export const ADMIN_EMAIL = "samahn240@gmail.com";

/**
 * Role resolution — DB-derived, supports multi-role users.
 *
 *   getUserRoles(userId)
 *     ├── SELECT 1 FROM teachers WHERE user_id=?  ──▶ isTeacher
 *     └── SELECT 1 FROM students WHERE user_id=?  ──▶ isStudent
 *     (parallel queries, fail-closed: any error → all false)
 *
 *   isFounder: user.email === ADMIN_EMAIL  (checked at callsite, not here)
 *
 *   getUserRole() is DEPRECATED — use getUserRoles() for new code.
 */
export interface UserRoles {
  isTeacher: boolean;
  isStudent: boolean;
}

export async function getUserRoles(userId: string): Promise<UserRoles> {
  try {
    const supabase = getSupabase();
    const [teacherRes, studentRes] = await Promise.all([
      supabase.from("teachers").select("id").eq("user_id", userId).maybeSingle(),
      supabase.from("students").select("id").eq("user_id", userId).maybeSingle(),
    ]);
    return {
      isTeacher: !!teacherRes.data,
      isStudent: !!studentRes.data,
    };
  } catch (err) {
    console.error("[getUserRoles] DB lookup failed — failing closed:", err);
    return { isTeacher: false, isStudent: false };
  }
}

/**
 * Get the authenticated user from request cookies or a Bearer token.
 *
 * Auth resolution order:
 *   1. Authorization: Bearer <token>  — for non-browser callers (eval harness, scripts)
 *   2. Cookie-based session           — for browser clients (normal flow)
 */
export async function getCallerUser(): Promise<User | null> {
  // 1. Bearer token (non-browser callers)
  const headersList = await headers();
  const authHeader = headersList.get("Authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice(7);
    const { data: { user } } = await getSupabase().auth.getUser(token);
    return user;
  }

  // 2. Cookie-based session (browser clients)
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll() {
          // read-only — API routes don't need to refresh cookies
        },
      },
    }
  );
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

/**
 * @deprecated Use getUserRoles() for new code.
 * Returns a single role string from user metadata for backwards compat.
 */
export function getUserRole(user: User): "teacher" | "student" {
  return user.user_metadata?.role === "student" ? "student" : "teacher";
}

/** Look up the students.id for a given auth user (returns null if not linked). */
export async function getCallerStudentId(userId: string): Promise<string | null> {
  const { data } = await getSupabase()
    .from("students")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();
  return data?.id ?? null;
}
