# IvyStoryLab

A full-stack Next.js platform for a college admissions coaching company. It combines a polished marketing site, a student-facing AI essay coach, live video tutoring sessions, a multi-teacher agent marketplace, and a thought-leadership blog — all in one app.

---

## What It Does

**Public Site (`/academy`, `/services`, `/results`, `/team`, `/faq`, `/contact`)**
The main marketing presence. A long-form, scroll-driven narrative featuring the founder's philosophy, student stories, tutor profiles, college acceptances, and testimonials.

**Blog (`/blog`)**
Public thought-leadership blog with tag filtering and email subscriptions. Posts are authored through an internal admin panel and stored in Supabase. Readers can subscribe via Resend.

**Student AI Essay Coach (`/lab`)**
A student-facing AI coaching tool powered by a teacher's custom agent. Features:
- Personalized essay coaching across 4 modes: Common App, Transfer, Academic, Supplemental
- Multi-turn conversation history with file upload (PDF, DOCX)
- Behavioral constraint layer: session phases (OPENING → DIAGNOSING → COACHING → FEEDBACK)
- RAG-powered playbook retrieval from the teacher's knowledge base
- Student portrait notes — AI-generated session summaries that accumulate over time
- Daily message quota enforcement (free / pro tiers)

**Teacher Dashboard (`/dashboard`)**
Teacher-facing hub for managing students, scheduling sessions, and configuring their AI agent. Features:
- Student roster with linked lab accounts
- Schedule and manage live video sessions
- Session coaching sidebar (real-time nudges)
- Agent settings and pedagogy upload
- Payments tab: connect a Stripe account, view earnings (available/pending), 80/20 revenue split

**Live Video Coaching (`/session/[id]`)**
In-platform video sessions via Daily.co with a live AI coaching companion. Features:
- Web Speech API transcript capture, stored per-turn in `transcript_chunks`
- AI coaching nudges (polls GPT-4o with transcript + student portrait)
- Moment flagging for portrait and parent email generation
- Pre-session messaging thread between teacher and student
- Session completion: triggers portrait regen + parent email draft

**Admin (`/admin`)**
Internal tools, admin-only (`samahn240@gmail.com`):
- `/admin/dashboard` — Student tracker, session logs, portrait viewer, invite management
- `/admin/platform` — Platform Pulse: live stats across all tables + revenue table (platform fees per teacher)
- `/admin/posts` — Blog post management (create, edit, delete, newsletter)
- `/admin/teacher-config` — Teacher agent builder (identity, beliefs, voice, signature moves)
- `/admin/students/[id]/view` — Read-only shadow view of any student's /lab data
- `/admin/availability` — Booking slot management

**Teacher Registration (`/teacher/register`)**
Self-registration flow for new teachers. Creates a `teachers` row and routes to `/dashboard`.

**Booking (`/academy/book`)**
Parent consultation bookings via Stripe + Google Calendar. Separate from video sessions.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 (`@theme inline`) |
| Database & Auth | Supabase (PostgreSQL + Row Level Security) |
| AI | OpenAI GPT-4o (portrait, nudge, parent email) + Claude (chat coach) |
| Video | Daily.co (WebRTC rooms + meeting tokens) |
| Email | Resend (invites, session emails, blog subscriptions) |
| Payments | Stripe (consultation bookings + Connect marketplace — 20% platform fee) |
| Calendar | Google Calendar API (booking sync) |
| Deployment | Vercel (with cron jobs) |

---

## Project Structure

```
app/
  academy/              # Marketing pages + booking flow (/academy/book)
  blog/                 # Public blog index + post pages
  admin/
    dashboard/          # Student tracker (admin-only)
    platform/           # Platform Pulse stats
    posts/              # Blog management
    teacher-config/     # Teacher agent builder
    students/[id]/view/ # Student lab shadow view
    availability/       # Booking availability management
  lab/                  # Student AI essay coach (auth-protected)
    onboarding/         # 4-step onboarding form
    profile/            # Profile update page
  dashboard/            # Teacher dashboard + settings
  session/[id]/         # Live video coaching sessions
  teacher/register/     # Teacher self-registration
  _components/          # Shared components (NotificationBell, etc.)
components/             # Public site shared UI (Navbar, Footer, etc.)
lib/
  supabase.ts               # Server Supabase client (service role)
  supabase-browser.ts       # Browser Supabase client (anon key)
  lab-auth.ts               # getCallerUser, getUserRoles, ADMIN_EMAIL
  lab-profile.ts            # buildSystemPromptForUser, writePortraitNote
  lab-quota.ts              # checkQuota — daily message limit enforcement
  teacher.ts                # getCallerTeacher helper
  behavioral-constraints.ts # Session phase inference + constraint blocks
  knowledge-retrieval.ts    # RAG: retrievePlaybookByVector (teacher-scoped)
  daily.ts                  # Daily.co: createDailyRoom, createMeetingToken
  portrait-generation.ts    # AI portrait generation helper
  agent-system-prompt.ts    # Sam Ahn fallback system prompt
app/api/
  lab/                  # chat, conversations, onboarding, profile, upload
  session/[id]/         # token, nudge, flag, complete, transcript, messages
  notifications/        # GET bell notifications + POST mark-read
  admin/                # video-sessions, invite-student, lab-students, teacher-config, revenue
  teacher/              # register, settings, invite-student, connect (onboard + status)
  cron/                 # session-reminders (daily), sync-availability (daily)
scripts/
  seed-blog.ts          # Seed sample blog posts
  eval-chat.ts          # AI behavioral compliance eval harness (all 4 modes)
__tests__/lib/          # Unit tests: behavioral-constraints, lab-profile, lab-quota
supabase/migrations/    # All applied DB migrations
```

