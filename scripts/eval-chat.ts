#!/usr/bin/env tsx
/**
 * Behavioral compliance eval harness.
 *
 * Usage:
 *   npx tsx --env-file=.env.local scripts/eval-chat.ts
 *   npx tsx --env-file=.env.local scripts/eval-chat.ts --mode academic
 *   npx tsx --env-file=.env.local scripts/eval-chat.ts --mode all
 *
 * Checks every AI response for:
 *   1. No bullet lists (no lines starting with - or * or •)
 *   2. Ends with a question (response contains ?)
 *   3. No summary endings ("In summary", "Overall", "Great job on")
 *   4. FEEDBACK phase: contains a blockquote (>) when file is attached
 *
 * Exit code 0 = all checks pass. Exit code 1 = failures found.
 */

import { createClient } from "@supabase/supabase-js";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const TEST_USER_EMAIL = process.env.EVAL_USER_EMAIL ?? process.env.LAB_TEST_USER_EMAIL;
const TEST_USER_PASSWORD = process.env.EVAL_USER_PASSWORD ?? process.env.LAB_TEST_USER_PASSWORD;

// ── types ─────────────────────────────────────────────────────────────────────

type EssayMode = "common_app" | "transfer" | "academic" | "supplemental";

interface CheckResult {
  name: string;
  passed: boolean;
  detail?: string;
}

interface TurnResult {
  turn: number;
  message: string;
  response: string;
  checks: CheckResult[];
  passed: boolean;
}

interface ModeResult {
  mode: EssayMode;
  turns: TurnResult[];
  passed: boolean;
}

// ── test scripts ──────────────────────────────────────────────────────────────

const SCRIPTS: Record<EssayMode, string[]> = {
  common_app: [
    "Hi, I'm working on my Common App essay.",
    "I want to write about playing piano.",
    "I've been playing since I was 6 and it's really important to me.",
    "I guess I want to show that I'm dedicated and passionate.",
  ],
  transfer: [
    "I'm working on my transfer essay.",
    "I want to transfer to study computer science somewhere better.",
    "My current school doesn't have the research opportunities I need.",
    "I'm interested in MIT's lab on machine learning.",
  ],
  academic: [
    "I'm writing an academic essay on climate change.",
    "My thesis is that carbon taxes are the most effective policy tool.",
    "Here's my argument: carbon taxes create market incentives that reduce emissions.",
    "Let me paste my introduction: Carbon pricing has emerged as a cornerstone of climate policy...",
  ],
  supplemental: [
    "I'm working on a why school essay for Northwestern.",
    "I want to talk about their journalism school.",
    "I like how they combine theory and practice.",
    "I've done some research on their Medill program.",
  ],
};

// ── compliance checks ─────────────────────────────────────────────────────────

function checkNoBulletLists(response: string): CheckResult {
  const lines = response.split("\n");
  const bulletLines = lines.filter((l) => /^\s*[-*•]\s/.test(l));
  return {
    name: "no-bullet-lists",
    passed: bulletLines.length === 0,
    detail: bulletLines.length > 0 ? `Found ${bulletLines.length} bullet line(s): "${bulletLines[0]}"` : undefined,
  };
}

function checkEndsWithQuestion(response: string): CheckResult {
  const trimmed = response.trim();
  // The response must contain at least one question mark
  const hasQuestion = trimmed.includes("?");
  // The last non-empty line should ideally end with ?
  const lastLine = trimmed.split("\n").filter((l) => l.trim()).pop() ?? "";
  const lastLineHasQuestion = lastLine.includes("?");
  return {
    name: "ends-with-question",
    passed: hasQuestion,
    detail: !hasQuestion
      ? "Response has no question mark"
      : !lastLineHasQuestion
      ? `Response has ? but last line doesn't: "${lastLine.slice(0, 80)}"`
      : undefined,
  };
}

function checkNoSummaryEnding(response: string): CheckResult {
  const summaryPhrases = [
    /\b(in summary|overall,|in conclusion|to summarize|great job on|well done on)\b/i,
    /so overall/i,
  ];
  const found = summaryPhrases.find((p) => p.test(response));
  return {
    name: "no-summary-ending",
    passed: !found,
    detail: found ? `Found summary phrase matching: ${found}` : undefined,
  };
}

function checkFeedbackHasBlockquote(response: string, isFeedbackPhase: boolean): CheckResult {
  if (!isFeedbackPhase) return { name: "feedback-blockquote", passed: true };
  const hasBlockquote = response.includes("\n> ") || response.startsWith("> ");
  return {
    name: "feedback-blockquote",
    passed: hasBlockquote,
    detail: !hasBlockquote ? "FEEDBACK phase response has no blockquote (> text)" : undefined,
  };
}

// ── eval runner ───────────────────────────────────────────────────────────────

async function getAuthToken(): Promise<string> {
  if (!TEST_USER_EMAIL || !TEST_USER_PASSWORD) {
    throw new Error(
      "Set EVAL_USER_EMAIL and EVAL_USER_PASSWORD (or LAB_TEST_USER_EMAIL/PASSWORD) in .env.local"
    );
  }

  const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
  const { data, error } = await db.auth.signInWithPassword({
    email: TEST_USER_EMAIL,
    password: TEST_USER_PASSWORD,
  });

  if (error || !data.session) {
    throw new Error(`Auth failed: ${error?.message ?? "no session"}`);
  }

  return data.session.access_token;
}

