import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://retpbhcztvthymtluesu.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_ncEocS-7CbRQpX8mhQac-g_NJWEoy43'

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
})

// CATATAN (2026-11-14):
// Blok "mock session" yang lama sudah DIHAPUS karena konflik dengan
// Supabase Auth asli (pakai signInWithPassword di src/lib/auth.ts).
// Mock session membuat RLS policy berbasis auth.jwt() tidak pernah cocok
// dan bisa menimpa sesi admin yang valid dengan token palsu.
// Sekarang: admin login via Supabase Auth asli -> JWT berisi email/role
// -> policy RLS (mis. auth.jwt()->>'email') bekerja dengan benar.
// Komponen yang butuh email user: pakai useAuthStore() dari src/lib/auth.ts
