import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-border/40 bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-lg font-bold mb-4">Luxky</h3>
            <p className="text-sm text-foreground/60">
              Premium e-commerce platform
            </p>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4">Shop</h4>
            <ul className="space-y-2">
              <li><Link href="/products" className="text-sm text-foreground/60 hover:text-primary">All Products</Link></li>
              <li><Link href="/categories" className="text-sm text-foreground/60 hover:text-primary">Categories</Link></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4">About</h4>
            <ul className="space-y-2">
              <li><Link href="/about" className="text-sm text-foreground/60 hover:text-primary">Our Story</Link></li>
              <li><Link href="/contact" className="text-sm text-foreground/60 hover:text-primary">Contact</Link></li>
              <li><a href="https://luxky.sija-smkn11malang.my.id/" target="_blank" className="text-sm text-foreground/60 hover:text-primary">CV & Portfolio</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4">Connect</h4>
            <p className="text-sm text-foreground/60">
              WhatsApp: +62 851-7896-5265
            </p>
            <p className="text-sm text-foreground/60 mt-2">
              Email: info@luxky.com
            </p>
          </div>
        </div>
        
        <div className="border-t border-border/40 mt-8 pt-8 text-center">
          <p className="text-sm text-foreground/60">
            © {new Date().getFullYear()} Luxky E-Commerce. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
