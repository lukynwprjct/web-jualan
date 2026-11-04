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

// Auto-fetch user from Supabase auth on mount (NO localStorage bypass)
import { useEffect } from 'react'
import { supabase } from './supabase'
import { useAuthStore } from './auth'

export function useAuth() {
  const { user, isLoading } = useAuthStore()
  
  useEffect(() => {
    // Get user dari Supabase auth (bukan localStorage)
    // Ini akan return null kalau belum login
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const { set } = useAuthStore.getState()
      if (session?.user) {
        set({ user: session.user, isLoading: false })
      } else {
        set({ user: null, isLoading: false })
      }
    })
    
    return () => subscription.unsubscribe()
  }, [])
  
  return { user, isLoading }
}
