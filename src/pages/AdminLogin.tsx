import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { useAuthStore } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import BlackHoleBackground from '@/components/BlackHoleBackground'
import { Eye, EyeOff, Loader2 } from 'lucide-react'

export default function AdminLogin() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const navigate = useNavigate()
  const { login } = useAuthStore()

  useEffect(() => {
    // Auto-focus email field
    const emailInput = document.getElementById('email')
    if (emailInput) {
      emailInput.focus()
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      const { error } = await login(email, password)
      
      if (error) {
        setError(error.message || 'Login failed')
        return
      }
      
      navigate('/admin/dashboard')
    } catch (err) {
      setError('An error occurred during login')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative">
      {/* Black Hole Background */}
      <BlackHoleBackground speed={0.2} />

      {/* Login Card with Glassmorphism */}
      <Card className="w-full max-w-md relative z-10 backdrop-blur-md bg-black/40 border-white/10 shadow-2xl shadow-red-900/20 animate-fade-in-up">
        <CardHeader className="space-y-1">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-red-200">
              LUXKY STORE
            </h1>
            <p className="text-sm text-foreground/60 mt-2">
              Admin Access
            </p>
          </div>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-foreground/80">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@luxky.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
                className="bg-white/5 border-white/10 text-foreground placeholder:text-foreground/40 focus:border-red-500 focus:ring-red-500/20"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password" className="text-foreground/80">
                Password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                  className="bg-white/5 border-white/10 text-foreground placeholder:text-foreground/40 focus:border-red-500 focus:ring-red-500/20 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/50 hover:text-foreground transition-colors"
                  disabled={isLoading}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
            
            {error && (
              <div className="p-3 rounded-md bg-red-500/10 border border-red-500/20">
                <p className="text-sm text-red-400">{error}</p>
              </div>
            )}
            
            <Button 
              type="submit" 
              className="w-full bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 border-none"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                'Login'
              )}
            </Button>
            
            <p className="text-center text-sm text-foreground/60 mt-4">
              Don't have an account?{' '}
              <a href="/admin/register" className="text-red-400 hover:text-red-300 hover:underline transition-colors">
                Register
              </a>
            </p>
          </form>
        </CardContent>
      </Card>

      {/* Custom animation styles */}
      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in-up {
          animation: fadeInUp 0.5s ease-out forwards;
        }
      `}</style>
    </div>
  )
}
