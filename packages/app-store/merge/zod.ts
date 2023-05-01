import { z } from "zod";

export const appDataSchema = z.object({});

export const appKeysSchema = z.object({
  apiKey: z.string().min(1),
});
