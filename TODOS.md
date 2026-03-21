# TODOs

Captured during /plan-eng-review on 2026-03-12. Updated during /plan-ceo-review on 2026-03-17 (x4). Updated during /plan-ceo-review on 2026-03-17 — live coaching companion review (x3). Updated during /plan-ceo-review on 2026-03-18 — multi-teacher platform vision (x3 new, x2 closed). Updated during /plan-ceo-review on 2026-03-18 — teacher platform architecture (x3 new). Updated during /plan-ceo-review on 2026-03-18 — multi-role identity (x2 new). Implemented 2026-03-18: TODO-10, TODO-15, TODO-16, TODO-23, TODO-24, TODO-26 all shipped. Added 2026-03-19: TODO-34, TODO-35. Updated 2026-03-19 — teacher profile builder review (x2 new: TODO-36, TODO-37; TODO-34 and TODO-35 superseded by accepted scope). Added 2026-03-19: TODO-38 (enterprise/districts demo flow), TODO-39 (student learning dashboard — 10x vision). Added 2026-03-19: TODO-40 (student platform research), TODO-41 (primary_emphasis section ordering). Added 2026-03-19: TODO-42 (B2B institutional hub — private school/org communities), TODO-43 (AI translation layer — cross-language tutoring). Updated 2026-03-19: TODO-42 and TODO-43 expanded with full implementation nuance from /plan-ceo-review SELECTIVE EXPANSION (chosen direction: TODO-42 = Approach C full multi-tenant subdomains; TODO-43 = build ladder A→C→B). Added 2026-03-19: TODO-44 (international teacher payout support). Stripe Connect plan reviewed 2026-03-19 — scope: Connect Express + 20% take-rate + earnings widget + admin revenue table. Implemented 2026-03-19: TODO-28 (Stripe Connect) shipped. Updated 2026-03-19 — B2B institutional hub CEO review: added TODO-46 (Phase 2 subdomains + branding), TODO-47 (SSO integration), TODO-48 (org analytics caching). Added 2026-03-19: TODO-49 (sales-led org pricing — contact Sam flow), TODO-50 (org pricing tier tracking). Implemented 2026-03-21: TODO-38 (For Schools marketing hub + demo funnel) shipped. Added 2026-03-21: TODO-53 (ROI calculator), TODO-54 (partner logos), TODO-55 (demo confirmation email), TODO-56 (PDF one-pager). Added 2026-03-21: TODO-57 (subject landing pages), TODO-58 (teacher recruiting engine), TODO-59 (subject outcome dashboards), TODO-60 (subject SEO pages) — all from platform identity pivot CEO review.

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

## TODO-28: Stripe Connect + platform take-rate ✅ DONE

**What:** Implement Stripe Connect marketplace payments — teacher connected accounts, automatic platform fee extraction on each transaction, teacher payouts.

**Why:** The marketplace model doesn't generate revenue without it. Teachers earn from AI subscriptions and live sessions; StoryLab takes a % cut automatically on every transaction.

**Pros:** Unlocks the marketplace revenue model. Stripe Connect handles compliance, tax reporting, and international payouts. Platform fee is extracted automatically — no manual reconciliation.

**Cons:** Stripe Connect is an "innovation token" — more complex than standard Stripe Checkout. Requires teacher onboarding into Connect (identity verification). One-way door: hard to swap payment providers later.

**Context:** Two monetization flows: (1) student subscribes to teacher's AI agent plan — recurring charge, platform takes %; (2) student books a live session — one-time charge, platform takes %. Teacher storefront (TODO-29) is the UI entry point. Build after teacher platform architecture PR ships. Stripe Connect docs: https://stripe.com/docs/connect.

**Effort:** L human / M with CC | **Priority:** P1 | **Depends on:** marketplace-reframe plan (`/teachers/[slug]` storefront + platform homepage) must ship first. Once storefront is live, this is unblocked.

**Update (2026-03-18):** Prerequisite noted. Marketplace-reframe plan (CEO review 2026-03-18) builds the storefront that Stripe Connect needs as its UI entry point.

**Completed: 2026-03-19** — Shipped: Connect Express onboarding, `account.updated` webhook, 20% `application_fee_amount` on `/api/book/checkout`, teacher Payments tab in `/dashboard/settings`, admin revenue table on `/admin/platform`. DB: `teachers.stripe_account_id` + `stripe_onboarding_complete`. Deferred: /lab subscription fee (TODO-45), international payouts (TODO-44).

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

## TODO-33: Per-teacher accepting-new-students toggle ✅ DONE

**What:** Add `accepting_students` boolean to `teachers` table. Surface it on the teacher storefront ("Currently accepting new students" / "Waitlist only") and make it controllable from `/dashboard`.

**Why:** Once multiple teachers exist on the platform, some will be at capacity. Students shouldn't be able to start onboarding with a teacher who can't take them — better to show honest availability upfront than to let students start and get turned away.

**Pros:** Sets honest expectations. Teachers control their capacity. Prevents student frustration.

**Cons:** Minor extra state to manage; teachers need to remember to toggle it.

**Context:** One new column on `teachers` table: `accepting_students BOOLEAN DEFAULT true`. Show a badge on the teacher card and storefront. On teacher's `/dashboard`, add a toggle in settings. When `false`, hide or grey out the "Start with [Teacher]" CTA and show a waitlist message instead.

**Effort:** S human / S with CC | **Priority:** P2 | **Depends on:** marketplace-reframe plan (teacher storefront must exist first)

---

## TODO-34: Help teachers price their AI agents and themselves

**What:** Build a pricing guidance flow within the teacher onboarding/settings that helps teachers determine: (1) what to charge per session (live coaching), and (2) how to price AI agent access for students (subscription vs. per-session).

**Why:** Teachers have no reference point for pricing their knowledge. Getting this wrong destroys retention — too high scares parents off, too low devalues the teacher and the platform. A guided tool that benchmarks against comparable tutors, estimates hours-to-recoup, and suggests tiered pricing (e.g. "AI access: $30/mo, live session: $250/hr") would meaningfully increase teacher confidence and platform GMV.

**Pros:** Removes a major friction point in teacher activation. Aligned financial incentives = more engaged teachers. Gives platform leverage to set norms (prevent race-to-bottom pricing).

