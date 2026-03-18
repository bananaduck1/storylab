# TODOs

Captured during /plan-eng-review on 2026-03-12. Updated during /plan-ceo-review on 2026-03-17 (x4). Updated during /plan-ceo-review on 2026-03-17 — live coaching companion review (x3). Updated during /plan-ceo-review on 2026-03-18 — multi-teacher platform vision (x3 new, x2 closed). Updated during /plan-ceo-review on 2026-03-18 — teacher platform architecture (x3 new). Updated during /plan-ceo-review on 2026-03-18 — multi-role identity (x2 new). Implemented 2026-03-18: TODO-10, TODO-15, TODO-16, TODO-23, TODO-24, TODO-26 all shipped.

---

## TODO-1: Markdown rendering for assistant messages ✅ DONE

**What:** Install `react-markdown` (or equivalent) and render AI coach responses as formatted markdown instead of raw whitespace-pre-wrap text.

**Why:** The behavioral layer's quote-before-comment constraint generates `> blockquote` syntax for every cited passage — currently renders as literal `> text` plaintext instead of a styled blockquote. Sam also uses `**bold**` for emphasis on key coaching words. Both degrade the reading experience without markdown rendering.

**Pros:** Blockquoted essay passages become visually distinct from Sam's commentary. Bold emphasis lands correctly. Makes the quote-before-comment UX actually work visually.

**Cons:** Adds a dependency (`react-markdown` ~10kb gzipped). Requires adding prose styles consistent with the rest of the app (or reuse `app/blog/blog.module.css` pattern).

**Context:** The affected component is `app/lab/_components/LabChat.tsx`, specifically the assistant message render block at the `<span className="whitespace-pre-wrap">` line. The simplest approach is to replace that `<span>` with a `<ReactMarkdown>` component scoped to a prose class. Test with a few real Sam Ahn responses to confirm formatting looks correct before shipping.

**Depends on:** Nothing. Independent change.

---

## TODO-2: Conversation delete + rename UI in the sidebar ✅ DONE

**What:** Add hover-reveal controls to each conversation item in the sidebar — a trash icon to delete and an editable title (click-to-edit inline) to rename.

**Why:** Students accumulate conversations over time. Without management tools, the sidebar grows into an unscrollable list of "New conversation" entries. The DELETE and PATCH endpoints at `/api/lab/conversations/[id]` already exist and are tested.

**Pros:** Closes the conversation management UX gap. Reuses existing API surface — no backend work required.

**Cons:** Inline edit state adds complexity to the sidebar component. Need to handle optimistic UI updates (show new title immediately, revert on error).

**Context:** Both API routes are implemented in `app/api/lab/conversations/[id]/route.ts`. The sidebar is rendered inside `app/lab/_components/LabChat.tsx` in the conversations `.map()` block starting around line 418. Suggested UX: show delete icon on hover (confirm with a second click or simple `window.confirm`), rename via double-click on the title to show an `<input>` inline.

**Depends on:** Nothing. Independent change.

---

## TODO-3: Student profile edit page at /lab/profile ✅ DONE

**What:** Build a `/lab/profile` page where students can update their profile (name, grade, target schools, essay focus, voice, goals) after completing onboarding.

**Why:** Students' college plans evolve. A student who started in 10th grade with no target schools will have different data by 11th grade application season. Currently there is no way to update the profile that feeds the Sam Ahn system prompt without deleting the Supabase row manually.

**Pros:** Keeps the AI's context current. Required before charging students — a paying user discovering their profile data is stale and has no way to fix it is a churn risk.

**Cons:** Minor duplicated UI with onboarding form. Should share form fields or extract a `ProfileForm` component to avoid divergence.

**Context:** The upsert logic already exists in `app/api/lab/onboarding/route.ts` (POST with `onConflict: "user_id"`). The profile edit page can reuse the same endpoint. Pre-populate fields from a GET to `/api/lab/profile` (add this GET handler). Add a link to `/lab/profile` from the LabChat header or sidebar footer. The server component at `app/lab/page.tsx` already passes the full profile to `LabChat`, so the current values are available.

**Depends on:** Adding a `GET /api/lab/profile` route to fetch the current profile for pre-population.

---

## TODO-4: Deduplicate student_profiles fetch on /lab page load ✅ DONE

**What:** Refactor `checkQuota()` in `lib/lab-quota.ts` to accept an optional pre-fetched profile so `app/lab/page.tsx` doesn't read the same row twice per page load.

**Why:** `app/lab/page.tsx` already does `db.from("student_profiles").select("*")` to get the full profile, then calls `checkQuota(userId)` which independently reads the same row for `plan`, `extra_messages`, etc. Two sequential reads of the same tiny row on every page load.

**Pros:** Eliminates one DB round trip from the critical path of every `/lab` load. Cleaner API — callers with an existing profile don't need to trigger a redundant read.

