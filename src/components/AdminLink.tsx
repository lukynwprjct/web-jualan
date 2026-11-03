import { useState, useEffect } from "react"
import { User, LogIn, PlusCircle } from "lucide-react"
import { Button } from "@/components/ui/button"

export function AdminLink() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [showMenu, setShowMenu] = useState(false)

  useEffect(() => {
    const storedUser = localStorage.getItem("luxky_admin")
    if (storedUser) {
      setIsLoggedIn(true)
    }
  }, [])

  if (!isLoggedIn) {
    return (
      <div className="relative">
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full"
          onClick={() => setShowMenu(!showMenu)}
        >
          <User className="h-5 w-5" />
        </Button>

        {showMenu && (
          <div className="absolute right-0 top-10 z-50 mt-2 w-48 rounded-md border border-border bg-background p-1 shadow-lg">
            <a
              href="/admin/login"
              className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
              onClick={() => setShowMenu(false)}
            >
              <LogIn className="h-4 w-4" />
              Login
            </a>
            <a
              href="/admin/register"
              className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
              onClick={() => setShowMenu(false)}
            >
              <PlusCircle className="h-4 w-4" />
              Register
            </a>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="icon"
        className="rounded-full"
        onClick={() => setShowMenu(!showMenu)}
      >
        <User className="h-5 w-5" />
      </Button>

      {showMenu && (
        <div className="absolute right-0 top-10 z-50 mt-2 w-48 rounded-md border border-border bg-background p-1 shadow-lg">
          <a
            href="/admin/dashboard"
            className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
            onClick={() => setShowMenu(false)}
          >
            Dashboard
          </a>
          <a
            href="/admin/products"
            className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
            onClick={() => setShowMenu(false)}
          >
            Products
          </a>
          <button
            onClick={() => {
              localStorage.removeItem("luxky_admin")
              setIsLoggedIn(false)
              setShowMenu(false)
            }}
            className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm font-medium hover:bg-destructive hover:text-destructive-foreground"
          >
            Logout
          </button>
        </div>
      )}
    </div>
  )
}