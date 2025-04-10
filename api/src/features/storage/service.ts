import db from "@/db/drizzle";
import { StorageError } from "@/utils/errors";
import { Result, err, ok } from "@/utils/result";
import { File, files as Files } from "@db/schema";
import {eq} from "drizzle-orm";
import * as crypto from "crypto";

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

export const decryptContent = async (encrypted_content: string, decrypted_symmetric_key: Buffer<ArrayBufferLike>, iv: string) => {
  // 1. Decode the Base64 encrypted content + tag
  const encryptedDataWithTag = Buffer.from(encrypted_content, "base64");

  // 2. Extract the tag (last 16 bytes) and the actual ciphertext
  const tagLength = 16;
  const ciphertextLength = encryptedDataWithTag.length - tagLength;

  // Basic check: ensure buffer is long enough to contain a tag
  if (ciphertextLength < 0) {
    throw new Error("Invalid encrypted data: too short to contain auth tag.");
  }

  const ciphertext = encryptedDataWithTag.subarray(0, ciphertextLength);
  const authTag = encryptedDataWithTag.subarray(ciphertextLength); // Gets the last 16 bytes

  // 3. Decode the IV
  const ivBuffer = Buffer.from(iv, "base64");

  // 4. Create the decipher
  const decipher = crypto.createDecipheriv(
    "aes-256-gcm",
    decrypted_symmetric_key,
    ivBuffer // Pass the IV buffer here
  );

  // 5. Set the authentication tag EXPLICITLY
  decipher.setAuthTag(authTag);

  // 6. Decrypt the ciphertext (ONLY the ciphertext part)
  const decrypted_content_part1 = decipher.update(ciphertext);
  // decipher.final() will throw if the tag verification fails
  const decrypted_content_part2 = decipher.final();

  const decrypted_content = Buffer.concat([
    decrypted_content_part1,
    decrypted_content_part2,
  ]);

  return ok(decrypted_content);
};
