export default function HeroBlackhole() {
  return (
    <div className="hero-blackhole w-full h-full" style={{ position: 'relative', overflow: 'hidden' }}>
      {/* Fallback background if WebGL fails */}
      <div 
        className="absolute inset-0 z-0 opacity-50"
        style={{
          background: 'radial-gradient(circle at center, #4a0000 0%, #000000 100%)'
        }}
      />
    </div>
  )
}