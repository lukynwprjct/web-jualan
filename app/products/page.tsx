import ProductGrid from "@/components/ProductGrid";
import { Button } from "@/components/ui/button";

export default function ProductsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <div>
          <h1 className="text-4xl font-bold mb-2">All Products</h1>
          <p className="text-foreground/70">
            Browse our premium collection
          </p>
        </div>
        <Button variant="outline" className="hidden md:inline-flex">
          Filter
        </Button>
      </div>
      <ProductGrid />
    </div>
  );
}
