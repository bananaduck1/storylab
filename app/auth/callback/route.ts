import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

const ADMIN_EMAIL = "samahn240@gmail.com";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=missing_code`);
  }

  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        },
      },
    }
  );

  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data.user) {
    return NextResponse.redirect(`${origin}/login?error=auth_failed`);
  }

  if (data.user.email === ADMIN_EMAIL) {
    return NextResponse.redirect(`${origin}/admin/dashboard`);
  }

  // Link student account to their student record if invite metadata is present
  const studentId = data.user.user_metadata?.student_id;
  if (studentId) {
    const { createClient } = await import("@supabase/supabase-js");
    const adminClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    await adminClient
      .from("students")
      .update({ user_id: data.user.id })
      .eq("id", studentId)
      .is("user_id", null); // only link if not already linked
  }

  // Domain-based soft org membership (pending approval required)
  const userEmail = data.user.email;
  if (userEmail) {
    const domain = userEmail.split("@")[1];
    if (domain) {
      const { createClient: createAdminClient } = await import("@supabase/supabase-js");
      const adminClient = createAdminClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );
      // Find org with matching email domain
      const { data: org } = await adminClient
        .from("organizations")
        .select("id")
        .eq("email_domain", domain)
        .maybeSingle();
      if (org) {
        // Find student row for this user
        const { data: student } = await adminClient
          .from("students")
          .select("id, org_id")
          .eq("user_id", data.user.id)
          .maybeSingle();
        // Only set if not already in an org
        if (student && !student.org_id) {
          await adminClient
            .from("students")
            .update({ org_id: org.id, org_membership_status: "pending" })
            .eq("id", student.id);
        }
      }
    }
  }

  return NextResponse.redirect(`${origin}/lab`);
}
