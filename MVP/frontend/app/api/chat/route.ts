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

export async function POST(req: Request) {
  const context = await req.json();

  const result = await streamObject({
    model: openai("gpt-4o-mini"),
    schema: eventSchema,
    prompt:
      `Generate 3 economic scenarios, adhering to these special instructions:` +
      context,
  });

  return result.toTextStreamResponse();
}