**Cons:** Changes the signature of `checkQuota` (adds optional second arg), touching all callers. Risk of divergence if the caller passes a stale profile. Needs care to keep the call-time read as the default (non-breaking for the chat route which doesn't have a profile pre-fetched).

**Context:** The fix is to add `profileData?: object` as an optional second parameter to `checkQuota`. If provided, skip the `student_profiles` SELECT. The chat route (`app/api/lab/chat/route.ts`) calls `checkQuota` without a profile and should continue doing so. Only `app/lab/page.tsx` passes it. The duplicate SELECT is at `page.tsx` line ~21 (`db.from("student_profiles").select("*")`) and inside `checkQuota` at `lib/lab-quota.ts` line ~25.

**Depends on:** Nothing. Independent refactor.

**Decision (2026-03-18):** Already implemented. `lib/lab-quota.ts` has the `preloadedProfile?: ProfileSnapshot | null` parameter. `app/lab/page.tsx:52` passes the pre-fetched profile to `checkQuota(user.id, profile)`. Zero extra work needed.

---

## TODO-5: System prompt XML restructuring ✅ CLOSED

**Decision (2026-03-18):** Superseded by TODO-23 (multi-tenant foundation). Once Sam's system prompt moves into a structured JSONB `agent_config` in the `teachers` table (with explicit fields for identity, core_beliefs, diagnostic_eye, voice, signature_moves), the sections are already structured — no XML restructuring of the flat file needed. The file `lib/agent-system-prompt.ts` becomes a fallback reference only. Close this.

---

## TODO-6: Structured portrait JSON schema

**What:** Replace free-text `student_profiles.portrait_notes` with a structured JSON schema:
`{ deflection_patterns, essay_topics_tried, recurring_phrases, key_personal_details, last_updated }`.

**Why:** Structured fields enable targeted retrieval and richer system prompt injection
(e.g., "this student tends to deflect when asked about family").

**Pros:** Much more queryable. Admin UI can display structured data cleanly.
**Cons:** Requires a migration and a rewrite of `generatePortraitNote` + `writePortraitNote`.
Risk: designing the schema before you know what the AI naturally wants to record.

**Context:** Start by reading 20–30 actual `portrait_notes` values after the free-text system
has been running for a week. Let the real data drive the schema. Do not design speculatively.
`writePortraitNote` is in `lib/lab-profile.ts`. `generatePortraitNote` is in `app/api/lab/chat/route.ts`.

**Effort:** M | **Priority:** P2 | **Depends on:** 1–2 weeks of portrait accumulation data

---

## TODO-7: Admin portrait visibility ✅ DONE

`portrait_notes` is already rendered in `app/admin/dashboard/page.tsx` at line 1377-1378 as part of the lab data pane. Verified 2026-03-18.

---

## TODO-8: Diagnostic intent pre-classification

**What:** Before `retrievePlaybookByVector`, make a brief gpt-4o-mini call to classify
the coaching challenge in the student's message (e.g., "expository ending", "fluency trap",
"no pivot scene"). Use the classification as the retrieval query instead of the raw message.

**Why:** Cosine similarity over raw student messages retrieves chunks semantically similar
to the topic (e.g., "piano") rather than the coaching technique needed ("find the left clavicle").
Classification routes retrieval by diagnostic intent, not keyword.

**Pros:** More targeted playbook retrieval. Higher precision.
**Cons:** ~300ms synchronous latency. ~$0.002/message classification cost.

**Context:** Validate that the current RAG separation (typed retrieval + differentiated labels)
alone fixes generic responses before adding this. The classification call would go in
`app/api/lab/chat/route.ts` before the `embedQuery` call, replacing the raw `ragQuery`
string with a coaching-intent classification.

**Effort:** M | **Priority:** P3 | **Depends on:** RAG separation + 2 weeks of usage data

---

## TODO-9: Portrait reset endpoint ✅ DONE

**What:** `POST /api/lab/portrait/reset` — clears `student_profiles.portrait_notes` for
the authenticated user.

**Why:** A student who had a bad or uncharacteristic first conversation could be stuck with
misleading portrait notes indefinitely.

**Pros:** Low implementation cost (~20 lines). Strong trust signal.
**Cons:** Students don't currently know portrait_notes exists. May not be needed until
portraits are visible to students in some form.

**Context:** For now Sam can manually clear portrait_notes via Supabase dashboard if needed.
Add this endpoint alongside any future "your coaching profile" UI.

**Effort:** S | **Priority:** P3 | **Depends on:** Portrait system shipping

---

## TODO-10: Behavioral compliance eval harness ✅ DONE

**What:** A script (`scripts/eval-chat.ts`) that sends a set of scripted messages through the `/api/lab/chat` endpoint and grades each response for behavioral compliance: no bullet lists, ends with a question, quote present in feedback phase, one-problem focus.

**Why:** There's currently no way to detect regressions when the system prompt is updated. Every prompt change requires manual QA. An eval harness makes prompt iteration scientific instead of intuitive.

**Pros:** Catches regressions automatically. Makes prompt A/B testing possible. Unlocks confident iteration.
**Cons:** Effort to build and maintain the test fixture. Real API calls = real cost per run.

**Context:** The harness would run 5–10 pre-scripted conversation stubs (opening message only, 4-turn conversation ending with essay upload, etc.) and parse each response for: (1) no lines starting with `-` or `*`, (2) response ends with `?`, (3) at least one `>` blockquote line in feedback phase. Run as `npx tsx --env-file=.env.local scripts/eval-chat.ts`. Add to CI as an optional check.

**Effort:** L | **Priority:** P2 | **Depends on:** Behavioral layer shipping

**Decision (2026-03-18):** Implemented. `scripts/eval-chat.ts` — 4 compliance checks, all 4 modes supported, `--mode all` runs regression across every mode. Set `EVAL_USER_EMAIL` + `EVAL_USER_PASSWORD` in `.env.local` to run.

