// GET /api/lab/data/export
//
// Streams the student's own data as a JSON download.
// Includes: profile fields (strengths_notes, growth_notes — NOT portraits.content_json),
// conversations (non-deleted), conversation messages, and essays.
//
// Streaming approach: Node.js Readable stream so large exports don't timeout.
// On DB error mid-stream, appends {"_error":"export_incomplete"} sentinel
// so clients can detect a truncated export.

import { NextResponse } from "next/server";
import { Readable } from "stream";
import { getCallerUser } from "@/lib/lab-auth";
import { getSupabase } from "@/lib/supabase";

export const runtime = "nodejs";

export async function GET() {
  const user = await getCallerUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = getSupabase();

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        // ── Profile ─────────────────────────────────────────────────────────
        const { data: profile } = await supabase
          .from("student_profiles")
          .select(
            "full_name, grade, schools, essay_focus, writing_voice, goals, " +
            "strengths_notes, growth_notes, recordings_consent, created_at"
          )
          .eq("user_id", user.id)
          .maybeSingle();

        controller.enqueue(encoder.encode('{\n  "profile": '));
        controller.enqueue(encoder.encode(JSON.stringify(profile ?? null, null, 2)));

        // ── Conversations ─────────────────────────────────────────────────
        const { data: conversations, error: convErr } = await supabase
          .from("conversations")
          .select("id, title, essay_mode, created_at, updated_at")
          .eq("user_id", user.id)
          .is("deleted_at", null)
          .order("created_at", { ascending: true });

        if (convErr) throw convErr;

        controller.enqueue(encoder.encode(',\n  "conversations": [\n'));

        const convs = conversations ?? [];
        for (let i = 0; i < convs.length; i++) {
          const conv = convs[i];

          // Fetch messages for this conversation
          const { data: messages, error: msgErr } = await supabase
            .from("conversation_messages")
            .select("role, content, file_name, file_type, created_at")
            .eq("conversation_id", conv.id)
            .order("created_at", { ascending: true });

          if (msgErr) throw msgErr;

          const convWithMessages = { ...conv, messages: messages ?? [] };
          const comma = i < convs.length - 1 ? "," : "";
          controller.enqueue(
            encoder.encode("    " + JSON.stringify(convWithMessages) + comma + "\n")
          );
        }

        controller.enqueue(encoder.encode("  ]"));

        // ── Essays ────────────────────────────────────────────────────────
        // Only include if student has essays linked to their user_id
        const { data: studentRow } = await supabase
          .from("students")
          .select("id")
          .eq("user_id", user.id)
          .maybeSingle();

        if (studentRow) {
          const { data: essays, error: essayErr } = await supabase
            .from("essays")
            .select("title, content, status, created_at, updated_at")
            .eq("student_id", studentRow.id)
            .order("created_at", { ascending: true });

          if (essayErr) throw essayErr;

          controller.enqueue(encoder.encode(',\n  "essays": '));
          controller.enqueue(encoder.encode(JSON.stringify(essays ?? [], null, 2)));
        }

        controller.enqueue(encoder.encode("\n}\n"));
        controller.close();
      } catch (err) {
        console.error("[data/export] stream error:", err);
        // Append sentinel so the client can detect the export was truncated
        try {
          controller.enqueue(encoder.encode(',\n  "_error": "export_incomplete"\n}\n'));
        } catch {
          // If we can't even enqueue the error sentinel, just close
        }
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="storylab-data-${new Date().toISOString().slice(0, 10)}.json"`,
      "Transfer-Encoding": "chunked",
      "Cache-Control": "no-store",
    },
  });
}
