import { toast } from "sonner";

// --- Helper functions for encryption (Should ideally be in a separate utils file) ---

export const arrayBufferToBase64 = (buffer: ArrayBuffer): string => {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
};

export const base64ToArrayBuffer = (base64: string): ArrayBuffer => {
  const binary_string = atob(base64);
  const len = binary_string.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binary_string.charCodeAt(i);
  }
  return bytes.buffer;
};

/**
 * Encrypts a file using the symmetric key stored in local storage.
 * @param file The File object to encrypt.
 * @returns A Promise resolving to an object containing the base64 encoded IV and ciphertext, or null if encryption fails.
 */
export const encryptFileWithLocalKey = async (
    file: File
): Promise<{ iv: string; encryptedData: string } | null> => {
  try {
    // 1. Retrieve the base64 symmetric key from local storage
    const base64SymmetricKey = localStorage.getItem("symmetric-key");
    if (!base64SymmetricKey) {
      toast.error("Symmetric key not found in local storage.");
      console.error("Symmetric key not found.");
      return null;
    }

    // 2. Decode the base64 key into an ArrayBuffer
    const symmetricKeyRaw = base64ToArrayBuffer(base64SymmetricKey);

    // 3. Import the symmetric key for use with Web Crypto API
    const cryptoKey = await window.crypto.subtle.importKey(
        "raw",
        symmetricKeyRaw,
        { name: "AES-GCM" },
        true,
        ["encrypt", "decrypt"]
    );

    // 4. Read the file content as an ArrayBuffer
    const fileBuffer = await file.arrayBuffer();

    // 5. Generate a random Initialization Vector (IV) - 12 bytes is recommended for AES-GCM
    const iv = window.crypto.getRandomValues(new Uint8Array(12));

    // 6. Encrypt the file content
    const encryptedContent = await window.crypto.subtle.encrypt(
        {
          name: "AES-GCM",
          iv: iv,
        },
        cryptoKey,
        fileBuffer
    );

    // 7. Package the IV and encrypted data (convert to base64 for easier handling/storage)
    const base64IV = arrayBufferToBase64(iv.buffer);
    const base64EncryptedData = arrayBufferToBase64(encryptedContent);

    console.log("File encrypted successfully!");
    return {
      iv: base64IV,
      encryptedData: base64EncryptedData,
    };
  } catch (error) {
    console.error("Error encrypting file:", error);
    toast.error("Failed to encrypt file. See console for details.");
    return null;
  }
};

/**
 * Generates a SHA-256 hash of the file content
 * @param fileContent The file content as ArrayBuffer
 * @returns A Promise resolving to the base64 encoded hash
 */
export const generateFileHash = async (fileContent: ArrayBuffer): Promise<string> => {
  try {
    // Generate SHA-256 hash of the file content
    const hashBuffer = await window.crypto.subtle.digest('SHA-256', fileContent);

    // Convert the hash to base64 string
    return arrayBufferToBase64(hashBuffer);
  } catch (error) {
    console.error("Error generating file hash:", error);
    throw new Error("Failed to generate file hash");
  }
};

/**
 * Signs the file hash with the user's private key
 * @param hash The hash to sign (base64 string)
 * @param private_key
 * @returns A Promise resolving to the base64 encoded signature
 */
export const signHash = async (hash: string, private_key: string): Promise<string> => {
  try {
    // Import the private key for use with Web Crypto API
    const privateKey = await window.crypto.subtle.importKey(
        "pkcs8",
        base64ToArrayBuffer(private_key),
        {
          name: "RSASSA-PKCS1-v1_5",
          hash: { name: "SHA-256" },
        },
        false,
        ["sign"]
    );

    // Sign the hash
    const signature = await window.crypto.subtle.sign(
        "RSASSA-PKCS1-v1_5",
        privateKey,
        base64ToArrayBuffer(hash)
    );

    // Convert the signature to base64 string
    return arrayBufferToBase64(signature);
  } catch (error) {
    console.error("Error signing hash:", error);
    throw new Error("Failed to sign hash with private key");
  }
};
