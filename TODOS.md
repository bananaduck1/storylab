# TODOs

Captured during /plan-eng-review on 2026-03-12. Updated during /plan-ceo-review on 2026-03-17 (x4). Updated during /plan-ceo-review on 2026-03-17 — live coaching companion review (x3).

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

## TODO-4: Deduplicate student_profiles fetch on /lab page load

**What:** Refactor `checkQuota()` in `lib/lab-quota.ts` to accept an optional pre-fetched profile so `app/lab/page.tsx` doesn't read the same row twice per page load.

**Why:** `app/lab/page.tsx` already does `db.from("student_profiles").select("*")` to get the full profile, then calls `checkQuota(userId)` which independently reads the same row for `plan`, `extra_messages`, etc. Two sequential reads of the same tiny row on every page load.

**Pros:** Eliminates one DB round trip from the critical path of every `/lab` load. Cleaner API — callers with an existing profile don't need to trigger a redundant read.

**Cons:** Changes the signature of `checkQuota` (adds optional second arg), touching all callers. Risk of divergence if the caller passes a stale profile. Needs care to keep the call-time read as the default (non-breaking for the chat route which doesn't have a profile pre-fetched).

**Context:** The fix is to add `profileData?: object` as an optional second parameter to `checkQuota`. If provided, skip the `student_profiles` SELECT. The chat route (`app/api/lab/chat/route.ts`) calls `checkQuota` without a profile and should continue doing so. Only `app/lab/page.tsx` passes it. The duplicate SELECT is at `page.tsx` line ~21 (`db.from("student_profiles").select("*")`) and inside `checkQuota` at `lib/lab-quota.ts` line ~25.

**Depends on:** Nothing. Independent refactor.

---

## TODO-5: System prompt XML restructuring

**What:** Convert the quick-reference tables in Section 6 of `lib/agent-system-prompt.ts`
(Symptom → First Move, Student State → Move) from plain markdown to structured XML tags
(e.g., `<symptom>`, `<first_move>`).

**Why:** GPT-4o parses structured XML tags more reliably than markdown tables in long system
prompts. The behavioral `→ Agent:` directives may be compressed in the model's attention
over a 600-line document.

**Pros:** Higher signal-to-noise for the most actionable rules.
**Cons:** Requires careful prompt regression testing — any change to the system prompt needs
eval against baseline behavior before shipping.

**Context:** Deferred because it's hard to isolate what fixed what if you change the prompt
and the memory architecture simultaneously. Ship the portrait/RAG changes first, observe
whether the agent still produces generic responses, then restructure the prompt if needed.

**Effort:** M | **Priority:** P2 | **Depends on:** Portrait system shipping + 1 week of data

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

## TODO-7: Admin portrait visibility

**What:** Add a read-only display of `student_profiles.portrait_notes` to `/admin/dashboard`
so Sam can inspect what the AI has learned about each /lab student.

**Why:** Without visibility, there's no way to verify portrait quality or catch cases where
the AI is writing unhelpful notes.

**Pros:** Trust signal. Debugging tool.
**Cons:** Exposes AI-written internal notes in the UI — need to make clear these are
agent-generated, not Sam's own notes.

**Context:** `/admin/dashboard` is at `app/admin/dashboard/page.tsx`. Note that admin uses
a separate `students` table with its own `portraits` table (narratives), while /lab stores
its notes in `student_profiles.portrait_notes`. These are different data sources. The admin
view would need to join or query `student_profiles` by matching email/identity.

**Effort:** S | **Priority:** P2 | **Depends on:** Portrait system shipping + real data to display

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

## TODO-10: Behavioral compliance eval harness

**What:** A script (`scripts/eval-chat.ts`) that sends a set of scripted messages through the `/api/lab/chat` endpoint and grades each response for behavioral compliance: no bullet lists, ends with a question, quote present in feedback phase, one-problem focus.

**Why:** There's currently no way to detect regressions when the system prompt is updated. Every prompt change requires manual QA. An eval harness makes prompt iteration scientific instead of intuitive.

**Pros:** Catches regressions automatically. Makes prompt A/B testing possible. Unlocks confident iteration.
**Cons:** Effort to build and maintain the test fixture. Real API calls = real cost per run.

**Context:** The harness would run 5–10 pre-scripted conversation stubs (opening message only, 4-turn conversation ending with essay upload, etc.) and parse each response for: (1) no lines starting with `-` or `*`, (2) response ends with `?`, (3) at least one `>` blockquote line in feedback phase. Run as `npx tsx --env-file=.env.local scripts/eval-chat.ts`. Add to CI as an optional check.

**Effort:** L | **Priority:** P2 | **Depends on:** Behavioral layer shipping

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

## TODO-15: Invite history in admin student pane

**What:** Show "Invited on [date] / Claimed on [date]" in the admin student pane so Sam knows the status of each outreach.

**Why:** Once invite emails are sending, there's no UI feedback on whether a student received and acted on the link. `students.user_id` being set tells you they claimed, but there's no record of when the invite went out.

**Context:** Add `invited_at TIMESTAMPTZ` to the `students` table. Set it when the invite email is sent. The admin student pane already shows sessions and portrait; add a small status line: `Invited: Mar 17 | Claimed: Mar 18` (or `Not yet claimed`). Requires the invite email feature from student unification PR 1.

**Effort:** S | **Priority:** P3 | **Depends on:** Invite email feature (student unification PR 1)

---

## TODO-16: Supplemental essay mode

**What:** A 4th essay mode covering "Why this school" essays, activity descriptions (150-word brevity coaching), and diversity/community essays — each sub-type with distinct Sam coaching moves.

**Why:** Supplementals are a massive part of the application process and have completely different goals from the 3 core modes. A student writing a 150-word activity description needs ruthless brevity coaching, not Socratic narrative excavation. "Why school" essays fail when they sound like templates — Sam has specific instincts about what makes them specific.

**Pros:** Covers the full application lifecycle. High-value for students in active application season. Code change is trivial (~30 min) once the pedagogy is defined.

**Cons:** Requires Sam to articulate coaching doctrine for each sub-type in writing (3-5 constraint bullets each). The bottleneck is content, not code.

**Context:** Implementation is an extension of the essay modes system (this PR). The pattern is identical — add `"supplemental"` to the `EssayMode` union, add phase thresholds, add constraint overrides, add mode context. The constraint content needs to come from Sam's coaching doctrine on: (1) "Why this school" — what makes a compelling specific reason vs. a generic template? (2) Activity descriptions — how do you be memorable in 150 words? (3) Diversity/community — what's the frame? Write 3-5 bullets per sub-type, then hand to CC.

**Effort:** S (code) / M (doctrine writing) | **Priority:** P2 | **Depends on:** Essay modes PR + Sam's supplemental pedagogy notes

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
