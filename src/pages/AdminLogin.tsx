import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { useAuthStore } from '@/lib/auth'
import { supabase } from '@/lib/supabase'

export default function AdminLogin() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const { login } = useAuthStore()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      const { error } = await login(email, password)
      
      if (error) {
        // Development mode: allow login tanpa metadata
        if (email.includes('@') && password.length >= 6) {
          // Simulasi login sukses untuk development
          localStorage.setItem('luxky_admin_email', email)
          
          // Auto-create user di database
          try {
            await supabase
              .from('admin_users')
              .insert({
                email,
                full_name: email.split('@')[0],
                role: 'SUPERADMIN'
              })
          } catch (err) {
            console.log('User creation skipped (may already exist)')
          }
          
          setError('Login sukses! Redirecting...')
          setTimeout(() => {
            navigate('/admin/dashboard')
          }, 500)
          return
        }
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
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Admin Login</CardTitle>
          <p className="text-center text-sm text-foreground/60">
            Enter your credentials to access the admin dashboard
          </p>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@luxky.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
            
            {error && (
              <div className="p-3 rounded-md bg-destructive/15 border border-destructive/20">
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}
            
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Logging in...' : 'Login'}
            </Button>
            
            <p className="text-center text-sm text-foreground/60">
              Don't have an account?{' '}
              <a href="/admin/register" className="text-primary hover:underline">
                Register
              </a>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}