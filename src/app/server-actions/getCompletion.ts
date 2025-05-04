"use server";

import OpenAI from "openai";

const openai = new OpenAI({
  baseURL: process.env.OPENROUTER_API_URL || "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
  defaultHeaders: {
    "HTTP-Referer": "https://openrouter-app-two.vercel.app",
    "X-Title": "OpenRouter Chat",
  },
});

export interface Message {
  role: "user" | "assistant";
  content: string;
}

export async function getCompletion(
  messageHistory: Message[],
): Promise<{ messages: Message[] }> {
  const completion = await openai.chat.completions.create({
    model: process.env.OPENROUTER_API_MODEL || "openai/gpt-4o-mini",
    messages: messageHistory,
  });

  if (!completion.choices || completion.choices.length === 0) {
    throw new Error("No choices returned from OpenRouter API");
  }

  if (!completion.choices[0].message.content) {
    throw new Error("No message returned from OpenRouter API");
  }

  return {
    messages: [
      ...messageHistory,
      {
        role: completion.choices[0].message.role,
        content: completion.choices[0].message.content,
      },
    ],
  };
}
