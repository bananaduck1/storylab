/**
 * Behavioral compliance eval for the /lab chat endpoint.
 *
 * Sends 5 fixed student messages through a fresh conversation and grades
 * Sam's responses against the behavioral constraints:
 *   ✓ No bullet lists (* or -)
 *   ✓ Ends with a question mark
 *   ✓ No summary endings (e.g. "Feel free to ask…")
 *
 * Usage:
 *   npx tsx --env-file=.env.local scripts/eval-chat.ts
 *
 * Required env vars:
 *   LAB_EVAL_USER_EMAIL   — existing /lab user with onboarding done
 *   LAB_EVAL_USER_PASSWORD
 *   NEXT_PUBLIC_SUPABASE_URL
 *   NEXT_PUBLIC_SUPABASE_ANON_KEY
 *
 * Optional:
 *   LAB_EVAL_BASE_URL     — default: http://localhost:3000
 */

import { createClient } from "@supabase/supabase-js";

const BASE_URL = process.env.LAB_EVAL_BASE_URL ?? "http://localhost:3000";
const EMAIL = process.env.LAB_EVAL_USER_EMAIL ?? "";
const PASSWORD = process.env.LAB_EVAL_USER_PASSWORD ?? "";
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

const TEST_MESSAGES = [
  "I want to write about overcoming failure in my math class.",
  "I got a bad grade on a test and felt embarrassed.",
  "I studied harder after that and did better.",
  "I guess it taught me to keep trying.",
  "I'm not sure how to make this more interesting.",
];

const SUMMARY_ENDINGS = [
  "feel free to",
  "let me know if",
  "don't hesitate",
  "hope that helps",
  "good luck",
  "in summary",
  "to summarize",
];

interface CheckResult {
  passed: boolean;
  reason?: string;
}

function checkNoBullets(text: string): CheckResult {
  const lines = text.split("\n");
  const bulletLine = lines.find((l) => /^\s*[\*\-]\s/.test(l));
  if (bulletLine) {
    return { passed: false, reason: `Bullet found: "${bulletLine.trim().slice(0, 60)}"` };
  }
  return { passed: true };
}

function checkEndsWithQuestion(text: string): CheckResult {
  const trimmed = text.trim();
  if (!trimmed.endsWith("?")) {
    const last50 = trimmed.slice(-50);
    return { passed: false, reason: `Last chars: "…${last50}"` };
  }
  return { passed: true };
}

function checkNoSummaryEnding(text: string): CheckResult {
  const lower = text.toLowerCase();
  const found = SUMMARY_ENDINGS.find((phrase) => lower.includes(phrase));
  if (found) {
    return { passed: false, reason: `Summary phrase found: "${found}"` };
  }
  return { passed: true };
}

async function sendMessage(
  conversationId: string,
  message: string,
  token: string
): Promise<string> {
  const res = await fetch(`${BASE_URL}/api/lab/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ conversation_id: conversationId, message }),
  });

  if (!res.ok) {
    throw new Error(`Chat API error ${res.status}: ${await res.text()}`);
  }

  // Response is a plain text stream — read it fully
  const text = await res.text();
  return text;
}

async function createConversation(token: string): Promise<string> {
  const res = await fetch(`${BASE_URL}/api/lab/conversations`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ title: "eval-" + Date.now() }),
  });

  if (!res.ok) {
    throw new Error(`Create conversation error ${res.status}: ${await res.text()}`);
  }

  const json = await res.json();
  return json.id as string;
}

async function main() {
  if (!EMAIL || !PASSWORD) {
    console.error("Set LAB_EVAL_USER_EMAIL and LAB_EVAL_USER_PASSWORD in .env.local");
    process.exit(1);
  }

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error("Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local");
    process.exit(1);
  }

  console.log("Signing in as", EMAIL, "…");
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const { data, error } = await supabase.auth.signInWithPassword({ email: EMAIL, password: PASSWORD });
  if (error || !data.session) {
    console.error("Sign-in failed:", error?.message);
    process.exit(1);
  }

  const token = data.session.access_token;
  console.log("Signed in. Creating conversation…");

  const conversationId = await createConversation(token);
  console.log("Conversation:", conversationId);
  console.log("");

  let passed = 0;
  let failed = 0;

  for (let i = 0; i < TEST_MESSAGES.length; i++) {
    const msg = TEST_MESSAGES[i];
    console.log(`[${i + 1}/${TEST_MESSAGES.length}] User: "${msg}"`);

    let response: string;
    try {
      response = await sendMessage(conversationId, msg, token);
    } catch (err) {
      console.error("  ✗ Request failed:", String(err));
      failed++;
      continue;
    }

    const preview = response.replace(/\n/g, " ").slice(0, 120);
    console.log(`  Sam: "${preview}${response.length > 120 ? "…" : ""}"`);

    const checks = [
      { name: "no-bullets", result: checkNoBullets(response) },
      { name: "ends-with-?", result: checkEndsWithQuestion(response) },
      { name: "no-summary-ending", result: checkNoSummaryEnding(response) },
    ];

    let turnOk = true;
    for (const { name, result } of checks) {
      if (result.passed) {
        console.log(`  ✓ ${name}`);
      } else {
        console.log(`  ✗ ${name}: ${result.reason}`);
        turnOk = false;
      }
    }

    if (turnOk) {
      passed++;
    } else {
      failed++;
    }
    console.log("");
  }

  const total = passed + failed;
  console.log(`Result: ${passed}/${total} turns passed`);

  if (failed > 0) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
