import { analyzeEssay } from "@/src/lib/analyzeEssay";
import { NextResponse, NextRequest } from "next/server";
// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdfParse = require("pdf-parse");
import mammoth from "mammoth";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

const SUPPORTED_TYPES: Record<string, string> = {
  "text/plain": "txt",
  "application/pdf": "pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
};

function extFromName(name: string): string | null {
  const m = name.match(/\.(txt|pdf|docx)$/i);
  return m ? m[1].toLowerCase() : null;
}

async function extractText(buf: Buffer, fileType: string): Promise<string> {
  switch (fileType) {
    case "txt":
      return buf.toString("utf-8");
    case "pdf": {
      const pdf = await pdfParse(buf);
      return pdf.text;
    }
    case "docx": {
      const result = await mammoth.extractRawText({ buffer: buf });
      return result.value;
    }
    default:
      throw new Error("Unsupported file type");
  }
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const prompt = formData.get("prompt");
    const file = formData.get("file");

    if (!prompt || typeof prompt !== "string" || !prompt.trim()) {
      return NextResponse.json({ error: "Missing or empty prompt" }, { status: 400 });
    }
    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "Missing file" }, { status: 400 });
    }

    // Size check
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: "File exceeds 10 MB limit" }, { status: 413 });
    }

    // Determine file type
    const mimeType = SUPPORTED_TYPES[file.type] ?? null;
    const extType = extFromName(file.name);
    const fileType = mimeType ?? extType;

    if (!fileType) {
      return NextResponse.json(
        { error: "Unsupported file type. Accepted: .txt, .pdf, .docx" },
        { status: 415 },
      );
    }

    // Extract text
    const arrayBuf = await file.arrayBuffer();
    const buf = Buffer.from(arrayBuf);
    let text: string;
    try {
      text = await extractText(buf, fileType);
    } catch {
      return NextResponse.json({ error: "Could not extract text from file" }, { status: 422 });
    }

    text = text.trim().replace(/\s{3,}/g, "  ");
    if (!text || text.length < 10) {
      return NextResponse.json({ error: "Extracted text is empty or too short" }, { status: 422 });
    }

    // Combine prompt context with extracted essay text
    const essayWithContext = prompt.trim() + "\n\n" + text;
    const result = await analyzeEssay(essayWithContext);
    return NextResponse.json(result);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

export async function GET() {
  const essay = `While I anticipated my experience at Calarts to be different, I was shocked my first day of classes. If my private school scenery represented a monotone palette (partly because we have uniforms), the students at Calarts characterized a rainbow. From a theater girl who would only wear hot pink and giant accessories to a tall visual arts person dressed in a variety of dark colors, everyone was so stained with their own distinctive color. In stark contrast to my private school teachers wearing a checkered pattern shirt stiffened with a tie and khaki pants, my drawing class teacher walked in wearing a hot pink, leopard print blouse with tight red shorts and red high heels, proudly talking about his art which was about a pregnant lady eating babies. 

At my high school, I felt like the unusual one.  While my friends pursued STEM, I thought and acted like an artist. There was no place to celebrate or talk about art. A friend once told me, "You're so brave for pursuing art." .  

However, this camp was starting to make me feel like I was too normal. I met a girl who worked with her parents at a fabric store, making clothes in her free time and participating in the fashion shows her school would host. One girl's wardrobe consisted of all the clothes she upcycled, and there was not one shirt that she hadn't drawn on, and there was a person who attended pilot school that was offered a contract from the Chinese government to work for them for 99 years. 

On the other hand, the friends I met at Calarts opened up new possibilities for me. I met a girl who worked with her parents at a fabric store, making clothes in her free time and participating in the fashion shows her school would host. One girl's wardrobe consisted of all the clothes she upcycled, and there was not one shirt that she hadn't drawn on, and there was a person who attended pilot school that was offered a contract from the Chinese government to work for them for 99 years. 

There were so many people here who were pushing the boundaries to see where they could take their art, and it made me angry at myself. I was angry that I had stayed complacent, treating my art unfairly when it had so many more places to go. 

In my high school filled with mostly shy and non artistic kids, the chance to be on stage came as easily as raising my hand. However, in the open mic nights hosted at the camp, everyone, even the visual arts kids, were competing to be up on stage, to be seen as an artist and to show their art. Their unrivaled confidence in themselves and seeing how much fun they had with their artistry made me realize how privileged yet stifled I was. 

Before Calarts, I tended to be sort of idle, but seeing my peers push themselves made me work even harder. Every opportunity I had, I would stay in the art studio, working on my painting for hours, and when it was closing time, I would always be the last one to leave. This kind of effort manifested in my art style as well. I came into this camp with an artstyle focused on details, realism, and accuracy, but I soon began to find the beauty of abstraction, expression, and making mistakes in my art. 

Inspired by my peers, I wanted to find new ways to express my creativity and influence those around me. I started to paint much more often, volunteered to teach art to mentally disabled people, began my hobby of creating fake nails and selling them to friends, and even organized a fundraiser for the LA fires, designing the cookies and marketing strategy. 

A few years back, I would never have thought an individual could make that big of a change in their community. However, I saw students eagerly reading and collecting all the newspaper editions I produced, many contributing to a good cause through my fundraiser, and younger students connecting with me to ask for advice on art or to tell me how much they loved the event posters I made. Art found me in ways I hadn't before, and I realized that whether it was small or big, my art had always affected others.`;

  try {
    const result = await analyzeEssay(essay);
    return NextResponse.json(result);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
