"use client";

import { useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Upload, CheckCircle2, Plus } from "lucide-react";
import type { FileType } from "../../types/file";

interface FileUploadModalProps {
  encryptionKey: string;
  onFileUpload: (files: FileType[]) => void;
  triggerButton?: React.ReactNode;
}

export function FileUploadModal({
  encryptionKey,
  onFileUpload,
  triggerButton,
}: FileUploadModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadComplete, setUploadComplete] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFiles(files);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files);
    }
  };

  const handleFiles = (fileList: FileList) => {
    if (!encryptionKey) {
      alert("Please set an encryption key first");
      setIsOpen(false);
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    setUploadComplete(false);

    // Simulate upload progress
    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        const newProgress = prev + Math.random() * 10;
        if (newProgress >= 100) {
          clearInterval(interval);

          setTimeout(() => {
            setUploadComplete(true);

            setTimeout(() => {
              // Convert FileList to array of FileType objects
              const newFiles: FileType[] = Array.from(fileList).map((file) => ({
                id: Date.now() + Math.random().toString(36).substring(2, 9),
                name: file.name,
                size: file.size,
                type: file.type || "Unknown",
                date: new Date().toISOString(),
                encrypted: true,
              }));

              onFileUpload(newFiles);

              // Reset and close modal after upload completes
              setTimeout(() => {
                setIsUploading(false);
                setUploadComplete(false);
                setIsOpen(false);
              }, 1000);
            }, 500);
          }, 500);

          return 100;
        }
        return newProgress;
      });
    }, 200);
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      // Only allow closing if not currently uploading
      if (!isUploading) {
        setIsOpen(false);
      }
    } else {
      setIsOpen(true);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild onClick={() => setIsOpen(true)}>
        {triggerButton || (
          <Button size="sm" className="gap-1">
            <Plus className="h-4 w-4" /> Upload
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-4 w-4" />
            Upload Files
          </DialogTitle>
        </DialogHeader>

        <div className="py-4">
          <div
            onClick={() => fileInputRef.current?.click()}
            onDragEnter={handleDragEnter}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`
              border border-dashed rounded-md p-8 text-center cursor-pointer mb-2 transition-colors
              ${
                isDragging
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/50"
              }
              ${!encryptionKey ? "opacity-50 pointer-events-none" : ""}
            `}
          >
            <Upload className="w-8 h-8 text-primary mx-auto mb-3" />
            <p className="text-sm mb-1">Drag & drop files or click to browse</p>
            <p className="text-xs text-muted-foreground">
              Files will be encrypted with your key
            </p>
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              multiple
              onChange={handleFileInputChange}
              disabled={!encryptionKey}
            />
          </div>

          {isUploading && (
            <div className="mt-3">
              <div className="flex justify-between text-xs mb-1">
                <span>Uploading & Encrypting...</span>
                <span>{Math.round(uploadProgress)}%</span>
              </div>
              <Progress value={uploadProgress} className="h-1" />

              {uploadComplete && (
                <div className="flex items-center mt-2 text-xs text-green-500">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  <span>Upload complete</span>
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
