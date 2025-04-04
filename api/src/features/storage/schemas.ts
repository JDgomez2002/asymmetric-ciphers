import { z } from "zod";

export const uploadFileSchema = z.object({
  name: z.string().min(1),
  content: z.string(), // The encrypted content
  hash: z.string().min(1), // Hash of the encrypted content
  signature: z.string().min(1), // Signature of the encrypted content
  contentType: z.string().optional(),
});

export const fileIdSchema = z.object({
  id: z.string().min(1),
});
