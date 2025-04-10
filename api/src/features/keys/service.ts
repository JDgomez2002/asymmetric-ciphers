import db from "@/db/drizzle";
import { files, users } from "@db/schema";
import { eq } from "drizzle-orm";
import { Result, ok, err } from "@/utils/result";
import { KeyError } from "@utils/errors";
import * as crypto from "crypto";
import {HTTPException} from "hono/dist/types/http-exception";

export const updateKey = async ({
  user_id,
  key,
}: {
  user_id: number;
  key: string;
}): Promise<Result<void>> => {
  const user = await db
    .update(users)
    .set({ public_key: key })
    .where(eq(users.id, user_id));

  if (!user) {
    return err(new Error("Failed to update user's public key"));
  }

  return ok(undefined);
};

export const syncUserKey = async ({
  user_id,
  encrypted_asymmetric_key,
  public_key,
}: {
  user_id: number;
  encrypted_asymmetric_key: string;
  public_key: string;
}): Promise<Result<void>> => {
  const serverPrivateKeyPem = process.env.PRIVATE_KEY;
  if (!serverPrivateKeyPem) {
    console.error(
      "Server private key is not configured in environment variables."
    );
    return err(new Error("Server configuration error"));
  }

  try {
    const encryptedKeyBuffer = Buffer.from(encrypted_asymmetric_key, "base64");

    // 3. Attempt to decrypt using RSA-OAEP
    crypto.privateDecrypt(
      {
        key: serverPrivateKeyPem,
        padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
        oaepHash: "sha256", // Specify the hash algorithm used during encryption
      },
      encryptedKeyBuffer
    );

    // If decryption succeeds, we don't need the result, just confirmation it worked.
  } catch (decryptionError) {
    console.error(
      "Failed to decrypt the provided asymmetric key:",
      decryptionError
    );
    // Return a specific error indicating the key is invalid or malformed
    return err(new Error("Invalid encrypted key"));
  }

  console.log("Correctly decrypted the key. Proceeding to store the keys.");

  const updateResult = await db
    .update(users)
    .set({
      symmetric_key: encrypted_asymmetric_key,
      public_key: public_key,
    })
    .where(eq(users.id, user_id))
    .returning({ id: users.id });

  if (updateResult.length === 0) {
    return err(
      new Error(
        "Failed to sync user's asymmetric key: User not found or update failed."
      )
    );
  }

  return ok(undefined);
};

export const getUserKey = async (
  user_id: number
): Promise<
  Result<{
    has_key: boolean;
    public_key: string | null;
    symmetric_key: string | null;
  }>
> => {
  const user = await db.query.users.findFirst({
    where: eq(users.id, user_id),
    columns: {
      public_key: true,
      symmetric_key: true,
    },
  });

  if (!user) {
    return err(new Error("User not found"));
  }

  return ok({
    has_key: !!user.symmetric_key && !!user.public_key,
    public_key: user.public_key,
    symmetric_key: user.symmetric_key,
  });
};

export const getServerPublicKey = async (): Promise<Result<string>> => {
  const key = process.env.PUBLIC_KEY;

  if (!key) {
    return err(new KeyError("Public key not found.", 404, "KEY_NOT_FOUND"));
  }

  return ok(key);
};

export const verifyFileSignature = async ({
  file_id,
  signature,
}: {
  file_id: number;
  signature: string;
}): Promise<Result<boolean>> => {
  const file = await db.query.files.findFirst({
    where: eq(files.id, file_id),
    columns: {
      content: true,
      userId: true,
    },
  });

  if (!file) {
    return err(new Error("File not found"));
  }

  const user = await db.query.users.findFirst({
    where: eq(users.id, file.userId),
    columns: {
      public_key: true,
    },
  });

  if (!user || !user.public_key) {
    return err(new Error("User's public key not found"));
  }

  try {
    // Convert the content to a buffer for verification
    const contentBuffer = Buffer.from(file.content);

    // Verify the signature
    const verifier = crypto.createVerify("SHA256");
    verifier.update(contentBuffer);

    const isValid = verifier.verify(
      user.public_key,
      Buffer.from(signature, "base64")
    );

    return ok(isValid);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return err(new Error(`Verification failed: ${errorMessage}`));
  }
};

export const decryptUserSymmetricKey = async (encryptedKey: string): Promise<Result<Buffer<ArrayBufferLike>>> => {
  // Decrypt the symmetric key using the server's private key
  const serverPrivateKeyPem = process.env.PRIVATE_KEY;
  if (!serverPrivateKeyPem) {
    return err(new KeyError("Server configuration error", 500, "SERVER KEY ERROR" ));
  }

  const encryptedKeyBuffer = Buffer.from(encryptedKey, "base64");
  const decrypted_symmetric_key = crypto.privateDecrypt(
      {
        key: serverPrivateKeyPem,
        padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
        oaepHash: "sha256",
      },
      encryptedKeyBuffer
  );

    return ok(decrypted_symmetric_key);
};

export const verifyFileSignatureWithUserKey = async ({ public_key, hash, signature }: { public_key: string; hash: string; signature: string; }): Promise<Result<boolean>> => {
  // Convert the hash from base64 to a buffer
  const hashBuffer = Buffer.from(hash, 'base64');

  // Convert the signature from base64 to a buffer
  const signatureBuffer = Buffer.from(signature, 'base64');

  // In Web Crypto API, RSASSA-PKCS1-v1_5 with SHA-256 was used for signing
  // So we need to use the equivalent in Node.js crypto
  try {
    const formattedPublicKey = public_key.replace(/\\n/g, '\n');

    const isVerified = crypto.verify(
      'RSA-SHA256', // Algorithm
      hashBuffer,   // Original data that was signed
      formattedPublicKey, // Public key in PEM format
      signatureBuffer  // The signature to verify
    );
    return ok(isVerified);

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    // console.log("verification failed:", errorMessage)
    return err(new Error(`Verification failed: ${errorMessage}`));
  }
};