**Cons:** Pricing is sensitive — teachers may resist being told what to charge. Requires market data or benchmarks to be credible.

**Context:** Currently `pricing_config` on the `teachers` table holds a `sessionPrice` JSONB field set during onboarding Step 3. The field is filled manually with no guidance. The onboarding step that collects this lives in `app/teacher/onboarding/page.tsx` (Step 3, pricing section). AI agent pricing is not surfaced to teachers at all — they have no visibility into what students pay for `/lab` access or how that revenue flows to them.

**Depends on:** Revenue share model being defined (currently undefined). Platform pricing page.

---

## TODO-35: Help teachers build their teacher profiles

**What:** Build a guided profile completion flow in `/dashboard/settings` that walks teachers through: photo upload, bio writing, subject tags, quote/headline, accepting_bookings toggle, and Google Calendar setup. Show a live preview of their storefront as they fill it in. Include a completeness score ("Your profile is 60% complete").

**Why:** Teachers currently have no guidance on what makes a great storefront. The profile wizard in `/teacher/onboarding` captures minimal info and teachers likely skip it or fill it poorly. A compelling storefront (photo, bio, specific subject framing) is the #1 driver of parent bookings. A bad profile = zero bookings even with good availability.

**Pros:** Directly drives teacher activation and first booking. A live preview removes the "what does this look like?" anxiety. Completeness score creates a gamified motivation loop.

**Cons:** Photo upload requires storage setup (Supabase Storage bucket for teacher photos). Live preview requires a client-side rendering of the storefront component.

**Context:** The teacher settings page is at `app/dashboard/settings/page.tsx`. The storefront is rendered by `app/teachers/[slug]/_components/TeacherStorefrontContent.tsx`. The `teachers` table has: `name`, `slug`, `subject`, `bio`, `photo_url`, `quote`, `storefront_published`, `accepting_bookings`, `google_calendar_id`, `pricing_config`. Currently `photo_url` is set manually (admin side only). The teacher onboarding wizard (`app/teacher/onboarding/page.tsx`) only captures basic info and does not have a preview.

**Depends on:** Supabase Storage bucket for teacher photo uploads (not yet configured). TODO-34 (pricing guidance) could be woven into this same flow.

---

## TODO-36: Pricing guidance in profile builder wizard

**What:** The profile builder's Pricing tab currently shows a bare number field for session price. Build a full guidance flow: benchmarks against comparable tutors in the subject/market, suggested tiered pricing structure (AI-only access vs. live sessions), and an hours-to-recoup calculator for teachers setting their rates.

**Why:** Teachers have no reference point for pricing their knowledge. Getting this wrong destroys retention — too high scares parents off, too low devalues the teacher and the platform. This is the difference between teachers feeling confident at activation vs. guessing and second-guessing.

**Pros:** Removes a major friction point in teacher activation. Gives the platform leverage to set healthy pricing norms (prevent race-to-bottom). Aligned financial incentives = more engaged, longer-retained teachers.

**Cons:** Pricing is sensitive — teachers may resist being told what to charge. Requires market data or benchmarks to be credible. Revenue share model must be defined before this is useful.

**Context:** The profile builder wizard ships first (accepted scope in 2026-03-19 review). This extends the Pricing tab of that wizard. The `pricing_config` JSONB on `teachers` can hold whatever structure we land on. Currently it's set manually with no guidance. Entry point: `app/dashboard/settings/` Pricing tab. Supersedes and extends TODO-34.

**Effort:** M human / S CC+gstack
**Priority:** P2
**Depends on:** Profile builder wizard (accepted scope, 2026-03-19). Revenue share model definition.

---

## TODO-37: Teacher storefront analytics

**What:** Simple per-teacher analytics: pageviews on `/teachers/[slug]`, CTA click counts ("Book a session" clicks, "Try my AI coach" clicks, contact form submissions). Visible to the teacher in their dashboard.

**Why:** Once teacher pages are self-serve and live, teachers will immediately want to know if their storefront is working. Without this, they have no signal to improve their profile. It's also a retention tool — seeing "42 parents viewed your page this month" is motivating.

**Pros:** Closes the feedback loop for teacher activation. Identifies which storefront sections convert parents (data to improve templates). Low implementation cost relative to the activation value.

**Cons:** Adds a new data pipeline (events → aggregate → display). GDPR consideration for EU users. Need to decide: first-party tracking or a lightweight external tool (Plausible, etc.).

**Context:** The storefront page at `app/teachers/[slug]/page.tsx` is the right place to instrument. The teacher dashboard is at `app/dashboard/`. The simplest implementation: a `storefront_events` table (teacher_id, event_type, created_at) with a server action on page load + CTA clicks. No external tool needed for v1.

**Effort:** M human / S CC+gstack
**Priority:** P2
**Depends on:** Teacher profile builder shipping (accepted scope, 2026-03-19). Nothing else.

---

## TODO-38: "Book a Demo" flow for school districts and educational organizations ✅ DONE

**Completed:** 2026-03-21 — shipped as `/for-schools` marketing hub + `/demo` intake form + `/for-schools/overview` printable one-pager. Navbar updated with "For Schools" link + "Schedule a Demo" button. Homepage institutional section added between Teachers and Manifesto sections. Email-only via Resend (no DB — add `demo_inquiries` table when volume justifies it).

**What:** Build a dedicated landing page and inquiry flow for institutional buyers — school districts, tutoring centers, and edtech companies interested in licensing or deploying the platform.

**Why:** Individual teacher sign-ups are the current acquisition model, but institutional buyers represent a completely different (and much higher-value) sales motion. A district deploying the platform for 500 students is a fundamentally different conversation than a solo tutor signing up. Without a dedicated entry point, these buyers have nowhere to land and no way to signal intent.

**Pros:** Opens a B2B revenue channel alongside the B2C tutor marketplace. A short intake form (org size, use case, timeline) pre-qualifies leads before any human time is spent. The page also signals platform maturity to institutional evaluators who may stumble across the site.

**Cons:** Requires thinking through the institutional product offering (is it white-label? a managed deployment? per-seat pricing?) before the page can be written with conviction. Launching a vague "contact us" page is worse than no page. Should wait until there is at least one real institutional conversation to draw from.

