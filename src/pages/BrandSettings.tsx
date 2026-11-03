import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { supabase } from '@/lib/supabase'
import { Store, Save, Info, ShoppingBag, MessageCircle, User, Phone, Globe, Instagram, Facebook, Twitter, Youtube, ChevronUp, ChevronDown } from 'lucide-react'

interface BrandSetting {
  id: string
  key: string
  value: string
  description: string | null
  is_public: boolean
  updated_at: string
}

export default function AdminBrandSettings() {
  const [settings, setSettings] = useState<BrandSetting[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedSection, setExpandedSection] = useState<string | null>('general')
  const [saving, setSaving] = useState(false)

  // Categories for public settings
  const settingCategories = {
    general: {
      label: 'General',
      icon: Store,
      keys: ['brand_name', 'brand_slogan', 'brand_description', 'about_us', 'logo_url', 'favicon_url']
    },
    contact: {
      label: 'Contact',
      icon: MessageCircle,
      keys: ['whatsapp_number', 'whatsapp_label', 'email', 'phone', 'address']
    },
    social: {
      label: 'Social Media',
      icon: Globe,
      keys: ['instagram', 'facebook', 'twitter', 'youtube', 'linkedin']
    },
    meta: {
      label: 'Meta Tags',
      icon: Info,
      keys: ['meta_title', 'meta_description', 'meta_keywords']
    }
  }

  useEffect(() => {
    fetchSettings()
  }, [])

  async function fetchSettings() {
    setLoading(true)
    const { data, error } = await supabase
      .from('brand_settings')
      .select('*')
      .order('key', { ascending: true })

    if (error) {
      console.error('Error fetching settings:', error)
    } else {
      setSettings(data || [])
    }
    setLoading(false)
  }

  const getSetting = (key: string) => {
    return settings.find(s => s.key === key)
  }

  const updateSetting = async (key: string, value: string) => {
    const existing = getSetting(key)
    
    console.log('Updating setting:', { key, value, existing })
    
    try {
      if (existing) {
        const { data, error } = await supabase
          .from('brand_settings')
          .update({ value, is_public: true })
          .eq('key', key)
          .select()
        
        if (error) {
          console.error('Update error:', error)
        } else {
          console.log('Update success:', data)
          setSettings(prev => prev.map(s => s.key === key ? { ...s, value } : s))
        }
      } else {
        const { data, error } = await supabase
          .from('brand_settings')
          .insert({ key, value, is_public: true })
          .select()
        
        if (error) {
          console.error('Insert error:', error)
        } else {
          console.log('Insert success:', data)
          setSettings(prev => [...prev, ...data])
        }
      }
    } catch (err) {
      console.error('Exception:', err)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    // Settings are auto-saved on change, just show feedback
    setTimeout(() => {
      setSaving(false)
      alert('Settings saved successfully!')
    }, 500)
  }

  const renderSettingInput = (setting: BrandSetting) => {
    const value = setting.value || ''
    
    switch (setting.key) {
      case 'about_us':
      case 'brand_description':
        return (
          <Textarea
            value={value}
            onChange={(e) => updateSetting(setting.key, e.target.value)}
            className="min-h-[100px] bg-background"
            placeholder={`Enter ${setting.key}...`}
          />
        )
      default:
        return (
          <Input
            value={value}
            onChange={(e) => updateSetting(setting.key, e.target.value)}
            className="bg-background"
            placeholder={`Enter ${setting.key}...`}
          />
        )
    }
  }

  const renderCategory = (categoryKey: string) => {
    const category = settingCategories[categoryKey as keyof typeof settingCategories]
    const settingsInCategory = settings.filter(s => 
      category.keys.includes(s.key) && s.is_public
    )
    const isExpanded = expandedSection === categoryKey

    return (
      <Card key={categoryKey} className="mb-4 border-border/40 bg-card/50">
        <CardHeader 
          className="cursor-pointer hover:bg-card/80 transition-colors"
          onClick={() => setExpandedSection(isExpanded ? null : categoryKey)}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <category.icon className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">{category.label}</CardTitle>
            </div>
            {isExpanded ? (
              <ChevronUp className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            )}
          </div>
        </CardHeader>
        
        {isExpanded && (
          <CardContent className="space-y-4 pt-2">
            {settingsInCategory.map((setting) => (
              <div key={setting.key} className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor={setting.key} className="font-medium text-sm w-32">
                    {setting.key.replace('_', ' ')}
                  </Label>
                  <div className="flex-1">
                    {renderSettingInput(setting)}
                  </div>
                </div>
                {setting.description && (
                  <p className="text-xs text-muted-foreground pl-3">
                    {setting.description}
                  </p>
                )}
              </div>
            ))}
          </CardContent>
        )}
      </Card>
    )
  }

  return (
    <div className="container mx-auto py-8 px-4 min-h-screen">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Brand Settings</h1>
          <p className="text-muted-foreground mt-1">
            Manage your brand information, contact details, and social media
          </p>
        </div>
        <Button 
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2"
        >
          <Save className="h-4 w-4" />
          {saving ? 'Saving...' : 'Save All'}
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* General Settings */}
          {renderCategory('general')}
          
          {/* Contact Settings */}
          {renderCategory('contact')}
          
          {/* Social Media Settings */}
          {renderCategory('social')}
          
          {/* Meta Settings */}
          {renderCategory('meta')}
        </div>
      )}

      {/* Quick Stats */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Store className="h-4 w-4 text-primary" />
              <span className="text-sm text-muted-foreground">Settings</span>
            </div>
            <div className="text-2xl font-bold">{settings.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <MessageCircle className="h-4 w-4 text-primary" />
              <span className="text-sm text-muted-foreground">Public</span>
            </div>
            <div className="text-2xl font-bold">
              {settings.filter(s => s.is_public).length}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}