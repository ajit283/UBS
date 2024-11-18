import { openai } from "@ai-sdk/openai";
import { streamObject } from "ai";
import { z } from "zod";

export const eventSchema = z.object({
  scenarios: z.array(
    z.object({
      event: z.string(),
      description: z.string(),
    })
  ),
});

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

// Simple in-memory cache for LLM responses
const responseCache = new Map<string, any>();

export async function POST(req: Request) {
  const context = await req.json();
  const prompt = `Generate 3 economic scenarios, adhering to these special instructions:${context}`;

  // Check if response exists in cache
  const cachedResponse = responseCache.get(prompt);
  if (cachedResponse) {
    return new Response(JSON.stringify(cachedResponse), {
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const result = await streamObject({
    model: openai("gpt-4o-mini"),
    schema: eventSchema,
    prompt,
  });

  // Cache the response before returning
  const response = await result.toTextStreamResponse();
  const responseBody = await response.text();
  responseCache.set(prompt, JSON.parse(responseBody));

  return new Response(responseBody, {
    headers: { 'Content-Type': 'application/json' }
  });
}
