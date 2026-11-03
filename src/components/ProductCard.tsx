import { Card, CardContent, CardFooter, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ShoppingBag, MessageSquare } from "lucide-react"
import { useNavigate } from "react-router-dom"

interface ProductCardProps {
  id: number
  name: string
  price: number
  image: string
  category: string
  status: "READY" | "RESERVED" | "SOLD"
}

export default function ProductCard({ id, name, price, image, category, status }: ProductCardProps) {
  const navigate = useNavigate()
  
  const handleInquiry = () => {
    navigate(`/inquiry/${id}`)
  }

  const handleWhatsApp = () => {
    const whatsappNumber = "6285178965265"
    const productName = encodeURIComponent(name)
    const productPrice = encodeURIComponent(`Rp ${(price / 1000).toFixed(0)}K`)
    const message = `Halo,%20saya%20tertarik%20dengan%20produk:\n\n*${name}*\nHarga: ${productPrice}\n\nBisa%20berikan%20informasi%20lebih%20detail%20ya?`
    window.open(`https://wa.me/${whatsappNumber}?text=${message}`, "_blank")
  }

  return (
    <Card className="bg-card overflow-hidden">
      <div className="aspect-square overflow-hidden relative">
        <img
          src={image}
          alt={name}
          className="w-full h-full object-cover transition-transform hover:scale-105"
          loading="lazy"
        />
        <div className="absolute top-2 right-2">
          <span
            className={`text-xs font-medium px-2 py-1 rounded-full ${
              status === "READY"
                ? "bg-green-900/80 text-green-100"
                : status === "RESERVED"
                ? "bg-yellow-900/80 text-yellow-100"
                : "bg-red-900/80 text-red-100"
            }`}
          >
            {status}
          </span>
        </div>
      </div>
      <CardContent className="p-4">
        <div className="mb-2">
          <span className="text-xs font-medium px-2 py-1 rounded-full bg-secondary text-secondary-foreground">
            {category}
          </span>
        </div>
        <CardTitle className="text-lg mb-2">{name}</CardTitle>
        <div className="flex items-center justify-between">
          <span className="text-xl font-bold">
            Rp {(price / 1000).toFixed(0)}K
          </span>
        </div>
      </CardContent>
      <CardFooter className="p-4 pt-0 flex flex-col gap-2">
        {status === "READY" ? (
          <>
            <Button className="w-full" onClick={handleInquiry}>
              <ShoppingBag className="h-4 w-4 mr-2" />
              Inquiry
            </Button>
            <Button variant="outline" className="w-full" onClick={handleWhatsApp}>
              <MessageSquare className="h-4 w-4 mr-2" />
              Chat WhatsApp
            </Button>
          </>
        ) : (
          <Button variant="outline" className="w-full" disabled>
            {status}
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}
