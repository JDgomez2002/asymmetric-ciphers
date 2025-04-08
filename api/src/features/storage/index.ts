import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { uploadFileSchema } from "./schemas";
import type { JwtVariables } from "hono/jwt";
import { authMiddleware } from "@/middlewares";
import { getFiles, createFile } from "./service";
import { HTTPException } from "hono/http-exception";
import { StorageError } from "@/utils/errors";
import {ContentfulStatusCode} from "hono/utils/http-status";

type Variables = JwtVariables;

const app = new Hono<{ Variables: Variables }>();

app.use("*", authMiddleware());

app.get("/", async (c) => {
  const { data: files } = await getFiles();

  return c.json({ files });
});

app.post("/upload", zValidator("json", uploadFileSchema), async (c) => {
  const { name, content, hash, signature, contentType, size } = c.req.valid("json");
  const userId = c.get("jwtPayload").sub;

  const { success, error, data } = await createFile({
    name,
    content,
    hash,
    signature,
    userId,
    contentType,
    size
  });

  if (!success) {
    const status =
        error instanceof StorageError ? error.status : 500;
    const code =
        error instanceof StorageError
            ? error.code
            : "INTERNAL_SERVER_ERROR";
    throw new HTTPException(status as ContentfulStatusCode, {
      message: code?.toString(),
    });
  }

  // Return file info without the binary content
  const { content: _, ...fileInfo } = data;

  return c.json({
    success: true,
    file: fileInfo,
  });
});

app.get("/:id", async (c) => {
  return c.json({ message: "Get file endpoint" });
});

app.get("/:id/download", async (c) => {
  return c.json({ message: "Download file endpoint" });
});

export default app;