---

## TODO-11: Phase threshold env-var tuning ✅ CLOSED

**Decision (2026-03-17):** Named constants (`OPENING_TURNS = 2`, `DIAGNOSING_TURNS = 8`) are done and sufficient. Env-var configuration was explicitly decided against — the overhead isn't justified for thresholds that rarely need changing, and a code edit + redeploy is acceptable when they do. If production data shows the boundaries consistently feel wrong, reopen then.

---

## TODO-12: DB-persisted session phase for admin visibility

**What:** Add `session_phase TEXT DEFAULT 'opening'` to the `conversations` table. Write the inferred phase on each turn. Surface it in `/admin/dashboard` alongside the lab students view so the phase of each student's most recent session is visible.

**Why:** Message-count phase inference is invisible — there's no way to know from the outside whether any session is in the right phase. Admin visibility lets you diagnose cases where a student has been in "OPENING" mode for 20 messages.

**Pros:** Full observability into session health. Enables manual reset. Foundation for session quality metrics.
**Cons:** Additional migration + per-turn DB write. Admin UI work.

**Context:** The migration is trivial (one ALTER TABLE). The per-turn write goes in the `after()` block in `app/api/lab/chat/route.ts` alongside the existing conversation `updated_at` write. The admin dashboard is at `app/admin/dashboard/page.tsx`.

**Effort:** M | **Priority:** P3 | **Depends on:** Behavioral layer shipping + enough sessions to make phase data interesting

---

## TODO-13: Invite email bounce tracking

**What:** Handle Resend webhook to detect when a student invite email bounces and surface that status in the admin student pane.

**Why:** When Sam sends an invite email to a student, there's no signal that it was delivered. A bounced email means the student will never see the claim link, and Sam has no way to know.

**Context:** Resend exposes a webhook for bounce/delivery events. The admin invite email feature (PR 1 of student unification plan) is the trigger for this. Once invite emails are shipping, add a `webhook` route for Resend events that updates a `students.invite_status` or similar column. The admin student pane can then show "bounced" / "delivered" / "pending" alongside the invite button. Resend docs: https://resend.com/docs/dashboard/webhooks/overview

**Effort:** M | **Priority:** P3 | **Depends on:** Invite email feature (student unification PR 1)

---

## TODO-14: Student-editable strengths and growth areas

**What:** Let students add their own framing to the AI-generated strengths and growth areas on their `/lab/profile` card.

**Why:** The AI portrait is informed but not infallible. A student who reads "tends to over-explain" might want to contextualize it. Giving them a text field to add their own perspective closes the loop between AI observation and student self-awareness.

**Context:** The student portrait card (student unification PR 2) shows AI-extracted `strengths_notes` and `growth_notes`. This TODO adds optional `strengths_own_notes TEXT` and `growth_own_notes TEXT` columns on `student_profiles` that students can write to via a simple edit mode on `/lab/profile`. Revisit after validating AI output quality with real students — the AI framing needs to be good before letting students react to it.

**Effort:** S | **Priority:** P3 | **Depends on:** Student portrait card (student unification PR 2) + 2–4 weeks of real student usage

---

## TODO-15: Invite history in admin student pane ✅ DONE

**What:** Show "Invited on [date] / Claimed on [date]" in the admin student pane so Sam knows the status of each outreach.

**Why:** Once invite emails are sending, there's no UI feedback on whether a student received and acted on the link. `students.user_id` being set tells you they claimed, but there's no record of when the invite went out.

**Context:** Add `invited_at TIMESTAMPTZ` to the `students` table. Set it when the invite email is sent. The admin student pane already shows sessions and portrait; add a small status line: `Invited: Mar 17 | Claimed: Mar 18` (or `Not yet claimed`). Requires the invite email feature from student unification PR 1.

**Effort:** S | **Priority:** P3 | **Depends on:** Invite email feature (student unification PR 1)

**Decision (2026-03-18):** Implemented. Migration `20260318_invited_at.sql` adds the column. `app/api/admin/invite-student/route.ts` sets it on send. `lib/supabase.ts` Student interface updated. `app/admin/dashboard/page.tsx` shows invite date with `localInvitedAt` state for optimistic update.

---

## TODO-16: Supplemental essay mode ✅ DONE

**What:** A 4th essay mode covering "Why this school" essays, activity descriptions (150-word brevity coaching), and diversity/community essays — each sub-type with distinct Sam coaching moves.

**Why:** Supplementals are a massive part of the application process and have completely different goals from the 3 core modes. A student writing a 150-word activity description needs ruthless brevity coaching, not Socratic narrative excavation. "Why school" essays fail when they sound like templates — Sam has specific instincts about what makes them specific.

**Pros:** Covers the full application lifecycle. High-value for students in active application season. Code change is trivial (~30 min) once the pedagogy is defined.

**Cons:** Requires Sam to articulate coaching doctrine for each sub-type in writing (3-5 constraint bullets each). The bottleneck is content, not code.

**Context:** Implementation is an extension of the essay modes system (this PR). The pattern is identical — add `"supplemental"` to the `EssayMode` union, add phase thresholds, add constraint overrides, add mode context. The constraint content needs to come from Sam's coaching doctrine on: (1) "Why this school" — what makes a compelling specific reason vs. a generic template? (2) Activity descriptions — how do you be memorable in 150 words? (3) Diversity/community — what's the frame? Write 3-5 bullets per sub-type, then hand to CC.

