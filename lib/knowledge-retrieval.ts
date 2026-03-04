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

async function embedQuery(query: string): Promise<number[]> {
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

export async function retrieveKnowledge(
  query: string,
  options?: { chunkType?: ChunkType; limit?: number }
): Promise<string[]> {
  const embedding = await embedQuery(query);

  const { data, error } = await getSupabase().rpc("match_knowledge_chunks", {
    query_embedding: embedding,
    match_count: options?.limit ?? 5,
    filter_chunk_type: options?.chunkType ?? null,
  });

  if (error) throw new Error(`Knowledge retrieval error: ${error.message}`);

  return ((data ?? []) as KnowledgeChunk[]).map((row) => row.content);
}

// Convenience wrappers
export const retrievePlaybook = (query: string, limit = 3) =>
  retrieveKnowledge(query, { chunkType: "playbook", limit });

export const retrieveCaseStudy = (query: string, limit = 5) =>
  retrieveKnowledge(query, { chunkType: "case_study", limit });
