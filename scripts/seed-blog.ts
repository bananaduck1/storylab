/**
 * Seed script — inserts 2 sample blog posts for testing.
 *
 * Run:
 *   npx tsx --env-file=.env.local scripts/seed-blog.ts
 *
 * Or if your Node version is < 20.6 (no --env-file support):
 *   npx tsx scripts/seed-blog.ts
 *   (set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your shell first)
 */

import fs from "fs";
import path from "path";
import { createClient } from "@supabase/supabase-js";

// ─── Load .env.local manually so the script is self-contained ────────────────
const envPath = path.join(process.cwd(), ".env.local");
if (fs.existsSync(envPath)) {
  const lines = fs.readFileSync(envPath, "utf-8").split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const idx = trimmed.indexOf("=");
    if (idx === -1) continue;
    const key = trimmed.slice(0, idx).trim();
    const val = trimmed.slice(idx + 1).trim().replace(/^["']|["']$/g, "");
    if (key && !(key in process.env)) process.env[key] = val;
  }
}

// ─── Supabase client (service role to bypass RLS) ────────────────────────────
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.\n" +
      "Make sure .env.local exists or the vars are set in your shell."
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

// ─── Sample posts ─────────────────────────────────────────────────────────────
const posts = [
  {
    title: "Why the College Essay Is Your Greatest Intellectual Asset",
    slug: "college-essay-intellectual-asset",
    excerpt:
      "Most students treat the college essay as a performance. The ones who get in treat it as thinking.",
    tags: ["College Essays", "Writing"],
    published: true,
    published_at: new Date("2025-09-10").toISOString(),
    content: `
<p>Every year, thousands of students sit down to write the most important 650 words of their academic life — and the first thing they do is ask the wrong question. They ask: <em>What do I say?</em></p>

<p>The question that actually produces great essays is a different one: <em>What do I actually think?</em></p>

<h2>The performance trap</h2>

<p>The college essay has become a genre with its own conventions. The sports injury that taught resilience. The immigrant grandparent who inspired grit. The community service trip that opened eyes. None of these are bad topics. All of them are usually bad essays — because they're written to perform an identity rather than reveal a mind.</p>

<p>Admissions readers have a term for this. They call it "the package": a self-presentation so carefully assembled that it has no seams, no doubts, no authentic uncertainty. It reads as marketing. It reads as the student trying to become what they imagine the college wants — rather than showing the college who they already are.</p>

<h2>What thinking looks like on the page</h2>

<p>The essays that work — the ones that get stapled to the top of the pile, that get read aloud in committee — share a quality that's almost embarrassingly simple: they show the writer genuinely working something out. Not performing that they've worked it out. Actually working it out, on the page, in front of the reader.</p>

<p>This means tension. This means revision of an earlier assumption. This means a moment where the writer surprises themselves. It also means, almost always, specificity: a single scene, a single object, a single conversation — not a summary of many things, but a close reading of one thing.</p>

<h2>The practical implication</h2>

<p>The best preparation for a college essay isn't brainstorming topics. It's practicing the habit of noticing — noticing what you find strange, what you keep returning to, what makes you feel the particular friction of not quite understanding. The essay will find itself if you've been paying the right kind of attention.</p>

<p>When students come to StoryLab, we spend the first sessions not writing. We spend them talking — about books, about ideas, about the questions that haven't left them alone. The essay usually announces itself in that conversation, often before the student recognizes it.</p>

<p>The intellectual asset isn't the essay. It's the capacity for genuine inquiry that the essay, at its best, makes visible.</p>
    `.trim(),
  },
  {
    title: "The Case for Reading Novels Before You Write Your Application",
    slug: "reading-novels-before-college-application",
    excerpt:
      "The single best thing a junior can do the summer before senior year has nothing to do with applications.",
    tags: ["Humanities", "Reading", "College Essays"],
    published: true,
    published_at: new Date("2025-10-02").toISOString(),
    content: `
<p>If you asked a college counselor what to do the summer before senior year, you'd hear a predictable list: finalize your college list, draft your Common App essays, visit schools. All sensible. None of it is the most important thing.</p>

<p>The most important thing is to read a novel — seriously, slowly, attentively — that you've been meaning to read and haven't.</p>

<h2>What reading actually teaches</h2>

<p>This isn't a romance about the life of the mind, though it might sound like one. It's a practical claim. Close reading of literary fiction builds a cognitive muscle that almost no other activity builds as efficiently: the capacity to hold complexity without resolving it prematurely.</p>

<p>Great novels don't tell you what to think about their characters. They put you in proximity to someone whose inner life is strange and partial and sometimes contradictory — and they ask you to understand anyway. This is precisely the intellectual posture that makes for remarkable college essays, and eventually for remarkable college students.</p>

<h2>The essay connection</h2>

<p>Students who read widely tend to write essays that are interested in other people, in ideas, in the world beyond themselves. That interest is palpable on the page. It's the difference between an essay that's about the student's feelings and an essay that's about something — something the student cares about, something real and large, approached through the particular lens of one life.</p>

<p>Reading also teaches sentence-level things: rhythm, the management of subordinate clauses, how to enter a scene, how to leave one. These are learnable. They are learned, mostly, through exposure to writers who do them well.</p>

<h2>What to read</h2>

<p>This isn't the place for a syllabus. The right answer is: whatever you've been meaning to read and haven't. The novel you started and put down. The author your English teacher mentioned three times. The book your parent has on their shelf that you've always been slightly curious about.</p>

<p>The only criterion is genuine interest. Genuine interest produces genuine attention. Genuine attention produces the kind of reading that actually changes how you write and think.</p>

<p>The applications will get done. The essays will get written. But the student who spent August reading Toni Morrison or Marilynne Robinson or Kazuo Ishiguro will write different — better — essays than the student who spent it filling out activity lists. That's not a hypothesis. We've seen it enough times to be certain of it.</p>
    `.trim(),
  },
];

// ─── Insert ───────────────────────────────────────────────────────────────────
async function seed() {
  console.log("Seeding blog posts…\n");

  for (const post of posts) {
    const { data, error } = await supabase
      .from("posts")
      .upsert(post, { onConflict: "slug" })
      .select("id, slug")
      .single();

    if (error) {
      console.error(`✗ Failed to insert "${post.slug}":`, error.message);
    } else {
      console.log(`✓ Upserted: ${data.slug} (${data.id})`);
    }
  }

  console.log("\nDone.");
}

seed();