**Context:** The entry point is a new route at `/enterprise` or `/schools` (TBD). The page should communicate the platform's value to administrators and curriculum directors — different audience than the teacher-facing storefront. The intake form should collect: org name, role, student count, primary use case, timeline. Route submissions to a separate email or CRM rather than the existing `storylab.ivy@gmail.com` contact form. Consider a separate Supabase table (`demo_requests`) or just a Notion form integration.

**Effort:** S human / S CC+gstack
**Priority:** P2
**Depends on:** At least one real institutional conversation to inform what the page should say.

---

## TODO-39: Student learning dashboard — the 10x product vision

**What:** A unified student dashboard where all of a student's learning lives: homework assignments, drafts, feedback history, session notes, goal tracking, and AI coach interactions — all in one place, not scattered across email threads and Google Docs.

**Why:** The current `/lab` is an AI essay coach. That's a tool. The 10x product is the place students *live* during their academic life — a second brain for learning that happens to have a great AI tutor built in. Right now the platform is teacher-centric (teachers have storefronts, settings, dashboards). The student experience is thin: sign in, chat, leave. The long-term defensibility of the platform is a student who has 2 years of their learning history in one place — that's not something they'll abandon for a cheaper alternative.

**Pros:** Massive retention driver — the more history a student has in the platform, the stickier it becomes. Unlocks new revenue vectors (premium plans, school licensing based on student seats). Turns the AI coach from a chat window into an academic advisor with full context on the student's goals, progress, and weak spots over time.

**Cons:** This is a large product surface. The risk is building a generic LMS when the differentiated value is the AI + teacher quality. Needs careful scoping to avoid becoming homework management software. The right frame is: "the place where a student's relationship with their teacher and their AI coach lives" — not "digital binder."

**Context:** The foundation already exists: `student_profiles` (goals, target schools, voice), `conversations` + `conversation_messages` (full AI chat history), `sessions` (video coaching records with transcripts), `portraits` (AI-generated student portraits after each session). The data model is largely there. What's missing is a student-facing UI that surfaces all of it coherently. The vision: a student opens their dashboard and sees their essay drafts in progress, their next session, their most recent AI coach feedback, and their portrait — all in one view. Start with the most valuable slice: surfacing session history and portraits to students (currently only visible to teachers in `/admin/dashboard`).

**Effort:** XL human / L CC+gstack
**Priority:** P3 — directionally important but not the next thing to build
**Depends on:** Teacher profile builder (so students have real teacher relationships to anchor to). Multi-student support already exists.

---

## TODO-40: Competitive landscape research — every platform StoryLab competes with

**What:** Map the full competitive landscape across three tiers: (1) student workflow platforms (Google Classroom, Canvas, Schoology, Notion, Blackboard), (2) tutoring/coaching marketplaces (Wyzant, Varsity Tutors, Tutor.com, Lessonface, Superprof), (3) AI-native edtech (Khan Academy Khanmigo, Synthesis, Kira, Numerade, Chegg). For each: what it does, who it's for, where it falls short, and what StoryLab does that it can't.

**Why:** StoryLab competes differently at each tier — Google Classroom at the student workflow layer, Wyzant at the teacher marketplace layer, Khanmigo at the AI tutor layer. Before designing the 10x student dashboard (TODO-39) or the enterprise/districts pitch (TODO-38), we need a clear picture of what we're differentiating from at each level. The strategic question isn't just "what do students use" — it's "where is the white space no one has claimed."

**Pros:** Sharpens the product wedge at every layer. Prevents building commodity features that incumbents already own. Gives the enterprise demo (TODO-38) a crisp "why us" narrative. Sets up TODO-39 scoping to be 10x better.

**Cons:** Research work, no code shipped. Scope can expand — needs a time-box. The right output is a 1-page competitive matrix, not a 40-page report.

**Context:** Key distinctions to track: (a) K-12 vs. college focus (Canvas skews college; Google Classroom skews K-12); (b) AI-native vs. AI-bolted-on; (c) teacher-centric vs. student-centric vs. institutional. StoryLab's current differentiation is the combination of a teacher's storefront + relationship-aware AI coaching + narrative arc over time — that combination doesn't exist anywhere in the market. The research should confirm that gap or find where it doesn't hold.

**Effort:** S human / S CC+gstack
**Priority:** P3 — do before TODO-38 (enterprise demo) or TODO-39 (student dashboard) implementation
**Depends on:** Nothing — can be done anytime as a research spike

---

## TODO-41: Implement primary_emphasis section ordering in TeacherStorefrontContent ✅ DONE

**What:** Wire up the `primaryEmphasis` prop in `TeacherStorefrontContent.tsx` to actually reorder and conditionally render storefront sections based on a teacher's emphasis setting.

**Why:** The data model is complete (`primary_emphasis` column, feature flags, props declared) but the component ignores the value — every teacher's storefront renders in the same section order regardless of their `primary_emphasis` setting. The CEO plan defined three orderings: AI-emphasis (AI coach section early), Live-emphasis (booking section prominent), Equal (AI coach + book side by side).

**Pros:** Completes the feature flags architecture. Gives future teachers meaningful control over their storefront's first impression. Differentiates an AI-focused tutor from a live-session coach at the page level.

**Cons:** Requires restructuring `TeacherStorefrontContent.tsx` to conditionally render section order — moderate JSX refactor. No DB or API changes needed.

**Context:** `aiCoachingEnabled`, `liveSessionsEnabled`, and `primaryEmphasis` are already passed as props (see `app/teachers/[slug]/page.tsx:67`). The component just needs to use them. Reference the section order spec in the CEO plan: `~/.gstack/projects/bananaduck1-storylab/ceo-plans/2026-03-19-teacher-profile-builder.md`. The "equal" case (AI + Book side by side) is the most design-intensive.

**Effort:** M human / S CC+gstack
**Priority:** P2 — needed before onboarding teacher #2
**Depends on:** Teacher profile builder (shipped)

---

## TODO-42: B2B institutional hub — private school/org communities

