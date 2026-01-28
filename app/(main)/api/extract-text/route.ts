import { NextResponse, NextRequest } from "next/server";
import mammoth from "mammoth";

const MAX_FILE_SIZE = 10 * 1024 * 1024;

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
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const pdfParse = require("pdf-parse");
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
    const file = formData.get("file");

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "Missing file" }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: "File exceeds 10 MB limit" }, { status: 413 });
    }

    const mimeType = SUPPORTED_TYPES[file.type] ?? null;
    const extType = extFromName(file.name);
    const fileType = mimeType ?? extType;

    if (!fileType) {
      return NextResponse.json(
        { error: "Unsupported file type. Accepted: .txt, .pdf, .docx" },
        { status: 415 },
      );
    }

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

    return NextResponse.json({ text });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
