import { ReactNode, createContext, useContext, useEffect } from "react";
import {
  useCurrentUser,
  useLogin,
  useLogout,
  useSignUp,
  USER_QUERY_KEY,
} from "./queries";
import { LoginRequest, RegisterRequest, User } from "./types";
import { useQueryClient, type UseMutationResult } from "@tanstack/react-query";
import api from "../api/axios";

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: Error | null;
  login: UseMutationResult<{ jwt: string; user: User }, Error, LoginRequest>;
  logout: UseMutationResult<void, Error, void>;
  register: UseMutationResult<void, Error, RegisterRequest>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const queryClient = useQueryClient();

  const { data: user, isLoading, error, isSuccess, refetch } = useCurrentUser();

  const loginMutation = useLogin();
  const logoutMutation = useLogout();
  const registerMutation = useSignUp();

  useEffect(() => {
    console.log("[AuthProvider] Initializing.");
    const token = localStorage.getItem("token");
    if (token) {
      console.log("[AuthProvider] Token found, setting auth header.");
      api.defaults.headers.common["Authorization"] = `Bearer ${token}`;

      if (!queryClient.getQueryData([USER_QUERY_KEY])) {
        console.log("[AuthProvider] No user data found, fetching.");
        refetch();
      }
    } else {
      console.log("[AuthProvider] No token found, logging out.");
      logoutMutation.mutate();
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user: user || null,
        isAuthenticated: isSuccess && !!user,
        isLoading: isLoading || loginMutation.isPending,
        error: (error as Error | null) || (loginMutation.error as Error | null),
        login: loginMutation,
        logout: logoutMutation,
        register: registerMutation,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook
export const useAuth = () => {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
};