**What:** A gated, white-label version of StoryLab for schools and institutions. Each organization gets its own private community: their teachers, their students, their branding — not visible to the public. Access controlled by invite code or domain. Configurable per institution (which features are on, what subjects, what pricing model). Full subdomain per org: `schoolname.storylab.co`.

**Why:** The public marketplace is one growth vector. The B2B channel is a different, potentially larger one — a school buys a StoryLab subscription and deploys it to 500 students at once. That's a very different sales motion (one contract → many users) and a very different retention profile (institutional lock-in vs. individual churn). The two models can coexist: public marketplace for consumer, institutional hub for B2B.

**Pros:** Dramatically larger contract sizes. Institutional relationships are sticky — once a school adopts a platform, switching costs are high. Opens the door to the districts/enterprise pitch (TODO-38). Natural expansion path: start with one private school, prove the model, expand to district. Subdomains create strong brand presence for each institution.

**Cons:** B2B sales is slower and more relationship-driven than consumer. Full multi-tenancy with RLS and subdomain routing is architecturally significant (see approaches below). Customization per institution adds product complexity. Per-org feature flags need a management interface. Need to figure out the right pricing model (per-seat, per-school, per-district). Subdomain routing requires Vercel wildcard domain config + Supabase-level tenant resolution middleware.

**Implementation approaches (reviewed in /plan-ceo-review SELECTIVE EXPANSION, 2026-03-19):**

- **Approach A — Lightweight org layer** (L human / M CC+gstack): Add `organizations` table, foreign key `org_id` on `teachers`/`students`, invite-code join flow, simple org admin view. No subdomains. Shared URL space (`/org/school-name`). Fastest to ship; weakest institutional brand presence. Best if you want to validate the B2B motion before committing to infra.

- **Approach B — Full multi-tenant RLS isolation** (XL human / L CC+gstack): Add `organizations` table, tenant-scoped RLS policies on every table (teachers, students, conversations, sessions), per-org feature flags table. Tenant resolved from subdomain in middleware. All queries filtered by `org_id` automatically. Complete data isolation between orgs. Highest architectural complexity — touches every table and every API route.

- **Approach C — Full multi-tenant with subdomains + branding** (L-M human / S-M CC+gstack, incremental on top of B): Approach B + `schoolname.storylab.co` wildcard subdomains + per-org branding (logo, primary color, custom welcome copy). This is the chosen direction. Vercel wildcard domain (`*.storylab.co`) + Next.js middleware reads subdomain → resolves org → injects org context into all queries.

**→ CHOSEN DIRECTION: Approach C (full multi-tenant with subdomains + branding).** Rationale: institutional buyers respond strongly to "this is your school's platform" — the subdomain makes it feel like the institution owns it. RLS-based isolation is the right architecture for data privacy. The marginal cost of adding subdomains on top of multi-tenant is small.

**Dream state (12-month horizon):** StoryLab runs as three overlapping products: (A) public marketplace for individual students and teachers, (B) institutional platform for schools deploying to their community, (C) global network where a student in Flushing can be matched with a teacher in Seoul. The B2B and consumer layers share 90% of the same infrastructure. A school admin can browse the public teacher marketplace and invite teachers into their private community.

**Context:** Core schema changes: `organizations` table (`id`, `slug`, `name`, `logo_url`, `primary_color`, `invite_code`, `feature_flags` JSONB), `org_id` column on `teachers` and `students`, wildcard domain in `vercel.json`, tenant-resolution middleware in `middleware.ts`. Per-org feature flags (which AI models, which session types, pricing visibility). The public marketplace (`teachers/`, `/`) remains unchanged — teachers can exist in both the public marketplace and one or more org communities.

**Effort:** XL human / L CC+gstack (full implementation); start with Approach A (L/M) to validate B2B sales motion, then migrate to Approach C
**Priority:** P2 — strategic; do after teacher #2 onboarding validates the multi-teacher model
**Depends on:** Multi-teacher platform (shipped), teacher profile builder (shipped)

---

## TODO-43: AI translation layer — cross-language tutoring

**What:** AI-mediated language bridging woven into the tutoring experience, so a student and teacher who don't share a native language can work together fluently. A student in Flushing (Chinese-speaking household) should be able to work with a tutor in Seoul (Korean native, English-proficient) without language being the barrier.

**Why:** The best tutor for a given student may not be in their city or country or language. The platform's deepest value proposition is matching the right expertise to the right student — if language is a wall, the platform has artificially constrained its own market. AI makes that wall removable in a way that wasn't possible three years ago. This is a genuine 10x feature: no tutoring platform has built real cross-language tutoring. It's a wedge into global markets.

**Pros:** Opens the teacher supply side globally (dramatically increases the number of qualified teachers on the platform). Opens the student demand side globally (students anywhere can access teachers anywhere). Strong differentiation — no competitor has this. Naturally viral: a tutor in Seoul with 10 American students tells other Seoul tutors. The /lab layer in particular is nearly zero-cost to implement.

**Cons:** Translation quality for nuanced feedback on essays or creative writing is harder than translation for factual subjects. The latency and quality bar for real-time session translation is high — live audio translation is a separate, harder problem from text. Trust: students and parents need to believe the translated feedback is accurate. Privacy: who has access to session transcripts for translation?

**Implementation approach — build as a ladder (reviewed in /plan-ceo-review SELECTIVE EXPANSION, 2026-03-19):**

- **Approach A — /lab language preference** (S human / S CC+gstack, ship immediately): Add `preferred_language` field to `student_profiles`. Inject it into the system prompt so the AI coach responds in the student's language (e.g., Mandarin, Korean, Spanish) while the teacher's agent prompt and knowledge base stay in English. The LLM does the translation transparently. Near-zero risk, huge value for non-English students. This is the first step.
  - Implementation: add column to `student_profiles`, add a language selector to the onboarding form and `/lab/profile` edit page, update `buildSystemPromptForUser()` in `lib/lab-profile.ts` to append `Respond in [language].`

- **Approach C — Async post-session transcript translation** (M human / S-M CC+gstack, ship second): After a live video session completes (when `/api/session/[id]/complete` runs), translate the transcript into the student's preferred language and store it alongside the English original. Students who don't read English fluently can review what was said. No real-time complexity. This closes the gap for students whose native language isn't English but whose teacher works in English.
  - Implementation: POST-session webhook triggers translation job via OpenAI or Google Translate API; store translated transcript in `sessions.transcript_translated` JSONB; surface it in the student's session history UI.