**Effort:** S (code) / M (doctrine writing) | **Priority:** P2 | **Depends on:** Essay modes PR + Sam's supplemental pedagogy notes

**Decision (2026-03-18):** Implemented with placeholder doctrine (S1-S9 constraints). `lib/behavioral-constraints.ts`, `lib/lab-profile.ts` (MODE_CONTEXT + MODE_OPENING), `app/lab/_components/LabChat.tsx` all updated. Sam to refine the S1-S9 bullets with his actual supplemental pedagogy.

---

## TODO-17: Mode-specific eval harness cases

**What:** Extend `scripts/eval-chat.ts` with mode-specific test runs — scripted messages in Academic mode (verify Sam gives structural/argument guidance, not Socratic excavation) and Transfer mode (verify Sam focuses on fit/institutional reasoning, not identity narrative).

**Why:** The eval harness (TODO-10) only tests behavioral compliance in Common App mode. A prompt change that improves Academic mode could silently regress Common App behavior. Without mode-specific evals, you can't tell.

**Pros:** Makes prompt iteration safe across all modes. Catches cross-mode regressions. Cheap to run (a few API calls per mode).

**Cons:** Adds test cases to maintain as modes evolve. Requires defining "what does good look like" for each mode's responses.

**Context:** The eval harness already exists at `scripts/eval-chat.ts`. Extend it by adding a `--mode` flag that changes the conversation's `essay_mode` before running the eval suite. Add 3-5 scripted messages per new mode and grade-check for mode-appropriate behavior (e.g., Academic mode: no "tell me about yourself" questions, structural framing present in coaching responses). Run as `npx tsx --env-file=.env.local scripts/eval-chat.ts --mode academic`.

**Effort:** S | **Priority:** P2 | **Depends on:** Essay modes PR + eval harness (TODO-10 ✅)

---

## TODO-18: SSE real-time coaching sidebar

**What:** Upgrade the live coaching sidebar from 30-second polling to Server-Sent Events (SSE) so AI coaching nudges appear within ~5 seconds of the student finishing a sentence.

**Why:** The v1 polling implementation has up to 30 seconds of latency between what's said and when the nudge appears. SSE makes the coaching companion feel genuinely real-time — the nudge "she just said piano again" lands while the teacher still has the opening to respond.

**Pros:** ~5s nudge latency vs. 30s. More responsive feel. Demonstrates the product's intelligence in a visceral way.

**Cons:** SSE requires a persistent connection from teacher's browser to server. More complex than polling — requires careful handling of connection drops, reconnects, and Vercel edge function timeouts. Next.js App Router supports SSE via `ReadableStream` in route handlers.

**Context:** The v1 sidebar polls `GET /api/session/[id]/nudge` every 30s using `setInterval`. The SSE upgrade replaces the polling endpoint with a streaming `GET /api/session/[id]/nudge-stream` that keeps the connection open and pushes events as new transcript chunks arrive. The challenge is triggering the push: options are (a) Supabase Realtime subscription server-side watching `transcript_chunks` inserts, or (b) webhook-driven internal pub/sub (Redis or in-memory). Revisit after v1 is running with real sessions and you have a sense of what nudge latency actually feels like in practice.

**Effort:** M → CC: ~30 min | **Priority:** P2 | **Depends on:** Live coaching polling sidebar shipping (Phase 1)

---

## TODO-19: Session recording storage

**What:** Store the video recording of each tutoring session in Supabase Storage, linked to the session record. Teacher can re-listen with transcript synced (click a word, jump to that moment in the recording).

**Why:** A transcript captures what was said, but not how — tone, hesitation, energy. Being able to re-listen to a specific moment ("she said it really quietly, like she was embarrassed") gives the teacher a deeper read. Also useful for training new tutors on coaching technique.

**Pros:** Full session fidelity. Teacher training tool. Future: student can watch their own breakthrough moments.

**Cons:** Adds storage costs (~$0.004-0.008/session/month in Supabase Storage). More importantly: requires a consent flow for recording minors, FERPA/COPPA compliance review, and explicit parental consent at booking time. Daily.co supports cloud recording at $0.003/participant-minute ($0.36/hour), or client-side recording + upload.

**Context:** Do NOT build this until legal/consent requirements are reviewed for recording minors. The transcript alone captures all the AI value this plan is built on. Recording is a quality-of-life upgrade for the teacher, not a core product requirement. When ready: Daily.co's `startRecording()` API is the simplest path. Store the resulting `.mp4` in Supabase Storage under `session-recordings/{session_id}.mp4`. Add a `recording_url` column to `sessions`. The playback UI pairs the recording with the `transcript_chunks` table for sync.

**Effort:** M → CC: ~30 min + legal review | **Priority:** P2 | **Depends on:** Legal/consent review for recording minor students; Phase 1 video pipeline shipping

---

## TODO-20: Student intellectual arc visualization

**What:** A visual timeline in `/lab/profile` showing how the student's thinking has evolved across tutoring sessions over time. Drawn from the portrait version history (`portraits` table already stores versioned snapshots). Example: "March: discovering specific detail → April: learning to generalize → May: finding your thesis."

**Why:** The intellectual development tracking is the core product promise of StoryLab. Making it visible to the student themselves transforms it from an internal teacher tool into a student-facing growth experience — which is a retention and engagement driver for /lab subscribers, and a differentiator when pitching families.

