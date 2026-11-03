import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { supabase } from '@/lib/supabase'
import { CheckCircle, XCircle, MessageSquare, Trash2, User, Phone, Send } from 'lucide-react'

interface Inquiry {
  id: string
  customer_id: string
  customer: {
    name: string
    phone_original: string
    phone_normalized: string
  }
  product_id: string
  product_name_snapshot: string
  product_price_snapshot: number
  message: string | null
  status: 'PENDING' | 'REPLIED' | 'CANCELLED'
  notes: string | null
  created_at: string
}

export default function Inquiries() {
  const [inquiries, setInquiries] = useState<Inquiry[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedInquiry, setExpandedInquiry] = useState<string | null>(null)
  const [replyMessage, setReplyMessage] = useState<Record<string, string>>({})

  useEffect(() => {
    fetchInquiries()
  }, [])

  async function fetchInquiries() {
    setLoading(true)
    const { data, error } = await supabase
      .from('inquiries')
      .select(`
        *,
        customer:customers(name, phone_original, phone_normalized)
      `)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching inquiries:', error)
    } else {
      setInquiries(data || [])
    }
    setLoading(false)
  }

  const handleUpdateStatus = async (id: string, newStatus: Inquiry['status']) => {
    const { error } = await supabase
      .from('inquiries')
      .update({ status: newStatus })
      .eq('id', id)

    if (!error) {
      fetchInquiries()
    }
  }

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this inquiry?')) {
      const { error } = await supabase
        .from('inquiries')
        .delete()
        .eq('id', id)

      if (!error) {
        fetchInquiries()
      }
    }
  }

  const handleReplyWhatsApp = async (inquiry: Inquiry) => {
    const customerPhone = inquiry.customer?.phone_normalized || inquiry.customer?.phone_original
    if (!customerPhone) {
      alert('No customer phone number available')
      return
    }

    const productName = encodeURIComponent(inquiry.product_name_snapshot)
    const productPrice = encodeURIComponent(`Rp ${(inquiry.product_price_snapshot / 1000).toFixed(0)}K`)
    const customerMessage = inquiry.message ? `\n\nCustomer Message:\n${inquiry.message}` : ''
    const reply = replyMessage[inquiry.id] || ''
    const fullMessage = `Halo ${inquiry.customer?.name},${customerMessage ? '' : ''}\n\nTerima kasih atas inquiry Anda untuk:\n*${inquiry.product_name_snapshot}*\nHarga: ${productPrice}${reply ? `\n\nReply:\n${reply}` : ''}\n\nSilakan balas chat ini untuk konfirmasi lebih lanjut.`

    const whatsappNumber = "6285178965265"
    window.open(`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(fullMessage)}`, "_blank")
    
    // Update status to REPLIED
    await handleUpdateStatus(inquiry.id, 'REPLIED')
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount)
  }

  return (
    <div className="container mx-auto py-8 px-4 min-h-screen">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Inquiries</h1>
        <div className="flex gap-2">
          <Badge variant="outline" className="bg-yellow-100/20 text-yellow-600 border-yellow-200">
            Pending
          </Badge>
          <Badge variant="outline" className="bg-green-100/20 text-green-600 border-green-200">
            Replied
          </Badge>
          <Badge variant="outline" className="bg-red-100/20 text-red-600 border-red-200">
            Cancelled
          </Badge>
        </div>
      </div>

      {/* Inquiries List */}
      <div className="space-y-4">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : inquiries.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No inquiries yet
          </div>
        ) : (
          inquiries.map((inquiry) => (
            <Card key={inquiry.id} className="overflow-hidden">
              <CardContent className="p-4">
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{inquiry.customer?.name}</h3>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Phone className="h-3 w-3" />
                        {inquiry.customer?.phone_original}
                      </div>
                    </div>
                  </div>
                  <Badge 
                    className={`${
                      inquiry.status === 'PENDING' ? 'bg-yellow-500' :
                      inquiry.status === 'REPLIED' ? 'bg-green-500' : 'bg-red-500'
                    }`}
                  >
                    {inquiry.status}
                  </Badge>
                </div>

                {/* Product Info */}
                <div className="mb-3 p-3 bg-muted/30 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <MessageSquare className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Product Inquiry</span>
                  </div>
                  <div className="text-sm">
                    <p className="font-semibold">{inquiry.product_name_snapshot}</p>
                    <p className="text-primary font-bold mt-1">
                      {formatCurrency(inquiry.product_price_snapshot)}
                    </p>
                  </div>
                </div>

                {/* Message */}
                <div className="mb-3">
                  <Label className="text-xs text-muted-foreground mb-1 block">
                    Customer Message
                  </Label>
                  <div className="p-3 bg-muted/50 rounded-lg text-sm">
                    {inquiry.message || <span className="text-muted-foreground italic">No message</span>}
                  </div>
                </div>

                {/* Reply Input */}
                {inquiry.status === 'PENDING' && (
                  <div className="mb-3">
                    <Label className="text-xs text-muted-foreground mb-1 block">
                      Your Reply (optional)
                    </Label>
                    <textarea
                      className="w-full px-3 py-2 text-sm bg-transparent border rounded focus:outline-none focus:ring-2 focus:ring-primary min-h-[80px]"
                      placeholder="Type your reply message here..."
                      value={replyMessage[inquiry.id] || ''}
                      onChange={(e) => setReplyMessage(prev => ({
                        ...prev,
                        [inquiry.id]: e.target.value
                      }))}
                    />
                  </div>
                )}

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-2 pt-3 border-t border-border/40">
                  {inquiry.status === 'PENDING' && (
                    <>
                      <Button 
                        size="sm" 
                        className="flex-1"
                        onClick={() => handleUpdateStatus(inquiry.id, 'REPLIED')}
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Mark as Replied
                      </Button>
                      <Button 
                        size="sm" 
                        className="flex-1"
                        onClick={() => handleReplyWhatsApp(inquiry)}
                      >
                        <Send className="h-4 w-4 mr-2" />
                        Reply on WhatsApp
                      </Button>
                    </>
                  )}
                  {inquiry.status !== 'CANCELLED' && (
                    <Button 
                      size="sm" 
                      variant="destructive"
                      className="flex-1"
                      onClick={() => handleUpdateStatus(inquiry.id, 'CANCELLED')}
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Cancel
                    </Button>
                  )}
                  <Button 
                    size="sm" 
                    variant="outline"
                    className="flex-1"
                    onClick={() => handleDelete(inquiry.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                {/* Meta Info */}
                <div className="mt-3 text-xs text-muted-foreground text-right">
                  {new Date(inquiry.created_at).toLocaleString('id-ID')}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Stats */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground mb-1">Pending</div>
            <div className="text-2xl font-bold">
              {inquiries.filter(i => i.status === 'PENDING').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground mb-1">Replied</div>
            <div className="text-2xl font-bold text-green-600">
              {inquiries.filter(i => i.status === 'REPLIED').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground mb-1">Cancelled</div>
            <div className="text-2xl font-bold text-red-600">
              {inquiries.filter(i => i.status === 'CANCELLED').length}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
