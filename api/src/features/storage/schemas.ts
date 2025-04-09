import { z } from "zod";

export const uploadFileSchema = z.object({
  name: z.string().min(1),
  encrypted_content: z.string(), // This will be base64 encoded encrypted content
  iv: z.string(),
  hash: z.string(),
  signature: z.string(),
  contentType: z.string().optional(),
  size: z.number(),
});

export const verifyFileSchema = z.object({
  content: z.string(),
  signature: z.string(),
  public_key: z.string(),
});

export const fileIdSchema = z.object({
  id: z.string().min(1),
});