- **Approach B — Real-time live session translation** (XL human / L CC+gstack, ship much later): Transcribe both sides of the video call in real time, translate each utterance, and display subtitles to the other party. Two-way translation: teacher sees student speech in English, student sees teacher speech in their native language. Extremely high value but extremely hard. Daily.co doesn't expose per-participant audio streams easily; need to route audio through a translation pipeline before display. This is a separate, much harder product surface — do not conflate with Approach A.

**→ RECOMMENDED BUILD ORDER: A → C → B.** Start with /lab language preference (Approach A) — ships in one session, immediately valuable for non-English students, validates demand before investing in live translation infrastructure.

**Context:** The /lab surface and the live session surface are entirely separate translation problems. Approach A (chat) is a prompt engineering change. Approach C (async transcript) is a post-processing job. Approach B (real-time video) requires audio routing infrastructure. Don't let Approach B's complexity block A and C. The key data primitive: `preferred_language` on `student_profiles`, consistent across all three approaches.

**Effort:** S CC+gstack (Approach A alone); M CC+gstack (+ Approach C); XL/L (full ladder including real-time)
**Priority:** P3 — vision-level; Approach A can ship anytime; full ladder after B2B model is validated (TODO-42)
**Depends on:** Student profile (shipped), /lab chat (shipped), video sessions (shipped for Approach C+B)

---

## TODO-44: International teacher payout support

**What:** Validate and document which countries Stripe Connect Express supports for teacher payouts before opening the platform to non-US teachers. Add a country eligibility check to the Connect onboarding flow so teachers in unsupported countries see a clear message rather than failing silently mid-KYC.

**Why:** Stripe Express doesn't support all countries equally — some require Standard accounts instead, some are unsupported entirely. A teacher in Korea, Canada, or India will have a different onboarding experience. Before recruiting international teachers, we need to know what we can actually offer them.

