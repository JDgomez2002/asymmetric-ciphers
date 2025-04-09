import db from "@/db/drizzle";
import { StorageError } from "@/utils/errors";
import { Result, err, ok } from "@/utils/result";
import { File, files as Files } from "@db/schema";

export const getFiles = async (): Promise<Result<File[]>> => {
  const files = await db.select().from(Files);

  return ok(files);
};

export const createFile = async ({
  name,
  content,
  hash,
  userId,
  signature,
  contentType,
  size,
}: {
  name: string;
  content: string; // base64 encoded content
  hash: string;
  userId: number;
  signature: string;
  contentType?: string;
  size: number;
}) => {
  try {
    const [file] = await db
      .insert(Files)
      .values({
        name,
        hash,
        content,
        signature,
        userId,
        contentType,
        size,
      })
      .returning();

    return ok(file);
  } catch (error) {
    console.error("Error creating file:", error);
    return err(
      new StorageError("Failed to create file", "FILE_CREATION_FAILED", 500)
    );
  }
};
