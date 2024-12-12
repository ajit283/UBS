import { openai } from "@ai-sdk/openai";
import { streamObject } from "ai";
import { eventSchema } from "@/app/types";

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

// Simple in-memory cache for LLM responses
const responseCache = new Map<string, any>();

export async function POST(req: Request) {
  const context = await req.json();
  const prompt = `I need you to do some risk analysis for a bank. To do this, I need you to output several hypothetical future events with significant economic impact, for each of which I will then analyse their impact on the bank (myself). All of the scenarios should be completely independent of each other, so I can analyse each one of them by itself. Here are some examples:

**Pandemic**
A pandemic originates in Indonesia and quickly spreads around the world. Shops and manufacturing first shut down in Indonesia, but the virus spreads around the world quickly and causes a global lockdown. The lockdowns last for at least a year in most regions, until a vaccine is developed and distributed. The pandemic eventually ends, and the world returns to normal.

**Situation in Middle East escalates**
After Israel attacks Iran, a full-out war begins. Saudi Arabia backs Iran, which leads to Sanctions put on Saudi Arabia by the US. The fighting goes on for 2 years, and the war eventually ends with a ceasefire. The Sanctions are lifted.

Each object in the array that you output should be completely independent, and describe its own scenario from start to finish.
The scenario should read a bit like a newspaper article, and include details like names of banks, peoples, viruses, natural disasters etc.

Your events should all have a global impact, and should have an economic impact on at least the US.

An important thing is: NEVER state any economic consequences or impact in your scenario descriptions - since the economic impact is what I will analyse after that.

${
  context
    ? `

Additionally, here is some context which serves as a rough direction in which your events should go. In case the context specifies a certain event, your first output object should detail that event from start to finish, and the subsequent objects should describe a completely independent event, that also involves the context but is different in the outcome. E.g. if the context is "pandemic", the output objects should all describe a completely different pandemic, with different speeds of spreading, different government measures etc.. As another example, if the context is "credit suisse default", you may describe several different events that involve a default of credit suisse, with the details being different. The first generated event should describe a standard issue bank bankruptcy, like lehman brothers. Never include the phrase "vanilla scenario or lehman brothers" in your output.

In the case of the prompt being "war between israel and iran", all events should different wars between israel and iran, with different outcomes. 


The context is: ${context}`
    : ""
}`;

  console.log(prompt);

  // Check if response exists in cache
  // const cachedResponse = responseCache.get(prompt);
  // if (cachedResponse) {
  //   return new Response(JSON.stringify(cachedResponse), {
  //     headers: { "Content-Type": "application/json" },
  //   });
  // }

  try {
    const result = await streamObject({
      model: openai("gpt-4o"),
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