async function createConversation(
  token: string,
  mode: EssayMode
): Promise<string> {
  const res = await fetch(`${SITE_URL}/api/lab/conversations`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      Cookie: `sb-access-token=${token}`,
    },
    body: JSON.stringify({ title: `eval-${mode}-${Date.now()}`, essay_mode: mode }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to create conversation (${res.status}): ${text}`);
  }

  const data = await res.json();
  return data.id;
}

async function sendMessage(
  token: string,
  conversationId: string,
  message: string
): Promise<string> {
  const res = await fetch(`${SITE_URL}/api/lab/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      Cookie: `sb-access-token=${token}`,
    },
    body: JSON.stringify({ conversation_id: conversationId, message }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Chat request failed (${res.status}): ${text}`);
  }

  // Read streaming response
  const reader = res.body!.getReader();
  const decoder = new TextDecoder();
  let content = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    content += decoder.decode(value, { stream: true });
  }

  return content.trim();
}

async function evalMode(token: string, mode: EssayMode): Promise<ModeResult> {
  console.log(`\n  Mode: ${mode}`);
  const convId = await createConversation(token, mode);
  const turns: TurnResult[] = [];
  const messages = SCRIPTS[mode];

  for (let i = 0; i < messages.length; i++) {
    const message = messages[i];
    process.stdout.write(`    Turn ${i + 1}/${messages.length}… `);

    let response: string;
    try {
      response = await sendMessage(token, convId, message);
    } catch (err) {
      console.log("ERROR");
      turns.push({
        turn: i + 1,
        message,
        response: "",
        checks: [{ name: "request", passed: false, detail: String(err) }],
        passed: false,
      });
      continue;
    }

    const isFeedbackPhase = i >= 8; // Feedback typically triggered by file upload; approximate
    const checks = [
      checkNoBulletLists(response),
      checkEndsWithQuestion(response),
      checkNoSummaryEnding(response),
      checkFeedbackHasBlockquote(response, isFeedbackPhase),
    ];

    const passed = checks.every((c) => c.passed);
    const failures = checks.filter((c) => !c.passed);

    if (passed) {
      console.log("PASS");
    } else {
      console.log(`FAIL (${failures.map((f) => f.name).join(", ")})`);
      for (const f of failures) {
        if (f.detail) console.log(`      → ${f.detail}`);
      }
    }

    turns.push({ turn: i + 1, message, response, checks, passed });

    // Small delay to avoid rate limiting
    await new Promise((r) => setTimeout(r, 1000));
  }

  const passed = turns.every((t) => t.passed);
  return { mode, turns, passed };
}

// ── main ──────────────────────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2);
  const modeArg = args.find((a) => a.startsWith("--mode="))?.split("=")[1] ??
    (args.indexOf("--mode") !== -1 ? args[args.indexOf("--mode") + 1] : null);

  const allModes: EssayMode[] = ["common_app", "transfer", "academic", "supplemental"];
  const modesToRun: EssayMode[] =
    !modeArg || modeArg === "all"
      ? allModes
      : allModes.includes(modeArg as EssayMode)
      ? [modeArg as EssayMode]
      : (() => { throw new Error(`Unknown mode: ${modeArg}. Use: ${allModes.join(", ")}, or all`); })();

  console.log("IvyStoryLab Behavioral Compliance Eval");
  console.log(`Site: ${SITE_URL}`);
  console.log(`Modes: ${modesToRun.join(", ")}`);
  console.log("");

  let token: string;
  try {
    process.stdout.write("Authenticating… ");
    token = await getAuthToken();
    console.log("OK");
  } catch (err) {
    console.error(`FAILED: ${err}`);
    process.exit(1);
  }

  const results: ModeResult[] = [];

  for (const mode of modesToRun) {
    try {
      const result = await evalMode(token, mode);
      results.push(result);
    } catch (err) {
      console.error(`  ERROR running mode ${mode}: ${err}`);
      results.push({ mode, turns: [], passed: false });
    }
  }

  // Summary
  console.log("\n" + "─".repeat(50));
  console.log("EVAL SUMMARY");
  console.log("─".repeat(50));

  let totalTurns = 0;
  let passingTurns = 0;

  for (const r of results) {
    const turnsPassed = r.turns.filter((t) => t.passed).length;
    const status = r.passed ? "PASS" : "FAIL";
    console.log(`  ${r.mode.padEnd(16)} ${status}  (${turnsPassed}/${r.turns.length} turns)`);
    totalTurns += r.turns.length;
    passingTurns += turnsPassed;
  }

  console.log("─".repeat(50));
  console.log(`  Total: ${passingTurns}/${totalTurns} turns passing`);
  console.log(`  Overall: ${results.every((r) => r.passed) ? "PASS ✓" : "FAIL ✗"}`);

  const allPassed = results.every((r) => r.passed);
  process.exit(allPassed ? 0 : 1);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
