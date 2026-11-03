import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
})

// ============================================
// SETUP AUTH DARI LOCALSTORAGE UNTUK RLS
// ============================================
// Ini memungkinkan RLS policy pakai auth.uid() dan auth.jwt()
// meskipun kita bypass Supabase Auth untuk login

const storedEmail = localStorage.getItem('luxky_admin_email')
if (storedEmail) {
  // Simulasi session dari localStorage
  const mockSession = {
    access_token: `mock-${Date.now()}`,
    refresh_token: `mock-refresh-${Date.now()}`,
    expires_in: 3600,
    expires_at: Math.floor(Date.now() / 1000) + 3600,
    user: {
      id: 'local-user-id',
      email: storedEmail,
      role: 'STAFF', // Default role, bisa di-update via auth store
      aud: 'authenticated',
      app_metadata: {
        provider: 'email'
      },
      user_metadata: {
        email: storedEmail,
        role: 'STAFF'
      }
    }
  }

  // Set session secara manual
  supabase.auth.setSession(mockSession.access_token, mockSession.refresh_token)
    .then(({ data, error }) => {
      if (error) {
        console.log('Setup auth session from localStorage:', error.message)
      } else {
        console.log('✅ Auth session loaded from localStorage for RLS')
        // Update role user
        supabase.auth.updateUser({ data: { role: 'STAFF' } })
          .then(({ data: { user }, error: userError }) => {
            if (userError) {
              console.log('Update user role:', userError.message)
            } else if (user) {
              console.log('✅ User role set to:', user.user_metadata?.role || 'STAFF')
            }
          })
      }
    })
}
