import { useEffect, useState } from 'react'
import { supabase } from './supabase'

export interface BrandSetting {
  id: string
  key: string
  value: string | null
  description: string | null
  is_public: boolean
  created_at: string
  updated_at: string
}

export function useBrandSettings() {
  const [data, setData] = useState<BrandSetting[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchSettings = async () => {
    setLoading(true)
    const { data: settings, error } = await supabase
      .from('brand_settings')
      .select('*')
      .eq('is_public', true)
      .order('key', { ascending: true })

    if (error) {
      console.error('Error fetching brand settings:', error)
      setError(error)
    } else {
      setData(settings)
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchSettings()
    
    // Subscribe to changes
    const channel = supabase
      .channel('brand_settings_changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'brand_settings',
        },
        (payload) => {
          console.log('New insert:', payload)
          fetchSettings()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  return { data, loading, error, refetch: fetchSettings }
}

export function getSetting(key: string, settings?: BrandSetting[]): string | null {
  if (!settings) return null
  return settings.find(s => s.key === key)?.value
}
