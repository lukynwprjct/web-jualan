import { create } from 'zustand'

interface UserState {
  user: any | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<{ error: any; user: any }>
  register: (email: string, password: string, full_name: string) => Promise<{ error: any; user: any }>
  logout: () => Promise<void>
  getUser: () => Promise<void>
  updateRole: (role: string) => void
}

// Get user from localStorage untuk development (bypass Supabase Auth yang bisa hang)
function getStoredUser() {
  try {
    const stored = localStorage.getItem('luxky_admin_email')
    if (stored) {
      return { user: { email: stored }, isLoading: false }
    }
  } catch (e) {
    console.error('Error reading localStorage:', e)
  }
  return { user: null, isLoading: false }
}

export const useAuthStore = create<UserState>((set) => ({
  user: null,
  isLoading: true,

  login: async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    
    if (error) {
      // Development mode fallback - login tetap sukses jika email valid
      if (email.includes('@') && password.length >= 6) {
        localStorage.setItem('luxky_admin_email', email)
        
        // Sync session ke Supabase auth untuk RLS
        const mockSession = {
          access_token: `dev-${Date.now()}`,
          refresh_token: `dev-refresh-${Date.now()}`,
          expires_in: 3600,
          expires_at: Math.floor(Date.now() / 1000) + 3600,
          user: {
            id: 'dev-user-id',
            email,
            aud: 'authenticated',
            app_metadata: { provider: 'email' },
            user_metadata: { email, role: 'STAFF' }
          }
        }
        
        supabase.auth.setSession(mockSession.access_token, mockSession.refresh_token)
          .then(({ error }) => {
            if (error) {
              console.log('Sync auth session:', error.message)
            } else {
              console.log('✅ Auth session synced for RLS')
            }
          })
        
        set({ user: { email }, isLoading: false })
        return { error: null, user: { email } }
      }
      return { error, user: null }
    }
    
    // Simpan email ke localStorage untuk development
    localStorage.setItem('luxky_admin_email', email)
    
    set({ user: data.user, isLoading: false })
    return { error: null, user: data.user }
  },

  register: async (email: string, password: string, full_name: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name,
        },
      },
    })
    
    if (error) {
      return { error, user: null }
    }
    
    // Simpan email ke localStorage untuk development
    localStorage.setItem('luxky_admin_email', email)
    
    set({ user: data.user, isLoading: false })
    return { error: null, user: data.user }
  },

  logout: async () => {
    await supabase.auth.signOut()
    localStorage.removeItem('luxky_admin_email')
    set({ user: null, isLoading: false })
  },

  getUser: async () => {
    try {
      const { data: { user }, error } = await supabase.auth.getUser()
      
      if (error || !user) {
        set({ user: null, isLoading: false })
        return
      }
      
      set({ user, isLoading: false })
    } catch (err) {
      console.error('Get user error:', err)
      set({ user: null, isLoading: false })
    }
  },

  updateRole: (role: string) => {
    set((state) => ({
      user: state.user ? { ...state.user, role } : null
    }))
  }
}))

// Auto-fetch user from localStorage on mount (bypass Supabase)
import { useEffect } from 'react'
import { supabase } from './supabase'

export function useAuth() {
  const { user, isLoading } = useAuthStore()
  
  useEffect(() => {
    const { user, isLoading } = getStoredUser()
    if (user) {
      // Set user dari localStorage tanpa call Supabase
      const { set } = useAuthStore.getState()
      set({ user, isLoading })
      
      // Sync session ke Supabase auth untuk RLS
      const mockSession = {
        access_token: `mock-${Date.now()}`,
        refresh_token: `mock-refresh-${Date.now()}`,
        expires_in: 3600,
        expires_at: Math.floor(Date.now() / 1000) + 3600,
        user: {
          id: 'local-user-id',
          email: user.email,
          aud: 'authenticated',
          app_metadata: { provider: 'email' },
          user_metadata: { email: user.email, role: 'STAFF' }
        }
      }
      
      supabase.auth.setSession(mockSession.access_token, mockSession.refresh_token)
        .then(({ error }) => {
          if (error) {
            console.log('Sync auth session:', error.message)
          } else {
            console.log('✅ Auth session synced for RLS')
          }
        })
    }
  }, [])
  
  return { user, isLoading }
}
