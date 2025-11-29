"use client"
import { LogOut, Moon, Sun } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select"
import { Button } from "@/app/components/ui/button"
import { useAuth } from "@/app/contexts/AuthContext"
import { useTheme } from "@/app/components/ThemeProvider"

interface NavbarProps {
  displayCurrency: "THB" | "USD"
  setDisplayCurrency: (currency: "THB" | "USD") => void
  isAdmin?: boolean
}

export function Navbar({ displayCurrency, setDisplayCurrency, isAdmin = false }: NavbarProps) {
  const { logout, user } = useAuth()
  const { theme, toggleTheme, mounted } = useTheme()

  return (
    <header className="border-b border-border bg-card/80 backdrop-blur-md sticky top-0 z-50 shadow-sm">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="relative w-12 h-12 flex items-center justify-center overflow-hidden rounded-xl shadow-2xl shadow-amber-500/20 animate-float bg-gradient-to-br from-amber-400 to-yellow-600">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M6 3h12l4 6-10 13L2 9l4-6z" />
              <path d="M11 3 8 9l4 13 4-13-3-6z" />
            </svg>
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-amber-500 to-yellow-600 bg-clip-text text-transparent">
              {isAdmin ? "Admin Control Panel" : "Gold Trading System"}
            </h1>
            {!isAdmin && user && <p className="text-xs sm:text-sm text-muted-foreground">ยินดีต้อนรับ, {user.username}</p>}
          </div>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          {!isAdmin && (
            <Select value={displayCurrency} onValueChange={(value: "THB" | "USD") => setDisplayCurrency(value)}>
              <SelectTrigger className="w-[80px] sm:w-[100px] border-primary/20 hover:border-primary transition-colors text-xs sm:text-sm">
                <SelectValue placeholder="Currency" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="THB">฿ THB</SelectItem>
                <SelectItem value="USD">$ USD</SelectItem>
              </SelectContent>
            </Select>
          )}
          {mounted && (
            <Button
              onClick={toggleTheme}
              variant="outline"
              size="icon"
              className="border-primary/20 hover:border-primary hover:bg-primary/10 transition-all bg-transparent h-8 w-8 sm:h-10 sm:w-10"
            >
              {theme === "dark" ? (
                <Sun className="h-4 w-4 sm:h-5 sm:w-5 text-amber-500" />
              ) : (
                <Moon className="h-4 w-4 sm:h-5 sm:w-5 text-slate-700" />
              )}
            </Button>
          )}
          <Button
            onClick={logout}
            variant="outline"
            size="sm"
            className="border-destructive/20 hover:border-destructive hover:bg-destructive/10 hover:text-destructive transition-all bg-transparent h-8 sm:h-9 px-2 sm:px-4 text-xs sm:text-sm"
          >
            <LogOut className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">ออกจากระบบ</span>
            <span className="inline sm:hidden">ออก</span>
          </Button>
        </div>
      </div>
    </header>
  )
}
