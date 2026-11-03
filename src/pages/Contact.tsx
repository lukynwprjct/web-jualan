import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function Contact() {
  return (
    <div className="container mx-auto py-12 px-4">
      <h1 className="text-4xl font-bold mb-8 text-center">Contact Us</h1>
      
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Get In Touch</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="font-semibold mb-2">WhatsApp (Primary)</h3>
              <p className="text-foreground/80">6285178965265</p>
              <p className="text-sm text-foreground/60">Mon-Sat: 09:00 - 18:00 WIB</p>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Email</h3>
              <p className="text-foreground/80">info@luxky.com</p>
              <p className="text-sm text-foreground/60">We'll respond within 24 hours</p>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Address</h3>
              <p className="text-foreground/80">
                Jl. Premium No. 123<br />
                Malang Kota, 65111<br />
                Indonesia
              </p>
            </div>

            <a 
              href="https://wa.me/6285178965265"
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full"
            >
              <Button className="w-full" size="lg">
                Chat on WhatsApp
              </Button>
            </a>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
