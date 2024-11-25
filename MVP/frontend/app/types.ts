import { z } from "zod";

export const eventSchema = z.object({
  scenarios: z.array(
    z.object({
      event: z.string(),
      description: z.string(),
    })
  ),
});