**Pros:** High emotional value. Makes the "compound development record" thesis tangible. Could be included in a student's application portfolio. Parents love seeing this.

**Cons:** Requires real portrait data to be non-trivial. With 2 sessions, the "timeline" is meaningless. With 20 sessions over 6 months, it becomes genuinely moving. Also requires design work to avoid feeling like a generic progress bar or checklist — the intellectual arc should read like a narrative, not a metric.

**Context:** The `portraits` table already stores versioned portraits. The visualization reads portrait history in chronological order and extracts the `current_growth_edge` field from each version to show progression. Start by reading 20+ real portrait histories after the video pipeline has been running for 4-6 weeks — let the real data drive the visualization design. Do not design this speculatively. The student-facing page is `/lab/profile` (already exists as a profile page). Add a "Your Development" section below the current profile card.

**Effort:** L → CC: ~1 hr + design | **Priority:** P2 | **Depends on:** Phase 1 video pipeline shipping + 4-6 weeks of real portrait accumulation

---

## TODO-21: Upgrade transcript capture to Deepgram

**What:** Replace the Web Speech API transcript capture with Deepgram's real-time WebSocket API, capturing both participants from the audio stream directly rather than from each browser's local microphone input.

**Why:** Web Speech API only works in Chrome/Edge. Any participant on Safari or Firefox produces no transcript, silently degrading portrait quality. Deepgram processes the audio stream server-side and is browser-agnostic — the session works the same regardless of what browser the student or teacher uses.

**Pros:** Works in all browsers. Bidirectional from a single audio stream (no coordination between two browsers required). Better accuracy. Enables real-time word-level timestamps for future recording sync.

