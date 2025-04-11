// Define a type for the supported algorithms
export type SigningAlgorithm = "RSA" | "ECC";

export const generateKey = async (
  serverPublicKeyPEM: string,
  algorithm: SigningAlgorithm = "RSA"
) => {
  try {
    // Key parameters based on algorithm choice
    const keyGenParams =
      algorithm === "RSA"
        ? {
            name: "RSA-OAEP",
            modulusLength: 2048,
            publicExponent: new Uint8Array([1, 0, 1]), // 65537
            hash: "SHA-256",
          }
        : {
            name: "ECDSA",
            namedCurve: "P-256", // Good balance of security and performance
          };

    // 1. Generate key pair based on algorithm
    const keyPair = await window.crypto.subtle.generateKey(
      keyGenParams,
      true, // extractable
      algorithm === "RSA" ? ["encrypt", "decrypt"] : ["sign", "verify"]
    );

    // 2. Export public key to SPKI format
    const publicKeySpki = await window.crypto.subtle.exportKey(
      "spki",
      keyPair.publicKey
    );

    // 3. Export private key to PKCS8 format (for storage)
    const privateKeyPkcs8 = await window.crypto.subtle.exportKey(
      "pkcs8",
      keyPair.privateKey
    );

    // 4. Convert public key to PEM format
    let publicKeyBase64 = btoa(
      String.fromCharCode(...new Uint8Array(publicKeySpki))
    );
    publicKeyBase64 =
      publicKeyBase64?.match(/.{1,64}/g)?.join("\n") || publicKeyBase64;

    const publicKeyPEM = `-----BEGIN PUBLIC KEY-----\n${publicKeyBase64}\n-----END PUBLIC KEY-----`;

    // 5. Import server's public key
    const serverPublicKeyDER = convertPEMToDER(serverPublicKeyPEM);

    const serverKey = await window.crypto.subtle.importKey(
      "spki",
      serverPublicKeyDER,
      {
        name: "RSA-OAEP",
        hash: "SHA-256",
      },
      false,
      ["encrypt"]
    );

    // 6. Generate a symmetric key (AES-GCM 256-bit)
    const symmetricKey = await window.crypto.subtle.generateKey(
      {
        name: "AES-GCM",
        length: 256,
      },
      true, // Make it extractable
      ["encrypt", "decrypt"]
    );

    // 7. Export the symmetric key to raw format
    const symmetricKeyRaw = await window.crypto.subtle.exportKey(
      "raw",
      symmetricKey
    );

    const base64SymmetricKey = arrayBufferToBase64(symmetricKeyRaw);

    // 8. Encrypt the raw symmetric key using the server's public key
    const encryptedSymmetricKey = await window.crypto.subtle.encrypt(
      {
        name: "RSA-OAEP",
      },
      serverKey,
      symmetricKeyRaw // Encrypt the raw symmetric key bytes
    );

    // 9. Convert encrypted symmetric key to base64
    const base64EncryptedSymmetricKey = btoa(
      String.fromCharCode(...new Uint8Array(encryptedSymmetricKey))
    );

    return {
      privateKey: arrayBufferToBase64(privateKeyPkcs8), // Client's private key for local storage
      publicKey: publicKeyPEM, // Client's public key for server
      encryptedKey: base64EncryptedSymmetricKey, // Encrypted *symmetric* key for server
      rawSymmetricKey: base64SymmetricKey, // Raw symmetric key for local storage
      algorithm: algorithm, // Add the algorithm used
    };
  } catch (error) {
    console.error("Error generating key pair:", error);
    throw error;
  }
};

// Helper functions
const arrayBufferToBase64 = (buffer: ArrayBuffer): string => {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
};

const convertPEMToDER = (pem: string): ArrayBuffer => {
  // Remove header, footer and newlines
  const base64 = pem
    .replace("-----BEGIN PUBLIC KEY-----", "")
    .replace("-----END PUBLIC KEY-----", "")
    .replace(/\n/g, "");

  // Convert base64 to binary
  const binary = atob(base64);

  // Convert to Uint8Array
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }

  return bytes.buffer;
};
