"use server";

import { getSupabase } from "@/lib/supabase";
import { revalidatePath } from "next/cache";
import { Resend } from "resend";

interface PostInput {
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  tags: string[];
  published: boolean;
}

export async function createPost(data: PostInput): Promise<{ id: string }> {
  const supabase = getSupabase();

  const { data: post, error } = await supabase
    .from("posts")
    .insert({
      ...data,
      published_at: data.published ? new Date().toISOString() : null,
    })
    .select("id")
    .single();

  if (error) throw new Error(error.message);

  revalidatePath("/blog");
  revalidatePath("/admin/dashboard");

  return post;
}

export async function updatePost(id: string, data: PostInput): Promise<void> {
  const supabase = getSupabase();

  const { data: existing } = await supabase
    .from("posts")
    .select("published_at")
    .eq("id", id)
    .single();

  let published_at: string | null = existing?.published_at ?? null;
  if (data.published && !published_at) {
    published_at = new Date().toISOString();
  } else if (!data.published) {
    published_at = null;
  }

  const { error } = await supabase
    .from("posts")
    .update({ ...data, published_at })
    .eq("id", id);

  if (error) throw new Error(error.message);

  revalidatePath("/blog");
  revalidatePath(`/blog/${data.slug}`);
  revalidatePath("/admin/dashboard");
}

export async function sendNewsletter(postId: string): Promise<{ sent: number }> {
  const supabase = getSupabase();

  // Fetch the post
  const { data: post, error: postError } = await supabase
    .from("posts")
    .select("id, title, slug, excerpt, newsletter_sent_at, published")
    .eq("id", postId)
    .single();

  if (postError || !post) throw new Error("Post not found");
  if (!post.published) throw new Error("Post must be published before sending");
  if (post.newsletter_sent_at) throw new Error("Newsletter already sent for this post");

  // Fetch all subscribers
  const { data: subscribers, error: subError } = await supabase
    .from("email_subscribers")
    .select("email");

  if (subError) throw new Error(subError.message);
  if (!subscribers?.length) return { sent: 0 };

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://ivystorylab.com";
  const postUrl = `${siteUrl}/blog/${post.slug}`;
  const from = process.env.CONTACT_FROM_EMAIL ?? "onboarding@resend.dev";

  const resend = new Resend(process.env.RESEND_API_KEY);

  // Batch in chunks of 100 (Resend batch limit)
  const emails = subscribers.map((s) => s.email);
  const chunks: string[][] = [];
  for (let i = 0; i < emails.length; i += 100) {
    chunks.push(emails.slice(i, i + 100));
  }

  for (const chunk of chunks) {
    await resend.batch.send(
      chunk.map((to) => ({
        from,
        to,
        subject: post.title,
        text: [
          post.excerpt ?? "",
          "",
          `Read the full post: ${postUrl}`,
          "",
          "—",
          "You're receiving this because you subscribed to Perspectives from StoryLab.",
          `Unsubscribe: ${siteUrl}/blog`,
        ]
          .join("\n")
          .trim(),
        html: `
          <div style="font-family:Georgia,serif;max-width:560px;margin:0 auto;padding:40px 24px;color:#3f3f46;font-size:17px;line-height:1.75;">
            <h1 style="font-size:26px;color:#18181b;margin:0 0 16px;">${post.title}</h1>
            ${post.excerpt ? `<p style="font-size:18px;color:#52525b;margin:0 0 28px;">${post.excerpt}</p>` : ""}
            <a href="${postUrl}" style="display:inline-block;background:#18181b;color:#fff;text-decoration:none;padding:10px 22px;border-radius:6px;font-size:15px;">Read the full post →</a>
            <hr style="border:none;border-top:1px solid #e4e4e7;margin:40px 0 24px;" />
            <p style="font-size:13px;color:#a1a1aa;margin:0;">You're receiving this because you subscribed to Perspectives from StoryLab. <a href="${siteUrl}/blog" style="color:#a1a1aa;">Manage subscription</a></p>
          </div>
        `,
      }))
    );
  }

  // Mark as sent
  await supabase
    .from("posts")
    .update({ newsletter_sent_at: new Date().toISOString() })
    .eq("id", postId);

  revalidatePath("/admin/dashboard");

  return { sent: emails.length };
}

export async function deletePost(id: string, slug: string): Promise<void> {
  const supabase = getSupabase();

  const { error } = await supabase.from("posts").delete().eq("id", id);

  if (error) throw new Error(error.message);

  revalidatePath("/blog");
  revalidatePath(`/blog/${slug}`);
  revalidatePath("/admin/dashboard");
}
