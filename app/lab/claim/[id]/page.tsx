import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { getSupabase } from "@/lib/supabase";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ClaimPage({ params }: Props) {
  const { id } = await params;
  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const role = user.user_metadata?.role;
  if (role !== "student") {
    return (
      <div className="flex min-h-dvh items-center justify-center px-4">
        <div className="max-w-sm text-center">
          <p className="text-sm text-zinc-700 mb-2">Only student accounts can claim a student entry.</p>
          <a href="/lab" className="text-xs text-zinc-400 hover:text-zinc-600">← Back to Lab</a>
        </div>
      </div>
    );
  }

  // Fetch the student row
  const { data: student } = await getSupabase()
    .from("students")
    .select("id, name, user_id")
    .eq("id", id)
    .maybeSingle();

  if (!student) {
    return (
      <div className="flex min-h-dvh items-center justify-center px-4">
        <div className="max-w-sm text-center">
          <p className="text-sm text-zinc-700 mb-2">Student entry not found.</p>
          <a href="/lab" className="text-xs text-zinc-400 hover:text-zinc-600">← Back to Lab</a>
        </div>
      </div>
    );
  }

  if (student.user_id) {
    if (student.user_id === user.id) {
      redirect("/lab");
    }
    return (
      <div className="flex min-h-dvh items-center justify-center px-4">
        <div className="max-w-sm text-center">
          <p className="text-sm text-zinc-700 mb-2">This student entry is already linked to another account.</p>
          <a href="/lab" className="text-xs text-zinc-400 hover:text-zinc-600">← Back to Lab</a>
        </div>
      </div>
    );
  }

  // Link the account
  await getSupabase()
    .from("students")
    .update({ user_id: user.id })
    .eq("id", id);

  redirect("/lab");
}
