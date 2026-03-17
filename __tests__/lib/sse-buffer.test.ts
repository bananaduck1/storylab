/**
 * [I] SSE streaming buffer reassembly test.
 *
 * Validates that the line-buffer logic in the chat route correctly handles
 * SSE "data: {...}" lines that are split across multiple reader.read() calls.
 * The bug being guarded: a split line produces one truncated JSON (parse error →
 * silently dropped) + one orphaned fragment filtered out by the "data: " check.
 */
import { describe, it, expect } from "vitest";

/**
 * Pure extraction of the streaming buffer logic from chat/route.ts.
 * We test the algorithm in isolation so we don't need to mock the full route.
 */
function processSSEChunks(chunks: string[]): string {
  let lineBuffer = "";
  let accumulated = "";
  let done = false;

  for (const rawChunk of chunks) {
    if (done) break;
    lineBuffer += rawChunk;
    const lines = lineBuffer.split("\n");
    lineBuffer = lines.pop() ?? "";

    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      const data = line.slice(6);
      if (data === "[DONE]") { done = true; break; }
      try {
        const json = JSON.parse(data);
        const text: string | undefined = json.choices?.[0]?.delta?.content;
        if (text) accumulated += text;
      } catch {
        // malformed — skip
      }
    }
  }
  return accumulated;
}

describe("SSE streaming buffer", () => {
  it("[I] reassembles tokens when a data: line is split across two chunks", () => {
    const chunks = [
      'data: {"choices":[{"delta":{"con',
      'tent":"Hello world"},"finish_reason":null,"index":0}]}\n\n',
      'data: [DONE]\n\n',
    ];
    expect(processSSEChunks(chunks)).toBe("Hello world");
  });

  it("accumulates multiple complete chunks correctly", () => {
    const chunks = [
      'data: {"choices":[{"delta":{"content":"Hello"},"index":0}]}\n\n',
      'data: {"choices":[{"delta":{"content":" world"},"index":0}]}\n\n',
      'data: [DONE]\n\n',
    ];
    expect(processSSEChunks(chunks)).toBe("Hello world");
  });

  it("stops accumulating after [DONE]", () => {
    const chunks = [
      'data: {"choices":[{"delta":{"content":"first"},"index":0}]}\n\n',
      'data: [DONE]\n\n',
      'data: {"choices":[{"delta":{"content":"should not appear"},"index":0}]}\n\n',
    ];
    expect(processSSEChunks(chunks)).toBe("first");
  });

  it("skips malformed JSON without throwing", () => {
    const chunks = [
      'data: not-valid-json\n\n',
      'data: {"choices":[{"delta":{"content":"ok"},"index":0}]}\n\n',
      'data: [DONE]\n\n',
    ];
    expect(processSSEChunks(chunks)).toBe("ok");
  });

  it("handles a line split at the very start of the data: prefix", () => {
    // "dat" stays in the line buffer; next chunk prepends it → "data: {...}" — fully recovered.
    const chunks = [
      'dat',
      'a: {"choices":[{"delta":{"content":"test"},"index":0}]}\n\n',
      'data: [DONE]\n\n',
    ];
    expect(processSSEChunks(chunks)).toBe("test");
  });

  it("handles chunks with multiple complete lines each", () => {
    const twoLines =
      'data: {"choices":[{"delta":{"content":"a"},"index":0}]}\n' +
      'data: {"choices":[{"delta":{"content":"b"},"index":0}]}\n\n';
    expect(processSSEChunks([twoLines, 'data: [DONE]\n\n'])).toBe("ab");
  });
});
