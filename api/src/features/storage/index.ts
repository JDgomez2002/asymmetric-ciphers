import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { uploadFileSchema, verifyFileSchema } from "./schemas";
import type { JwtVariables } from "hono/jwt";
import { authMiddleware } from "@/middlewares";
import { getFiles, createFile } from "./service";
import { HTTPException } from "hono/http-exception";
import { AuthError, StorageError } from "@/utils/errors";
import { ContentfulStatusCode } from "hono/utils/http-status";
import db from "@/db/drizzle";
import { eq } from "drizzle-orm";
import { users } from "@db/schema";
type Variables = JwtVariables;
import * as crypto from "crypto";
import { getUserById } from "@features/auth/service";
import { getFileById } from "@features/storage/service";
import {
  decryptUserSymmetricKey,
  verifyFileSignatureWithUserKey,
} from "@features/keys/service";
import { decryptContent } from "@features/storage/service";

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

  console.dir(
    {
      hash,
      signature,
    },
    { depth: null }
  );

  // Check if the user exists
  const {
    success: successGettingUser,
    error: errorGettingUser,
    data: user,
  } = await getUserById(userId);

  if (!successGettingUser) {
    const status =
      errorGettingUser instanceof AuthError ? errorGettingUser.status : 500;
    const code =
      errorGettingUser instanceof AuthError
        ? errorGettingUser.code
        : "INTERNAL_SERVER_ERROR";
    throw new HTTPException(status, {
      message: code,
    });
  }

  const encrypted_symmetric_key = user.symmetric_key;

  if (!encrypted_symmetric_key) {
    throw new HTTPException(400, {
      message: "User doesn't have a symmetric key",
    });
  }

  // Decrypt the symmetric key using the server's private key
  const {
    success: symmetricKeyDecrypted,
    error: errorDecryptingSymmetricKey,
    data: decrypted_symmetric_key,
  } = await decryptUserSymmetricKey(encrypted_symmetric_key);

  if (!symmetricKeyDecrypted) {
    const status =
      errorDecryptingSymmetricKey instanceof AuthError
        ? errorDecryptingSymmetricKey.status
        : 500;
    const code =
      errorDecryptingSymmetricKey instanceof AuthError
        ? errorDecryptingSymmetricKey.code
        : "INTERNAL_SERVER_ERROR";
    throw new HTTPException(status, {
      message: code,
    });
  }

  try {
    const public_key = user.public_key;
    if (!public_key) {
      throw new HTTPException(400, { message: "User public key not found" });
    }

    // 0. verify the signature with the user's public key just if the user sent valid hash and signature
    if (hash.trim() && signature.trim()) {
      console.dir(
        {
          public_key,
          hash,
          signature,
          algorithm: user.algorithm as "RSA" | "ECC",
        },
        { depth: null }
      );
      const { error: signatureVerificationError, data: validSignature } =
        await verifyFileSignatureWithUserKey({
          public_key,
          hash,
          signature,
          algorithm: user.algorithm as "RSA" | "ECC",
        });

      if (signatureVerificationError || validSignature === false) {
        console.error("signatureVerificationError", signatureVerificationError);
        throw new HTTPException(500, {
          message: "Error verifying signature with user public key",
        });
      }
      console.log("File verified");
    }

    // decrypt content with the decrypted symmetric key of the user
    const { success: contentDecrypted, data: decrypted_content } =
      await decryptContent(encrypted_content, decrypted_symmetric_key, iv);

    if (!contentDecrypted || !decrypted_content) {
      throw new HTTPException(500, {
        message: "Error decrypting file content with server private key",
      });
    }

    // save the file for demonstration purposes
    const file_path = `./files/${name}`;
    // Ensure the directory exists (optional, depends on setup)
    // await mkdir(dirname(file_path), { recursive: true });
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
      new HTTPException(500, new StorageError(error.message, "500", 500));
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
  } catch (error: unknown) {
    console.error("Decryption error:", error);
    // Check if the error is specifically a tag mismatch error
    if (error instanceof Error) {
      if (
        error.message.includes("Unsupported state") ||
        error.message.includes("bad auth tag")
      ) {
        throw new HTTPException(400, {
          message:
            "Decryption failed: Authentication tag mismatch or corrupted data.",
        });
      }
    }
    throw new HTTPException(400, { message: "Failed to decrypt file" });
  }
});

