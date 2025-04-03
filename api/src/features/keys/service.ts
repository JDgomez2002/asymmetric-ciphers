import db from "@/db/drizzle";
import { users } from "@db/schema";
import { eq } from "drizzle-orm";
import { Result, ok, err } from "@/utils/result";

export const updateKey = async ({ user_id, key }: { user_id: number, key: string }): Promise<Result<void>> => {
  const user = await db.update(users)
    .set({ public_key: key })
    .where(eq(users.id, user_id));

    // verify if the query succeeded
  if (!user) {
    return err(new Error("Failed to update user's public key"));
  }

  return ok(undefined);
};
