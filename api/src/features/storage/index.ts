import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { uploadFileSchema } from "./schemas";
import type { JwtVariables } from "hono/jwt";
import { authMiddleware } from "../../middlewares";
import { getFiles, createFile } from "./service";
import { HTTPException } from "hono/http-exception";
import { StorageError } from "@/utils/errors";

type Variables = JwtVariables;

const app = new Hono<{ Variables: Variables }>();

app.use("*", authMiddleware());

app.get("/", async (c) => {
  const { data: files } = await getFiles();

  return c.json({ files });
});

app.post("/upload", zValidator("json", uploadFileSchema), async (c) => {
  // const { name, content, hash } = c.req.valid("json");
  // const userId = c.get("jwtPayload").sub;
  // const result = await createFile({
  //   name,
  //   content,
  //   hash,
  //   userId,
  // });
  // if (!result.success) {
  //   const status =
  //     result.error instanceof StorageError ? result.error.status : 500;
  //   const code =
  //     result.error instanceof StorageError
  //       ? result.error.code
  //       : "INTERNAL_SERVER_ERROR";
  //   throw new HTTPException(status, {
  //     message: code,
  //   });
  // }
  // return c.json({
  //   success: true,
  //   file: result.data,
  // });
});

app.get("/:id", async (c) => {
  return c.json({ message: "Get file endpoint" });
});

app.get("/:id/download", async (c) => {
  return c.json({ message: "Download file endpoint" });
});

export default app;
