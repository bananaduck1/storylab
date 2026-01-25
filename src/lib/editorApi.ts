import { NextRequest, NextResponse } from "next/server";
import { analyzeEssay } from "./analyzeEssay";

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const RATE_LIMIT_MAX = 10;

const rateLimitStore = new Map<string, number[]>();

const SAMPLE_ESSAY = `While I anticipated my experience at Calarts to be different, I was shocked my first day of classes. If my private school scenery represented a monotone palette (partly because we have uniforms), the students at Calarts characterized a rainbow. From a theater girl who would only wear hot pink and giant accessories to a tall visual arts person dressed in a variety of dark colors, everyone was so stained with their own distinctive color. In stark contrast to my private school teachers wearing a checkered pattern shirt stiffened with a tie and khaki pants, my drawing class teacher walked in wearing a hot pink, leopard print blouse with tight red shorts and red high heels, proudly talking about his art which was about a pregnant lady eating babies. 

At my high school, I felt like the unusual one.  While my friends pursued STEM, I thought and acted like an artist. There was no place to celebrate or talk about art. A friend once told me, "You're so brave for pursuing art." .  

However, this camp was starting to make me feel like I was too normal. I met a girl who worked with her parents at a fabric store, making clothes in her free time and participating in the fashion shows her school would host. One girl's wardrobe consisted of all the clothes she upcycled, and there was not one shirt that she hadn't drawn on, and there was a person who attended pilot school that was offered a contract from the Chinese government to work for them for 99 years. 

On the other hand, the friends I met at Calarts opened up new possibilities for me. I met a girl who worked with her parents at a fabric store, making clothes in her free time and participating in the fashion shows her school would host. One girl's wardrobe consisted of all the clothes she upcycled, and there was not one shirt that she hadn't drawn on, and there was a person who attended pilot school that was offered a contract from the Chinese government to work for them for 99 years. 

There were so many people here who were pushing the boundaries to see where they could take their art, and it made me angry at myself. I was angry that I had stayed complacent, treating my art unfairly when it had so many more places to go. 

In my high school filled with mostly shy and non artistic kids, the chance to be on stage came as easily as raising my hand. However, in the open mic nights hosted at the camp, everyone, even the visual arts kids, were competing to be up on stage, to be seen as an artist and to show their art. Their unrivaled confidence in themselves and seeing how much fun they had with their artistry made me realize how privileged yet stifled I was. 

Before Calarts, I tended to be sort of idle, but seeing my peers push themselves made me work even harder. Every opportunity I had, I would stay in the art studio, working on my painting for hours, and when it was closing time, I would always be the last one to leave. This kind of effort manifested in my art style as well. I came into this camp with an artstyle focused on details, realism, and accuracy, but I soon began to find the beauty of abstraction, expression, and making mistakes in my art. 

Inspired by my peers, I wanted to find new ways to express my creativity and influence those around me. I started to paint much more often, volunteered to teach art to mentally disabled people, began my hobby of creating fake nails and selling them to friends, and even organized a fundraiser for the LA fires, designing the cookies and marketing strategy. 

A few years back, I would never have thought an individual could make that big of a change in their community. However, I saw students eagerly reading and collecting all the newspaper editions I produced, many contributing to a good cause through my fundraiser, and younger students connecting with me to ask for advice on art or to tell me how much they loved the event posters I made. Art found me in ways I hadn't before, and I realized that whether it was small or big, my art had always affected others.`;

const jsonError = (message: string, status: number) =>
  NextResponse.json({ error: message }, { status });

const getClientIp = (request: NextRequest) => {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0]?.trim() || "unknown";
  }
  return request.headers.get("x-real-ip") ?? "unknown";
};

const checkRateLimit = (ip: string) => {
  const now = Date.now();
  const existing = rateLimitStore.get(ip) ?? [];
  const windowStart = now - RATE_LIMIT_WINDOW_MS;
  const recent = existing.filter((timestamp) => timestamp > windowStart);

  if (recent.length >= RATE_LIMIT_MAX) {
    const oldest = recent[0] ?? now;
    const retryAfterMs = RATE_LIMIT_WINDOW_MS - (now - oldest);
    return {
      limited: true,
      retryAfterSeconds: Math.max(1, Math.ceil(retryAfterMs / 1000)),
    };
  }

  recent.push(now);
  rateLimitStore.set(ip, recent);
  return { limited: false, retryAfterSeconds: 0 };
};

export async function handleEditorGet() {
  try {
    const result = await analyzeEssay(SAMPLE_ESSAY);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Editor GET error:", error);
    return jsonError("Failed to analyze the sample essay.", 500);
  }
}

export async function handleEditorPost(request: NextRequest) {
  const ip = getClientIp(request);
  const rateLimit = checkRateLimit(ip);
  if (rateLimit.limited) {
    return NextResponse.json(
      { error: "Too many requests. Please wait and try again." },
      {
        status: 429,
        headers: { "Retry-After": rateLimit.retryAfterSeconds.toString() },
      }
    );
  }

  try {
    const formData = await request.formData();
    const promptValue = formData.get("prompt");
    const fileValue = formData.get("file");

    if (typeof promptValue !== "string" || promptValue.trim() === "") {
      return jsonError("Prompt is required.", 400);
    }

    let essayText = promptValue.trim();

    if (fileValue instanceof File) {
      if (fileValue.size > MAX_FILE_SIZE_BYTES) {
        return jsonError("File size exceeds the 10MB limit.", 413);
      }

      const extension = fileValue.name.split(".").pop()?.toLowerCase();
      if (extension === "txt" || fileValue.type === "text/plain") {
        const fileText = await fileValue.text();
        if (fileText.trim() === "") {
          return jsonError("Uploaded file is empty.", 400);
        }
        essayText = fileText.trim();
      } else {
        return jsonError(
          "Uploaded file type is not supported yet. Please upload a .txt file or paste your essay into the prompt.",
          400
        );
      }
    } else if (fileValue !== null) {
      return jsonError("Invalid file payload.", 400);
    }

    const result = await analyzeEssay(essayText);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Editor POST error:", error);
    return jsonError("Failed to analyze the essay. Please try again later.", 500);
  }
}
