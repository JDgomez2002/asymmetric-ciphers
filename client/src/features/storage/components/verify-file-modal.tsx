import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import api from "@/lib/api/axios";
import { Loader2, CheckCheck, Upload } from "lucide-react";
import {SetStateAction, useCallback, Dispatch, useState} from "react";
import { useDropzone } from "react-dropzone";
import { toast } from "sonner";
import { queryClient } from "@/main";
import { Label } from "@/components/ui/label"
import {
  encryptFileWithLocalKey,
} from "@/features/storage/utils";
import { Input } from "@/components/ui/input"

interface Props {
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>> 
}

export default function VerifyFileModal({ open, setOpen }: Props) {
  const [isUploading, setIsUploading] = useState(false);

  const [signature, setSignature] = useState<string>("");
  const [publicKey, setPublicKey] = useState<string>("");

  const handleFiles = useCallback(async (acceptedFiles: File[]) => {

    if (!signature.trim()) {
      toast.error("Please provide a Signature first")
      return;
    }

    if (!publicKey.trim()) {
      toast.error("Please provide a Public Key first")
      return;
    }

    const encryptionKey = localStorage.getItem("symmetric-key");

    if (!encryptionKey) {
      toast.error("Please generate or provide an encryption key first.");
      setOpen(false);
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
        signature,
        encrypted_content: encryptedResult.encryptedData,
        public_key: publicKey,
        iv: encryptedResult.iv,
      };

      // 3. Send the data to the server
      const { status, statusText, data: { message }} = await api.post("/files/verify", payload);

      if (status !== 200) {
        throw new Error(
          `Upload failed: ${status} ${statusText}`
        );
      }

      // 4. Handle success
      toast.success(message);
      setOpen(false);
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
  }, [signature, publicKey]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: handleFiles,
    multiple: false,
    disabled: isUploading,
  });

  const handleOpenChange = (open: boolean) => {
    if (!open && isUploading) {
      return;
    }
    setOpen(open);
  };

  const hasEncryptionKey = !!localStorage.getItem("symmetric-key");

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md dark:bg-card">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 mb-2">
            <CheckCheck className="h-4 w-4" />
            Verify File
          </DialogTitle>
        </DialogHeader>

        <div className="grid w-full max-w-sm items-center gap-1.5">
          <Label htmlFor="signature">Signature</Label>
          <Input id="signature" onChange={({ target: { value: text }}) => setSignature(text)} type="text" placeholder="yrxWOr7ytlLaBfBItGIo3ZdD2aEQ35AC..." />
        </div>

        <div className="grid w-full max-w-sm items-center gap-1.5">
          <Label htmlFor="public-key">Public key</Label>
          <Input id="public-key" onChange={({ target: { value: text }}) => setPublicKey(text)} type="text" placeholder="-----BEGIN PUBLIC KEY-----MIIBIjAN..." />
        </div>

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
