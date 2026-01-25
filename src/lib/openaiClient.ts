export const DEFAULT_ANALYSIS_MODEL =
  process.env.MODEL_ANALYSIS ?? "gpt-4o-mini";

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface ChatCompletionResponse {
  choices: Array<{
    message: {
      role: string;
      content: string;
    };
  }>;
}

export async function getOpenAIClient() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY environment variable is not set");
  }

  return {
    chat: {
      completions: {
        create: async (params: {
          model: string;
          messages: ChatMessage[];
          temperature?: number;
          response_format?: { type: string };
        }): Promise<ChatCompletionResponse> => {
          const response = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
              model: params.model,
              messages: params.messages,
              temperature: params.temperature ?? 0.7,
              ...(params.response_format && { response_format: params.response_format }),
            }),
          });

          if (!response.ok) {
            const errorText = await response.text();
            throw new Error(
              `OpenAI API error: ${response.status} ${response.statusText} - ${errorText}`
            );
          }

          return response.json();
        },
      },
    },
  };
}
