import { create } from 'zustand'
import { supabase } from './supabase'

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

    // ✅ FIX RACE: pastikan session benar-benar tersimpan & terbaca
    // sebelum state dianggap "login" (navigate lebih aman setelah ini).
    const { data: { session } } = await supabase.auth.getSession()
    const finalUser = session?.user ?? data.user

    set({ user: finalUser, isLoading: false })
    return { error: null, user: finalUser }
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

// ✅ FIX UTAMA: Listener auth dipasang SATU KALI di modul (bukan per-komponen).
// Dulu listener hanya hidup saat ProtectedRoute ter-mount — di halaman login
// tidak ada listener sama sekali, dan saat ProtectedRoute baru mount setelah
// login, event INITIAL_SESSION datang async; kalau pembacaan session/refresh
// gagal sementara (jaringan HP lambat), event-nya membawa session=null dan
// MENGHAPUS user yang barusan login -> ProtectedRoute mengira belum login
// -> loading/balik ke login (harus refresh manual).
let authListenerStarted = false

export function startAuthListener() {
  if (authListenerStarted) return
  authListenerStarted = true

  // 1) Ambil session tersimpan saat app pertama dibuka
  supabase.auth.getSession()
    .then(({ data: { session } }) => {
      useAuthStore.setState({ user: session?.user ?? null, isLoading: false })
    })
    .catch(() => {
      // Error network saat init: jangan biarkan loading selamanya
      useAuthStore.setState({ user: null, isLoading: false })
    })

  // 2) Dengarkan semua perubahan auth
  supabase.auth.onAuthStateChange((event, session) => {
    const currentUser = useAuthStore.getState().user

    switch (event) {
      case 'SIGNED_OUT':
        // Hanya SIGNED_OUT eksplisit yang mengosongkan user
        useAuthStore.setState({ user: null, isLoading: false })
        break

      case 'INITIAL_SESSION':
        // JANGAN timpa user yang sudah ada dengan null (race saat jaringan lambat).
        // Session valid -> sinkronkan; session null -> biarkan user seadanya.
        if (session?.user) {
          useAuthStore.setState({ user: session.user, isLoading: false })
        } else if (!currentUser) {
          // Benar-benar belum login sejak awal
          useAuthStore.setState({ user: null, isLoading: false })
        }
        break

      case 'SIGNED_IN':
      case 'TOKEN_REFRESHED':
      case 'USER_UPDATED':
        if (session?.user) {
          useAuthStore.setState({ user: session.user, isLoading: false })
        }
        break

      default:
        // Event lain: hanya sinkron jika membawa session valid
        if (session?.user) {
          useAuthStore.setState({ user: session.user, isLoading: false })
        }
    }
  })
}

// Hook kompatibilitas untuk pemakaian lama (sekarang listener-nya global)
export function useAuth() {
  startAuthListener()
  const { user, isLoading } = useAuthStore()
  return { user, isLoading }
}
