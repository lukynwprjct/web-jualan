import { create } from 'zustand'
import { supabase } from './supabase'
import { useEffect } from 'react'

interface UserState {
  user: any | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<{ error: any; user: any }>
  register: (email: string, password: string, full_name: string) => Promise<{ error: any; user: any }>
  logout: () => Promise<void>
  getUser: () => Promise<void>
  updateRole: (role: string) => void
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
      return { error, user: null }
    }
    
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
    
    set({ user: data.user, isLoading: false })
    return { error: null, user: data.user }
  },

  logout: async () => {
    await supabase.auth.signOut()
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

// Auto-fetch user dari Supabase auth — panggil ini di root App
export function useAuth() {
  const { user, isLoading } = useAuthStore()

  useEffect(() => {
    // 1. Langsung cek session aktif saat mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        useAuthStore.setState({ user: session.user, isLoading: false })
      } else {
        useAuthStore.setState({ user: null, isLoading: false })
      }
    })

    // 2. Subscribe perubahan auth (login/logout/refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        useAuthStore.setState({ user: session.user, isLoading: false })
      } else {
        useAuthStore.setState({ user: null, isLoading: false })
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  return { user, isLoading }
}