---

## Running Locally

### 1. Install dependencies

```bash
npm install
```

### 2. Set up environment variables

Create a `.env.local` file:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# OpenAI (portrait generation, coaching nudges, parent email drafts)
OPENAI_API_KEY=your_openai_api_key

# Resend (email: invites, session confirmations, blog subscriptions)
RESEND_API_KEY=your_resend_api_key
CONTACT_FROM_EMAIL=noreply@yourdomain.com

# Daily.co (video rooms)
DAILY_API_KEY=your_daily_api_key

# Site URL (used in email join links)
NEXT_PUBLIC_SITE_URL=https://yourdomain.com

# Stripe (consultation bookings + Connect marketplace)
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret        # booking webhook (/api/stripe/webhook)
STRIPE_LAB_WEBHOOK_SECRET=your_lab_webhook_secret       # /lab subscription webhook (/api/webhooks/stripe)
STRIPE_CONNECT_WEBHOOK_SECRET=your_connect_webhook_secret  # Connect events (/api/webhooks/stripe-connect)

# Google Calendar (booking availability sync)
GOOGLE_SERVICE_ACCOUNT_EMAIL=your_service_account@project.iam.gserviceaccount.com
GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n..."
GOOGLE_CALENDAR_ID=your_calendar_id

# Cron (protects cron endpoints)
CRON_SECRET=your_cron_secret

# Optional
LAB_DAILY_LIMIT=50        # Default: 50 messages/day
MY_EMAIL=admin@yourdomain.com
```

### 3. Set up Supabase

Apply all migrations from `supabase/migrations/` in order. Key tables:

| Table | Purpose |
|---|---|
| `posts` | Blog posts |
| `email_subscribers` | Blog newsletter subscribers |
| `students` | Student roster (admin-managed) |
| `student_profiles` | AI coaching profile + portrait notes |
| `conversations` | Essay coaching chat sessions |
| `conversation_messages` | Individual chat messages |
| `usage_logs` | Daily message quota tracking |
| `teachers` | Teacher accounts + `agent_config` JSONB + `stripe_account_id` / `stripe_onboarding_complete` |
| `knowledge_chunks` | Teacher RAG playbook (teacher-scoped) |
| `sessions` | Video coaching sessions (Daily.co) |
| `session_messages` | Pre/post-session thread |
| `transcript_chunks` | Live session transcript chunks |
| `notifications` | In-app bell notifications |
| `availability` | Bookable consultation slots |
| `bookings` | Completed consultation bookings |
| `portraits` | Versioned AI-generated student portraits |
| `essays` | Student essay drafts |

### 4. Start the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — redirects to `/academy`.

---

## Key Routes

| Route | Description |
|---|---|
| `/academy` | Main marketing page |
| `/blog` | Public blog |
| `/lab` | Student AI essay coach (requires auth) |
| `/lab/onboarding` | New student setup (name, grade, schools, goals) |
| `/lab/profile` | Update student profile |
| `/dashboard` | Teacher dashboard (requires teacher role) |
| `/session/[id]` | Live video coaching session |
| `/teacher/register` | Teacher self-registration |
| `/academy/book` | Consultation booking hub |
| `/admin/dashboard` | Student tracker (admin-only) |
| `/admin/platform` | Platform Pulse — live stats |
| `/admin/posts` | Blog post management |
| `/admin/teacher-config` | Teacher agent builder |
| `/admin/availability` | Booking slot management |
| `/contact` | Contact form |
| `/results` | College acceptance results |
| `/team` | Team page |

---

## Multi-Role Identity

Users can hold multiple roles simultaneously. Role resolution is DB-based:

- **Student** — row in `students` table with matching `user_id`
- **Teacher** — row in `teachers` table with matching `user_id`
- **Founder/Admin** — email matches `ADMIN_EMAIL` in `lib/lab-auth.ts`

`getUserRoles(userId)` in `lib/lab-auth.ts` queries both tables in parallel and returns `{ isTeacher, isStudent }`. Teachers bypass the `/lab/onboarding` redirect and see LabChat with a "lifelong learner" banner instead.

---

## AI Coaching Architecture

```
Student message
      │
      ▼
buildSystemPromptForUser(userId, phase, mode, callerIsTeacher)
      │
      ├── behavioral-constraints.ts  ← always prepended first (survives truncation)
      ├── teacher.agent_config JSONB ← assembled from DB (fallback: lib/agent-system-prompt.ts)
      ├── student_profiles context block
      └── MODE_CONTEXT[mode] + portrait_notes + MODE_OPENING (new conv)
      │
      ▼
retrievePlaybookByVector(query, teacherId) ← RAG from knowledge_chunks
      │
      ▼
Claude API (streaming) → persisted to conversation_messages
      │
      └── after(): portrait note generation, usage_logs update, conversation title
```

---

## Running Evals

```bash
# Set in .env.local: EVAL_USER_EMAIL + EVAL_USER_PASSWORD
npx tsx --env-file=.env.local scripts/eval-chat.ts --mode all
```

Checks all 4 modes (common_app, transfer, academic, supplemental) for behavioral compliance: no bullet lists, ends with a question, quote present in feedback phase, one-problem focus.
