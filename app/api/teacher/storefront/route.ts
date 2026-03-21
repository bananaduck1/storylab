import { NextRequest, NextResponse } from "next/server";
import { getCallerUser } from "@/lib/lab-auth";
import { getCallerTeacher } from "@/lib/teacher";
import { getSupabase } from "@/lib/supabase";
import { hasInjection, MAX_FIELD, MAX_SHORT_FIELD } from "@/lib/content-validation";

function validateStorefrontContent(sc: unknown): { valid: boolean; error?: string } {
  if (typeof sc !== "object" || sc === null) return { valid: false, error: "storefront_content must be an object" };
  const c = sc as Record<string, unknown>;

  // hero
  if (c.hero !== undefined) {
    const h = c.hero as Record<string, unknown>;
    if (typeof h.headline !== "string" || h.headline.length > MAX_FIELD) return { valid: false, error: "hero.headline invalid" };
    if (typeof h.subheadline !== "string" || h.subheadline.length > MAX_FIELD) return { valid: false, error: "hero.subheadline invalid" };
    if (hasInjection(h.headline) || hasInjection(h.subheadline)) return { valid: false, error: "hero contains disallowed content" };
  }

  // story
  if (c.story !== undefined) {
    const s = c.story as Record<string, unknown>;
    if (typeof s.body !== "string" || s.body.length > MAX_FIELD) return { valid: false, error: "story.body invalid" };
    if (hasInjection(s.body)) return { valid: false, error: "story contains disallowed content" };
  }

  // case_studies
  if (c.case_studies !== undefined) {
    if (!Array.isArray(c.case_studies)) return { valid: false, error: "case_studies must be an array" };
    if (c.case_studies.length > 3) return { valid: false, error: "Maximum 3 case studies" };
    for (const cs of c.case_studies as unknown[]) {
      const s = cs as Record<string, unknown>;
      for (const field of ["student_label", "outcome", "teaser", "challenge", "what_changed"] as const) {
        if (typeof s[field] !== "string" || (s[field] as string).length > MAX_FIELD) {
          return { valid: false, error: `case_studies.${field} invalid` };
        }
        if (hasInjection(s[field] as string)) return { valid: false, error: `case_studies.${field} contains disallowed content` };
      }
    }
  }

  // testimonials
  if (c.testimonials !== undefined) {
    if (!Array.isArray(c.testimonials)) return { valid: false, error: "testimonials must be an array" };
    for (const t of c.testimonials as unknown[]) {
      const item = t as Record<string, unknown>;
      if (typeof item.quote !== "string" || item.quote.length > MAX_FIELD) return { valid: false, error: "testimonials.quote invalid" };
      if (typeof item.attribution !== "string" || item.attribution.length > MAX_SHORT_FIELD) return { valid: false, error: "testimonials.attribution invalid" };
    }
  }

  return { valid: true };
}

export async function PATCH(req: NextRequest) {
  const user = await getCallerUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const teacher = await getCallerTeacher(user.id);
  if (!teacher) return NextResponse.json({ error: "Not a teacher" }, { status: 403 });

  const body = await req.json();
  const { storefront_content, ai_coaching_enabled, live_sessions_enabled, primary_emphasis, accepting_students } = body;

  // Validate feature flags
  if (primary_emphasis !== undefined && !["ai", "live", "equal"].includes(primary_emphasis)) {
    return NextResponse.json({ error: "primary_emphasis must be 'ai', 'live', or 'equal'" }, { status: 400 });
  }

  // Validate storefront_content if provided
  if (storefront_content !== undefined) {
    const { valid, error } = validateStorefrontContent(storefront_content);
    if (!valid) return NextResponse.json({ error }, { status: 400 });
  }

  const updates: Record<string, unknown> = {};
  if (storefront_content !== undefined) updates.storefront_content = storefront_content;
  if (typeof ai_coaching_enabled === "boolean") updates.ai_coaching_enabled = ai_coaching_enabled;
  if (typeof live_sessions_enabled === "boolean") updates.live_sessions_enabled = live_sessions_enabled;
  if (primary_emphasis !== undefined) updates.primary_emphasis = primary_emphasis;
  if (typeof accepting_students === "boolean") updates.accepting_students = accepting_students;

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No fields to update" }, { status: 400 });
  }

  const { error } = await getSupabase()
    .from("teachers")
    .update(updates)
    .eq("id", teacher.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
