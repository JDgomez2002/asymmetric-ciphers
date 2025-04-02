import { LoginSchema, type RegisterSchema } from "./schemas";
import { Result, ok, err } from "@/utils/result";
import { AuthError } from "@/utils/errors";
import { User, users } from "@db/schema";
import db from "@/db/drizzle";
import { eq } from "drizzle-orm";
import * as bcrypt from "bcrypt";
import { sign } from 'hono/jwt'

// Token expires in, with minutes
const expirationMinutes: number = 60;
const EXPIRATION_TIME: number = Math.floor(Date.now() / 1000) + 60 * expirationMinutes
const JWT_SECRET_KEY = process.env.JWT_KEY!

async function login({
  username,
  password,
}: LoginSchema): Promise<Result<string>> {
  const result = await db
    .select()
    .from(users)
    .where(eq(users.username, username))
    .limit(1);

  const user = result[0];

  if (!user) {
    return err(new AuthError("User not found", 404, "USER_NOT_FOUND"));
  }

  const passwordMatch = await bcrypt.compare(password, user.password);

  if (!passwordMatch) {
    return err(
      new AuthError("Invalid credentials", 401, "INVALID_CREDENTIALS")
    );
  }

  // handle jwt generation...
  const payload = {
    sub: user.id,
    role: 'user',
    exp: EXPIRATION_TIME,
  }
  const token = await sign(payload, JWT_SECRET_KEY)

  return ok(token);
}

async function register({
  username,
  password,
  name,
}: RegisterSchema): Promise<Result<void>> {
  const existingUsers = await db
    .select()
    .from(users)
    .where(eq(users.username, username))
    .limit(1);

  if (existingUsers.length > 0) {
    return err(new AuthError("Username already taken", 400, "USERNAME_TAKEN"));
  }

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  await db.insert(users).values({
    username,
    password: hashedPassword,
    name,
  });

  return ok(undefined);
}

export { login, register };
