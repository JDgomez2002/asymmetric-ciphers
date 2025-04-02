import { z } from "zod";

export const uploadFileSchema = z.object({
  name: z.string().min(1),
  content: z.string(),
  contentType: z.string().optional(),
});

export const fileIdSchema = z.object({
  id: z.string().min(1),
});
