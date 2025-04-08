export interface File {
    id: string;
    name: string;
    hash: string;
    // Keep as text but store base64 encoded data
    content: string;
    signature: string;
    userId: string;
    size: number;
    contentType: string;
    createdAt: string;
}
