import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function About() {
  return (
    <div className="container mx-auto py-12 px-4">
      <h1 className="text-4xl font-bold mb-8 text-center">About Luxky</h1>
      
      <div className="max-w-4xl mx-auto space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>Who We Are</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg text-foreground/80 mb-4">
              Luxky adalah platform e-commerce terpercaya yang menyediakan berbagai macam 
              barang bekas berkualitas (preloved / secondhand) untuk kebutuhan gaya hidup, 
              hobi, hingga otomotif.
            </p>
            <p className="text-foreground/70">
              Mulai dari perlengkapan vape, pakaian/fashion, hingga sparepart motor bekas 
              layak pakai—kami siap membantu Anda menemukan barang impian dengan harga 
              yang jauh lebih terjangkau namun tetap mengutamakan kualitas dan kondisi 
              barang yang baik.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Our Mission</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-foreground/80 mb-4">
              Menjadi destinasi belanja barang secondhand pilihan yang transparan, 
              terpercaya, dan hemat di kantong.
            </p>
            <p className="text-foreground/70">
              Kami berkomitmen memberikan informasi kondisi barang secara jujur agar 
              setiap pelanggan mendapatkan transaksi yang memuaskan.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>What We Offer</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="p-4 bg-muted/30 rounded-lg">
              <h4 className="font-semibold mb-2">Vape & Equipment Second</h4>
              <p className="text-foreground/80 text-sm">
                Perangkat vape dan perlengkapan hobi bekas dengan kondisi siap pakai dan terawat.
              </p>
            </div>

            <div className="p-4 bg-muted/30 rounded-lg">
              <h4 className="font-semibold mb-2">Preloved Fashion & Apparel</h4>
              <p className="text-foreground/80 text-sm">
                Pakaian dan aksesori bekas pilihan dengan gaya kekinian dan harga bersahabat.
              </p>
            </div>

            <div className="p-4 bg-muted/30 rounded-lg">
              <h4 className="font-semibold mb-2">Sparepart & Aksesori Motor Bekas</h4>
              <p className="text-foreground/80 text-sm">
                Komponen dan suku cadang motor secondhand siap pakai untuk kebutuhan harian maupun modifikasi.
              </p>
            </div>

            <div className="p-4 bg-muted/30 rounded-lg">
              <h4 className="font-semibold mb-2">Koleksi Barang Serba Ada</h4>
              <p className="text-foreground/80 text-sm">
                Pilihan barang bekas bervariasi yang terus diperbarui sesuai ketersediaan stok (limited inventory).
              </p>
            </div>

            <div className="p-4 bg-muted/30 rounded-lg">
              <h4 className="font-semibold mb-2">Transparansi Kondisi & Pengiriman Aman</h4>
              <p className="text-foreground/80 text-sm">
                Keterangan fisik barang yang jelas serta proses pengiriman yang rapi dan aman sampai ke tangan Anda.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
