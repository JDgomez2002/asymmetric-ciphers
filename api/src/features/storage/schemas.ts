import { z } from "zod";

export const uploadFileSchema = z.object({
  name: z.string().min(1),
  content: z.string(), // This will be base64 encoded encrypted content
  hash: z.string(),
  signature: z.string(),
  contentType: z.string().optional(),
  size: z.number()
});

export const fileIdSchema = z.object({
  id: z.string().min(1),
});
