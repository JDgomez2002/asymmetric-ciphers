import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { createBrowserRouter, RouterProvider } from "react-router";
import LoginPage from "@/features/auth/login";
import RegisterPage from "@/features/auth/register";
import FileManager from "@/features/storage";
import { ThemeProvider } from "@/components/ui/theme-provider";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/lib/auth/auth-provider";
import { MainLayout } from "./layouts/main-layout";
import { Toaster } from "sonner";

const router = createBrowserRouter([
  {
    path: "/",
    element: <LoginPage />,
  },
  {
    path: "/register",
    element: <RegisterPage />,
  },
  {
    errorElement: <div>Error</div>,
    path: "/drive",
    element: <MainLayout />,
    children: [
      {
        path: "",
        element: <FileManager />,
      },
    ],
  },
  {
    path: "*",
    element: <div>Not Found</div>,
  },
]);

export const queryClient = new QueryClient();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider defaultTheme="dark">
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <RouterProvider router={router} />
          <Toaster />
        </AuthProvider>
      </QueryClientProvider>
    </ThemeProvider>
  </StrictMode>
);
