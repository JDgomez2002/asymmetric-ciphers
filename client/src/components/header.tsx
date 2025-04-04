import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import { Moon, Sun, LockKeyhole } from "lucide-react"

export function Header() {
  const { setTheme, theme } = useTheme()

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark")
  }

  return (
    <header className="border-b border-border/10 bg-card/80 backdrop-blur-sm">
      <div className="container mx-auto px-4 py-3 max-w-4xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <LockKeyhole className="h-4 w-4 text-primary mr-2" />
            <h1 className="text-base font-medium">Secure File Vault</h1>
          </div>

          <Button variant="ghost" size="icon" onClick={toggleTheme} className="h-8 w-8">
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
        </div>
      </div>
    </header>
  )
}

