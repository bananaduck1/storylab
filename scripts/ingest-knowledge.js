// scripts/ingest-knowledge.js
// Run once: node scripts/ingest-knowledge.js
// Prereqs: npm install --save-dev mammoth dotenv

require("dotenv").config({ path: ".env.local" });

const fs = require("fs");
const path = require("path");
const mammoth = require("mammoth");
const { createClient } = require("@supabase/supabase-js");

// ── config ───────────────────────────────────────────────────────────────────

const DOCS_DIR = path.join(__dirname, "../training-docs");
const EMBEDDING_MODEL = "text-embedding-3-small";
const CHUNK_CHARS = 2000; // ~500 tokens (1 token ≈ 4 chars)
const OVERLAP_CHARS = 200; // ~50 tokens overlap
const EMBED_BATCH = 50; // embeddings per OpenAI request

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// ── chunk_type inference ──────────────────────────────────────────────────────

function inferChunkType(filename) {
  const name = filename.toLowerCase();
  if (name.includes("playbook")) return "playbook";
  return "case_study";
}

// ── text chunking ─────────────────────────────────────────────────────────────
// Splits on paragraph boundaries first; falls back to character splits for
// paragraphs that exceed CHUNK_CHARS on their own.

function chunkText(text) {
  const chunks = [];
  // Normalise line endings and split into paragraphs
  const paragraphs = text
    .replace(/\r\n/g, "\n")
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);

  let current = "";

  for (const para of paragraphs) {
    const candidate = current ? current + "\n\n" + para : para;

    if (candidate.length <= CHUNK_CHARS) {
      current = candidate;
    } else {
      // Flush current chunk
      if (current) {
        chunks.push(current);
        // Carry overlap into the next chunk
        current = current.slice(-OVERLAP_CHARS) + "\n\n" + para;
      } else {
        // Single paragraph exceeds limit — split it character-by-character
        let remaining = para;
        while (remaining.length > CHUNK_CHARS) {
          // Try to break on sentence boundary
          const slice = remaining.slice(0, CHUNK_CHARS);
          const lastPeriod = Math.max(
            slice.lastIndexOf(". "),
            slice.lastIndexOf(".\n"),
            slice.lastIndexOf("? "),
            slice.lastIndexOf("! ")
          );
          const breakAt = lastPeriod > CHUNK_CHARS * 0.5 ? lastPeriod + 1 : CHUNK_CHARS;
          chunks.push(remaining.slice(0, breakAt).trim());
          remaining = remaining.slice(breakAt - OVERLAP_CHARS).trim();
        }
        current = remaining;
      }
    }
  }

  if (current.trim()) chunks.push(current.trim());
  return chunks;
}

// ── OpenAI embeddings ─────────────────────────────────────────────────────────

async function embedBatch(texts) {
  const res = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({ model: EMBEDDING_MODEL, input: texts }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`OpenAI embeddings error: ${err}`);
  }

  const json = await res.json();
  // Return in same order as input
  return json.data.sort((a, b) => a.index - b.index).map((d) => d.embedding);
}

async function embedAll(texts) {
  const embeddings = [];
  for (let i = 0; i < texts.length; i += EMBED_BATCH) {
    const batch = texts.slice(i, i + EMBED_BATCH);
    process.stdout.write(`  embedding batch ${Math.floor(i / EMBED_BATCH) + 1}/${Math.ceil(texts.length / EMBED_BATCH)}...`);
    const vecs = await embedBatch(batch);
    embeddings.push(...vecs);
    console.log(" done");
  }
  return embeddings;
}

// ── main ──────────────────────────────────────────────────────────────────────

async function main() {
  // Validate env
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) throw new Error("NEXT_PUBLIC_SUPABASE_URL missing");
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) throw new Error("SUPABASE_SERVICE_ROLE_KEY missing");
  if (!process.env.OPENAI_API_KEY) throw new Error("OPENAI_API_KEY missing");

  if (!fs.existsSync(DOCS_DIR)) {
    throw new Error(`training-docs/ directory not found at ${DOCS_DIR}`);
  }

  const files = fs
    .readdirSync(DOCS_DIR)
    .filter((f) => f.toLowerCase().endsWith(".docx"));

  if (files.length === 0) {
    console.log("No .docx files found in training-docs/. Exiting.");
    return;
  }

  console.log(`Found ${files.length} document(s): ${files.join(", ")}\n`);

  for (const filename of files) {
    const filePath = path.join(DOCS_DIR, filename);
    const chunkType = inferChunkType(filename);
    console.log(`[${filename}] type=${chunkType}`);

    // Extract text
    const { value: rawText } = await mammoth.extractRawText({ path: filePath });
    if (!rawText.trim()) {
      console.log(`  ⚠ Empty document — skipping\n`);
      continue;
    }

    // Chunk
    const chunks = chunkText(rawText);
    console.log(`  ${chunks.length} chunks from ${rawText.length.toLocaleString()} chars`);

    // Embed
    const embeddings = await embedAll(chunks);

    // Delete existing chunks for this source_doc (idempotent re-runs)
    const { error: deleteError } = await supabase
      .from("knowledge_chunks")
      .delete()
      .eq("source_doc", filename);
    if (deleteError) throw new Error(`Delete failed: ${deleteError.message}`);

    // Insert
    const rows = chunks.map((content, i) => ({
      content,
      embedding: embeddings[i],
      source_doc: filename,
      chunk_type: chunkType,
      metadata: { chunk_index: i, total_chunks: chunks.length },
    }));

    const { error: insertError } = await supabase
      .from("knowledge_chunks")
      .insert(rows);
    if (insertError) throw new Error(`Insert failed: ${insertError.message}`);

    console.log(`  ✓ ${rows.length} chunks upserted\n`);
  }

  console.log("Ingestion complete.");
}

main().catch((err) => {
  console.error("Fatal:", err.message);
  process.exit(1);
});
