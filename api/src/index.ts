import auth from "@features/auth";
import storage from "@features/storage";
import keys from "@features/keys";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { logger } from "hono/logger";
import { cors } from "hono/cors";
import { ZodError } from "zod";

const app = new Hono();

app.use("*", logger());

app.use(
  "*",
  cors({
    origin: "http://localhost:5173",
    allowHeaders: ["Authorization", "Content-Type"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true,
  })
);

app.route("/auth", auth);
app.route("/files", storage);

app.route("/keys", keys);

app.onError((err: Error | HTTPException, c) => {
  console.error(err);
  if (err instanceof ZodError) {
    return c.json(
      {
        success: false,
        error: "BAD_REQUEST",
        errors: err.errors.map((e) => ({
          field: e.path.join("."),
          message: e.message,
        })),
      },
      400
    );
  }

  if (err instanceof HTTPException) {
    return c.json({ success: false, error: err.message }, err.status);
  }

  return c.json({ success: false, error: "Internal Server Error" }, 500);
});

export default app;
