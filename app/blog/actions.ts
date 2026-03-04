"use server";

import { createStaticClient } from "@/lib/supabase/server";

type SubscribeState = { success: true } | { error: string } | null;

export async function subscribeEmail(
  _prevState: SubscribeState,
  formData: FormData
): Promise<SubscribeState> {
  const raw = formData.get("email");
  if (typeof raw !== "string" || !raw.includes("@")) {
    return { error: "Please enter a valid email address." };
  }

  const email = raw.toLowerCase().trim();
  const supabase = createStaticClient();

  const { error } = await supabase
    .from("email_subscribers")
    .insert({ email });

  if (error) {
    // Postgres unique-violation code
    if (error.code === "23505") {
      return { error: "That email is already subscribed." };
    }
    return { error: "Something went wrong. Please try again." };
  }

  return { success: true };
}
