import db from "@/db/drizzle";
import { files as Files, File } from "@db/schema";
import { Result, ok, err } from "@/utils/result";

export const getFiles = async (): Promise<Result<File[]>> => {
  const files = await db
  .select()
  .from(Files);

  return ok(files)
};
