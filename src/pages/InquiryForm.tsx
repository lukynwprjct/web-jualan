import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { supabase } from '@/lib/supabase'

interface Product {
  id: string
  name: string
  price: number
  stock: number
  image_url: string
}

interface FormState {
  customer_name: string
  customer_phone: string
  product_id: string
  product_name: string
  product_price: number
  inquiry_message: string
}

export default function InquiryForm() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  
  const [formData, setFormData] = useState<FormState>({
    customer_name: '',
    customer_phone: '',
    product_id: id || '',
    product_name: '',
    product_price: 0,
    inquiry_message: ''
  })

  // Fetch product when component mounts
  useEffect(() => {
    fetchProduct()
  }, [id])

  async function fetchProduct() {
    if (!id) return
    
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      console.error('Error fetching product:', error)
      navigate('/')
    } else if (data) {
      setProduct(data)
      setFormData(prev => ({
        ...prev,
        product_id: data.id,
        product_name: data.name,
        product_price: data.price
      }))
    }
    setLoading(false)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const validatePhone = (phone: string): boolean => {
    // Basic phone validation: starts with 08 or 62, 10-15 digits
    const phoneRegex = /^(08|62)[0-9]{8,14}$/
    return phoneRegex.test(phone)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate
    if (!formData.customer_name.trim()) {
      alert('Nama lengkap wajib diisi')
      return
    }
    
    if (!validatePhone(formData.customer_phone)) {
      alert('Nomor WhatsApp harus berformat 08xx atau 62xx, 10-15 digit')
      return
    }
    
    if (!formData.product_id) {
      alert('Produk tidak valid')
      return
    }

    setSubmitting(true)

    try {
      // Normalize phone number
      let normalizedPhone = formData.customer_phone
      if (normalizedPhone.startsWith('08')) {
        normalizedPhone = '62' + normalizedPhone.slice(1)
      }
      normalizedPhone = normalizedPhone.replace(/[^0-9]/g, '')

      // Kirim inquiry via RPC aman (sekali panggil: customer + inquiry
      // + stok + event bot ditangani di sisi database)
      const { data, error } = await supabase.rpc('submit_inquiry', {
        p_product_id: formData.product_id,
        p_customer_name: formData.customer_name.trim(),
        p_customer_whatsapp: normalizedPhone,
        p_note: formData.inquiry_message || null,
        p_quantity: 1
      })

      if (error) {
        throw error
      }

      if (data && data.ok === false) {
        alert('Gagal mengirim inquiry: ' + (data.error || 'Coba lagi'))
        return
      }

      alert('Inquiry berhasil dikirim! Kami akan menghubungi Anda via WhatsApp segera.')
      navigate('/')

    } catch (error: any) {
      console.error('Error submitting inquiry:', error)
      alert('Gagal mengirim inquiry: ' + error.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-foreground/60">Loading product...</p>
        </div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <p className="text-foreground/60">Product not found</p>
            <Button className="mt-4" onClick={() => navigate('/')}>
              Back to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 px-4 min-h-screen">
      <Button variant="ghost" onClick={() => navigate('/')} className="mb-4">
        ← Back to Products
      </Button>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Product Info */}
        <Card>
          <img
            src={product.image_url}
            alt={product.name}
            className="w-full h-64 object-cover rounded-t-lg"
          />
          <CardContent className="p-6">
            <h2 className="text-2xl font-bold mb-2">{product.name}</h2>
            <p className="text-foreground/60 mb-4">
              {product.stock === 0 ? 'SOLD OUT' : product.stock === 1 ? 'Only 1 left' : `${product.stock} available`}
            </p>
            <div className="text-3xl font-bold text-primary">
              Rp {product.price.toLocaleString('id-ID')}
            </div>
            <div className="mt-4 p-4 bg-muted rounded-lg">
              <p className="text-sm text-foreground/60">
                Ready to purchase? Fill the form below and we'll contact you via WhatsApp!
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Inquiry Form */}
        <Card>
          <CardHeader>
            <CardTitle>Send Inquiry</CardTitle>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="customer_name">Full Name</Label>
                <Input
                  id="customer_name"
                  name="customer_name"
                  value={formData.customer_name}
                  onChange={handleInputChange}
                  placeholder="John Doe"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="customer_phone">WhatsApp Number</Label>
                <Input
                  id="customer_phone"
                  name="customer_phone"
                  value={formData.customer_phone}
                  onChange={handleInputChange}
                  placeholder="0812-3456-7890"
                  required
                />
                <p className="text-xs text-foreground/60">
                  Format: 08xx or 62xx (10-15 digits)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="inquiry_message">Message (Optional)</Label>
                <Textarea
                  id="inquiry_message"
                  name="inquiry_message"
                  value={formData.inquiry_message}
                  onChange={handleInputChange}
                  placeholder="I'm interested in this product..."
                  rows={4}
                />
              </div>

              <div className="pt-4">
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={submitting}
                >
                  {submitting ? 'Sending...' : 'Send Inquiry'}
                </Button>
              </div>

              <p className="text-xs text-center text-foreground/40">
                We'll contact you via WhatsApp to confirm your order
              </p>
            </CardContent>
          </form>
        </Card>
      </div>
    </div>
  )
}
