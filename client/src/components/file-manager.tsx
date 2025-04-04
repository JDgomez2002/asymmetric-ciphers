"use client";

import { useState, useEffect } from "react";
import { EncryptionKeySection } from "@/components/encryption-key-section";
import { FileUploadSection } from "@/components/file-upload-section";
import { FileListSection } from "@/components/file-list-section";
import { FileInfoModal } from "@/components/file-info-modal";
import type { FileType } from "@/types/file";
import { sampleFiles } from "@/lib/sample-files";
import { Header } from "@/components/header";

export function FileManager() {
  const [encryptionKey, setEncryptionKey] = useState<string>("");
  const [files, setFiles] = useState<FileType[]>([]);
  const [selectedFile, setSelectedFile] = useState<FileType | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    // Load encryption key from localStorage
    if (typeof window !== "undefined") {
      const savedKey = localStorage.getItem("secureFileVaultKey") || "";
      setEncryptionKey(savedKey);
    }

    // Load sample files for demo
    setFiles(sampleFiles);
  }, []);

  const handleKeyChange = (key: string) => {
    setEncryptionKey(key);
  };

  const handleSaveKey = () => {
    if (!encryptionKey) {
      alert("Please enter or generate a key first");
      return;
    }
    localStorage.setItem("secureFileVaultKey", encryptionKey);
    alert("Key saved to your browser storage");
  };

  const handleClearKey = () => {
    setEncryptionKey("");
  };

  const handleFileUpload = (newFiles: FileType[]) => {
    setFiles((prev) => [...prev, ...newFiles]);
  };

  const handleFileInfo = (file: FileType) => {
    setSelectedFile(file);
    setIsModalOpen(true);
  };

  const handleFileDownload = (file: FileType) => {
    if (!encryptionKey) {
      alert("Please enter your encryption key to download files");
      return;
    }

    alert(
      `Downloading ${file.name}... (In a real app, this would decrypt the file with your key)`
    );
  };

  const handleFileDelete = () => {
    if (!selectedFile) return;

    setFiles((prev) => prev.filter((file) => file.id !== selectedFile.id));
    setIsModalOpen(false);
  };

  const handleSortFiles = (sortOption: string) => {
    const sortedFiles = [...files];

    switch (sortOption) {
      case "name-asc":
        sortedFiles.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case "name-desc":
        sortedFiles.sort((a, b) => b.name.localeCompare(a.name));
        break;
      case "date-new":
        sortedFiles.sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        );
        break;
      case "date-old":
        sortedFiles.sort(
          (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
        );
        break;
      case "size-large":
        sortedFiles.sort((a, b) => b.size - a.size);
        break;
      case "size-small":
        sortedFiles.sort((a, b) => a.size - b.size);
        break;
    }

    setFiles(sortedFiles);
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header />

      <div className="container mx-auto px-4 py-6 max-w-4xl">
        <div className="space-y-6 grid">
          <EncryptionKeySection
            encryptionKey={encryptionKey}
            onKeyChange={handleKeyChange}
            onSaveKey={handleSaveKey}
            onClearKey={handleClearKey}
          />

          {/* <FileUploadSection
            encryptionKey={encryptionKey}
            onFileUpload={handleFileUpload}
          /> */}

          <FileListSection
            files={files}
            onFileInfo={handleFileInfo}
            onFileDownload={handleFileDownload}
            onFileUpload={handleFileUpload}
            encryptionKey={encryptionKey}
            onSortFiles={handleSortFiles}
          />
        </div>
      </div>

      <FileInfoModal
        file={selectedFile}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onDelete={handleFileDelete}
        onDownload={() => selectedFile && handleFileDownload(selectedFile)}
      />
    </div>
  );
}
