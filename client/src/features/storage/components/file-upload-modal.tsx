import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import api from "@/lib/api/axios";
import { Loader2, Plus, Upload } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useDropzone } from "react-dropzone";
import { toast } from "sonner";
import { queryClient } from "@/main";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { KEYUTIL, KJUR } from "jsrsasign";

// --- Helper functions for encryption (Should ideally be in a separate utils file) ---

const arrayBufferToBase64 = (buffer: ArrayBuffer): string => {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
};

const base64ToArrayBuffer = (base64: string): ArrayBuffer => {
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
const encryptFileWithLocalKey = async (
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
const generateFileHash = async (fileContent: ArrayBuffer): Promise<string> => {
  try {
    // Generate SHA-256 hash of the file content
    const hashBuffer = await window.crypto.subtle.digest(
      "SHA-256",
      fileContent
    );

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
const signHash = async (hash: string, private_key: string): Promise<string> => {
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

// --- Component Code ---

interface FileUploadModalProps {
  triggerButton?: React.ReactNode;
}

export function FileUploadModal({ triggerButton }: FileUploadModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [sign, setSign] = useState<boolean>(false);

  const handleFiles = useCallback(
    async (acceptedFiles: File[]) => {
      const encryptionKey = localStorage.getItem("symmetric-key");
      const { privateKey, algorithm } = JSON.parse(
        localStorage.getItem("private-key") ?? "{}"
      );

      if (!encryptionKey) {
        toast.error("Please generate or provide an encryption key first.");
        setIsOpen(false);
        return;
      }

      if (sign && !privateKey) {
        toast.error("Private key not found. Cannot sign the file.");
        return;
      }

      if (!acceptedFiles || acceptedFiles.length === 0) {
        return;
      }

      // For now, let's just handle the first file
      const file = acceptedFiles[0];
      if (!file) return;

      setIsUploading(true);

      try {
        // 1. Encrypt the file
        const encryptedResult = await encryptFileWithLocalKey(file);

        if (!encryptedResult) {
          // Encryption failed, error handled within the function
          setIsUploading(false);
          return;
        }

        let fileHash = "";
        let signature = "";

        // Only perform signing if the sign flag is true
        if (sign) {
          // Read file content for hashing
          const fileBuffer = await file.arrayBuffer();

          // Generate a hash of the original file content
          fileHash = await generateFileHash(fileBuffer);

          // Use ECC specific signing with jsrsasign if the algorithm is ECC
          if (algorithm === "ECC") {
            try {
              // 1. Format the base64 PKCS8 key into PEM format
              const pemHeader = "-----BEGIN PRIVATE KEY-----";
              const pemFooter = "-----END PRIVATE KEY-----";
              // Ensure proper 64-char line wrapping for PEM standard
              const pemBody = privateKey.match(/.{1,64}/g)?.join("\n") || "";
              const pemFormattedPrivateKey = `${pemHeader}\n${pemBody}\n${pemFooter}`;

              console.log("PEM formatted private key:", pemFormattedPrivateKey);

              // 2. Load the private key using KEYUTIL from the PEM string
              //    No format hint needed, KEYUTIL auto-detects PEM.
              const prvKey = KEYUTIL.getKey(pemFormattedPrivateKey);

              if (!prvKey) {
                throw new Error(
                  "Failed to load ECC private key from PEM using KEYUTIL."
                );
              }

              // 3. Create a signature instance
              const sig = new KJUR.crypto.Signature({ alg: "SHA256withECDSA" });

              // 4. Initialize for signing
              sig.init(prvKey);

              // 5. Convert base64 hash to Hex
              const hashBytes = base64ToArrayBuffer(fileHash);
              let hashHex = "";
              const hashUint8Array = new Uint8Array(hashBytes);
              for (let i = 0; i < hashUint8Array.length; i++) {
                hashHex += ("0" + hashUint8Array[i].toString(16)).slice(-2);
              }

              // 6. Update with hash hex
              sig.updateHex(hashHex);

              // 7. Sign (DER format hex)
              const sigHex = sig.sign();

              // 8. Convert hex DER signature to base64
              const sigBytes = [];
              for (let i = 0; i < sigHex.length; i += 2) {
                sigBytes.push(parseInt(sigHex.substring(i, i + 2), 16));
              }
              signature = arrayBufferToBase64(Uint8Array.from(sigBytes).buffer);

              console.log("ECC Signature (DER, Base64):", signature);
            } catch (error) {
              console.error("Error using jsrsasign ECC signing:", error);
              toast.error(
                "Failed to sign with ECC using jsrsasign. See console."
              );
              signature = "";
            }
          } else {
            // Regular RSA signing
            signature = await signHash(fileHash, privateKey);
            console.log("RSA Signature (Base64):", signature);
          }
        }

        // 2. Prepare the payload for the server
        const payload = {
          name: file.name,
          encrypted_content: encryptedResult.encryptedData,
          iv: encryptedResult.iv,
          hash: fileHash,
          signature: signature,
          algorithm: sign ? algorithm : "",
          contentType: file.type || "application/octet-stream",
          size: file.size,
        };

        // 3. Send the data to the server
        const response = await api.post("/files/upload", payload);

        if (response.status !== 200) {
          throw new Error(
            `Upload failed: ${response.status} ${response.statusText}`
          );
        }

        // 4. Handle success
        const responseData = response.data;
        console.log("Upload successful:", responseData);
        toast.success(`${file.name} uploaded and encrypted successfully!`);
        setIsOpen(false);
        // invalidate the files query to refresh the file list
        await queryClient.invalidateQueries({ queryKey: ["files"] });
      } catch (error) {
        console.error("Upload process error:", error);
        toast.error(
          `Upload failed: ${
            error instanceof Error ? error.message : String(error)
          }`
        );
      } finally {
        setIsUploading(false);
      }
    },
    [sign]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: handleFiles,
    multiple: false,
    disabled: isUploading,
  });

  const handleOpenChange = (open: boolean) => {
    if (!open && isUploading) {
      return;
    }
    setIsOpen(open);
  };

  const hasEncryptionKey = !!localStorage.getItem("symmetric-key");

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild onClick={() => setIsOpen(true)}>
        {triggerButton || (
          <Button size="sm" className="gap-1">
            <Plus className="h-4 w-4" /> Upload
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md dark:bg-card">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 mb-2">
            <Upload className="h-4 w-4" />
            Upload File
          </DialogTitle>
        </DialogHeader>

        <div className="py-4">
          <div
            {...getRootProps()}
            className={`
              border border-dashed rounded-md p-8 text-center cursor-pointer mb-2 transition-colors relative
              ${
                isDragActive
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/50"
              }
              ${
                !hasEncryptionKey || isUploading
                  ? "opacity-50 pointer-events-none"
                  : ""
              }
            `}
          >
            <input {...getInputProps()} />
            {isUploading && (
              <div className="absolute inset-0 bg-background/80 flex flex-col items-center justify-center z-10 rounded-md">
                <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
                <p className="text-sm text-muted-foreground">
                  Encrypting & Uploading...
                </p>
              </div>
            )}
            <Upload className="w-8 h-8 text-primary mx-auto mb-3" />
            <p className="text-sm mb-1">
              Drag & drop a file or click to browse
            </p>
            <p className="text-xs text-muted-foreground">
              {hasEncryptionKey
                ? "File will be encrypted with your key"
                : "Please generate an encryption key first"}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Switch
            id="sign-file"
            onCheckedChange={(value) => setSign(value)}
            defaultChecked={sign}
          />
          <Label>Sign file</Label>
        </div>
      </DialogContent>
    </Dialog>
  );
}
