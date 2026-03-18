import { getSupabase } from "@/lib/supabase";

const EMBEDDING_MODEL = "text-embedding-3-small";

type ChunkType = "case_study" | "playbook";

interface KnowledgeChunk {
  id: string;
  content: string;
  source_doc: string;
  chunk_type: ChunkType;
  metadata: Record<string, unknown>;
  similarity: number;
}

export async function embedQuery(query: string): Promise<number[]> {
  const res = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({ model: EMBEDDING_MODEL, input: query }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`OpenAI embeddings error: ${err}`);
  }

  const json = await res.json();
  return json.data[0].embedding as number[];
}

// Internal: run the Supabase RPC with a pre-computed embedding vector.
// Use this when you need to embed once and retrieve multiple chunk types in parallel.
async function retrieveByVector(
  vector: number[],
  options?: { chunkType?: ChunkType; limit?: number; teacherId?: string }
): Promise<string[]> {
  const { data, error } = await getSupabase().rpc("match_knowledge_chunks", {
    query_embedding: vector,
    match_count: options?.limit ?? 5,
    filter_chunk_type: options?.chunkType ?? null,
    filter_teacher_id: options?.teacherId ?? null,
  });

  if (error) throw new Error(`Knowledge retrieval error: ${error.message}`);

  return ((data ?? []) as KnowledgeChunk[]).map((row) => row.content);
}

// Vector-based typed retrievals — for callers that embed once and retrieve in parallel.
// The chat route uses these to avoid a second embedQuery call.
export const retrievePlaybookByVector = (vector: number[], limit = 3, teacherId?: string) =>
  retrieveByVector(vector, { chunkType: "playbook", limit, teacherId });

export const retrieveCaseStudyByVector = (vector: number[], limit = 2, teacherId?: string) =>
  retrieveByVector(vector, { chunkType: "case_study", limit, teacherId });

// Full pipeline (embed + retrieve) — for callers that don't need embed-once optimization.
export async function retrieveKnowledge(
  query: string,
  options?: { chunkType?: ChunkType; limit?: number; teacherId?: string }
): Promise<string[]> {
  const embedding = await embedQuery(query);
  return retrieveByVector(embedding, options);
}

// String-based typed convenience wrappers — use when embed-once isn't needed.
export const retrievePlaybook = (query: string, limit = 3, teacherId?: string) =>
  retrieveKnowledge(query, { chunkType: "playbook", limit, teacherId });

export const retrieveCaseStudy = (query: string, limit = 5, teacherId?: string) =>
  retrieveKnowledge(query, { chunkType: "case_study", limit, teacherId });
