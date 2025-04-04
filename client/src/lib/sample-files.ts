import type { FileType } from "@/types/file";

export const sampleFiles: FileType[] = [
  {
    id: "file1",
    name: "Financial Report Q2 2023.pdf",
    size: 2456789,
    type: "application/pdf",
    date: "2023-05-15T10:30:00Z",
    encrypted: true,
  },
  {
    id: "file2",
    name: "Vacation Photos Collection.zip",
    size: 12546789,
    type: "application/zip",
    date: "2023-06-20T14:45:00Z",
    encrypted: true,
  },
  {
    id: "file3",
    name: "Project Proposal Draft.docx",
    size: 456789,
    type: "application/docx",
    date: "2023-07-01T09:15:00Z",
    encrypted: true,
  },
  {
    id: "file4",
    name: "Team Meeting Notes.txt",
    size: 12345,
    type: "text/plain",
    date: "2023-07-05T15:30:00Z",
    encrypted: true,
  },
  {
    id: "file5",
    name: "Product Presentation.pptx",
    size: 3456789,
    type: "application/pptx",
    date: "2023-07-10T11:20:00Z",
    encrypted: true,
  },
];
