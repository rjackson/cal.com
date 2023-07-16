import type { ZodRawShape } from "zod";
import { z } from "zod";

import { eventTypeAppCardZod } from "@calcom/app-store/eventTypeAppCardZod";

const vaultObject = (shape: ZodRawShape) => {
  return z
    .object({
      decrypted: z.object(shape).optional(),
      encrypted: z.object(shape).optional(),
    })
    .optional();
};

export const appDataSchema = eventTypeAppCardZod.merge(
  z.object({
    __vault: vaultObject({ apiKey: z.string() }),
    bucket: z.string().min(1),
    endpoint: z.string().optional(),
  })
);
export const appKeysSchema = z.object({});
