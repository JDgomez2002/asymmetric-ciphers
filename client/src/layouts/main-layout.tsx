import { useAuth } from "@/lib/auth/auth-provider";
import { Navigate, Outlet, useLocation } from "react-router";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Loader2, LockKeyhole, Moon, Sun } from "lucide-react";
import { useTheme } from "@/components/ui/theme-provider";

export const MainLayout = () => {
  const { user, error, isLoading, logout } = useAuth();
  const location = useLocation();
  const { setTheme, theme } = useTheme();

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  if (isLoading) {
    return (
      <div className="bg-slate-950 min-h-screen flex items-center justify-center">
        <Loader2 className="size-4 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  if (error) {
    return <h1>Error</h1>;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="p-4 flex justify-between items-center ">
        <div className="flex items-center">
          <LockKeyhole className="h-4 w-4 text-primary mr-2" />
          <h1 className="text-base font-medium">AsyDrive</h1>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" size="icon" onClick={toggleTheme}>
            {theme === "dark" ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="text-sm cursor-pointer">
                {user.username}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="min-w-32 rounded-md border p-1 "
              sideOffset={5}
            >
              <DropdownMenuItem
                className="text-sm px-2 py-1.5 rounded hover:bg-gray-100 cursor-pointer outline-none"
                onClick={() => logout.mutate()}
              >
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>
      <main className="flex-1 p-4 bg-gray-100 dark:bg-slate-950">
        <Outlet />
      </main>
    </div>
  );
};
