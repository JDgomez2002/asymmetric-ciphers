import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, Trash2 } from "lucide-react";

interface FileInfoModalProps {
  file: file | null;
  isOpen: boolean;
  onClose: () => void;
  onDelete: () => void;
  onDownload: () => void;
}

export function FileInfoModal({
  file,
  isOpen,
  onClose,
  onDelete,
  onDownload,
}: FileInfoModalProps) {
  if (!file) return null;

  const formatSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return (
      Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>File Information</DialogTitle>
        </DialogHeader>

        <div className="py-4">
          <h3 className="font-medium mb-4 truncate">{file.name}</h3>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Size:</span>
              <span>{formatSize(file.size)}</span>
            </div>

            <div className="flex justify-between">
              <span className="text-muted-foreground">Uploaded:</span>
              <span>{new Date(file.createdAt).toLocaleDateString()}</span>
            </div>

            <div className="flex justify-between">
              <span className="text-muted-foreground">Type:</span>
              <span>{file.contentType?.split("/")[1] || file.contentType}</span>
            </div>

            <div className="flex justify-between">
              <span className="text-muted-foreground">Signed:</span>
              <span>{file.signature ? "Yes" : "No"}</span>
            </div>
          </div>
        </div>

        <DialogFooter className="flex gap-2">
          <Button onClick={onDownload} className="flex-1">
            <Download className="mr-2 h-4 w-4" /> Download
          </Button>
          <Button variant="destructive" onClick={onDelete} className="flex-1">
            <Trash2 className="mr-2 h-4 w-4" /> Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
