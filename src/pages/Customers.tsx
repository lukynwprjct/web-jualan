import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { supabase } from '@/lib/supabase'
import { Plus, Edit, Trash2, X, User, Phone } from 'lucide-react'

interface Customer {
  id: string
  full_name: string
  whatsapp_display: string
  whatsapp_normalized: string
  address: string | null
  notes: string | null
  created_at: string
}

export default function Customers() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null)

  // Form state
  const [formData, setFormData] = useState({
    full_name: '',
    whatsapp_display: '',
    address: '',
    notes: ''
  })

  useEffect(() => {
    fetchCustomers()
  }, [])

  async function fetchCustomers() {
    setLoading(true)
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching customers:', error)
    } else {
      setCustomers(data || [])
    }
    setLoading(false)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleOpenModal = (customer?: Customer) => {
    if (customer) {
      setEditingCustomer(customer)
      setFormData({
        full_name: customer.full_name,
        whatsapp_display: customer.whatsapp_display,
        address: customer.address || '',
        notes: customer.notes || ''
      })
    } else {
      setEditingCustomer(null)
      setFormData({
        full_name: '',
        whatsapp_display: '',
        address: '',
        notes: ''
      })
    }
    setIsModalOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Normalisasi nomor WA Indonesia: 08xx -> 628xx
    let normalized = formData.whatsapp_display.replace(/[^0-9]/g, '')
    if (normalized.startsWith('08')) {
      normalized = '62' + normalized.slice(1)
    }

    const customerData = {
      full_name: formData.full_name,
      whatsapp_display: formData.whatsapp_display,
      whatsapp_normalized: normalized,
      address: formData.address || null,
      notes: formData.notes || null
    }

    if (editingCustomer) {
      // Update customer
      const { error } = await supabase
        .from('customers')
        .update(customerData)
        .eq('id', editingCustomer.id)

      if (!error) {
        fetchCustomers()
        setIsModalOpen(false)
      }
    } else {
      // Create customer
      const { error } = await supabase
        .from('customers')
        .insert([customerData])

      if (!error) {
        fetchCustomers()
        setIsModalOpen(false)
      }
    }
  }

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this customer?')) {
      const { error } = await supabase
        .from('customers')
        .delete()
        .eq('id', id)

      if (!error) {
        fetchCustomers()
      }
    }
  }

  return (
    <div className="container mx-auto py-8 px-4 min-h-screen">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Customers</h1>
        <Button onClick={() => handleOpenModal()}>
          <Plus className="mr-2 h-4 w-4" />
          Add Customer
        </Button>
      </div>

      {/* Customers List */}
      <div className="space-y-4">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : customers.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No customers yet. Click "Add Customer" to get started!
          </div>
        ) : (
          customers.map((customer) => (
            <Card key={customer.id} className="overflow-hidden">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">{customer.full_name}</h3>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                        <Phone className="h-3 w-3" />
                        {customer.whatsapp_display}
                      </div>
                      {customer.address && (
                        <div className="text-sm text-muted-foreground mt-1">
                          {customer.address}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="bg-green-100/20 text-green-600 border-green-200">
                      {customer.whatsapp_normalized}
                    </Badge>
                    <Button variant="outline" size="sm" onClick={() => handleOpenModal(customer)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(customer.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-border/40 flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">
                    Joined: {new Date(customer.created_at).toLocaleDateString('id-ID')}
                  </span>
                  {customer.notes && (
                    <span className="text-xs text-muted-foreground italic">{customer.notes}</span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <div className="flex items-center justify-between p-4 border-b">
              <CardTitle>{editingCustomer ? 'Edit Customer' : 'Add Customer'}</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setIsModalOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="p-4 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="full_name">Customer Name</Label>
                  <Input
                    id="full_name"
                    name="full_name"
                    value={formData.full_name}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="whatsapp_display">WhatsApp Number</Label>
                  <Input
                    id="whatsapp_display"
                    name="whatsapp_display"
                    value={formData.whatsapp_display}
                    onChange={handleInputChange}
                    placeholder="0812-3456-7890"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Address (Optional)</Label>
                  <Textarea
                    id="address"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    placeholder="Alamat customer"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notes">Notes (Optional)</Label>
                  <Textarea
                    id="notes"
                    name="notes"
                    value={formData.notes}
                    onChange={handleInputChange}
                    placeholder="Catatan tentang customer"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 p-4 border-t">
                <Button variant="outline" type="button" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingCustomer ? 'Update Customer' : 'Add Customer'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  )
}
