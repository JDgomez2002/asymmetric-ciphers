import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { User, LoginRequest, RegisterRequest } from "./types";
import { queryClient } from "@/main";
import api from "@/lib/api/axios";

export const USER_QUERY_KEY = "user";

export const useLogin = () => {
  return useMutation({
    mutationFn: async (credentials: LoginRequest) => {
      const { data } = await api.post<{ jwt: string; user: User }>(
        "/auth/login",
        credentials
      );
      return data;
    },
    onSuccess: (data: { jwt: string; user: User }) => {
      localStorage.setItem("token", data.jwt);
      api.defaults.headers.common["Authorization"] = `Bearer ${data.jwt}`;
      queryClient.setQueryData([USER_QUERY_KEY], data.user);
    },
  });
};

export const useSignUp = () => {
  return useMutation({
    mutationFn: async (credentials: RegisterRequest) => {
      await api.post("/auth/register", credentials);
    },
  });
};

export const useCurrentUser = () => {
  return useQuery({
    queryKey: [USER_QUERY_KEY],
    queryFn: async (): Promise<User> => {
      const token = localStorage.getItem("token");
      console.log("[useCurrentUser] Token found, fetching user.");
      try {
        const { data } = await api.get("/auth/me", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        return data.user;
      } catch (error: any) {
        console.log("[useCurrentUser] Error fetching user.", error);
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

export const useLogout = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      return Promise.resolve();
    },
    onSuccess: () => {
      localStorage.removeItem("token");
      delete api.defaults.headers.common["Authorization"];
      queryClient.resetQueries({ queryKey: [USER_QUERY_KEY] });
    },
  });
};