**Context:** Stripe's supported countries for Connect Express are listed at https://stripe.com/docs/connect/express-accounts. The `teachers.stripe_account_id` created in the Stripe Connect PR (TODO-28) works globally for charge routing, but payout eligibility (can money actually land in the teacher's bank?) is country-dependent. Research spike: for each target country (Korea, Canada, India, UK — wherever teacher #3+ might come from), confirm: (a) Express supported, (b) payout timeline, (c) any additional identity verification requirements.

**Effort:** S research spike | **Priority:** P3
**Depends on:** Stripe Connect foundation (TODO-28, shipped), international teacher recruitment

---

## TODO-45: Platform fee on /lab recurring subscriptions

**What:** Extend the student's `/lab` subscription checkout (`app/api/payments/subscribe/route.ts`) to route through the teacher's Connect account with a 20% platform fee — so when a student subscribes to teacher #2's AI coaching plan, 80% goes to the teacher automatically.

**Why:** The Connect foundation (TODO-28) extracts fees on one-time session bookings. But /lab monthly subscriptions (`mode: "subscription"`) currently go straight to the platform account. Once teacher #2 has /lab students subscribing, this fee capture is missing.

**Pros:** Completes the marketplace revenue model — 20% cut on both live sessions AND AI subscription revenue. Foundation already exists after TODO-28.

**Cons:** Connect + subscriptions have edge cases: teacher deauthorizes mid-subscription (what happens to the recurring charge?), teacher leaves platform. Need clear policies before implementing.

**Context:** `app/api/payments/subscribe/route.ts` creates a Stripe Checkout session in `mode: "subscription"`. To add Connect routing, add `application_fee_percent: 20` (not `application_fee_amount` — percent is used for subscriptions) and `transfer_data.destination: teacher.stripe_account_id` to the session. Also need `subscription_data.transfer_data`. The student profile must be associated with a specific teacher_id for this to work — right now `subscribe` doesn't know which teacher the student is subscribing to.

**Effort:** M human / S CC+gstack
**Priority:** P2
**Depends on:** TODO-28 (Stripe Connect foundation), teacher-student association in student_profiles, teacher_id-scoped /lab subscription model

---

## TODO-46: Phase 2 — B2B subdomain routing + per-org branding

**What:** Add `schoolname.storylab.co` wildcard subdomain routing and per-org branding (logo, primary color applied to CSS tokens). Phase 1 ships `/org/[slug]` path-based routing; Phase 2 promotes orgs to their own subdomains.

**Why:** Institutional buyers respond strongly to "this is your school's platform" — the subdomain makes it feel like the institution owns it. Phase 1 validates the B2B sales motion; Phase 2 ships when the first paying customer signs and wants the full white-label experience.

**Pros:** Strong institutional brand signal. Per-org branding tokens already stubbed in Phase 1 schema (`logo_url`, `primary_color` on `organizations`). Middleware already handles org resolution — subdomain adds one lookup at the top.

**Cons:** One-way door infrastructure change (DNS + Vercel wildcard domain config). Only trigger when there's a real paying customer.

**Context:** Vercel: add `*.storylab.co` wildcard domain. Next.js middleware: extract `host` header → parse subdomain → resolve org from `organizations.slug` → inject into request headers. Per-org branding: read `primary_color`/`logo_url` from org row, expose as CSS custom properties on `<html>` overriding default DESIGN.md tokens for org-scoped pages.

**Effort:** M human / S CC+gstack
**Priority:** P2 — trigger on first paying institutional customer
**Depends on:** TODO-42 Phase 1 (B2B institutional hub, org data model)

---

## TODO-47: SSO integration — Google Workspace / Microsoft 365

**What:** Allow institutional users to log in via their school-issued Google or Microsoft account. Supabase supports both OAuth providers natively.

**Why:** A common enterprise IT requirement. Many schools mandate institutional accounts for third-party tools. Can be a deal-breaker for district-level sales (TODO-38).

**Pros:** Unlocks enterprise/district sales. Low effort — Supabase OAuth config + minor UI change. Domain-based auto-join (Phase 1) works naturally: email domain is verified by Google/Microsoft.

**Cons:** Requires registering StoryLab as an OAuth app in Google Cloud Console and Microsoft Azure AD. Only needed for enterprise tier.

**Context:** Supabase: enable Google and Microsoft OAuth providers in dashboard. Auth callback at `app/auth/callback/route.ts` requires no changes. UI: add "Sign in with Google"/"Sign in with Microsoft" buttons to login page, conditionally shown when joining an org (`?org=slug` param).

**Effort:** S human / S CC+gstack
**Priority:** P3 — enterprise tier only; defer until TODO-38 (districts) is in scope
**Depends on:** TODO-42 (B2B institutional hub), TODO-46 (Phase 2 subdomains, optional)

---

## TODO-48: Org analytics caching for large cohorts

**What:** Pre-compute daily analytics snapshots for each org into an `org_analytics_cache` table, updated by a cron job. Phase 1 ships with live aggregation queries; this is the scaling fix for orgs with 50+ students.

**Why:** Live aggregation across conversations, usage_logs, and sessions filtered by org_id (via student JOIN) becomes slow for large orgs. Pre-computed snapshot eliminates query cost on every admin page load.

**Pros:** Sub-10ms analytics page load regardless of org size. Cron pattern already exists (`vercel.json` crons). Simple daily INSERT.

**Cons:** Analytics are 24h stale (acceptable for admin dashboards). Adds a cron dependency.

**Context:** Schema: `org_analytics_cache(org_id, date, student_count, active_students_7d, session_count_30d, lab_messages_30d)`. Cron: `/api/cron/compute-org-analytics`, daily at 14:00 UTC. Trigger this when first large org (50+ students) reports slow analytics load.

**Effort:** S human / S CC+gstack
**Priority:** P3 — trigger when first large org (50+ students) hits the platform
**Depends on:** TODO-42 (B2B institutional hub, Phase 1)

---

## TODO-49: Sales-led org pricing — replace direct Stripe checkout with "contact us" flow ✅ DONE

**What:** Replace the "Subscribe" → Stripe Checkout button in `/org/[slug]/admin` with a "Contact us to get started" CTA that routes to a short intake form or direct email to Sam. Sam negotiates price and manually creates a custom Stripe subscription per org via the Stripe Dashboard (or a thin internal API).

**Why:** Org pricing will be "speak to sales" — no fixed public price. This means a single `STRIPE_ORG_PRICE_ID` is the wrong model. Each school contract is negotiated based on cohort size, budget, and fit. A uniform price treats a well-resourced school the same as an underfunded one, which is both a mission problem and a sales problem.

**Pros:** Pricing flexibility is the natural solution to the equity concern — Sam can quote Exeter full rate and a Title I public school at cost or discounted. Every org deal is a relationship conversation, not a self-serve click. Avoids the need to maintain a public pricing page.

**Cons:** Manual per-org subscription creation adds admin overhead for Sam as volume grows. Not an issue at early stage (10–20 orgs); becomes a problem at 100+ orgs.

**Context:** Current implementation (`app/api/org/subscribe/route.ts`) issues a Stripe Checkout session against `STRIPE_ORG_PRICE_ID`. This route can stay as internal tooling for when Sam creates subscriptions on behalf of an org, but shouldn't be the user-facing path. The admin billing tab UI should show a "Get started — contact us" CTA with Sam's email or a simple intake form, plus a status indicator once a subscription is active (webhook already handles that via `org_subscriptions` table). No change needed to the webhook or DB layer.

**Effort:** S human / S CC+gstack
**Priority:** P2 — do before first org signs up; the self-serve checkout is a placeholder
**Depends on:** TODO-42 (B2B institutional hub, Phase 1)

---

## TODO-50: Org pricing tier tracking — record deal context per org ✅ DONE

**What:** Add a `pricing_tier` field (or equivalent metadata) to the `organizations` table so Sam can record what pricing category each org was given and why. Values: `'standard'` | `'reduced'` | `'sponsored'`. Store a short `deal_notes` text field alongside it for Sam's internal context (e.g., "Title I school, 80% discount," "strategic partnership").

**Why:** Once pricing is negotiated case-by-case, the decision rationale lives only in Sam's memory or email. When the org comes up for renewal, or when a third party eventually handles sales, the pricing history is lost. Capturing tier + notes at signup creates a paper trail and makes equity-based discounting intentional rather than ad hoc.

**Pros:** Lightweight (two columns). Makes the pricing philosophy legible to future Sam or a sales hire. Enables Sam to see at a glance which orgs are subsidized when planning revenue projections. Could eventually feed into analytics (what % of orgs are on reduced pricing).

**Cons:** Adds a manual data-entry step to org creation. Low risk — fields are nullable, no enforcement logic needed.

**Context:** The equity concern is: a flat rate treats Exeter the same as an underfunded public school. "Speak to sales" (TODO-49) solves the pricing side. This TODO captures the *tracking* side. Schema addition: `ALTER TABLE organizations ADD COLUMN pricing_tier TEXT CHECK (pricing_tier IN ('standard', 'reduced', 'sponsored')); ALTER TABLE organizations ADD COLUMN deal_notes TEXT;` — add to a new migration. Surface in the Sam-only org creation flow (`POST /api/org`) as optional fields.

**Effort:** XS human / XS CC+gstack
**Priority:** P3 — add when the second or third org is signed; not needed for first deal
**Depends on:** TODO-49 (sales-led org pricing)

---

## TODO-51: Consent and user agreement to recording for live sessions ✅ DONE

**What:** Before a student (or parent, if minor) joins a `/session/[id]` video session, surface a clear consent prompt acknowledging that the session may be recorded and used for coaching/transcript purposes. Gate entry to the Daily.co room until consent is accepted. Log the consent event (user ID, session ID, timestamp, version of the agreement) to the database for compliance purposes.

**Why:** The platform already captures transcripts via Web Speech API and stores them in the `sessions` table. Recording individuals without informed consent is a legal liability (FERPA for minors, state wiretapping laws, GDPR if international). A lightweight consent gate protects both the platform and users, and is standard practice for any edtech product handling student data.

**Scope:**
- Pre-session modal on `/session/[id]` (student side only; teacher is implicitly consenting as platform operator)
- Consent text: "This session may be recorded and transcribed to support your coaching. By clicking 'I Agree', you consent to this recording." Include link to Privacy Policy.
- DB: `session_consents` table — `id`, `session_id`, `user_id`, `consented_at`, `agreement_version TEXT`, `ip_address TEXT`
- Migration: new file `supabase/migrations/20260319_session_consents.sql`
- API: `POST /api/session/[id]/consent` — inserts consent row, returns 200; idempotent (upsert on session_id + user_id)
- Gate: `VideoRoom.tsx` renders consent modal first; only mounts Daily.co iframe after consent API call succeeds
- Agreement version: hardcode `'v1'` now; bump when text changes

**Edge cases:**
- Teacher joins → skip consent gate (check role via token claims)
- Student refreshes mid-session → re-check consent via GET or store in session state to avoid re-prompting
- Parent email link → if parent joins, they should also see the consent

**Pros:** Legal compliance, trust signal for parents, defensible audit trail.
**Cons:** Adds one extra click before sessions start. Minor UX friction.

**Effort:** S human / S CC+gstack
**Priority:** P1 — must ship before any live sessions go out; legal requirement
**Depends on:** `/session/[id]` video infrastructure (already shipped)

---

## TODO-52: Parental consent for minor students

**What:** Add age verification to the student profile and require parental email confirmation before students under 13 can consent to session recording. Parental consent must be re-confirmed annually.

**Why:** COPPA (Children's Online Privacy Protection Act) requires verifiable parental consent for collecting personal data from users under 13. FERPA adds additional protections for students in K-12. The current consent gate applies to all students regardless of age — this is a legal gap that must be closed before the platform scales to school accounts.

**Scope:**
- Add `birth_year INT` and `parent_email TEXT` to `student_profiles`
- Add `parent_consent_status TEXT DEFAULT 'not_required'` (values: `'not_required'`, `'pending'`, `'confirmed'`)
- Flow: if `birth_year` present and age < 13 → send verification email to `parent_email` → parent clicks link → `parent_consent_status = 'confirmed'` → student can proceed
- Gate: if student age < 13 and `parent_consent_status != 'confirmed'`, block session join with "Parental consent required"
- Annual re-confirmation: cron resets `parent_consent_status = 'pending'` each year; parent gets email to re-confirm

**Pros:** COPPA/FERPA compliance. Required for institutional (K-12 school) accounts.
**Cons:** Adds friction for families with younger students. Requires `birth_year` field (currently not collected).

**Context:** Must resolve before 100 student accounts OR before any K-12 school contract is signed, whichever comes first. The simplest first step: add `birth_year` to the onboarding form now (optional), so data accumulates before the gate logic is built.

**Effort:** M human / S CC+gstack
**Priority:** P2 — must resolve before 100 students or first K-12 school deal
**Depends on:** TODO-51 (consent gate shipped)

---

## TODO-53: Interactive "how many students could benefit?" calculator on /for-schools

**What:** An interactive calculator on `/for-schools` where an administrator enters their student count and sees a projected impact figure (e.g., "486 students could receive individualized coaching — at $8/student/month").

**Why:** Makes the ROI tangible before the demo call. Principals and district admins think in cohorts and budgets — showing the math removes a friction point and pre-qualifies higher-intent leads.

**Pros:** High-value conversion tool; makes the pitch concrete. Low build cost with CC.
**Cons:** Requires locking in pricing model first (per-seat/month). If pricing changes, calculator needs updating. Don't build until there's a real price to show.

**Context:** The `/for-schools` page currently has stat-based problem framing and pilot pathway. The calculator would go after the stakeholder cards and before the FERPA compliance section. Simple: one `<input type="range">` or `<input type="number">` → computed display of cost and student count. No server needed.

**Effort:** S human / S CC+gstack
**Priority:** P3 — defer until pricing is locked
**Depends on:** Institutional pricing decision (TODO-49 resolution)

---

## TODO-54: Partner school logos / social proof section on /for-schools

**What:** A logo strip or social proof section on `/for-schools` showing schools/districts that have run a pilot.

**Why:** Institutional buyers make decisions based on peer adoption. "Lincoln Prep ran a pilot and expanded to 400 students" is worth more than any copy we can write.

**Pros:** Single highest-impact trust signal for institutional conversion. Zero maintenance once built.
**Cons:** Can't build this until at least one school signs. Placeholder logos look worse than nothing.

**Context:** Add a `partner_schools` table (name, logo_url, testimonial, show_on_for_schools boolean). The section renders above or below the stakeholder cards on `/for-schools`. The `/for-schools/overview` printable one-pager should also show logos if available.

**Effort:** S human / S CC+gstack
**Priority:** P3 — unblocks when first institutional client signs
**Depends on:** First K-12 school or district completing a pilot

---

## TODO-55: Demo auto-confirmation email with calendar link

**What:** When an admin submits `/demo`, send them a confirmation email with a direct Google Calendar booking link (Calendly-style, but direct) so they can immediately schedule the call without a follow-up exchange.

**Why:** The current flow emails the admin inbox and relies on a human to reply with times. A calendar link removes 1–2 back-and-forth emails and compresses the time-to-call from days to minutes.

**Pros:** Faster time-to-demo. More professional experience. Low engineering effort.
**Cons:** Requires a public booking calendar (Google Cal public slot, Calendly, or similar). Adds an env var (calendar link URL). The `/api/demo` route would send two emails instead of one (admin notification + applicant confirmation).

**Context:** The `/api/demo` route already calls Resend. Add a second `resend.emails.send()` call to the applicant's email with a calendar booking link. The link is just an env var (`DEMO_CALENDAR_URL`) — no calendar API integration needed. When `DEMO_CALENDAR_URL` is not set, skip the applicant email (graceful degradation).

**Effort:** S human / S CC+gstack
**Priority:** P2 — high value, low effort; build when first demo requests arrive
**Depends on:** TODO-38 shipped (this is a polish pass on it)

---

## TODO-56: Admin one-pager as downloadable PDF

**What:** Replace the printable `/for-schools/overview` page with a real PDF download button that generates a server-rendered PDF.

**Why:** "Print to PDF" works but produces varying quality across browsers and requires user action in a print dialog. A server-generated PDF is a single click, produces consistent output, and can be branded properly with watermarks and fonts.

**Pros:** Better leave-behind artifact. Consistent branding across all devices. Single click instead of browser print dialog.
**Cons:** Requires a PDF generation library (Puppeteer, `@react-pdf/renderer`, or similar). Puppeteer adds ~150MB to the bundle and requires a serverless-compatible setup. `@react-pdf/renderer` has limited CSS support. Adds server rendering complexity.

**Context:** The printable page at `/for-schools/overview` already exists and works. This is a polish pass. The simplest path: use `@react-pdf/renderer` for a React-native PDF component, or keep the printable page and add a service-worker-based "Save as PDF" button using `window.print()` with CSS `@media print` optimizations (already in place). The content is static — doesn't change per request — so a static PDF asset generated at build time is also viable.

**Effort:** M human / S CC+gstack
**Priority:** P3 — current printable page is sufficient for now
**Depends on:** TODO-38 shipped (this is a polish pass on it)

---

## TODO-57: Subject-specific institutional landing pages

**What:** Build `/for-schools/math`, `/for-schools/science`, `/for-schools/english`, etc. — subject-targeted pages showing department-specific proof points, pilot outcomes, and CTA copy.

**Why:** A district math coordinator evaluating StoryLab doesn't identify with "writing coaching." They want to see math-specific pilot data and use cases. Subject landing pages compress the sales cycle for non-English departments and enable subject-specific SEM campaigns.

**Pros:** Unlocks institutional sales beyond English departments. Enables subject-specific CTA ("schedule a math pilot"). Strong for SEO on "AI math tutor for schools" queries.
**Cons:** Requires real proof points per subject before these pages have credibility. Shipping empty subject pages is worse than not having them.

**Context:** Platform identity pivot (2026-03-21) establishes the multi-subject infrastructure. /for-schools remains a generic hub after the pivot. Subject-specific pages are the next layer — but require 2+ teachers per subject with pilot data first. The infrastructure for subject taxonomy (enum + filter) ships with the pivot and creates the foundation for these pages.

**Effort:** M human / S CC+gstack
**Priority:** P2 — blocked by needing non-writing teacher pilot data first
**Depends on:** Platform identity pivot shipped + 2+ non-writing teachers with pilot outcomes

---

## TODO-58: Teacher recruiting engine

**What:** Build a teacher application form with subject-track routing, a teacher profile review queue in admin, and an onboarding track per subject.

**Why:** The platform identity pivot is only valuable if we can recruit calculus, science, and language teachers. The identity pivot creates urgency — the infrastructure now supports any subject, but teacher supply is the constraint. Without a recruiting funnel, the "any subject" promise is unfulfilled.

**Pros:** Converts the identity pivot into reality. Creates a flywheel: more subjects → more students → more revenue → more teachers. Teacher recruiting is the leverage point of the entire platform.
**Cons:** Recruiting quality teachers is hard. Application volume will be low initially. Requires admin bandwidth to vet applicants.

**Context:** The current teacher onboarding wizard (app/teacher/onboarding/) handles self-signup but has no application/vetting layer. The subject taxonomy (from identity pivot) creates natural tracks. Suggested approach: public application form at /teach (or /for-teachers) → admin queue in /admin → approval triggers onboarding invite → teacher completes wizard with subject + ai_methodology.

**Effort:** L human / ~1 hr CC+gstack
**Priority:** P1 — this is the hard constraint on the platform thesis post-pivot
**Depends on:** Platform identity pivot shipped (subject taxonomy + ai_methodology field)

---

## TODO-59: Subject-level outcome dashboards for institutional clients

**What:** Build subject-disaggregated outcome reporting for district admins — pilot results broken down by subject, teacher, and student cohort.

**Why:** Principals and district admins buying multi-department contracts need to see performance by subject, not just aggregate platform metrics. A math department head wants to see math scores; a language arts director wants writing scores. One dashboard that shows "here's what happened in your math pilot vs. your English pilot" is the artifact that closes a district-wide renewal.

**Pros:** Makes multi-subject institutional sales tractable. Creates compelling leave-behind for renewal conversations. Differentiates from single-subject competitors.
**Cons:** Requires real multi-subject pilot data to have content. Complex data model if subjects have different performance metrics.

**Context:** The current admin dashboard (/admin/dashboard) tracks individual students. The /admin/pipeline tracks deal stage. Missing: a performance reporting view aggregated by subject/teacher/cohort. This is the third leg of the institutional sales stool (pipeline + reporting + subject pages). Blocked until we have multi-subject pilot data.

**Effort:** M human / ~30 min CC+gstack
**Priority:** P2 — blocked by needing real multi-subject pilot data
**Depends on:** Platform identity pivot shipped + 2+ subjects with pilot data + TODO-57 (subject landing pages as context)

---

## TODO-60: Subject-based SEO pages

**What:** Build subject/intent-specific SEO landing pages: "/ai-math-tutor", "/ap-calculus-ai-coach", "/spanish-tutor-ai", "/ap-english-writing-coach", etc.

**Why:** Organic search is the cheapest student acquisition channel at scale. "AI math tutor" and "AP prep AI" have high search volume and low current competition from real-teacher-backed products. These pages capture demand from individual students (not just institutional buyers) and funnel them to the /teachers discovery page.

**Pros:** Compound organic growth. Reaches students directly, not just through schools. Each subject page targets a different high-intent query. Low marginal cost once infrastructure exists.
**Cons:** SEO takes time (3-6 months to rank). Requires non-writing teachers to feature. Generic AI tutor pages without real teacher profiles won't rank well — needs substance.

**Context:** The platform identity pivot creates the subject taxonomy. The teacher grid with subject filter (/teachers) becomes the destination. SEO pages are landing-page wrappers that capture search intent and hand off to /teachers filtered by subject. Blocked until 2+ non-writing teachers have public profiles. Structure: `/ai-[subject]-tutor` → header → subject-specific value prop → featured teachers in that subject → CTA to /teachers?subject=X.

**Effort:** M human / ~30 min CC+gstack
**Priority:** P2 — blocked by needing real non-writing teacher profiles first
**Depends on:** Platform identity pivot shipped (subject filter on /teachers) + 2+ non-writing teachers with public profiles
