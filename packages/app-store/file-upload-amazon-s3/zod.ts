import { z } from "zod";

import { eventTypeAppCardZod } from "@calcom/app-store/eventTypeAppCardZod";

export const appDataSchema = eventTypeAppCardZod.merge(
  z.object({
    // TODO: Add capability to encrypt and exclude keys from frontend (at the moment, all app data is exposed to frontend)
    // Maybe appKeys, but they're shared globally instead of per eventType?
    apiKey: z.string(),
    bucket: z.string(),
    endpoint: z.string().optional(),
  })
);
export const appKeysSchema = z.object({});
