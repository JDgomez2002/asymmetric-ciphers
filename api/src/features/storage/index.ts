import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { uploadFileSchema } from "./schemas";
import { jwt } from 'hono/jwt'
import type { JwtVariables } from 'hono/jwt'

const JWT_SECRET_KEY = process.env.JWT_KEY!

type Variables = JwtVariables

const app = new Hono<{ Variables: Variables }>();

app.use(
  "*",
  jwt({ secret: JWT_SECRET_KEY })
);

app.get("/", async (c) => {
  return c.json({ success: true, message: "List files endpoint" });
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
