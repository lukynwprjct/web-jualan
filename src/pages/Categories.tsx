import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { supabase } from '@/lib/supabase'
import { Plus, Edit, Trash2, X, Grid3X3 } from 'lucide-react'

interface Category {
  id: string
  name: string
  description: string | null
  image_url: string | null
  is_active: boolean
  created_at: string
}

export default function Categories() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null)
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    image_url: '',
    is_active: true
  })

  useEffect(() => {
    fetchCategories()
  }, [])

  async function fetchCategories() {
    setLoading(true)
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching categories:', error)
    } else {
      setCategories(data || [])
    }
    setLoading(false)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleToggleActive = (id: string, currentStatus: boolean) => {
    const newStatus = !currentStatus
    supabase
      .from('categories')
      .update({ is_active: newStatus })
      .eq('id', id)
      .then(() => fetchCategories())
  }

  const handleOpenModal = (category?: Category) => {
    if (category) {
      setEditingCategory(category)
      setFormData({
        name: category.name,
        description: category.description || '',
        image_url: category.image_url || '',
        is_active: category.is_active
      })
    } else {
      setEditingCategory(null)
      setFormData({
        name: '',
        description: '',
        image_url: '',
        is_active: true
      })
    }
    setIsModalOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const categoryData = {
      name: formData.name,
      description: formData.description,
      image_url: formData.image_url || null,
      is_active: formData.is_active
    }

    if (editingCategory) {
      // Update category
      const { error } = await supabase
        .from('categories')
        .update(categoryData)
        .eq('id', editingCategory.id)

      if (!error) {
        setMessage({ type: 'success', text: 'Category updated successfully!' })
        fetchCategories()
        setIsModalOpen(false)
        setTimeout(() => setMessage(null), 3000)
      } else {
        setMessage({ type: 'error', text: 'Error updating category: ' + error.message })
        setTimeout(() => setMessage(null), 3000)
      }
    } else {
      // Create category
      const { error } = await supabase
        .from('categories')
        .insert([categoryData])

      if (!error) {
        setMessage({ type: 'success', text: 'Category added successfully!' })
        fetchCategories()
        setIsModalOpen(false)
        setFormData({ name: '', description: '', image_url: '', is_active: true })
        setTimeout(() => setMessage(null), 3000)
      } else {
        setMessage({ type: 'error', text: 'Error adding category: ' + error.message })
        setTimeout(() => setMessage(null), 3000)
      }
    }
  }

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this category?')) {
      // First check if any products use this category
      const { count } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .eq('category_id', id)

      if (count && count > 0) {
        alert('Cannot delete category. Products are using this category.')
        return
      }

      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', id)

      if (!error) {
        fetchCategories()
      }
    }
  }

  return (
    <div className="container mx-auto py-8 px-4 min-h-screen">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Categories</h1>
        <Button onClick={() => handleOpenModal()}>
          <Plus className="mr-2 h-4 w-4" />
          Add Category
        </Button>
      </div>

      {/* Categories Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          <div className="col-span-full text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          </div>
        ) : categories.length === 0 ? (
          <div className="col-span-full text-center py-8 text-muted-foreground">
            No categories yet. Click "Add Category" to get started!
          </div>
        ) : (
          categories.map((category) => (
            <Card key={category.id} className="overflow-hidden">
              <div className="relative h-32 w-full bg-muted">
                {category.image_url ? (
                  <img
                    src={category.image_url}
                    alt={category.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center">
                    <Grid3X3 className="h-8 w-8 text-muted-foreground/50" />
                  </div>
                )}
                <Badge 
                  className={`absolute top-2 right-2 ${
                    category.is_active ? 'bg-green-500' : 'bg-gray-500'
                  }`}
                >
                  {category.is_active ? 'Active' : 'Inactive'}
                </Badge>
              </div>
              <CardContent className="p-4">
                <h3 className="font-semibold text-lg mb-2">{category.name}</h3>
                <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                  {category.description || 'No description'}
                </p>
                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1" onClick={() => handleOpenModal(category)}>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit
                  </Button>
                  <Button 
                    variant="destructive" 
                    className="flex-1" 
                    onClick={() => handleDelete(category.id)}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </Button>
                </div>
                <div className="mt-2">
                  <button
                    onClick={() => handleToggleActive(category.id, category.is_active)}
                    className={`text-sm w-full py-2 px-4 rounded-md ${
                      category.is_active 
                        ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200' 
                        : 'bg-green-100 text-green-800 hover:bg-green-200'
                    }`}
                  >
                    {category.is_active ? 'Deactivate' : 'Activate'}
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
              <CardTitle>{editingCategory ? 'Edit Category' : 'Add Category'}</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setIsModalOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="p-4 space-y-4">
                {message && (
                  <Alert variant={message.type}>
                    <AlertDescription>{message.text}</AlertDescription>
                  </Alert>
                )}
                <div className="space-y-2">
                  <Label htmlFor="name">Category Name</Label>
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
                <div className="space-y-2">
                  <Label htmlFor="image_url">Image URL (Optional)</Label>
                  <Input
                    id="image_url"
                    name="image_url"
                    value={formData.image_url}
                    onChange={handleInputChange}
                    placeholder="https://example.com/image.jpg"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="is_active"
                    name="is_active"
                    checked={formData.is_active}
                    onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                    className="rounded"
                  />
                  <Label htmlFor="is_active">Active</Label>
                </div>
              </div>
              <div className="flex justify-end gap-2 p-4 border-t">
                <Button variant="outline" type="button" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingCategory ? 'Update Category' : 'Add Category'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
      
      {/* Global Message */}
      {message && !isModalOpen && (
        <Alert variant={message.type} className="fixed top-4 right-4 z-50 max-w-sm">
          <AlertDescription>{message.text}</AlertDescription>
        </Alert>
      )}
    </div>
  )
}
