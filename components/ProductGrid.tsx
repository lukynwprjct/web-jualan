import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Star } from "lucide-react";

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

export default function ProductGrid() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch dari Supabase
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .eq('status', 'READY')
          .order('created_at', { ascending: false });
        
        if (error) {
          console.error("Error fetching products:", error);
          // Fallback ke mock data jika error
          const mockProducts: Product[] = [
            {
              id: "1",
              name: "Premium Watch",
              price: 5000000,
              category: "Watches",
              description: "Luxury timepiece with genuine leather strap",
              image_url: "https://via.placeholder.com/400x400/1a1a1a/ffffff?text=Watch",
              status: "READY",
              created_at: new Date().toISOString()
            },
            {
              id: "2",
              name: "Designer Bag",
              price: 8000000,
              category: "Accessories",
              description: "High-quality leather designer bag",
              image_url: "https://via.placeholder.com/400x400/1a1a1a/ffffff?text=Bag",
              status: "READY",
              created_at: new Date().toISOString()
            },
            {
              id: "3",
              name: "Gold Chain",
              price: 12000000,
              category: "Jewelry",
              description: "24K gold premium chain",
              image_url: "https://via.placeholder.com/400x400/1a1a1a/ffffff?text=Chain",
              status: "RESERVED",
              created_at: new Date().toISOString()
            }
          ];
          setProducts(mockProducts);
        } else if (data) {
          setProducts(data);
        }
      } catch (error) {
        console.error("Error fetching products:", error);
        // Fallback ke mock data jika error
        const mockProducts: Product[] = [
          {
            id: "1",
            name: "Premium Watch",
            price: 5000000,
            category: "Watches",
            description: "Luxury timepiece with genuine leather strap",
            image_url: "https://via.placeholder.com/400x400/1a1a1a/ffffff?text=Watch",
            status: "READY",
            created_at: new Date().toISOString()
          },
          {
            id: "2",
            name: "Designer Bag",
            price: 8000000,
            category: "Accessories",
            description: "High-quality leather designer bag",
            image_url: "https://via.placeholder.com/400x400/1a1a1a/ffffff?text=Bag",
            status: "READY",
            created_at: new Date().toISOString()
          },
          {
            id: "3",
            name: "Gold Chain",
            price: 12000000,
            category: "Jewelry",
            description: "24K gold premium chain",
            image_url: "https://via.placeholder.com/400x400/1a1a1a/ffffff?text=Chain",
            status: "RESERVED",
            created_at: new Date().toISOString()
          }
        ];
        setProducts(mockProducts);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  if (loading) {
    return (
      <section className="w-full py-12 md:py-24 bg-gray-900">
        <div className="container mx-auto px-4 text-center">
          <p className="text-foreground/60">Loading products...</p>
        </div>
      </section>
    );
  }

  return (
    <section className="w-full py-12 md:py-24 bg-gray-900">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
          Featured Products
        </h2>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {products.map((product) => (
            <div key={product.id} className="group relative bg-gray-800 rounded-lg overflow-hidden transition-all hover:shadow-xl">
              <div className="relative aspect-square overflow-hidden">
                <img
                  src={product.image_url}
                  alt={product.name}
                  className="object-cover w-full h-full transition-transform group-hover:scale-105"
                  loading="lazy"
                />
                {product.status !== "READY" && (
                  <div className="absolute inset-0 bg-black/80 flex items-center justify-center">
                    <span className="text-white font-medium bg-gray-700 px-3 py-1 rounded-full text-sm">
                      {product.status}
                    </span>
                  </div>
                )}
              </div>
              
              <div className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="text-sm text-foreground/60 mb-1">{product.category}</p>
                    <h3 className="text-xl font-bold text-white">{product.name}</h3>
                  </div>
                  {product.status === "READY" && (
                    <Star className="h-5 w-5 text-yellow-500" />
                  )}
                </div>
                
                <p className="text-2xl font-bold text-white mb-2">
                  Rp {product.price.toLocaleString("id-ID")}
                </p>
                
                <p className="text-sm text-foreground/70 mb-4 line-clamp-2">
                  {product.description}
                </p>
                
                {product.status === "READY" ? (
                  <Link
                    href={`/products/${product.id}`}
                    className="block w-full text-center bg-white text-black py-2 rounded-md hover:bg-gray-200 transition-colors font-medium"
                  >
                    Inquiry Now
                  </Link>
                ) : (
                  <button
                    disabled
                    className="block w-full text-center bg-gray-700 text-gray-400 py-2 rounded-md cursor-not-allowed font-medium"
                  >
                    {product.status === "SOLD" ? "Sold Out" : "Reserved"}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
        
        {products.length === 0 && (
          <div className="text-center py-12">
            <p className="text-foreground/60">No products available yet.</p>
          </div>
        )}
      </div>
    </section>
  );
}
