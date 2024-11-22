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
  const prompt =
    `Generate 3 economic scenarios, they should be totally independent of each other. Each one should individually be a scenario. One should not need to read any other scenario to understand it. \n` +
    context.length
      ? `use this as inspiration: ${context}`
      : ``;

  // Check if response exists in cache
  const cachedResponse = responseCache.get(prompt);
  if (cachedResponse) {
    return new Response(JSON.stringify(cachedResponse), {
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const result = await streamObject({
      model: openai("gpt-4o-mini"),
      schema: eventSchema,
      prompt,
    });

    // Convert to text stream response but keep streaming
    const response = result.toTextStreamResponse();

    // Cache the response after it's complete
    response
      .clone()
      .text()
      .then((text) => {
        try {
          responseCache.set(prompt, JSON.parse(text));
        } catch (e) {
          console.error("Failed to cache response:", e);
        }
      });

    return response;
  } catch (error) {
    console.error("Error in chat route:", error);
    return new Response(
      JSON.stringify({ error: "Failed to generate response" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
