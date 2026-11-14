import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { X, Send, MessageCircle, Headphones } from 'lucide-react'

interface ChatMsg {
  role: 'user' | 'assistant'
  content: string
}

/**
 * ChatBot Widget — AI customer service Luxky Store
 * - Melayang di pojok kanan bawah
 * - Terhubung ke Edge Function web-chat (Gemini + katalog produk asli)
 * - Eskalasi ke WA admin saat AI tidak bisa menyelesaikan
 */
export default function ChatBot() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMsg[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [welcome, setWelcome] = useState('Hai! 👋 Aku asisten virtual Luxky Store. Mau tanya produk, harga, atau negosiasi? Silakan!')
  const [escalated, setEscalated] = useState(false)
  const [waLink, setWaLink] = useState('https://wa.me/6285178965265')
  const bodyRef = useRef<HTMLDivElement>(null)

  // visitorId anonim tersimpan di localStorage
  const getVisitorId = (): string => {
    let id = localStorage.getItem('luxky_visitor_id')
    if (!id) {
      id = 'v-' + Math.random().toString(36).slice(2) + Date.now().toString(36)
      localStorage.setItem('luxky_visitor_id', id)
    }
    return id
  }

  // Ambil pesan sambutan dari pengaturan (bot_settings)
  useEffect(() => {
    supabase
      .from('bot_settings')
      .select('key, value')
      .in('key', ['welcome_message', 'escalation_whatsapp'])
      .then(({ data }) => {
        if (!data) return
        for (const row of data) {
          if (row.key === 'welcome_message' && row.value) setWelcome(row.value)
          if (row.key === 'escalation_whatsapp' && row.value) {
            setWaLink(`https://wa.me/${row.value}`)
          }
        }
      })
  }, [])

  // Auto scroll ke bawah saat ada pesan baru
  useEffect(() => {
    bodyRef.current?.scrollTo({ top: bodyRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, open])

  async function send() {
    const text = input.trim()
    if (!text || sending) return
    setInput('')
    setMessages(prev => [...prev, { role: 'user', content: text }])
    setSending(true)

    try {
      const res = await fetch(`${import.meta.env.VITE_CHAT_URL}/web-chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ visitorId: getVisitorId(), message: text })
      })
      const data = await res.json()

      if (data.reply) {
        setMessages(prev => [...prev, { role: 'assistant', content: data.reply }])
      }
      if (data.escalate) {
        setEscalated(true)
        if (data.waLink) setWaLink(data.waLink)
      }
      if (data.error) {
        setMessages(prev => [...prev, { role: 'assistant', content: 'Maaf, sedang ada gangguan. ' + data.error }])
      }
    } catch {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Maaf, koneksi bermasalah. Coba lagi atau hubungi admin ya. 🙏'
      }])
    } finally {
      setSending(false)
    }
  }

  return (
    <>
      {/* Tombol bulat melayang */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          aria-label="Chat dengan asisten"
          className="fixed bottom-5 right-5 z-50 h-14 w-14 rounded-full bg-[#5C0715] text-white shadow-lg shadow-red-900/40 flex items-center justify-center hover:bg-[#7a0a1d] hover:scale-105 transition-all"
        >
          <MessageCircle className="h-6 w-6" />
        </button>
      )}

      {/* Jendela chat */}
      {open && (
        <div className="fixed bottom-5 right-5 z-50 w-[92vw] max-w-sm h-[70vh] max-h-[560px] rounded-2xl overflow-hidden flex flex-col border border-white/10 bg-[#0a0a0a] shadow-2xl shadow-red-900/30">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-[#5C0715] to-[#2a0309]">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-full bg-white/10 flex items-center justify-center">
                <Headphones className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-white font-semibold text-sm leading-tight">Luxky Assistant</p>
                <p className="text-white/60 text-xs leading-tight">
                  {sending ? 'sedang mengetik...' : 'Online'}
                </p>
              </div>
            </div>
            <button onClick={() => setOpen(false)} aria-label="Tutup chat" className="text-white/70 hover:text-white">
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Isi chat */}
          <div ref={bodyRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-3 bg-[#0d0d0d]">
            <div className="flex justify-start">
              <div className="max-w-[85%] rounded-2xl rounded-bl-sm px-3 py-2 text-sm bg-[#1a1a1a] text-white/90">
                {welcome}
              </div>
            </div>

            {messages.map((m, i) => (
              <div key={i} className={m.role === 'user' ? 'flex justify-end' : 'flex justify-start'}>
                <div
                  className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm whitespace-pre-wrap ${
                    m.role === 'user'
                      ? 'rounded-br-sm bg-[#5C0715] text-white'
                      : 'rounded-bl-sm bg-[#1a1a1a] text-white/90'
                  }`}
                >
                  {m.content}
                </div>
              </div>
            ))}

            {sending && (
              <div className="flex justify-start">
                <div className="rounded-2xl rounded-bl-sm px-4 py-3 bg-[#1a1a1a] flex gap-1">
                  <span className="h-2 w-2 rounded-full bg-white/50 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="h-2 w-2 rounded-full bg-white/50 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="h-2 w-2 rounded-full bg-white/50 animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}

            {/* Tombol eskalasi ke admin */}
            {escalated && (
              <div className="flex justify-center pt-1">
                <a
                  href={waLink}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs px-4 py-2 rounded-full bg-green-600 hover:bg-green-500 text-white font-medium transition-colors"
                >
                  💬 Lanjut ke WhatsApp Admin
                </a>
              </div>
            )}
          </div>

          {/* Input */}
          <div className="flex items-center gap-2 px-3 py-2 border-t border-white/10 bg-[#0a0a0a]">
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && send()}
              placeholder="Tulis pesan..."
              className="flex-1 bg-[#161616] border border-white/10 rounded-full px-4 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-[#5C0715]"
            />
            <button
              onClick={send}
              disabled={sending || !input.trim()}
              aria-label="Kirim"
              className="h-9 w-9 rounded-full bg-[#5C0715] text-white flex items-center justify-center disabled:opacity-40 hover:bg-[#7a0a1d] transition-colors"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </>
  )
}
