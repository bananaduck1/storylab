import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getSupabase } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";

/** Get the authenticated user from request cookies (safe — validates JWT with Supabase). */
export async function getCallerUser(): Promise<User | null> {
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

/** Get the role from user metadata. Defaults to 'teacher' if unset (backwards compat). */
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
