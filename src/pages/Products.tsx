import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { supabase } from '@/lib/supabase'
import { Plus, Edit, Trash2, X } from 'lucide-react'

interface Category {
  id: string
  name: string
}

interface Product {
  id: string
  name: string
  description: string
  price: number
  category_id: string | null
  image_url: string
  status: 'READY' | 'RESERVED' | 'SOLD'
  stock: number
  created_at: string
}

export default function Products() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category_id: '',
    image_url: '',
    status: 'READY',
    stock: '0'
  })

  // ✅ UPLOAD FOTO LANGSUNG (metode 1) — ke Supabase Storage bucket 'product-images'
  // Link otomatis terisi ke image_url. Metode 2 (paste link) tetap tersedia.
  async function handleUploadFoto(file: File) {
    setUploadError('')
    if (!file) return
    // Validasi: cuma gambar, maks 5 MB
    if (!file.type.startsWith('image/')) {
      setUploadError('File harus gambar (jpg/png/webp)')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('Ukuran foto maksimal 5 MB')
      return
    }
    setUploading(true)
    try {
      // Nama file unik: timestamp + nama bersih
      const ext = (file.name.split('.').pop() || 'jpg').toLowerCase()
      const cleanName = formData.name
        ? formData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 30)
        : 'produk'
      const fileName = `${cleanName}-${Date.now()}.${ext}`

      const { error: uploadErr } = await supabase.storage
        .from('product-images')
        .upload(fileName, file, { contentType: file.type, upsert: false })

      if (uploadErr) throw uploadErr

      // Dapatkan URL publik
      const { data } = supabase.storage
        .from('product-images')
        .getPublicUrl(fileName)

      setFormData(prev => ({ ...prev, image_url: data.publicUrl }))
    } catch (e: any) {
      console.error('Upload error:', e)
      setUploadError('Gagal upload: ' + e.message)
    } finally {
      setUploading(false)
    }
  }

  // Fetch categories for dropdown
  useEffect(() => {
    async function fetchCategories() {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name', { ascending: true })
      
      if (!error && data) {
        setCategories(data)
      }
    }
    fetchCategories()
  }, [])

  useEffect(() => {
    fetchProducts()
  }, [])

  async function fetchProducts() {
    setLoading(true)
    try {
      let query = supabase.from('products').select('*').order('created_at', { ascending: false })
      
      // Dev mode: bypass RLS untuk testing
      if (import.meta.env.VITE_SUPABASE_ANON_KEY && import.meta.env.VITE_SUPABASE_ANON_KEY.includes('sb_publishable')) {
        query = query.select('*', { count: 'exact' })
      }
      
      const { data, error, count } = await query

      if (error) {
        console.error('Error fetching products:', error)
        console.error('Error details:', JSON.stringify(error, null, 2))
      } else {
        setProducts(data || [])
        console.log('Products loaded:', data?.length || 0, 'items')
      }
    } catch (err) {
      console.error('Fetch products exception:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleOpenModal = (product?: Product) => {
    if (product) {
      setEditingProduct(product)
      setFormData({
        name: product.name,
        description: product.description || '',
        price: product.price.toString(),
        category_id: product.category_id || '',
        image_url: product.image_url,
        status: product.status,
        stock: product.stock.toString()
      })
    } else {
      setEditingProduct(null)
      setFormData({
        name: '',
        description: '',
        price: '',
        category_id: '',
        image_url: '',
        status: 'READY',
        stock: '0'
      })
    }
    setIsModalOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    let status = formData.status as 'READY' | 'RESERVED' | 'SOLD'
    const stock = parseInt(formData.stock) || 0
    
    // Auto-update status based on stock
    if (stock === 0) {
      status = 'SOLD'
    } else if (stock > 0 && status === 'SOLD') {
      status = 'READY'
    }
    
    const productData = {
      name: formData.name,
      description: formData.description,
      price: parseInt(formData.price) || 0,
      category_id: formData.category_id || null,
      image_url: formData.image_url || 'https://i.ibb.co/7yF0vZj/placeholder.jpg',
      status,
      stock
    }

    if (editingProduct) {
      // Update product
      const { error } = await supabase
        .from('products')
        .update(productData)
        .eq('id', editingProduct.id)

      if (!error) {
        fetchProducts()
        setIsModalOpen(false)
      }
    } else {
      // Create product
      const { error } = await supabase
        .from('products')
        .insert([productData])

      if (!error) {
        fetchProducts()
        setIsModalOpen(false)
      }
    }
  }

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id)

      if (error) {
        console.error('Delete error:', error)
        alert('Gagal menghapus produk: ' + error.message)
      } else {
        fetchProducts()
      }
    }
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
        <h1 className="text-3xl font-bold tracking-tight">Products</h1>
        <Button onClick={() => handleOpenModal()}>
          <Plus className="mr-2 h-4 w-4" />
          Add Product
        </Button>
      </div>

      {/* Products Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          <div className="col-span-full text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          </div>
        ) : products.length === 0 ? (
          <div className="col-span-full text-center py-8 text-muted-foreground">
            No products yet. Click "Add Product" to get started!
          </div>
        ) : (
          products.map((product) => (
            <Card key={product.id} className="overflow-hidden">
              <div className="relative h-48 w-full">
                <img
                  src={product.image_url || 'https://i.ibb.co/7yF0vZj/placeholder.jpg'}
                  alt={product.name}
                  className="h-full w-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://i.ibb.co/7yF0vZj/placeholder.jpg'
                  }}
                />
                <Badge 
                  className={`absolute top-2 right-2 ${
                    product.status === 'READY' ? 'bg-green-500' :
                    product.status === 'RESERVED' ? 'bg-yellow-500' : 'bg-red-500'
                  }`}
                >
                  {product.status}
                </Badge>
                {product.stock === 0 && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <span className="bg-red-600 text-white px-3 py-1 rounded font-bold">
                      SOLD OUT
                    </span>
                  </div>
                )}
              </div>
              <CardContent className="p-4">
                <h3 className="font-semibold text-lg mb-2 line-clamp-1">{product.name}</h3>
                <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                  {product.description || 'No description'}
                </p>
                <div className="flex justify-between items-center mb-4">
                  <span className="text-xl font-bold">{formatCurrency(product.price)}</span>
                  <span className="text-sm text-muted-foreground">Stock: {product.stock}</span>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1" onClick={() => handleOpenModal(product)}>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit
                  </Button>
                  <Button 
                    variant="destructive" 
                    className="flex-1" 
                    onClick={() => handleDelete(product.id)}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </Button>
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
              <CardTitle>{editingProduct ? 'Edit Product' : 'Add Product'}</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setIsModalOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="p-4 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Product Name</Label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="price">Price</Label>
                    <Input
                      id="price"
                      name="price"
                      type="number"
                      value={formData.price}
                      onChange={handleInputChange}
                      required
                      min="0"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="stock">Stock</Label>
                    <Input
                      id="stock"
                      name="stock"
                      type="number"
                      value={formData.stock}
                      onChange={handleInputChange}
                      required
                      min="0"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="image_url">Foto Produk</Label>

                  {/* Preview foto (kalau sudah ada link) */}
                  {formData.image_url && (
                    <div className="mb-2 flex items-center gap-3">
                      <img
                        src={formData.image_url}
                        alt="Preview foto produk"
                        className="h-20 w-20 rounded-lg object-cover border border-border"
                        onError={(e) => { (e.target as HTMLImageElement).style.opacity = '0.3' }}
                      />
                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, image_url: '' }))}
                        className="text-xs text-destructive hover:underline"
                      >
                        Hapus foto
                      </button>
                    </div>
                  )}

                  {/* METODE 1: upload langsung dari galeri/kamera */}
                  <div className="flex items-center gap-2 mb-2">
                    <label className="flex-1">
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file) handleUploadFoto(file)
                          e.target.value = '' // biar bisa pilih file yang sama lagi
                        }}
                        disabled={uploading}
                      />
                      <span className={`inline-flex items-center justify-center gap-2 w-full h-9 px-3 rounded-md border border-input text-sm cursor-pointer ${
                        uploading ? 'opacity-50' : 'hover:bg-accent'
                      }`}>
                        {uploading ? (
                          <>
                            <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                            Mengunggah...
                          </>
                        ) : (
                          <>📷 Pilih Foto dari Galeri</>
                        )}
                      </span>
                    </label>
                  </div>

                  {/* METODE 2: paste link */}
                  <Input
                    id="image_url"
                    name="image_url"
                    value={formData.image_url}
                    onChange={handleInputChange}
                    placeholder="atau tempel link foto di sini (https://...)"
                  />
                  {uploadError && (
                    <p className="text-xs text-destructive mt-1">{uploadError}</p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    Upload langsung ATAU tempel link — pilih yang gampang. Foto tersimpan di Supabase-mu.
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category_id">Category</Label>
                  <select
                    id="category_id"
                    name="category_id"
                    value={formData.category_id}
                    onChange={handleInputChange}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="">Pilih Kategori</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <select
                    id="status"
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="READY">READY</option>
                    <option value="RESERVED">RESERVED</option>
                    <option value="SOLD">SOLD</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-2 p-4 border-t">
                <Button variant="outline" type="button" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingProduct ? 'Update Product' : 'Add Product'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  )
}