**Cons:** Costs ~$0.0043/min per participant (~$0.52/hour session). Requires a Deepgram API key and a WebSocket relay (the browser connects to our server, which proxies to Deepgram — browser can't connect to Deepgram directly without exposing the API key). More complex than the current two-browser approach.

**Context:** Current implementation: each participant's browser runs `SpeechRecognition`, posts chunks to `POST /api/session/[id]/transcript`. Replace with: teacher's browser sends audio via WebSocket to a Next.js route handler (`/api/session/[id]/stream`), which pipes to Deepgram and writes chunks directly to `transcript_chunks` table. Student browser does the same. The `transcript_chunks` table schema is already in place — Deepgram just becomes the writer instead of the browser.

**Effort:** M → CC: ~1 hr | **Priority:** P2 | **Depends on:** Phase 1 video pipeline shipping + real sessions to validate the Web Speech API limitation in practice

---

## TODO-22: Daily.co paid plan for scale

**What:** Upgrade from Daily.co free tier to a paid plan as session volume grows, unlocking server-side webhooks, cloud recording, and usage analytics.

**Why:** The current free tier requires client-side transcript capture (Web Speech API) because Daily.co webhooks require a paid plan. At scale, server-side transcript capture (Deepgram WebSocket or Daily.co's native transcription) is more reliable and enables features that don't depend on both participants staying connected until session end.

**Pros:** Server-side transcript delivery — no lost chunks if a browser closes mid-session. Daily.co's native transcription as an alternative to Deepgram. Cloud recording. Usage dashboards. SLA guarantees.

**Cons:** Cost scales with usage (~$0.00099/participant-minute on paid plans). Only worth upgrading once session volume justifies it — the free tier handles low-volume coaching well.

**Context:** The current architecture was deliberately designed to avoid the paid plan requirement (see transcript_chunks approach). When upgrading, the primary change is: replace the client-side Web Speech API + `POST /api/session/[id]/transcript` flow with Daily.co's `transcriptionStarted` webhook events writing directly to `transcript_chunks`. The table schema stays the same. Daily.co paid plan also enables `startRecording()` for TODO-19.

**Effort:** S (integration) | **Priority:** P3 | **Depends on:** Session volume justifying cost + TODO-21 (Deepgram) evaluated first as a browser-agnostic alternative

---

## TODO-23: Multi-tenant foundation ✅ DONE

**What:** Add `teachers` table + `teacher_id` foreign key to `knowledge_chunks` and `student_profiles`. Move Sam's hardcoded system prompt from `lib/agent-system-prompt.ts` into a `teachers.agent_config` JSONB row. Update `buildSystemPromptForUser` and `retrievePlaybookByVector` to be teacher-scoped.

**Why:** The entire platform is currently single-tenant — Sam is baked into files, not a database row. Adding a second teacher requires either a painful migration or a parallel codebase. Every Sam-specific improvement built before this migration becomes partial technical debt that must be generalized later. This is the one-way door that makes the platform vision possible.

**Pros:** Unlocks multi-teacher architecture. Every future improvement (eval harness, portrait quality, knowledge base growth) automatically applies to all teachers. Teacher agent builder (TODO-24) depends on this.

**Cons:** Touches core chat pipeline — requires careful testing that Sam's agent behavior is identical before and after. Migration must backfill all existing `knowledge_chunks` and `student_profiles` with Sam's teacher_id.

**Context:**
Migration:
```sql
CREATE TABLE teachers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users,
  name TEXT NOT NULL,
  agent_config JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE knowledge_chunks ADD COLUMN teacher_id UUID REFERENCES teachers(id);
ALTER TABLE student_profiles ADD COLUMN teacher_id UUID REFERENCES teachers(id);
-- Insert Sam as teachers row 1, then backfill
```
`agent_config` JSONB schema: `{ identity, core_beliefs, diagnostic_eye, voice, signature_moves[] }` — maps directly to Sections 0-5 of `lib/agent-system-prompt.ts`.

`buildSystemPromptForUser` in `lib/lab-profile.ts` loads teacher row and assembles prompt from `agent_config` fields. Keep `lib/agent-system-prompt.ts` as a fallback reference until DB-loading is validated in production.

`retrievePlaybookByVector` in `lib/knowledge-retrieval.ts` takes optional `teacherId` parameter and adds WHERE filter to the Supabase RPC call. Add `teacher_id` index on `knowledge_chunks` before backfill.

**Critical gap to handle:** If `teachers.agent_config` is null/malformed, `buildSystemPromptForUser` must fall back to the hardcoded Sam prompt and log a warning — a missing config producing a blank system prompt is a silent failure.

**Effort:** M → CC: ~1 hr | **Priority:** P1 | **Depends on:** Nothing. Do this before further Sam-specific infrastructure investment.

**Decision (2026-03-18):** Implemented. Migration `20260318_teachers.sql` applied — teachers table created, Sam backfilled, knowledge_chunks + student_profiles have teacher_id, match_knowledge_chunks RPC updated. `lib/lab-profile.ts` returns `{ systemPrompt, teacherName, teacherId }` and loads from `agent_config`. `lib/knowledge-retrieval.ts` passes `filter_teacher_id` to RPC. `app/api/lab/chat/route.ts` wired up end-to-end.

---

## TODO-24: Teacher agent builder MVP ✅ DONE

**What:** A form at `/admin/teacher-config` (Sam-only initially, generalizable to any teacher) that lets a teacher configure their agent by filling in structured fields: identity, core beliefs, diagnostic eye, voice, signature moves. Saves to `teachers.agent_config` JSONB. This is the "Notion-style builder" for the teacher marketplace vision.

**Why:** The explicit customization path is how new teachers (with no session data yet) shape their agent from day 1. Even for Sam, formalizing his config in a UI means his agent can be refined without a code deploy. It's also the spec for how the teacher marketplace onboards future teachers.

**Pros:** Unlocks the explicit customization path. Makes teacher agent configuration a product experience, not a code change. Even Sam benefits — he can tune his voice/moves without touching `lib/agent-system-prompt.ts`. Provides the UI structure for teacher onboarding when the marketplace opens.

**Cons:** Requires TODO-23 first. Form fields must map cleanly to the `agent_config` JSONB schema. Need to sanitize for prompt injection (a teacher writing "Ignore all previous instructions" in the identity field).

**Context:** The `agent_config` JSONB schema from TODO-23:
```
{
  identity: string,          // Section 0 of Sam's prompt — who are you, what's your story
  core_beliefs: string,      // Section 1 — what do you believe about your subject
  diagnostic_eye: string,    // Section 2 — what do you notice in bad drafts
  voice: string,             // Sections 3-5 — how you talk, your tone, your moves
  signature_moves: string[]  // 3-5 specific coaching interventions you always make
}
```
UI: `/admin/teacher-config` — a form with one textarea per field, each with a short prompt/example. Sam fills in his version first. On save, calls `PATCH /api/admin/teacher-config` which validates the JSONB and writes to `teachers`. Add a "Preview" button that shows what the assembled system prompt looks like.

Sanitization: strip any "ignore previous instructions"-style content. Validate max field lengths (identity ≤ 5000 chars, each belief ≤ 2000 chars, each move ≤ 500 chars).

**Effort:** M → CC: ~2 hr | **Priority:** P1 | **Depends on:** TODO-23

**Decision (2026-03-18):** Implemented. `app/api/admin/teacher-config/route.ts` — GET + PATCH with injection detection and length validation. `app/admin/teacher-config/page.tsx` — 5-section form (identity, core_beliefs, diagnostic_eye, voice, signature_moves ×5) with preview toggle. Accessible at `/admin/teacher-config`.

---

## TODO-25: Session → teacher knowledge pipeline

**What:** After each completed video session, extract coaching patterns and technique examples from the session transcript and add them as `knowledge_chunks` tagged to the teacher's `teacher_id`. This is the implicit learning path — the agent improves from session data without the teacher doing any work.

**Why:** The explicit builder (TODO-24) captures what teachers *can articulate*. The implicit pipeline captures what they *actually do* — which is often richer and more consistent. Over time, a teacher with 100 sessions has an agent that embodies their real coaching patterns, not just their stated philosophy.

**Pros:** The core product promise: more sessions → better agent. Creates a data flywheel. Differentiates from generic "build an AI agent" tools — this one improves automatically.

**Cons:** Requires real session data to validate the extraction approach. The extraction quality depends on transcript quality (which depends on TODO-21 Deepgram). Do not build speculatively — wait for 10+ real sessions to understand what patterns are actually worth extracting.

**Context:** The pipeline: `POST /api/session/[id]/complete` already triggers portrait regen. Add a step that calls a `extractTeacherChunks(transcript, teacherId)` function. This function calls GPT-4o with the transcript + teacher's existing `agent_config` and asks: "What coaching moves, analogies, or diagnostic observations from this session are worth adding to this teacher's knowledge base?" Writes results as `knowledge_chunks` with `teacher_id` set and `chunk_type = "playbook"`.

Validate by running this against 10 Sam sessions and checking whether the extracted chunks improve RAG quality (use the eval harness from TODO-10 as a before/after measure).

The architecture is enabled by TODO-23 (knowledge_chunks.teacher_id). Build TODO-10 and TODO-23 first, then validate with real data.

**Effort:** M → CC: ~1 hr | **Priority:** P3 | **Depends on:** TODO-23 + TODO-10 (eval harness) + 10+ real video sessions

---

## TODO-26: Teacher reply email notification to student ✅ DONE

**What:** When Sam replies in the session message thread (admin dashboard), send the student an email with the reply body and their session join link.

**Why:** Closes the async communication loop — the student sees Sam's reply without needing to open the app. Without this, a student who sent "can I work on X?" has no signal that Sam saw it and replied "yes, perfect."

**Pros:** Students stay informed passively. Reinforces that StoryLab is responsive. Reuses Resend (already installed).

**Cons:** Could feel noisy if teacher replies frequently; mitigate with a single summary email rather than one-per-message if volume grows.

**Context:** When `POST /api/session/[id]/messages` is called with `sender_role: "teacher"`, look up the student's email from `students` table (via `session.student_id`) and send a Resend email. Subject: "Sam replied about your [date] session." Body: the reply text + join link. This is the mirror of the student-→-Sam notification built in the session lifecycle PR.

**Effort:** S → CC: ~10 min | **Priority:** P3 | **Depends on:** session_messages table + message thread UI (session lifecycle PR)

**Decision (2026-03-18):** Implemented. `app/api/session/[id]/messages/route.ts` — POST handler sends Resend email to student when `sender_role: "teacher"`. Session join link included. `session_messages` table and migration `20260318_session_messages.sql` applied.

---

## TODO-27: Include pre-session notes in TODO-25 knowledge pipeline

**What:** When `extractTeacherChunks()` runs after session complete (TODO-25), include the student's pre-session messages as additional context in the extraction prompt.

**Why:** "I want to work on my grandma story today" tells the AI exactly what was being coached — the session transcript alone lacks this framing. Pre-session notes are the student's explicit statement of intent and are often the richest signal for why the session went the way it did.

**Pros:** Improves chunk quality and relevance. Zero additional data collection — the notes are already stored.

**Cons:** None meaningful — it's a prompt augmentation, not a structural change.

**Context:** In `extractTeacherChunks(transcript, teacherId)`, fetch `session_messages` for the session (WHERE sender_role='student') and prepend them to the extraction prompt: "Student pre-session note: [body]. Transcript: [transcript]." Only include student messages (sender_role='student'), not teacher replies.

**Effort:** S → CC: ~5 min | **Priority:** P3 | **Depends on:** session_messages table (session lifecycle PR) + TODO-25

---

## TODO-28: Stripe Connect + platform take-rate

**What:** Implement Stripe Connect marketplace payments — teacher connected accounts, automatic platform fee extraction on each transaction, teacher payouts.

**Why:** The marketplace model doesn't generate revenue without it. Teachers earn from AI subscriptions and live sessions; StoryLab takes a % cut automatically on every transaction.

**Pros:** Unlocks the marketplace revenue model. Stripe Connect handles compliance, tax reporting, and international payouts. Platform fee is extracted automatically — no manual reconciliation.

**Cons:** Stripe Connect is an "innovation token" — more complex than standard Stripe Checkout. Requires teacher onboarding into Connect (identity verification). One-way door: hard to swap payment providers later.

**Context:** Two monetization flows: (1) student subscribes to teacher's AI agent plan — recurring charge, platform takes %; (2) student books a live session — one-time charge, platform takes %. Teacher storefront (TODO-29) is the UI entry point. Build after teacher platform architecture PR ships. Stripe Connect docs: https://stripe.com/docs/connect.

**Effort:** L human / M with CC | **Priority:** P1 | **Depends on:** marketplace-reframe plan (`/teachers/[slug]` storefront + platform homepage) must ship first. Once storefront is live, this is unblocked.

**Update (2026-03-18):** Prerequisite noted. Marketplace-reframe plan (CEO review 2026-03-18) builds the storefront that Stripe Connect needs as its UI entry point.

---

## TODO-29: Teacher storefront + student discovery

**What:** Public `/teachers/[slug]` page — teacher profile, teaching philosophy, AI agent preview, pricing for AI subscription and live sessions, booking CTA.

**Why:** The marketplace has no top of funnel without a teacher-facing storefront. Students need a way to discover teachers and understand what they're buying before committing.

**Pros:** Turns teacher profiles into a sales surface. AI agent preview ("try a free message") is a low-friction conversion driver. Teacher slug is SEO-addressable.

**Cons:** Needs Stripe Connect to have a working payment CTA. Preview mode requires sandboxed AI call that doesn't consume student quota.

**Context:** Teacher profile data (name, subject, bio, agent_config) is built in the teacher platform architecture PR. The storefront is the public face of that profile. Slug derived from teacher name (e.g., "sam-a" for Sam Ahn). Build after TODO-28 (Stripe Connect) ships so the booking CTA works end-to-end.

**Update (2026-03-18):** This TODO is superseded by the marketplace-reframe plan (CEO review 2026-03-18) which builds a fuller version: platform homepage, `/teachers/[slug]` storefront with migrated /academy content, AI preview widget, per-teacher blog, and self-serve teacher onboarding. Mark as IN PROGRESS — implementation plan exists.

**Effort:** M human / S with CC | **Priority:** P1 | **Depends on:** TODO-28 (Stripe Connect), teacher platform architecture PR

---

## TODO-30: Pedagogy enrichment post-onboarding

**What:** Teacher can upload session transcripts, recording clips, written notes, or rubrics from /dashboard/settings after onboarding — added to their `knowledge_chunks` and used to sharpen their AI agent over time.

**Why:** A teacher's pedagogy isn't captured in a single 5-question wizard. The AI gets smarter the more teaching material it has. A great teacher should be able to feed it their best session, their most-used framework, their annotated student examples.

**Pros:** Key differentiator for the AI mode — a teacher who trains their AI well has a genuinely better product than one who doesn't. Creates ongoing engagement with the platform. `knowledge_chunks` is already `teacher_id`-scoped and ready.

**Cons:** Upload pipeline (especially audio/video) adds infrastructure complexity. Text and transcript upload is simple; recording processing requires Whisper or similar.

**Context:** The `knowledge_chunks` table already has `teacher_id`. The existing admin teacher-config route (`/api/admin/teacher-config`) handles text chunks. Extend it to accept: (1) pasted transcript, (2) uploaded .txt/.docx file (mammoth already installed), (3) later: audio via Whisper. Surface in /dashboard/settings as a "Teaching Materials" section alongside the wizard.

**Effort:** M human / S with CC | **Priority:** P2 | **Depends on:** teacher platform architecture PR

---

## TODO-31: Identity continuity — student learning arc into teacher profile

**What:** When a student who's been using /lab becomes a teacher, optionally summarize their learning arc (essay topics, growth moments, what worked) and offer to inject it into their teacher profile background. Their own student experience informs their teaching methodology.

**Why:** The most authentic teachers teach from their own learning experience. A student who grew up on StoryLab has a unique origin story — their /lab conversations are evidence of what the platform can do. Surfacing this when they set up their teacher profile makes the transition feel meaningful, not administrative.

**Pros:** Deep product coherence — learning and teaching compound on each other. Differentiates teacher onboarding from competitors. Authentic data (real conversations) rather than a blank wizard.

**Cons:** Requires consent UI (reading private conversations). Summary job complexity (LLM call over potentially hundreds of messages). Edge case: what if their student conversations are embarrassing? Must be optional and previewable.

**Context:** The mechanic: when a student registers as a teacher (`POST /api/teacher/register`), if they have > N conversations in `conversation_messages`, show a step: "Your learning journey can inform your teaching. Want us to import highlights?" If yes, run a summarization job (GPT-4o over last 50 messages), store in `teachers.agent_config.student_background`. Injected into their AI system prompt alongside the wizard fields. Implementation: reuse existing `/api/lab/chat` summarization pattern. Consent stored as `teachers.identity_import_consented_at`.

**Effort:** L human / ~1 hour CC | **Priority:** P3 | **Depends on:** multi-role identity PR shipping

---

## TODO-32: Role-aware weekly email digest

**What:** A weekly cron email summarizing all roles: "This week in your StoryLab — 3 sessions taught, 2 AI conversations as a student, 1 new teacher joined the platform." Sent Sunday evenings, covers all active roles for the user.

**Why:** Retention. A single beautiful email that reflects your whole relationship with the platform reinforces the lifelong learner identity. Better than 3 separate transactional emails that feel like noise.

**Pros:** Strong retention mechanic. Positions StoryLab as a "relationship" not a tool. Notification center data (once built) makes this trivial to generate. One email = all roles.

**Cons:** Requires notification center to exist first (TODO in multi-role PR). Cron complexity (weekly schedule, user timezone handling). Risk: digest feels spammy if there's nothing meaningful to report — add a threshold (only send if N meaningful events).

**Context:** Implementation: `GET /api/cron/weekly-digest` (new Vercel cron, Sundays 18:00 UTC). Query `notifications` table for events in past 7 days grouped by user_id. For each active user with events, build a role-grouped summary email using Resend. Template: same StoryLab email design language as other emails. Only send if user had at least 1 event in the past week. Add `digest_unsubscribed` boolean to a user preferences table or `teachers`/`student_profiles`.

**Effort:** M human / ~15min CC | **Priority:** P2 | **Depends on:** notifications table ✅ (shipped 2026-03-18 — `20260318_notifications.sql` applied)

---

## TODO-33: Per-teacher accepting-new-students toggle

**What:** Add `accepting_students` boolean to `teachers` table. Surface it on the teacher storefront ("Currently accepting new students" / "Waitlist only") and make it controllable from `/dashboard`.

**Why:** Once multiple teachers exist on the platform, some will be at capacity. Students shouldn't be able to start onboarding with a teacher who can't take them — better to show honest availability upfront than to let students start and get turned away.

**Pros:** Sets honest expectations. Teachers control their capacity. Prevents student frustration.

**Cons:** Minor extra state to manage; teachers need to remember to toggle it.

**Context:** One new column on `teachers` table: `accepting_students BOOLEAN DEFAULT true`. Show a badge on the teacher card and storefront. On teacher's `/dashboard`, add a toggle in settings. When `false`, hide or grey out the "Start with [Teacher]" CTA and show a waitlist message instead.

**Effort:** S human / S with CC | **Priority:** P2 | **Depends on:** marketplace-reframe plan (teacher storefront must exist first)
