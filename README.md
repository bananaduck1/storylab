# IvyStoryLab

A full-stack web platform for a college admissions coaching company. It combines a polished marketing site, a thought-leadership blog, and a password-protected internal tool for tutors to track student progress — all in one Next.js app.

---

## What It Does

**Public Site (`/academy`, `/services`, `/results`, `/team`, `/faq`, `/contact`)**
The main marketing presence. The academy page is a long-form, scroll-driven narrative featuring the founder's philosophy, student stories, tutor profiles, college acceptances, and testimonials.

**Blog (`/blog`)**
A public thought-leadership blog with tag filtering and email subscriptions. Posts are authored through an internal admin panel and stored in Supabase. Readers can subscribe to updates via Resend.

**Admin (`/admin`)**
Protected route for creating, editing, and deleting blog posts. Requires Supabase Auth (email + password).

**Student Tracker — The Lab (`/lab`)**
An internal-only tool for tutors. Features:
- Student roster with development stage tracking (Exploration → Application Ready → Post-Admissions)
- Session logging (essay work, generative sessions, parent calls)
- AI-generated student portraits that auto-update after each session via GPT-4o
- Essay storage and review
- Supabase Auth for access control

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 (`@theme inline`) |
| Database & Auth | Supabase (PostgreSQL + Row Level Security) |
| AI | OpenAI GPT-4o (student portrait generation) |
| Email | Resend (blog subscription confirmations) |
| Deployment | Vercel |

---

## Project Structure

```
app/
  academy/          # Main marketing page + subpages (applications, transfer, humanities)
  blog/             # Public blog index + individual post pages
  admin/            # Admin panel for blog post management
  lab/              # Internal student tracker (auth-protected)
  ai-editor/        # AI writing assistant tool
  contact/          # Contact form
  team/             # Team page
  services/         # Services page
  results/          # Results/acceptances page
  faq/              # FAQ page
components/         # Shared UI (Navbar, Footer, LogoMarquee, TutorCard, etc.)
lib/
  supabase.ts           # Server-side Supabase client (service role)
  supabase-browser.ts   # Browser-side Supabase client (anon key)
  supabase/server.ts    # SSR Supabase client with cookies
app/api/lab/        # API routes: students, sessions, portraits, essays
scripts/
  seed-blog.ts      # Seed script for blog posts
```

---

## Running Locally

### 1. Install dependencies

```bash
npm install
```

### 2. Set up environment variables

Create a `.env.local` file in the project root:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# OpenAI (for AI portrait generation in /lab)
OPENAI_API_KEY=your_openai_api_key

# Resend (for blog email subscriptions)
RESEND_API_KEY=your_resend_api_key
```

### 3. Set up Supabase

You'll need the following tables in your Supabase project:

- `posts` — blog posts (`id`, `title`, `slug`, `excerpt`, `content`, `tags[]`, `published`, `published_at`, `created_at`)
- `email_subscribers` — blog subscribers (`id`, `email`, `subscribed_at`)
- `students` — student profiles
- `sessions` — tutor session logs
- `portraits` — versioned AI-generated student portraits
- `essays` — student essay drafts

RLS policies: `posts` allows public SELECT where `published = true`; `email_subscribers` allows public INSERT only.

To seed sample blog posts:

```bash
npx tsx --env-file=.env.local scripts/seed-blog.ts
```

### 4. Create a Lab user

Add a user in the Supabase dashboard under **Authentication → Users** with an email and password. This account is used to log in to `/lab`.

### 5. Start the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — it redirects to `/academy`.

---

## Key Routes

| Route | Description |
|---|---|
| `/academy` | Main marketing page |
| `/blog` | Public blog |
| `/admin` | Blog admin (requires Supabase Auth) |
| `/lab` | Internal student tracker (requires Supabase Auth) |
| `/contact` | Contact form |
| `/results` | College acceptance results |
| `/team` | Team page |
