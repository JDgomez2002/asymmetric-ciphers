import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api/axios";
import { toast } from "sonner";

// Query keys
export const KEYS_QUERY_KEY = "keys";
export const SERVER_PUBLIC_KEY_QUERY_KEY = "server-public-key";

// Types
interface UserKeyResponse {
  success: boolean;
  data: {
    has_key: boolean;
    public_key: string;
    encrypted_asymmetric_key: string;
  };
}

interface ServerPublicKeyResponse {
  success: boolean;
  public_key: string;
  symmetric_key: string;
}

interface SyncKeyRequest {
  encrypted_asymmetric_key: string;
  public_key: string;
  algorithm?: string;
}

interface SyncKeyResponse {
  success: boolean;
  message: string;
}

interface VerifySignatureRequest {
  file_id: number;
  signature: string;
  algorithm?: string;
}

interface VerifySignatureResponse {
  success: boolean;
  is_valid: boolean;
}

// 1. GET /keys/public - Get server's public key
export const useServerPublicKey = () => {
  return useQuery({
    queryKey: [SERVER_PUBLIC_KEY_QUERY_KEY],
    queryFn: async (): Promise<string> => {
      try {
        const {
          data: { public_key },
        } = await api.get<ServerPublicKeyResponse>("/keys/public");
        return public_key;
      } catch (error: any) {
        console.error("Error fetching server public key:", error);
        throw error;
      }
    },
    staleTime: 24 * 60 * 60 * 1000, // 24 hours - server key rarely changes
    refetchOnWindowFocus: false,
  });
};

// 2. GET /keys/ - Get user's key information
export const useUserKeys = () => {
  return useQuery({
    queryKey: [KEYS_QUERY_KEY],
    queryFn: async (): Promise<UserKeyResponse["data"]> => {
      try {
        const {
          data: { data: keys },
        } = await api.get<UserKeyResponse>("/keys");
        return keys;
      } catch (error: any) {
        console.error("Error fetching user keys:", error);
        throw error;
      }
    },
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
    // Only enabled if user is authenticated
    enabled: !!localStorage.getItem("token"),
  });
};

// 3. POST /keys/sync - Sync user's asymmetric key
export const useSyncKeys = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (keyData: SyncKeyRequest): Promise<SyncKeyResponse> => {
      const { data } = await api.post<SyncKeyResponse>("/keys/sync", keyData);
      return data;
    },
    onSuccess: () => {
      toast.success("Keys synced with the server successfully");
      queryClient.invalidateQueries({ queryKey: [KEYS_QUERY_KEY] });
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Failed to sync keys");
      console.error("Error syncing keys:", error);
    },
  });
};

// 4. POST /keys/verify - Verify a file's signature
export const useVerifySignature = () => {
  return useMutation({
    mutationFn: async (
      verifyData: VerifySignatureRequest
    ): Promise<boolean> => {
      try {
        const { data } = await api.post<VerifySignatureResponse>(
          "/keys/verify",
          verifyData
        );
        return data.is_valid;
      } catch (error: any) {
        toast.error(
          error?.response?.data?.message || "Failed to verify signature"
        );
        console.error("Error verifying signature:", error);
        throw error;
      }
    },
    onSuccess: (isValid) => {
      if (isValid) {
        toast.success("Signature verified successfully");
      } else {
        toast.error("Invalid signature - file may be tampered");
      }
    },
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message || "Failed to verify signature"
      );
    },
  });
};

