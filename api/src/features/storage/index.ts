import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { uploadFileSchema } from "./schemas";
import type { JwtVariables } from "hono/jwt";
import { authMiddleware } from "@/middlewares";
import { getFiles, createFile } from "./service";
import { HTTPException } from "hono/http-exception";
import { StorageError } from "@/utils/errors";
import { ContentfulStatusCode } from "hono/utils/http-status";
import db from "@/db/drizzle";
import { eq } from "drizzle-orm";
import { users } from "@db/schema";
type Variables = JwtVariables;
import * as crypto from "crypto";

const app = new Hono<{ Variables: Variables }>();

app.use("*", authMiddleware());

app.get("/", async (c) => {
  const { data: files } = await getFiles();

  return c.json({ files });
});

app.post("/upload", zValidator("json", uploadFileSchema), async (c) => {
  const { name, encrypted_content, iv, hash, signature, contentType, size } =
    c.req.valid("json");
  const userId = c.get("jwtPayload").sub;

  console.log(
    JSON.stringify(
      {
        name: name,
        encrypted_content: encrypted_content,
        iv: iv,
      },
      null,
      2
    )
  );

  const userResult = await db.select().from(users).where(eq(users.id, userId));

  let encrypted_symmetric_key = null;

  if (userResult.length > 0) {
    encrypted_symmetric_key = userResult[0].symmetric_key;
  }

  if (!encrypted_symmetric_key) {
    throw new HTTPException(400, { message: "User not found" });
  }

  // Decrypt the symmetric key using the server's private key
  const serverPrivateKeyPem = process.env.PRIVATE_KEY;
  if (!serverPrivateKeyPem) {
    throw new HTTPException(500, { message: "Server configuration error" });
  }

  try {
    const encryptedKeyBuffer = Buffer.from(encrypted_symmetric_key, "base64");
    const decrypted_symmetric_key = crypto.privateDecrypt(
      {
        key: serverPrivateKeyPem,
        padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
        oaepHash: "sha256",
      },
      encryptedKeyBuffer
    );

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

    // save the file for demonstration purposes
    const file_path = `./files/${name}`;
    await Bun.write(file_path, decrypted_content);

    // Save the file metadata to the database
    const file = {
      name,
      hash,
      signature,
      content: decrypted_content.toString("base64"),
      size,
      contentType,
      userId,
    };

    const { success, error, data: new_file } = await createFile(file);

    if (!success) {
      new HTTPException(
        500,
        new StorageError(error.message, "500", 500)
      );
    }

    // Continue with the decrypted content...
    return c.json({
      message: "File decrypted successfully",
      file: {
        name: new_file?.name,
        size: new_file?.size,
        type: new_file?.contentType,
        id: new_file?.id,
      },
    });
  } catch (error) {
    console.error("Decryption error:", error);
    // Check if the error is specifically a tag mismatch error
    if (
      (error instanceof Error && error.message.includes("Unsupported state")) ||
      error.message.includes("bad auth tag")
    ) {
      throw new HTTPException(400, {
        message:
          "Decryption failed: Authentication tag mismatch or corrupted data.",
      });
    }
    throw new HTTPException(400, { message: "Failed to decrypt file" });
  }
});

app.get("/:id", async (c) => {
  return c.json({ message: "Get file endpoint" });
});

app.get("/:id/download", async (c) => {
  return c.json({ message: "Download file endpoint" });
});

export default app;
