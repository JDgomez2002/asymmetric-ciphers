import { useAuth } from "@/lib/auth/auth-provider";
import { Navigate, Outlet, useLocation } from "react-router";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Button } from "./ui/button";

export const ProtectedLayout = () => {
  const { user, error, isLoading, logout } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="bg-slate-950 min-h-screen flex items-center justify-center">
        <div className="animate-pulse">Loading...</div>
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
      <header className="p-4 flex justify-between items-center">
        <h1 className="text-xl font-bold"> </h1>

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
      </header>
      <main className="flex-1 p-4">
        <Outlet />
      </main>
    </div>
  );
};
