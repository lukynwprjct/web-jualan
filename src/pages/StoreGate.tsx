import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, MapPin, Phone, User, ArrowRight } from 'lucide-react'

/**
 * Gerbang Toko (StoreGate)
 * - Halaman pertama yang dilihat pengunjung baru
 * - Wajib isi: nama, lokasi, no WhatsApp
 * - Data tersimpan ke tabel user_identities (bisa dilihat admin)
 * - Setelah isi: localStorage 'luxky_visitor' -> tidak ditanya lagi
 */
export default function StoreGate() {
  const navigate = useNavigate()
  const [nama, setNama] = useState('')
  const [lokasi, setLokasi] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    // Validasi
    if (nama.trim().length < 2) {
      setError('Nama minimal 2 karakter ya')
      return
    }
    if (lokasi.trim().length < 2) {
      setError('Lokasi minimal 2 karakter ya (contoh: Malang)')
      return
    }
    const cleanWa = whatsapp.replace(/[^0-9]/g, '')
    if (cleanWa.length < 10 || cleanWa.length > 15) {
      setError('Nomor WhatsApp tidak valid (contoh: 081234567890)')
      return
    }

    setLoading(true)
    try {
      // Simpan ke database (tabel user_identities, insert public sudah diizinkan)
      const { error: dbError } = await supabase.from('user_identities').insert({
        nama: nama.trim(),
        lokasi: lokasi.trim(),
        whatsapp: cleanWa.startsWith('08') ? '62' + cleanWa.slice(1) : cleanWa,
      })

      if (dbError) throw dbError

      // Tandai sudah masuk (kalau datanya valid) -> kunjungan berikutnya langsung masuk
      localStorage.setItem('luxky_visitor', JSON.stringify({
        nama: nama.trim(),
        lokasi: lokasi.trim(),
        since: new Date().toISOString()
      }))

      navigate('/', { replace: true })
    } catch (e: any) {
      console.error('StoreGate error:', e)
      setError('Gagal masuk. Cek koneksi internet lalu coba lagi ya.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-[#080808] px-4">
      {/* Latar glow burgundy senada tema Luxky */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 80% 50% at 50% -10%, rgba(92, 7, 21, 0.35), transparent), radial-gradient(ellipse 60% 40% at 80% 100%, rgba(92, 7, 21, 0.15), transparent)'
        }}
      />

      <Card className="w-full max-w-md relative z-10 backdrop-blur-md bg-black/50 border-white/10 shadow-2xl shadow-red-900/20">
        <CardHeader className="text-center space-y-2 pb-2">
          <CardTitle className="text-3xl font-bold tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-red-200">
            LUXKY STORE
          </CardTitle>
          <p className="text-sm text-white/60">
            Barang Berkualitas, Harga Terjangkau ✨
          </p>
        </CardHeader>

        <CardContent className="pt-4">
          <p className="text-xs text-white/40 text-center mb-5">
            Kenalan dulu yuk! Biar kami bisa melayani kamu lebih personal.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="gate-nama" className="text-white/80 flex items-center gap-1.5">
                <User className="h-3.5 w-3.5" /> Nama Kamu
              </Label>
              <Input
                id="gate-nama"
                value={nama}
                onChange={e => setNama(e.target.value)}
                placeholder="contoh: Rizky"
                maxLength={50}
                required
                className="bg-[#111] border-white/10 text-white placeholder-white/25 focus:border-[#D7263D]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="gate-lokasi" className="text-white/80 flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5" /> Lokasi / Kota
              </Label>
              <Input
                id="gate-lokasi"
                value={lokasi}
                onChange={e => setLokasi(e.target.value)}
                placeholder="contoh: Malang"
                maxLength={50}
                required
                className="bg-[#111] border-white/10 text-white placeholder-white/25 focus:border-[#D7263D]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="gate-wa" className="text-white/80 flex items-center gap-1.5">
                <Phone className="h-3.5 w-3.5" /> No. WhatsApp
              </Label>
              <Input
                id="gate-wa"
                value={whatsapp}
                onChange={e => setWhatsapp(e.target.value)}
                placeholder="0812-3456-7890"
                inputMode="tel"
                maxLength={16}
                required
                className="bg-[#111] border-white/10 text-white placeholder-white/25 focus:border-[#D7263D]"
              />
              <p className="text-[11px] text-white/30 leading-relaxed">
                Data hanya dipakai untuk layanan toko (info produk & konfirmasi order). Tidak dibagikan ke pihak lain.
              </p>
            </div>

            {error && (
              <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-11 bg-gradient-to-r from-[#5C0715] to-[#D7263D] hover:opacity-90 text-white font-semibold"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Memasukkan...
                </>
              ) : (
                <>
                  Masuk Toko <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
