"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Upload, CheckCircle2 } from "lucide-react"
import type { FileType } from "@/types/file"

interface FileUploadSectionProps {
  encryptionKey: string
  onFileUpload: (files: FileType[]) => void
}

export function FileUploadSection({ encryptionKey, onFileUpload }: FileUploadSectionProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadComplete, setUploadComplete] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    const files = e.dataTransfer.files
    if (files.length > 0) {
      handleFiles(files)
    }
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files)
    }
  }

  const handleFiles = (fileList: FileList) => {
    if (!encryptionKey) {
      alert("Please set an encryption key first")
      return
    }

    setIsUploading(true)
    setUploadProgress(0)
    setUploadComplete(false)

    // Simulate upload progress
    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        const newProgress = prev + Math.random() * 10
        if (newProgress >= 100) {
          clearInterval(interval)

          setTimeout(() => {
            setUploadComplete(true)

            setTimeout(() => {
              setIsUploading(false)
              setUploadComplete(false)

              // Convert FileList to array of FileType objects
              const newFiles: FileType[] = Array.from(fileList).map((file) => ({
                id: Date.now() + Math.random().toString(36).substring(2, 9),
                name: file.name,
                size: file.size,
                type: file.type || "Unknown",
                date: new Date().toISOString(),
                encrypted: true,
              }))

              onFileUpload(newFiles)
            }, 1500)
          }, 500)

          return 100
        }
        return newProgress
      })
    }, 200)
  }

  return (
    <Card className="shadow-sm">
      <CardContent className="p-4">
        <div className="flex items-center mb-3">
          <Upload className="h-4 w-4 text-primary mr-2" />
          <h2 className="text-base font-medium">Upload Files</h2>
        </div>

        <div
          onClick={() => fileInputRef.current?.click()}
          onDragEnter={handleDragEnter}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`
            border border-dashed rounded-md p-4 text-center cursor-pointer mb-2 transition-colors
            ${isDragging ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"}
            ${!encryptionKey ? "opacity-50 pointer-events-none" : ""}
          `}
        >
          <Upload className="w-5 h-5 text-primary mx-auto mb-2" />
          <p className="text-sm">Drag & drop files or click to browse</p>
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
      </CardContent>
    </Card>
  )
}

