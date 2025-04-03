import { validate } from "@/utils/validation";
import { AuthError } from "@utils/errors";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { keySchema } from "./schemas";
import { authMiddleware } from "../../middlewares";
import type { JwtVariables } from 'hono/jwt'
import { updateKey } from "./service";

type Variables = JwtVariables

const app = new Hono<{ Variables: Variables }>();

app.use(
  "*",
  authMiddleware()
);

app.put("/", validate("json", keySchema), async (c) => {
  const { user_id, public_key } = c.req.valid("json");

  const { success, error } = await updateKey({ user_id, key: public_key});

  if (!success) {
    const status = error instanceof AuthError ? error.status : 500;
    const code =
      error instanceof AuthError ? error.code : "INTERNAL_SERVER_ERROR";

    throw new HTTPException(status, {
      message: code,
    });
  }

  return c.json({
    success: true,
    message: "public key saved!"
  });
});

export default app;
