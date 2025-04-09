import db from "@/db/drizzle";
import { StorageError } from "@/utils/errors";
import { Result, err, ok } from "@/utils/result";
import { File, files as Files } from "@db/schema";
import {eq} from "drizzle-orm";

export const getFiles = async (): Promise<Result<File[]>> => {
  const files = await db.select().from(Files);

  return ok(files);
};

export const getFileById = async (id: number): Promise<Result<File>> => {
    const file = await db
        .select()
        .from(Files)
        .where(eq(Files.id, id))
        .limit(1);

    if (file.length === 0) {
        return err(new StorageError("File not found", "FILE_NOT_FOUND", 404));
    }

    return ok(file[0]);
};

export const createFile = async ({
  name,
  content,
  hash,
  userId,
  signature,
  contentType,
  size,
  path,
}: {
  name: string;
  content: string; // base64 encoded content
  hash: string;
  userId: number;
  signature: string;
  contentType?: string;
  size: number;
  path: string;
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
        path,
      })
      .returning();

    return ok(file);
  } catch (error) {
    // console.error("Error creating file:", error);
    return err(
      new StorageError("Failed to create file", "FILE_CREATION_FAILED", 500)
    );
  }
};
