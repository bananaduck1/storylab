# TODOs

Captured during /plan-eng-review on 2026-03-12. Updated during /plan-ceo-review on 2026-03-17.

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

## TODO-11: Phase threshold env-var tuning ✅ PARTIALLY DONE

**What:** ~~Replace the magic numbers in `inferPhase()` with named constants~~ — **done**, `OPENING_TURNS = 2` and `DIAGNOSING_TURNS = 8` are named constants in `lib/behavioral-constraints.ts`. Optional stretch: make them env-configurable via `LAB_OPENING_TURNS` and `LAB_DIAGNOSING_TURNS`.

**Why:** If the phase boundaries feel wrong in production (e.g., Sam is still in "opening" mode on message 3 when the student already pasted a draft), you currently need a code change + redeploy to adjust. Named constants at minimum, env vars for faster tuning.

**Pros:** Faster iteration on session arc feel without deploys.
**Cons:** Env vars add configuration overhead. Named constants alone are sufficient for most cases.

**Context:** `inferPhase` lives in `lib/behavioral-constraints.ts` alongside `buildBehavioralConstraints`. The thresholds are named constants (`OPENING_TURNS = 2`, `DIAGNOSING_TURNS = 8`): 0–2 messages = OPENING, 3–8 = DIAGNOSING, 9+ = COACHING. File upload always overrides to FEEDBACK regardless of count.

**Effort:** S | **Priority:** P3 | **Depends on:** Behavioral layer shipping + 1 week of usage data

---

## TODO-12: DB-persisted session phase for admin visibility

**What:** Add `session_phase TEXT DEFAULT 'opening'` to the `conversations` table. Write the inferred phase on each turn. Surface it in `/admin/dashboard` alongside the conversation list so Sam can see where each student is in their arc and manually reset stuck sessions.

**Why:** Message-count phase inference is invisible — there's no way to know from the outside whether any session is in the right phase. Admin visibility lets you diagnose cases where a student has been in "OPENING" mode for 20 messages.

**Pros:** Full observability into session health. Enables manual reset. Foundation for session quality metrics.
**Cons:** Additional migration + per-turn DB write. Admin UI work.

**Context:** The migration is trivial (one ALTER TABLE). The per-turn write goes in the `after()` block in `app/api/lab/chat/route.ts` alongside the existing conversation `updated_at` write. The admin dashboard is at `app/admin/dashboard/page.tsx`.

**Effort:** M | **Priority:** P3 | **Depends on:** Behavioral layer shipping + enough sessions to make phase data interesting
