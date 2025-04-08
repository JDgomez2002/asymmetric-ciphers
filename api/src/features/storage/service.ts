import db from "@/db/drizzle";
import { files as Files, users, File } from "@db/schema";
import { Result, ok, err } from "@/utils/result";
import { StorageError } from "@/utils/errors";
import { eq } from "drizzle-orm";
import * as crypto from "crypto";

export const getFiles = async (): Promise<Result<File[]>> => {
  const files = await db.select().from(Files);

  return ok(files);
};

// export const createFile = async ({
//   name,
//   content,
//   hash,
//   signature,
//   userId,
// }: {
//   name: string;
//   content: string;
//   hash: string;
//   signature: string;
//   userId: number;
// }): Promise<Result<File>> => {
//   try {
//     // Get user's public key
//     const [user] = await db.select().from(users).where(eq(users.id, userId));
//
//     if (!user?.public_key) {
//       return err(
//         new StorageError("User public key not found", 400, "INVALID_FILE")
//       );
//     }
//
//     // Verify the content hash
//     const calculatedHash = crypto
//       .createHash("sha256")
//       .update(content)
//       .digest("hex");
//
//     if (calculatedHash !== hash) {
//       return err(new StorageError("Invalid content hash", 400, "INVALID_FILE"));
//     }
//
//     // Verify the signature using the user's public key
//     const verify = crypto.createVerify("SHA256");
//     verify.update(content);
//     const isValid = verify.verify(user.public_key, signature, "base64");
//
//     if (!isValid) {
//       return err(new StorageError("Invalid signature", 400, "INVALID_FILE"));
//     }
//
//     // Store the file if verification passes
//     const [file] = await db
//       .insert(Files)
//       .values({
//         name,
//         content,
//         hash,
//         signature,
//         userId,
//       })
//       .returning();
//
//     if (!file) {
//       return err(
//         new StorageError("Failed to create file", 500, "UPLOAD_FAILED")
//       );
//     }
//
//     return ok(file);
//   } catch (error) {
//     return err(new StorageError("Failed to create file", 500, "UPLOAD_FAILED"));
//   }
// };

// storage/service.ts
// import db from '@db/drizzle';
// import { files } from '@db/schema';
// import { StorageError } from '@/utils/errors';

export const createFile = async ({
                                   name,
                                   content,
                                   hash,
                                   userId,
                                   signature,
                                   contentType,
                                   size
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
    // Decode base64 content to binary
    const binaryContent = Buffer.from(content, 'base64');

    const [file] = await db.insert(Files)
        .values({
          name,
          hash,
          content: binaryContent.toString("base64"),
          signature,
          userId,
          contentType,
          size
        })
        .returning();

    return ok(file);
  } catch (error) {
    console.error('Error creating file:', error);
    return err(
        new StorageError('Failed to create file', 'FILE_CREATION_FAILED', 500)
    )
  }
};
