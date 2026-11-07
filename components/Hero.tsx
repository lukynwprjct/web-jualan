import Link from "next/link";
import HeroBlackhole from "@/components/HeroBlackhole";

export default function Hero() {
  return (
    <section className="relative w-full py-12 md:py-24 lg:py-32 bg-black overflow-hidden">
      {/* Background Canvas - Blackhole WebGL */}
      <HeroBlackhole />
      
      <div className="container mx-auto px-4 relative z-10 text-center">
        <h1 className="text-4xl md:text-6xl lg:text-8xl font-bold tracking-tight text-white mb-6">
          LUXKY
        </h1>
        <p className="text-xl md:text-2xl text-foreground/80 max-w-2xl mx-auto mb-8">
          Premium products for the modern elite. Inquiry-based shopping experience via WhatsApp.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/products" className="inline-flex h-10 items-center justify-center rounded-md bg-white px-8 text-sm font-medium text-black shadow transition-colors hover:bg-gray-200 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gray-950 disabled:pointer-events-none disabled:opacity-50">
            Explore Products
          </Link>
          <Link href="/contact" className="inline-flex h-10 items-center justify-center rounded-md border border-white bg-transparent px-8 text-sm font-medium text-white shadow-sm transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gray-950 disabled:pointer-events-none disabled:opacity-50">
            Contact Us
          </Link>
          <Link href="/admin/dashboard" className="inline-flex h-10 items-center justify-center rounded-md bg-blue-600 px-8 text-sm font-medium text-white shadow transition-colors hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-950 disabled:pointer-events-none disabled:opacity-50">
            Dashboard
          </Link>
        </div>
      </div>
    </section>
  );
}
