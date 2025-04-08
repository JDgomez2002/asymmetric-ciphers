import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { File } from "./types";
import api from "@/lib/api/axios";

export const USER_QUERY_KEY = "user";

export const useUploadFile = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ name, content, hash, signature, contentType, size }: { name: string, content: string , hash: string, signature: string, contentType: string, size: number}) => {
            try {
                const token = localStorage.getItem("token");
                const { data: { file } } = await api.post("/files/upload", {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                    data: { name, content, hash, signature, contentType, size }
                });
                console.log("file uploaded:", file);
                return file;
            } catch (e: any) {
                console.log("[useUploadFile] Error uploading file.", e);
                if (e?.response?.status === 401) {
                    localStorage.removeItem("token");
                    throw new Error("Token expired");
                }
                throw e;
            }
        },
        onSuccess: () => {
            queryClient.resetQueries({ queryKey: ["files"] });
        }
    });
};

export const useFiles = () => {
    return useQuery({
        queryKey: ["files"],
        queryFn: async (): Promise<File[]> => {
            try {
                const token = localStorage.getItem("token");
                const { data: { files } } = await api.get("/files", {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });
                return files;
            } catch (error: any) {
                console.log("[useFiles] Error fetching files.", error);
                if (error?.response?.status === 401) {
                    localStorage.removeItem("token");
                    throw new Error("Token expired");
                }
                throw error;
            }
        },
        retry: false,
        staleTime: 5 * 60 * 1000,
        refetchOnWindowFocus: false,
        refetchOnMount: false,
        enabled: !!localStorage.getItem("token"),
    });
};
