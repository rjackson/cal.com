import { z } from "zod";

export const ZGetInputSchema = z.object({
  id: z.number(),
  decryptAppVaults: z.boolean().optional(),
});

export type TGetInputSchema = z.infer<typeof ZGetInputSchema>;
