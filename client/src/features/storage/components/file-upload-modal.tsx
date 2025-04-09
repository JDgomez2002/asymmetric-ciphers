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
import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { toast } from "sonner";
import { queryClient } from "@/main";

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

// --- Component Code ---

interface FileUploadModalProps {
  triggerButton?: React.ReactNode;
}

export function FileUploadModal({ triggerButton }: FileUploadModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const handleFiles = useCallback(async (acceptedFiles: File[]) => {
    const encryptionKey = localStorage.getItem("symmetric-key");
    if (!encryptionKey) {
      toast.error("Please generate or provide an encryption key first.");
      setIsOpen(false);
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

      // 2. Prepare the payload for the server
      const payload = {
        name: file.name,
        encrypted_content: encryptedResult.encryptedData,
        iv: encryptedResult.iv,
        hash: "TODO_generate_hash", // Placeholder - implement actual hash generation later
        signature: "TODO_generate_signature", // Placeholder - implement actual signature generation later
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
  }, []);

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
          <DialogTitle className="flex items-center gap-2">
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
      </DialogContent>
    </Dialog>
  );
}
