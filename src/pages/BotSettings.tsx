import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { supabase } from '@/lib/supabase'
import { Loader2, Save, Bot, Percent, MessageCircle, Sparkles, Power } from 'lucide-react'

interface SettingRow {
  key: string
  value: string
  description: string | null
}

const LABELS: Record<string, string> = {
  max_discount_percent: 'Diskon Maksimal (%)',
  negotiation_enabled: 'Fitur Negosiasi',
  escalation_whatsapp: 'Nomor WA Eskalasi (62xxx)',
  bot_persona: 'Persona Bot',
  bot_enabled: 'Status Chatbot',
  welcome_message: 'Pesan Sambutan',
}

const DESCRIPTIONS: Record<string, string> = {
  max_discount_percent: 'Batas diskon yang boleh diberikan AI tanpa approval admin (misal: 10)',
  negotiation_enabled: 'true = AI boleh nego harga, false = harga fix',
  escalation_whatsapp: 'Nomor WA yang dituju saat AI mentok / customer minta manusia',
  bot_persona: 'Kepribadian & gaya bahasa bot',
  bot_enabled: 'true = chatbot aktif, false = chatbot nonaktif',
  welcome_message: 'Pesan pertama yang muncul saat chat dibuka',
}

const ORDER = [
  'bot_enabled',
  'welcome_message',
  'bot_persona',
  'max_discount_percent',
  'negotiation_enabled',
  'escalation_whatsapp',
]

export default function BotSettings() {
  const [settings, setSettings] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    fetchSettings()
  }, [])

  async function fetchSettings() {
    setLoading(true)
    const { data, error } = await supabase
      .from('bot_settings')
      .select('key, value, description')
      .order('key')

    if (error) {
      console.error('Error fetching bot settings:', error)
    } else {
      const map: Record<string, string> = {}
      for (const row of (data || []) as SettingRow[]) {
        map[row.key] = row.value
      }
      setSettings(map)
    }
    setLoading(false)
  }

  async function handleSave() {
    setSaving(true)
    setMessage('')

    try {
      // Update satu per satu (baris sudah pasti ada karena seed di SQL setup)
      for (const key of Object.keys(settings)) {
        const { error } = await supabase
          .from('bot_settings')
          .update({ value: settings[key], updated_at: new Date().toISOString() })
          .eq('key', key)

        if (error) throw error
      }
      setMessage('✅ Pengaturan tersimpan! Bot langsung pakai pengaturan baru (tanpa deploy ulang).')
    } catch (e: any) {
      console.error(e)
      setMessage('❌ Gagal menyimpan: ' + e.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-foreground/60">Memuat pengaturan bot...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 px-4 min-h-screen max-w-3xl">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Bot className="h-8 w-8" /> Bot Settings
          </h1>
          <p className="text-sm text-foreground/60 mt-1">
            Atur perilaku chatbot AI — perubahan langsung aktif di web
          </p>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          Simpan
        </Button>
      </div>

      {message && (
        <div className="mb-6 p-3 rounded-lg bg-muted text-sm">{message}</div>
      )}

      <div className="space-y-4">
        {/* Status Chatbot */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Power className="h-4 w-4" /> {LABELS.bot_enabled}
            </CardTitle>
            <p className="text-xs text-muted-foreground">{DESCRIPTIONS.bot_enabled}</p>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              {['true', 'false'].map(v => (
                <Button
                  key={v}
                  size="sm"
                  variant={settings.bot_enabled === v ? 'default' : 'outline'}
                  onClick={() => setSettings(prev => ({ ...prev, bot_enabled: v }))}
                >
                  {v === 'true' ? 'Aktif' : 'Nonaktif'}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Pesan sambutan */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Sparkles className="h-4 w-4" /> {LABELS.welcome_message}
            </CardTitle>
            <p className="text-xs text-muted-foreground">{DESCRIPTIONS.welcome_message}</p>
          </CardHeader>
          <CardContent>
            <Textarea
              value={settings.welcome_message || ''}
              onChange={e => setSettings(prev => ({ ...prev, welcome_message: e.target.value }))}
              placeholder="Hai! Aku asisten virtual..."
            />
          </CardContent>
        </Card>

        {/* Persona */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Bot className="h-4 w-4" /> {LABELS.bot_persona}
            </CardTitle>
            <p className="text-xs text-muted-foreground">{DESCRIPTIONS.bot_persona}</p>
          </CardHeader>
          <CardContent>
            <Textarea
              value={settings.bot_persona || ''}
              onChange={e => setSettings(prev => ({ ...prev, bot_persona: e.target.value }))}
              placeholder="Kamu customer service Luxky Store: ramah, santai tapi sopan..."
            />
          </CardContent>
        </Card>

        {/* Diskon + negosiasi */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Percent className="h-4 w-4" /> {LABELS.max_discount_percent}
            </CardTitle>
            <p className="text-xs text-muted-foreground">{DESCRIPTIONS.max_discount_percent}</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              type="number"
              min="0"
              max="100"
              value={settings.max_discount_percent || ''}
              onChange={e => setSettings(prev => ({ ...prev, max_discount_percent: e.target.value }))}
            />
            <div>
              <Label className="text-sm">{LABELS.negotiation_enabled}</Label>
              <p className="text-xs text-muted-foreground mb-2">{DESCRIPTIONS.negotiation_enabled}</p>
              <div className="flex gap-2">
                {['true', 'false'].map(v => (
                  <Button
                    key={v}
                    size="sm"
                    variant={settings.negotiation_enabled === v ? 'default' : 'outline'}
                    onClick={() => setSettings(prev => ({ ...prev, negotiation_enabled: v }))}
                  >
                    {v === 'true' ? 'Boleh nego' : 'Harga fix'}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* WA eskalasi */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <MessageCircle className="h-4 w-4" /> {LABELS.escalation_whatsapp}
            </CardTitle>
            <p className="text-xs text-muted-foreground">{DESCRIPTIONS.escalation_whatsapp}</p>
          </CardHeader>
          <CardContent>
            <Input
              value={settings.escalation_whatsapp || ''}
              onChange={e => setSettings(prev => ({ ...prev, escalation_whatsapp: e.target.value }))}
              placeholder="6285178965265"
            />
          </CardContent>
        </Card>
      </div>

      {/* Tombol simpan bawah */}
      <div className="mt-6 flex justify-end">
        <Button onClick={handleSave} disabled={saving} size="lg">
          {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          Simpan Semua Pengaturan
        </Button>
      </div>
    </div>
  )
}
