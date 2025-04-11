import { validate } from "@/utils/validation";
import { AuthError, KeyError } from "@utils/errors";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { keySchema, syncKeySchema, verifySchema } from "./schemas";
import { authMiddleware } from "../../middlewares";
import type { JwtVariables } from "hono/jwt";
import {
  getServerPublicKey,
  getUserKey,
  syncUserKey,
  updateKey,
  verifyFileSignature,
} from "./service";

type Variables = JwtVariables;

const app = new Hono<{ Variables: Variables }>();

app.get("/public", async (c) => {
  const { success, data, error } = await getServerPublicKey();

  if (!success) {
    throw new HTTPException(500, {
      message: error.message,
    });
  }

  return c.json({
    success: true,
    public_key: data,
  });
});

app.use(authMiddleware());

app.get("/", async (c) => {
  const userId = c.get("jwtPayload").sub;

  if (!userId) {
    throw new HTTPException(401, {
      message: "UNAUTHORIZED",
    });
  }

  const { success, data, error } = await getUserKey(userId);

  if (!success) {
    console.error(error);

    const status = error instanceof AuthError ? error.status : 500;
    const code =
      error instanceof AuthError ? error.code : "INTERNAL_SERVER_ERROR";

    throw new HTTPException(status, {
      message: code,
    });
  }

  return c.json({
    success: true,
    data,
  });
});

app.post("/sync", validate("json", syncKeySchema), async (c) => {
  const userId = c.get("jwtPayload").sub;

  const { encrypted_asymmetric_key, public_key, algorithm } =
    c.req.valid("json");
  console.log("algorithm", algorithm);
  const result = await syncUserKey({
    user_id: userId,
    encrypted_asymmetric_key,
    public_key,
    algorithm,
  });

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
    message: "Keys synced successfully",
  });
});

app.post("/verify", validate("json", verifySchema), async (c) => {
  const { file_id, signature } = c.req.valid("json");

  const result = await verifyFileSignature({ file_id, signature });

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
    is_valid: result.data,
  });
});

export default app;
