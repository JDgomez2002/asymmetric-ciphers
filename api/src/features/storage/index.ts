import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { uploadFileSchema } from "./schemas";

const app = new Hono();

app.get("/", async (c) => {
  return c.json({ message: "List files endpoint" });
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
