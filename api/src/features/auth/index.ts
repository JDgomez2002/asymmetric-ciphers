import { validate } from "@/utils/validation";
import { AuthError } from "@utils/errors";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { loginSchema, registerSchema } from "./schemas";
import { login, register } from "./service";
import { eq } from "drizzle-orm";
import { authMiddleware } from "@/middlewares/auth.middleware";
import db from "@/db/drizzle";
import { users } from "@/db/schema";

const app = new Hono();

app.post("/login", validate("json", loginSchema), async (c) => {
  const body = c.req.valid("json");

  const { success, error, data } = await login(body);

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
    user: data.user,
    jwt: data.token,
  });
});

app.post("/register", validate("json", registerSchema), async (c) => {
  const data = c.req.valid("json");
  const result = await register(data);

  if (!result.success) {
    const status =
      result.error instanceof AuthError ? result.error.status : 500;
    const code =
      result.error instanceof AuthError
        ? result.error.code
        : "INTERNAL_SERVER_ERROR";

    throw new HTTPException(status, {
      message: code,
    });
  }

  return c.json({
    success: true,
  });
});

app.use(authMiddleware());

app.get("/me", async (c) => {
  const userId = c.get("jwtPayload").sub;

  if (!userId) {
    throw new HTTPException(401, {
      message: "UNAUTHORIZED",
    });
  }

  const result = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  const user = result[0];

  if (!user) {
    throw new HTTPException(404, {
      message: "USER_NOT_FOUND",
    });
  }

  const { password, ...userWithoutPassword } = user;

  return c.json({
    success: true,
    user: userWithoutPassword,
  });
});

export default app;
