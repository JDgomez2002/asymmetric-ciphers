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
import {
  Download,
  File as FileIcon,
  MoreVertical,
  Upload,
  PenLine,
  CheckCheck,
} from "lucide-react";
import { FileInfoModal } from "@/features/storage/components/file-info-modal";
import { useEffect, useState } from "react";
import { useFiles } from "@/lib/files/queries";
import { toast } from "sonner";
import api from "@/lib/api/axios";
import VerifyFileModal from "@/features/storage/components/verify-file-modal";

export function FileList() {
  const [selectedFile, setSelectedFile] = useState<file | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [verifyFileModal, setVerifyFileModal] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<string>("date-new");

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
      console.log("type:", type);
      return type.split("/")[1].toUpperCase();
    }
    return type;
  };

  const { data: files, isLoading: filesLoading } = useFiles();

  useEffect(() => {
    console.log("files:", files);
  }, [files]);

  const onSortFiles = (value: string) => {
    setSortBy(value);
  };

  const handleFileDelete = () => {
    console.log("file deleted");
  };

  const handleFileDownload = async (file: file) => {
    const response = await api.get(`/files/${file.id}/download`, {
      responseType: "blob",
    });

    // Create blob URL and trigger download
    const blob = new Blob([response.data]);
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `${file.name}.zip`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  };

  const onFileInfo = (file: file) => {
    setSelectedFile(file);
    setIsModalOpen(true);
  };

  if (filesLoading || !files) {
    return <div className="flex items-center justify-center h-full" />;
  }

  const sortFiles = (files: file[]) => {
    return [...files].sort((a, b) => {
      switch (sortBy) {
        case "name-asc":
          return a.name.localeCompare(b.name);
        case "name-desc":
          return b.name.localeCompare(a.name);
        case "date-new":
          return (
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
        case "date-old":
          return (
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          );
        case "size-large":
          return b.size - a.size;
        case "size-small":
          return a.size - b.size;
        default:
          return 0;
      }
    });
  };

  return (
    <div className="flex flex-col gap-4">
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
                    <Upload className="size-3" />
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
                {sortFiles(files).map((file, i) => (
                  <div
                    key={i}
                    className={`grid grid-cols-12 py-2.5 px-6 cursor-pointer  border-t  group hover:bg-secondary/50 ${
                      i === files.length - 1 ? "border-b" : ""
                    }`}
                  >
                    <div className="col-span-7 flex items-center">
                      <div className="mr-2 flex-shrink-0">
                        <FileIcon className="size-4" />
                      </div>
                      <div className="truncate text-sm">{file.name}</div>
                    </div>

                    <div className="col-span-2 text-xs text-muted-foreground self-center">
                      {formatSize(file.size)}
                    </div>

                    <div className="col-span-2 text-xs text-muted-foreground self-center truncate">
                      {getFileType(file?.contentType ?? "")}
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
                            Details
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={
                              file.hash
                                ? () => setVerifyFileModal(true)
                                : () =>
                                    toast.info(
                                      "File cannot be verified becasue it wasn't signed"
                                    )
                            }
                          >
                            Verify
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

      <VerifyFileModal open={verifyFileModal} setOpen={setVerifyFileModal} />
    </div>
  );
}

export default FileList;
