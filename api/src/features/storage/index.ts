import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import {uploadFileSchema, verifyFileSchema} from "./schemas";
import type { JwtVariables } from "hono/jwt";
import { authMiddleware } from "@/middlewares";
import { getFiles, createFile } from "./service";
import { HTTPException } from "hono/http-exception";
import {AuthError, StorageError} from "@/utils/errors";
import { ContentfulStatusCode } from "hono/utils/http-status";
import db from "@/db/drizzle";
import { eq } from "drizzle-orm";
import { users } from "@db/schema";
type Variables = JwtVariables;
import * as crypto from "crypto";
import { getUserById} from "@features/auth/service";
import { getFileById} from "@features/storage/service";
import { decryptUserSymmetricKey, verifyFileSignatureWithUserKey } from "@features/keys/service";

var JSZip = require("jszip");

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

  // Check if the user exists
  const { success: successGettingUser, error: errorGettingUser, data: user } = await getUserById(userId);

    if (!successGettingUser) {
      const status = errorGettingUser instanceof AuthError ? errorGettingUser.status : 500;
      const code =
          errorGettingUser instanceof AuthError ? errorGettingUser.code : "INTERNAL_SERVER_ERROR";
      throw new HTTPException(status, {
        message: code,
      });
    }

  let encrypted_symmetric_key = user.symmetric_key;

  if (!encrypted_symmetric_key) {
    throw new HTTPException(400, { message: "User doesn't have a symmetric key" });
  }

  // Decrypt the symmetric key using the server's private key
  const { success: symmetricKeyDecrypted, error: errorDecryptingSymmetricKey, data: decrypted_symmetric_key } = await decryptUserSymmetricKey(encrypted_symmetric_key);

  if (!symmetricKeyDecrypted) {
    const status = errorDecryptingSymmetricKey instanceof AuthError ? errorDecryptingSymmetricKey.status : 500;
    const code =
        errorDecryptingSymmetricKey instanceof AuthError ? errorDecryptingSymmetricKey.code : "INTERNAL_SERVER_ERROR";
    throw new HTTPException(status, {
      message: code,
    });
  }

  try {
    const public_key = user.public_key;
    if (!public_key) {
      throw new HTTPException(400, { message: "User public key not found" });
    }

    // 0. verify the signature with the user's public key
    const isVerified = await verifyFileSignatureWithUserKey({
      public_key,
      hash,
      signature,
    });

    if (!isVerified) {
      throw new HTTPException(400, { message: "Signature verification failed" });
    }

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
      path: file_path,
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
      message: "File decrypted & saved successfully",
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

app.post("/verify", zValidator("json", verifyFileSchema), async (c) => {
  const { signature, content, public_key } = c.req.valid("json");

  // generate hash
  const hash = crypto.createHash("sha256").update(content).digest("base64");

  // Check if the file already exists
  const isVerified = await verifyFileSignatureWithUserKey({
    public_key,
    hash,
    signature,
  });

  if (!isVerified) {
      throw new HTTPException(400, { message: "Signature verification failed" });
  }

  return c.json({
    message: "File verified successfully, valid signature",
  });

});
app.get("/:id/download", async (c) => {
  const userId = c.get("jwtPayload").sub;

  // Check if the user exists
  const { success: successGettingUser, error: errorGettingUser, data: user } = await getUserById(userId);

  if (!successGettingUser) {
    const status = errorGettingUser instanceof AuthError ? errorGettingUser.status : 500;
    const code =
        errorGettingUser instanceof AuthError ? errorGettingUser.code : "INTERNAL_SERVER_ERROR";
    throw new HTTPException(status, {
      message: code,
    });
  }

  const fileId = +c.req.param("id");

  const { success: fileSuccess, error: fileError, data: file } = await getFileById(fileId);

  if (!fileSuccess || !file) {
    throw new HTTPException(404, {
      message: "File not found", 
    });
  }

  const { path, name, signature } = file;
  const { public_key } = user;

  // Create a zip archive to store the files
  const zip = new JSZip();

  // Add the original file
  const fileContent = Bun.file(path);
  const fileBuffer = await fileContent.arrayBuffer();
  zip.file(name, fileBuffer);

  // Create and add the signature file
  const signatureContent = JSON.stringify({
    signature,
    public_key
  }, null, 2);
  zip.file(`${name}.signature.txt`, signatureContent);

  // Generate the zip file
  const zipContent = await zip.generateAsync({type: "arraybuffer"});

  // Set response headers for zip download
  c.header("Content-Disposition", `attachment; filename="${name}.zip"`);
  c.header("Content-Type", "application/zip");

  return c.body(zipContent);
});

export default app;
