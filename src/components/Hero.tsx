import HeroBlackhole from "./HeroBlackhole"

export default function Hero() {
  return (
    <section className="relative h-[500px] w-full overflow-hidden bg-black">
      <div className="absolute inset-0 z-0">
        <HeroBlackhole />
      </div>

      <div className="relative z-10 container mx-auto px-4 h-full flex items-center">
        <div className="max-w-2xl text-center md:text-left">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
            Premium Products
            <span className="block text-primary">For Discerning Taste</span>
          </h1>
          <p className="text-lg md:text-xl text-foreground/70 mb-8">
            Discover our collection of luxury watches, jewelry, and accessories.
            Inquiry only - no checkout required.
          </p>
          <div className="flex gap-4 justify-center md:justify-start">
            <a
              href="/products"
              className="px-6 py-3 rounded-md bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
            >
              View Products
            </a>
            <a
              href="https://wa.me/6285178965265?text=Halo,%20saya%20ingin%20bertanya%20tentang%20produk"
              className="px-6 py-3 rounded-md bg-secondary text-secondary-foreground font-medium hover:bg-secondary/80 transition-colors"
              target="_blank"
              rel="noopener noreferrer"
            >
              Contact Bot
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}
