import { FileUploadModal } from "@/features/storage/components/file-upload-modal";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { sampleFiles } from "@/lib/sample-files";
import { Download, File, MoreVertical, Upload } from "lucide-react";
import { FileInfoModal } from "@/features/storage/components/file-info-modal";
import { useState } from "react";

type FileType = {
  id: string;
  name: string;
  size: number;
  type: string;
};

export function FileList() {
  const [selectedFile, setSelectedFile] = useState<FileType | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const formatSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return (
      Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
    );
  };

  const getFileType = (type: string) => {
    if (!type) return "Unknown";
    if (type.includes("/")) {
      return type.split("/")[1].toUpperCase();
    }
    return type;
  };

  const files = sampleFiles;

  const onSortFiles = (value: string) => {
    console.log(value);
  };

  const handleFileDelete = () => {
    console.log("File deleted");
  };

  const handleFileDownload = (file: FileType) => {
    console.log(file);
  };

  const onFileInfo = (file: FileType) => {
    setSelectedFile(file);
    setIsModalOpen(true);
  };

  return (
    <>
      <FileInfoModal
        file={selectedFile}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onDelete={handleFileDelete}
        onDownload={() => selectedFile && handleFileDownload(selectedFile)}
      />
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Files</CardTitle>
          <CardDescription>Encrypted and stored on the server.</CardDescription>
          <CardAction>
            <div className="flex items-center gap-2">
              <FileUploadModal
                triggerButton={
                  <Button
                    size="icon"
                    variant="outline"
                    className="gap-1 cursor-pointer"
                  >
                    <Upload  className="size-3" />
                  </Button>
                }
              />
              <Select onValueChange={onSortFiles} defaultValue="date-new">
                <SelectTrigger className="w-[130px] h-8 text-xs">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name-asc">Name (A-Z)</SelectItem>
                  <SelectItem value="name-desc">Name (Z-A)</SelectItem>
                  <SelectItem value="date-new">Newest</SelectItem>
                  <SelectItem value="date-old">Oldest</SelectItem>
                  <SelectItem value="size-large">Size (Large)</SelectItem>
                  <SelectItem value="size-small">Size (Small)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardAction>
        </CardHeader>
        <CardContent className="p-0 rounded-lg">
          <div className="flex items-center gap-2"></div>
          {files.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground text-sm">
                No files yet. Upload some files to get started.
              </p>
            </div>
          ) : (
            <div>
              {/* Table header */}
              <div className="grid grid-cols-12 text-xs pb-2 font-medium text-muted-foreground px-6">
                <div className="col-span-7">Name</div>
                <div className="col-span-2">Size</div>
                <div className="col-span-2">Type</div>
                <div className="col-span-1"></div>
              </div>

              {/* Table rows */}
              <div>
                {files.map((file, index) => (
                  <div
                    key={file.id}
                    className={`grid grid-cols-12 py-2.5 px-6 cursor-pointer  border-t  group hover:bg-secondary/50 ${
                      index === files.length - 1 ? "border-b" : ""
                    }`}
                  >
                    <div className="col-span-7 flex items-center">
                      <div className="mr-2 flex-shrink-0">
                        <File className="size-4" />
                      </div>
                      <div className="truncate text-sm">{file.name}</div>
                    </div>

                    <div className="col-span-2 text-xs text-muted-foreground self-center">
                      {formatSize(file.size)}
                    </div>

                    <div className="col-span-2 text-xs text-muted-foreground self-center truncate">
                      {getFileType(file.type)}
                    </div>

                    <div className="col-span-1 flex items-center justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleFileDownload(file)}
                        className="h-6 w-6"
                      >
                        <Download className="h-3 w-3" />
                      </Button>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                          >
                            <MoreVertical className="h-3 w-3" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => onFileInfo(file)}>
                            File Info
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleFileDownload(file)}
                          >
                            Download
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}
