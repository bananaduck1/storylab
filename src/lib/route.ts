import { NextResponse } from "next/server";
import { analyzeEssay } from "@/lib/analyzeEssay";

export const runtime = "nodejs"; // ensure Node runtime (OpenAI, fs, etc.)
export const dynamic = "force-dynamic"; // avoid caching

type AnalyzeRequest = {
  essayText: string;
};

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Partial<AnalyzeRequest>;

    if (!body || typeof body.essayText !== "string") {
      return NextResponse.json(
        { error: "Invalid request. Expected JSON body: { essayText: string }" },
        { status: 400 }
      );
    }

    const essayText = body.essayText.trim();
    if (!essayText) {
      return NextResponse.json(
        { error: "essayText must be a non-empty string." },
        { status: 400 }
      );
    }

    // Do not log essay text.
    const result = await analyzeEssay(essayText);

    return NextResponse.json(result, { status: 200 });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Unknown server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json(
    { error: "Method Not Allowed. Use POST." },
    { status: 405, headers: { Allow: "POST" } }
  );
}
