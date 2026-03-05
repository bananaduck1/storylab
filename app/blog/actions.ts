"use server";

import { Resend } from "resend";
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
    if (error.code === "23505") {
      return { error: "That email is already subscribed." };
    }
    return { error: "Something went wrong. Please try again." };
  }

  // Send confirmation email — non-fatal if it fails
  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from: process.env.CONTACT_FROM_EMAIL ?? "onboarding@resend.dev",
      to: email,
      subject: "You're subscribed to Perspectives",
      text: `Hi,\n\nYou're now subscribed to Perspectives — essays on storytelling, the humanities, and the college experience from StoryLab.\n\nWe'll be in touch when something new goes up.\n\n— Sam\nStoryLab`,
    });
  } catch {
    // Subscription was saved — don't fail the request over email
  }

  return { success: true };
}
