import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import { Lock, Moon, Sun, Upload, FileText, Settings, LogOut, Shield } from "lucide-react"

interface SidebarProps {
  activeView: string
  onViewChange: (view: string) => void
}

export function Sidebar({ activeView, onViewChange }: SidebarProps) {
  const { setTheme, theme } = useTheme()

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark")
  }

  return (
    <div className="w-20 md:w-64 bg-card flex flex-col h-full border-r border-border/30">
      <div className="p-4 flex items-center justify-center md:justify-start">
        <Shield className="h-8 w-8 text-primary" />
        <h1 className="text-xl font-bold hidden md:block ml-2">Secure Vault</h1>
      </div>

      <div className="flex-1 py-8">
        <nav className="space-y-2 px-2">
          <Button
            variant={activeView === "files" ? "default" : "ghost"}
            className="w-full justify-start"
            onClick={() => onViewChange("files")}
          >
            <FileText className="h-5 w-5 mr-0 md:mr-2" />
            <span className="hidden md:inline">Files</span>
          </Button>

          <Button
            variant={activeView === "upload" ? "default" : "ghost"}
            className="w-full justify-start"
            onClick={() => onViewChange("upload")}
          >
            <Upload className="h-5 w-5 mr-0 md:mr-2" />
            <span className="hidden md:inline">Upload</span>
          </Button>

          <Button
            variant={activeView === "encryption" ? "default" : "ghost"}
            className="w-full justify-start"
            onClick={() => onViewChange("encryption")}
          >
            <Lock className="h-5 w-5 mr-0 md:mr-2" />
            <span className="hidden md:inline">Encryption</span>
          </Button>
        </nav>
      </div>

      <div className="p-4 border-t border-border/30 space-y-2">
        <Button variant="ghost" className="w-full justify-start" onClick={toggleTheme}>
          {theme === "dark" ? (
            <>
              <Sun className="h-5 w-5 mr-0 md:mr-2" />
              <span className="hidden md:inline">Light Mode</span>
            </>
          ) : (
            <>
              <Moon className="h-5 w-5 mr-0 md:mr-2" />
              <span className="hidden md:inline">Dark Mode</span>
            </>
          )}
        </Button>

        <Button variant="ghost" className="w-full justify-start">
          <Settings className="h-5 w-5 mr-0 md:mr-2" />
          <span className="hidden md:inline">Settings</span>
        </Button>

        <Button variant="ghost" className="w-full justify-start text-destructive">
          <LogOut className="h-5 w-5 mr-0 md:mr-2" />
          <span className="hidden md:inline">Logout</span>
        </Button>
      </div>
    </div>
  )
}

