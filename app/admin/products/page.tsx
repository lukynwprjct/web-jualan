import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "react-hot-toast";

interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  description: string;
  image_url: string;
  status: "READY" | "RESERVED" | "SOLD";
  created_at: string;
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    price: "",
    category: "",
    description: "",
    image_url: "",
    status: "READY" as "READY" | "RESERVED" | "SOLD",
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.price || !formData.image_url) {
      toast.error("Please fill in all required fields");
      return;
    }

    const productData = {
      name: formData.name,
      price: parseFloat(formData.price),
      category: formData.category || "Uncategorized",
      description: formData.description,
      image_url: formData.image_url,
      status: formData.status,
    };

    // Mock submit - akan diganti dengan Supabase call nanti
    if (editingProduct) {
      toast.success("Product updated successfully (mock)");
    } else {
      toast.success("Product added successfully (mock)");
    }

    setShowForm(false);
    setEditingProduct(null);
    setFormData({
      name: "",
      price: "",
      category: "",
      description: "",
      image_url: "",
      status: "READY",
    });
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      price: product.price.toString(),
      category: product.category,
      description: product.description,
      image_url: product.image_url,
      status: product.status,
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this product?")) {
      toast.success("Product deleted successfully (mock)");
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingProduct(null);
    setFormData({
      name: "",
      price: "",
      category: "",
      description: "",
      image_url: "",
      status: "READY",
    });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Manage Products</h1>
        <Button onClick={() => setShowForm(true)}>
          {showForm ? "Cancel" : "Add Product"}
        </Button>
      </div>

      {/* Product Form */}
      {showForm && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>{editingProduct ? "Edit Product" : "Add New Product"}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  <Label htmlFor="price">Price (Rp)</Label>
                  <Input
                    id="price"
                    name="price"
                    type="number"
                    value={formData.price}
                    onChange={handleInputChange}
                    min="0"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Input
                    id="category"
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    placeholder="e.g., Watches, Jewelry, Accessories"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <select
                    id="status"
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="READY">READY</option>
                    <option value="RESERVED">RESERVED</option>
                    <option value="SOLD">SOLD</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="image_url">Image URL (ImgBB direct link)</Label>
                <Input
                  id="image_url"
                  name="image_url"
                  value={formData.image_url}
                  onChange={handleInputChange}
                  placeholder="https://i.imgur.com/..."
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={3}
                  className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                />
              </div>

              <div className="flex gap-2">
                <Button type="submit">
                  {editingProduct ? "Update Product" : "Add Product"}
                </Button>
                <Button type="button" variant="outline" onClick={handleCancel}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Products List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[
          {
            id: "1",
            name: "Premium Watch",
            price: 5000000,
            category: "Watches",
            description: "Luxury timepiece with genuine leather strap",
            image_url: "https://via.placeholder.com/400x400/1a1a1a/ffffff?text=Watch",
            status: "READY" as const,
            created_at: new Date().toISOString()
          },
          {
            id: "2",
            name: "Designer Bag",
            price: 8000000,
            category: "Accessories",
            description: "High-quality leather designer bag",
            image_url: "https://via.placeholder.com/400x400/1a1a1a/ffffff?text=Bag",
            status: "READY" as const,
            created_at: new Date().toISOString()
          },
          {
            id: "3",
            name: "Gold Chain",
            price: 12000000,
            category: "Jewelry",
            description: "24K gold premium chain",
            image_url: "https://via.placeholder.com/400x400/1a1a1a/ffffff?text=Chain",
            status: "RESERVED" as const,
            created_at: new Date().toISOString()
          }
        ].map((product) => (
          <Card key={product.id} className="overflow-hidden">
            <div className="aspect-square overflow-hidden">
              <img
                src={product.image_url}
                alt={product.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "https://via.placeholder.com/400x400/1a1a1a/ffffff?text=No+Image";
                }}
              />
            </div>
            <CardContent className="p-4">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="font-bold text-lg">{product.name}</h3>
                  <p className="text-sm text-foreground/60">{product.category}</p>
                </div>
                <span
                  className={`px-2 py-1 rounded text-xs font-medium ${
                    product.status === "READY"
                      ? "bg-green-500/20 text-green-500"
                      : product.status === "RESERVED"
                      ? "bg-yellow-500/20 text-yellow-500"
                      : "bg-red-500/20 text-red-500"
                  }`}
                >
                  {product.status}
                </span>
              </div>

              <p className="text-2xl font-bold text-white mb-2">
                Rp {product.price.toLocaleString("id-ID")}
              </p>

              <p className="text-sm text-foreground/70 mb-4 line-clamp-2">
                {product.description}
              </p>

              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleEdit(product)}
                  className="flex-1"
                >
                  Edit
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => handleDelete(product.id)}
                  className="flex-1"
                >
                  Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
