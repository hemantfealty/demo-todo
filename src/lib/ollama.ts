import { config } from "@/config";

interface OllamaMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface OllamaResponse {
  message: { content: string };
}

export async function ollamaChat(messages: OllamaMessage[]): Promise<string> {
  const { apiKey, apiUrl, model } = config.ollama;

  if (!apiKey) throw new Error("OLLAMA_API_KEY is not configured");

  const url = `${apiUrl}/api/chat`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages,
      stream: false,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error("[Ollama] Error:", res.status, err);
    throw new Error(`Ollama API error ${res.status}: ${err}`);
  }

  const data: OllamaResponse = await res.json();
  return data.message?.content?.trim() ?? "";
}
