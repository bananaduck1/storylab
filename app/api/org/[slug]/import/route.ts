import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { isOrgAdmin } from "@/lib/org-auth";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

export async function POST(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  );
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const admin = await isOrgAdmin(user.id, slug);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const db = getSupabase();
  const { data: org } = await db.from("organizations").select("id").eq("slug", slug).maybeSingle();
  if (!org) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { csv } = await request.json(); // raw CSV text
  if (!csv) return NextResponse.json({ error: "csv field required" }, { status: 400 });

  // Parse CSV: expect "name,email" rows, skip header
  const lines = (csv as string).trim().split("\n").slice(1); // skip header line
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  // Deduplicate emails
  const seen = new Set<string>();
  const rows: { name: string; email: string }[] = [];
  for (const line of lines) {
    const [name, email] = line.split(",").map((s: string) => s.trim().replace(/^["']|["']$/g, ""));
    if (!email || !emailRegex.test(email)) continue;
    if (seen.has(email.toLowerCase())) continue;
    seen.add(email.toLowerCase());
    rows.push({ name: name || email, email: email.toLowerCase() });
  }

  const adminClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const results: { ok: number; failed: { email: string; reason: string }[] } = { ok: 0, failed: [] };

  // Process in batches of 50
  for (let i = 0; i < rows.length; i += 50) {
    const batch = rows.slice(i, i + 50);
    await Promise.all(batch.map(async ({ name, email }) => {
      try {
        // Check if user already exists via invite (try to find by email in students table)
        const { data: existingStudent } = await db
          .from("students")
          .select("id, org_id, user_id")
          .eq("email", email)
          .maybeSingle();

        if (existingStudent?.user_id) {
          // User exists — update org_id if not already set
          if (!existingStudent.org_id) {
            await db.from("students").update({ org_id: org.id, org_membership_status: "active" }).eq("id", existingStudent.id);
          }
          results.ok++;
        } else {
          // New user — send invite email
          const { error } = await adminClient.auth.admin.inviteUserByEmail(email, {
            redirectTo: `${SITE_URL}/org/${slug}/join`,
            data: { name, org_id: org.id, org_slug: slug },
          });
          if (error) {
            results.failed.push({ email, reason: error.message });
          } else {
            results.ok++;
          }
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Unknown error";
        results.failed.push({ email, reason: message });
      }
    }));
  }

  return NextResponse.json(results);
}