app.post("/verify", zValidator("json", verifyFileSchema), async (c) => {
  const { signature, encrypted_content, public_key, iv } = c.req.valid("json");
  const userId = c.get("jwtPayload").sub;

  // Check if the user exists
  const {
    success: successGettingUser,
    error: errorGettingUser,
    data: user,
  } = await getUserById(userId);

  if (!successGettingUser) {
    const status =
      errorGettingUser instanceof AuthError ? errorGettingUser.status : 500;
    const code =
      errorGettingUser instanceof AuthError
        ? errorGettingUser.code
        : "INTERNAL_SERVER_ERROR";
    throw new HTTPException(status, {
      message: code,
    });
  }

  // get the encrypted_symmetric_key of the user
  const encrypted_symmetric_key = user.symmetric_key;

  if (!encrypted_symmetric_key) {
    throw new HTTPException(400, {
      message: "User doesn't have a symmetric key",
    });
  }

  // Decrypt the symmetric key using the server's private key
  const {
    success: symmetricKeyDecrypted,
    error: errorDecryptingSymmetricKey,
    data: decrypted_symmetric_key,
  } = await decryptUserSymmetricKey(encrypted_symmetric_key);

  if (!symmetricKeyDecrypted) {
    const status =
      errorDecryptingSymmetricKey instanceof AuthError
        ? errorDecryptingSymmetricKey.status
        : 500;
    const code =
      errorDecryptingSymmetricKey instanceof AuthError
        ? errorDecryptingSymmetricKey.code
        : "INTERNAL_SERVER_ERROR";
    throw new HTTPException(status, {
      message: code,
    });
  }

  // decrypt content with the decrypted symmetric key of the user
  const { success: contentDecrypted, data: decrypted_content } =
    await decryptContent(encrypted_content, decrypted_symmetric_key, iv);

  if (!contentDecrypted || !decrypted_content) {
    throw new HTTPException(500, {
      message: "Error decrypting file content with user's symmetric key",
    });
  }

  // now the content is decrypted so we can work with it
  // here begins the actual verifycation proccess
  // generate hash
  const hash = crypto
    .createHash("sha256")
    .update(decrypted_content)
    .digest("base64");

  console.dir(
    {
      public_key,
      hash,
      signature,
      algorithm: user.algorithm as "RSA" | "ECC",
    },
    { depth: null }
  );

  const { success: signatureVerified, data: isVerified } =
    await verifyFileSignatureWithUserKey({
      public_key,
      hash,
      signature,
      algorithm: user.algorithm as "RSA" | "ECC",
    });

  if (!signatureVerified) {
    throw new HTTPException(500, {
      message: "Error verifying signature with user public key",
    });
  }

  if (!isVerified) {
    throw new HTTPException(400, { message: "Signature verification failed" });
  }

  return c.json({
    message: "File verified",
  });
});

app.get("/:id/download", async (c) => {
  const userId = c.get("jwtPayload").sub;

  // Check if the user exists
  const {
    success: successGettingUser,
    error: errorGettingUser,
    data: user,
  } = await getUserById(userId);

  if (!successGettingUser) {
    const status =
      errorGettingUser instanceof AuthError ? errorGettingUser.status : 500;
    const code =
      errorGettingUser instanceof AuthError
        ? errorGettingUser.code
        : "INTERNAL_SERVER_ERROR";
    throw new HTTPException(status, {
      message: code,
    });
  }

  const fileId = +c.req.param("id");

  const {
    success: fileSuccess,
    error: fileError,
    data: file,
  } = await getFileById(fileId);

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

  // Create and add the signature file, removing any newlines from public key
  const signatureContent = JSON.stringify(
    {
      signature,
      public_key,
    },
    null,
    2
  );
  zip.file(`${name}.signature.txt`, signatureContent);

  // Generate the zip file
  const zipContent = await zip.generateAsync({ type: "arraybuffer" });
  const zipBuffer = Buffer.from(zipContent); // Convert to Buffer

  // Set response headers for zip download
  c.header("Content-Disposition", `attachment; filename="${name}.zip"`);
  c.header("Content-Type", "application/zip");
  c.header("Content-Length", zipBuffer.length.toString()); // Add Content-Length

  return c.body(zipBuffer); // Send Buffer instead of ArrayBuffer
});

export default app;
