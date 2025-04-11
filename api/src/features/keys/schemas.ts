import { z } from "zod";

export const keySchema = z.object({
  user_id: z.number(),
  public_key: z.string().min(1),
});

export type KeySchema = z.infer<typeof keySchema>;

export const syncKeySchema = z.object({
  encrypted_asymmetric_key: z.string().min(1),
  public_key: z.string().min(1),
  algorithm: z.enum(["RSA", "ECC"]).default("RSA"),
});

export type SyncKeySchema = z.infer<typeof syncKeySchema>;

export const verifySchema = z.object({
  file_id: z.number(),
  signature: z.string().min(1),
});

export type VerifySchema = z.infer<typeof verifySchema>;
