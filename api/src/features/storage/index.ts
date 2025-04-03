import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { uploadFileSchema } from "./schemas";
import type { JwtVariables } from 'hono/jwt'
import { authMiddleware } from "./middleware";
import { getFiles } from "./service";

type Variables = JwtVariables

const app = new Hono<{ Variables: Variables }>();

app.use(
  "*",
  authMiddleware()
);

app.get("/", async (c) => {

  const { data: files } = await getFiles();

  return c.json({ files });
});

app.post("/upload", zValidator("json", uploadFileSchema), async (c) => {
  return c.json({ message: "Upload file endpoint" });
});

app.get("/:id", async (c) => {
  return c.json({ message: "Get file endpoint" });
});

app.get("/:id/download", async (c) => {
  return c.json({ message: "Download file endpoint" });
});

export default app;
