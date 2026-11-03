import { useState, useEffect } from 'react'
import { Moon, Sun, ShoppingBag, Search, Menu, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useNavigate } from "react-router-dom"

export function MainNav() {
  const [isOpen, setIsOpen] = useState(false)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const navigate = useNavigate()

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`)
      setIsSearchOpen(false)
      setSearchQuery('')
    }
  }

  // Close search when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element
      if (!target.closest('form')) {
        setIsSearchOpen(false)
      }
    }
    
    if (isSearchOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isSearchOpen])

  return (
    <>
      {/* Desktop Nav */}
      <nav className="hidden md:flex items-center gap-6">
        <a href="/" className="text-sm font-medium hover:text-primary transition-colors">
          Home
        </a>
        <a href="/products" className="text-sm font-medium hover:text-primary transition-colors">
          Products
        </a>
        <a href="/categories" className="text-sm font-medium hover:text-primary transition-colors">
          Categories
        </a>
        <a href="/about" className="text-sm font-medium hover:text-primary transition-colors">
          About
        </a>
        <a href="/contact" className="text-sm font-medium hover:text-primary transition-colors">
          Contact
        </a>
        <form onSubmit={handleSearch} className="relative">
          <Button 
            variant="ghost" 
            size="icon" 
            className="rounded-full"
            type="button"
            onClick={() => setIsSearchOpen(!isSearchOpen)}
          >
            <Search className="h-5 w-5" />
          </Button>
          {isSearchOpen && (
            <div className="absolute right-0 top-10 w-64 bg-background border rounded-md p-2 shadow-lg z-50">
              <input 
                type="text" 
                placeholder="Search products..." 
                className="w-full px-3 py-2 text-sm bg-transparent border rounded focus:outline-none focus:ring-2 focus:ring-primary"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          )}
        </form>
      </nav>

      {/* Mobile Menu Button */}
      <button
        className="md:hidden p-2 rounded-md hover:bg-accent"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </button>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden absolute top-16 left-0 w-full bg-background border-b border-border p-4 space-y-2">
          <a href="/" className="block py-2 text-sm font-medium" onClick={() => setIsOpen(false)}>Home</a>
          <a href="/products" className="block py-2 text-sm font-medium" onClick={() => setIsOpen(false)}>Products</a>
          <a href="/categories" className="block py-2 text-sm font-medium" onClick={() => setIsOpen(false)}>Categories</a>
          <a href="/about" className="block py-2 text-sm font-medium" onClick={() => setIsOpen(false)}>About</a>
        </div>
      )}
    </>
  )
}