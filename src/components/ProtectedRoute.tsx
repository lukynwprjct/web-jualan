import { Navigate } from 'react-router-dom'
import { useAuthStore, useAuth } from '@/lib/auth'
import { Loader2 } from 'lucide-react'

interface ProtectedRouteProps {
  children: React.ReactNode
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, isLoading } = useAuthStore()
  // ✅ FIX: listener auth sekarang global (startAuthListener), aman dipanggil di sini
  // tanpa efek samping subscribe berulang. Sebelumnya hook ini memasang listener baru
  // setiap ProtectedRoute mount -> event INITIAL_SESSION datang terlambat dan
  // bisa menimpa user yang baru login (race -> loading terus / balik ke login).
  useAuth()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-foreground/60">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/admin/login" replace />
  }

  return <>{children}</>
}
