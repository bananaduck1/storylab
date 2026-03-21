import { execFile } from "node:child_process";
import { randomUUID } from "node:crypto";
import { writeFile, unlink } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";
import { NextResponse } from "next/server";

const execFileAsync = promisify(execFile);

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const SUPPORTED_TYPES = new Map<string, string>([
  ["application/pdf", "pdf"],
  ["application/vnd.openxmlformats-officedocument.wordprocessingml.document", "docx"],
  ["text/plain", "txt"],
]);

const SUPPORTED_EXTENSIONS = new Map<string, string>([
  [".pdf", "application/pdf"],
  [".docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
  [".txt", "text/plain"],
]);

export const runtime = "nodejs";

function getMimeType(file: File) {
  if (file.type && SUPPORTED_TYPES.has(file.type)) {
    return file.type;
  }

  const lowerName = file.name.toLowerCase();
  for (const [extension, mimeType] of SUPPORTED_EXTENSIONS.entries()) {
    if (lowerName.endsWith(extension)) {
      return mimeType;
    }
  }

  return file.type || "";
}

function decodeXmlEntities(value: string) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'");
}

function extractPdfText(buffer: Buffer) {
  const raw = buffer.toString("latin1");
  const matches = raw.matchAll(/\(([^\)]*)\)/g);
  const chunks: string[] = [];

  for (const match of matches) {
    const value = match[1]
      .replace(/\\n/g, "\n")
      .replace(/\\r/g, "\n")
      .replace(/\\t/g, "\t")
      .replace(/\\\(/g, "(")
      .replace(/\\\)/g, ")")
      .replace(/\\\\/g, "\\");
    if (value.trim().length > 0) {
      chunks.push(value);
    }
  }

  return chunks.join(" ");
}

async function extractDocxText(buffer: Buffer) {
  const tempPath = join(tmpdir(), `storylab-upload-${randomUUID()}.docx`);
  await writeFile(tempPath, buffer);

  try {
    const { stdout } = await execFileAsync("unzip", ["-p", tempPath, "word/document.xml"]);
    const xml = stdout.toString("utf-8");
    const text = decodeXmlEntities(
      xml
        .replace(/<w:tab\b[^/>]*\/>/g, "\t")
        .replace(/<w:br\b[^/>]*\/>/g, "\n")
        .replace(/<w:p\b[^>]*>/g, "\n")
        .replace(/<[^>]+>/g, " ")
    );
    return text.replace(/\s+/g, " ").trim();
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    throw new Error(
      message.includes("unzip")
        ? "DOCX parsing is unavailable on this server. Please upload a TXT file instead."
        : "We couldn't read that DOCX file. Please try another document."
    );
  } finally {
    await unlink(tempPath).catch(() => null);
  }
}

async function parseFile(file: File) {
  const mimeType = getMimeType(file);
  const buffer = Buffer.from(await file.arrayBuffer());
  let text = "";

  switch (mimeType) {
    case "application/pdf": {
      text = extractPdfText(buffer);
      break;
    }
    case "application/vnd.openxmlformats-officedocument.wordprocessingml.document": {
      text = await extractDocxText(buffer);
      break;
    }
    case "text/plain": {
      text = buffer.toString("utf-8");
      break;
    }
    default: {
      throw new Error("Unsupported file type. Please upload a PDF, DOCX, or TXT file.");
    }
  }

  if (!text || text.trim().length === 0) {
    throw new Error("We couldn't read any text from that file. Please try another document.");
  }

  return { text: text.trim(), mimeType };
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const prompt = formData.get("prompt");
    const file = formData.get("file");

    if (typeof prompt !== "string" || prompt.trim().length === 0) {
      return NextResponse.json(
        { error: "Please include a prompt describing the edit you'd like." },
        { status: 400 }
      );
    }

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "Please upload a file to edit." },
        { status: 400 }
      );
    }

    if (file.size === 0) {
      return NextResponse.json(
        { error: "The uploaded file is empty. Please choose another file." },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File too large. Please upload a file smaller than 10MB." },
        { status: 413 }
      );
    }

    const { text, mimeType } = await parseFile(file);

    return NextResponse.json({
      prompt: prompt.trim(),
      filename: file.name,
      fileType: mimeType,
      text,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to read that file.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
