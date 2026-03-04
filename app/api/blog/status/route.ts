import { NextResponse } from "next/server";
import { createStaticClient } from "@/lib/supabase/server";

// Quick diagnostic — visit /api/blog/status to see what's wrong.
// Safe to leave in place; it only reads public published posts.
export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY;

  const vars = {
    NEXT_PUBLIC_SUPABASE_URL: url ? `${url.slice(0, 30)}…` : "MISSING",
    NEXT_PUBLIC_SUPABASE_ANON_KEY: anon
      ? `${anon.slice(0, 12)}…`
      : "MISSING",
    SUPABASE_SERVICE_ROLE_KEY: service ? `${service.slice(0, 12)}…` : "MISSING",
  };

  if (!url || !anon) {
    return NextResponse.json({ ok: false, vars, error: "Missing env vars" }, { status: 500 });
  }

  try {
    const supabase = createStaticClient();

    // Test 1: can we reach the posts table?
    const { data: posts, error: postsError } = await supabase
      .from("posts")
      .select("id, title, published")
      .limit(5);

    // Test 2: can we reach the email_subscribers table?
    const { data: subs, error: subsError } = await supabase
      .from("email_subscribers")
      .select("id")
      .limit(1);

    return NextResponse.json({
      ok: !postsError && !subsError,
      vars,
      posts: {
        error: postsError?.message ?? null,
        count: posts?.length ?? 0,
        rows: posts ?? [],
      },
      email_subscribers: {
        error: subsError?.message ?? null,
      },
    });
  } catch (e) {
    return NextResponse.json(
      { ok: false, vars, error: String(e) },
      { status: 500 }
    );
  }
}