// Sign a file with user's private key
export const signFile = async (
  fileData: ArrayBuffer
): Promise<{ signature: string; algorithm: string } | null> => {
  const storedKeyPair = localStorage.getItem("private-key");

  if (!storedKeyPair) return null;

  try {
    const keyPair = JSON.parse(storedKeyPair);
    // Get the algorithm directly from the stored key pair
    const algorithm = keyPair.algorithm || "RSA"; // Default to RSA for backward compatibility

    // Import parameters based on algorithm
    const importParams =
      algorithm === "RSA"
        ? {
            name: "RSASSA-PKCS1-v1_5",
            hash: { name: "SHA-256" },
          }
        : {
            name: "ECDSA",
            namedCurve: "P-256",
            hash: { name: "SHA-256" },
          };

    // Check if the privateKey is a JWK object or a base64 string
    let privateKey;
    if (typeof keyPair.privateKey === "object") {
      // It's a JWK object
      privateKey = await window.crypto.subtle.importKey(
        "jwk",
        keyPair.privateKey,
        importParams,
        false,
        ["sign"]
      );
    } else {
      // It's a base64 string (pkcs8 format)
      privateKey = await window.crypto.subtle.importKey(
        "pkcs8",
        base64ToArrayBuffer(keyPair.privateKey),
        importParams,
        false,
        ["sign"]
      );
    }

    // Sign the file using algorithm-specific parameters
    const signature = await window.crypto.subtle.sign(
      algorithm === "RSA"
        ? "RSASSA-PKCS1-v1_5"
        : {
            name: "ECDSA",
            hash: { name: "SHA-256" },
          },
      privateKey,
      fileData
    );

    // Convert to base64
    const signatureArray = new Uint8Array(signature);
    const binaryString = String.fromCharCode(...signatureArray);

    return {
      signature: btoa(binaryString),
      algorithm: algorithm,
    };
  } catch (error) {
    console.error("Error signing file:", error);
    return null;
  }
};

// Helper function to convert base64 to ArrayBuffer
const base64ToArrayBuffer = (base64: string): ArrayBuffer => {
  const binary_string = atob(base64);
  const len = binary_string.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binary_string.charCodeAt(i);
  }
  return bytes.buffer;
};

// Verify a signature locally
export const verifyFileSignature = async (
  publicKeyPem: string,
  signature: string,
  fileData: ArrayBuffer,
  algorithm: string = "RSA" // Default to RSA for backward compatibility
): Promise<boolean> => {
  try {
    // Remove headers and newlines from PEM
    const base64 = publicKeyPem
      .replace("-----BEGIN PUBLIC KEY-----", "")
      .replace("-----END PUBLIC KEY-----", "")
      .replace(/\n/g, "");

    // Convert base64 to binary
    const keyBinaryString = atob(base64);
    const keyBytes = new Uint8Array(keyBinaryString.length);
    for (let i = 0; i < keyBinaryString.length; i++) {
      keyBytes[i] = keyBinaryString.charCodeAt(i);
    }

    // Convert base64 signature to binary
    const sigBinaryString = atob(signature);
    const sigBytes = new Uint8Array(sigBinaryString.length);
    for (let i = 0; i < sigBinaryString.length; i++) {
      sigBytes[i] = sigBinaryString.charCodeAt(i);
    }

    // Handle ECC verification
    if (algorithm === "ECC") {
      try {
        // Import public key for ECC verification
        const eccPublicKey = await window.crypto.subtle.importKey(
          "spki",
          keyBytes,
          {
            name: "ECDSA",
            namedCurve: "P-256",
            hash: { name: "SHA-256" },
          },
          false,
          ["verify"]
        );

        // Verify using ECDSA
        return await window.crypto.subtle.verify(
          {
            name: "ECDSA",
            hash: { name: "SHA-256" },
          },
          eccPublicKey,
          sigBytes,
          fileData
        );
      } catch (error) {
        console.error("Error in ECC verification:", error);
        return false;
      }
    } else {
      // Use existing RSA verification
      const publicKey = await window.crypto.subtle.importKey(
        "spki",
        keyBytes,
        {
          name: "RSASSA-PKCS1-v1_5",
          hash: { name: "SHA-256" },
        },
        false,
        ["verify"]
      );

      // Verify the signature
      return await window.crypto.subtle.verify(
        "RSASSA-PKCS1-v1_5",
        publicKey,
        sigBytes,
        fileData
      );
    }
  } catch (error) {
    console.error("Error verifying signature:", error);
    return false;
  }
};
