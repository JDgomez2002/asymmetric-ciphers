import { z } from "zod";

export const keySchema = z.object({
  user_id: z.number(),
  public_key: z.string().min(1),
});

export type KeySchema = z.infer<typeof keySchema>;
