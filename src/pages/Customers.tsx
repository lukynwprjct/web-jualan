import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { supabase } from '@/lib/supabase'
import { Plus, Edit, Trash2, X, User, Phone, Mail } from 'lucide-react'

interface Customer {
  id: string
  name: string
  phone_original: string
  phone_normalized: string
  email: string | null
  whatsapp_active: boolean
  created_at: string
}

export default function Customers() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null)
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    phone_original: '',
    email: '',
    whatsapp_active: true
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

  const handleToggleWhatsApp = (id: string, currentStatus: boolean) => {
    const newStatus = !currentStatus
    supabase
      .from('customers')
      .update({ whatsapp_active: newStatus })
      .eq('id', id)
      .then(() => fetchCustomers())
  }

  const handleOpenModal = (customer?: Customer) => {
    if (customer) {
      setEditingCustomer(customer)
      setFormData({
        name: customer.name,
        phone_original: customer.phone_original,
        email: customer.email || '',
        whatsapp_active: customer.whatsapp_active
      })
    } else {
      setEditingCustomer(null)
      setFormData({
        name: '',
        phone_original: '',
        email: '',
        whatsapp_active: true
      })
    }
    setIsModalOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const customerData = {
      name: formData.name,
      phone_original: formData.phone_original,
      phone_normalized: formData.phone_original.startsWith('08') 
        ? '62' + formData.phone_original.slice(1)
        : formData.phone_original,
      email: formData.email || null,
      whatsapp_active: formData.whatsapp_active
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
                      <h3 className="font-semibold text-lg">{customer.name}</h3>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                        <Phone className="h-3 w-3" />
                        {customer.phone_original}
                      </div>
                      {customer.email && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                          <Mail className="h-3 w-3" />
                          {customer.email}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge 
                      className={`${
                        customer.whatsapp_active ? 'bg-green-500' : 'bg-gray-500'
                      }`}
                    >
                      {customer.whatsapp_active ? 'WhatsApp Active' : 'WhatsApp Disabled'}
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
                  <button
                    onClick={() => handleToggleWhatsApp(customer.id, customer.whatsapp_active)}
                    className={`text-xs px-3 py-1 rounded-full ${
                      customer.whatsapp_active 
                        ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200' 
                        : 'bg-green-100 text-green-800 hover:bg-green-200'
                    }`}
                  >
                    {customer.whatsapp_active ? 'Disable WhatsApp' : 'Enable WhatsApp'}
                  </button>
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
                  <Label htmlFor="name">Customer Name</Label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone_original">WhatsApp Number</Label>
                  <Input
                    id="phone_original"
                    name="phone_original"
                    value={formData.phone_original}
                    onChange={handleInputChange}
                    placeholder="0812-3456-7890"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email (Optional)</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="email@example.com"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="whatsapp_active"
                    name="whatsapp_active"
                    checked={formData.whatsapp_active}
                    onChange={(e) => setFormData(prev => ({ ...prev, whatsapp_active: e.target.checked }))}
                    className="rounded"
                  />
                  <Label htmlFor="whatsapp_active">WhatsApp Active</Label>
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
