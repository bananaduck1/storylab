// /api/admin/pipeline — CRUD for B2B pipeline orgs
// Admin-only (ADMIN_EMAIL guard).

import { NextRequest, NextResponse } from "next/server";
import { getCallerUser, ADMIN_EMAIL } from "@/lib/lab-auth";
import { getSupabase } from "@/lib/supabase";

const VALID_STAGES = [
  "prospect",
  "demo_scheduled",
  "proposal_sent",
  "negotiating",
  "closed_won",
  "closed_lost",
] as const;

const VALID_TIERS = ["standard", "enterprise", "pilot"] as const;

async function requireAdmin() {
  const user = await getCallerUser();
  if (!user || user.email !== ADMIN_EMAIL) return null;
  return user;
}

// GET /api/admin/pipeline — list all orgs with pipeline data + subscription status
export async function GET() {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data, error } = await getSupabase()
    .from("organizations")
    .select(
      `id, name, slug, contact_email, pipeline_stage, pipeline_notes,
       last_contacted_at, pricing_tier, deal_notes, created_at,
       org_subscriptions(status, current_period_end)`
    )
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

// POST /api/admin/pipeline — create a prospect org
export async function POST(req: NextRequest) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const name = (body.name as string)?.trim();
  const contact_email = (body.contact_email as string)?.trim() || null;

  if (!name) {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }

  // Derive slug from name
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);

  const { data, error } = await getSupabase()
    .from("organizations")
    .insert({
      name,
      slug,
      contact_email,
      pipeline_stage: "prospect",
      pricing_tier: body.pricing_tier && VALID_TIERS.includes(body.pricing_tier)
        ? body.pricing_tier
        : "standard",
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}

// PATCH /api/admin/pipeline — update pipeline fields for one org
export async function PATCH(req: NextRequest) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const { id, ...fields } = body as Record<string, any>;

  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const updates: Record<string, any> = {};

  if (fields.pipeline_stage !== undefined) {
    if (!VALID_STAGES.includes(fields.pipeline_stage)) {
      return NextResponse.json({ error: "Invalid pipeline_stage" }, { status: 400 });
    }
    updates.pipeline_stage = fields.pipeline_stage;
    // Auto-set last_contacted_at when stage changes (unless explicitly provided)
    if (fields.last_contacted_at === undefined) {
      updates.last_contacted_at = new Date().toISOString();
    }
  }

  if (fields.pricing_tier !== undefined) {
    if (!VALID_TIERS.includes(fields.pricing_tier)) {
      return NextResponse.json({ error: "Invalid pricing_tier" }, { status: 400 });
    }
    updates.pricing_tier = fields.pricing_tier;
  }

  if (typeof fields.pipeline_notes === "string") updates.pipeline_notes = fields.pipeline_notes;
  if (typeof fields.deal_notes === "string") updates.deal_notes = fields.deal_notes;
  if (typeof fields.contact_email === "string") updates.contact_email = fields.contact_email;
  if (fields.last_contacted_at !== undefined)
    updates.last_contacted_at = fields.last_contacted_at;

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
  }

  const { data, error } = await getSupabase()
    .from("organizations")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
