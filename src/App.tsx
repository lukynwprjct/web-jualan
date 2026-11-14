import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { MainNav } from './components/MainNav'
import { AdminLink } from './components/AdminLink'
import { ShoppingBag } from 'lucide-react'
import Hero from './components/Hero'
import ProductGrid from './components/ProductGrid'
import AdminLogin from './pages/AdminLogin'
import AdminRegister from './pages/AdminRegister'
import AdminDashboard from './pages/AdminDashboard'
import AdminProducts from './pages/Products'
import AdminCategories from './pages/Categories'
import AdminCustomers from './pages/Customers'
import AdminInquiries from './pages/Inquiries'
import AdminBrandSettings from './pages/BrandSettings'
import AdminBotSettings from './pages/BotSettings'
import InquiryForm from './pages/InquiryForm'
import About from './pages/About'
import Contact from './pages/Contact'
import Register from './pages/Register'
import ChatBot from './components/ChatBot'
import ProtectedRoute from './components/ProtectedRoute'
import { useBrandSettings } from './lib/brandSettings'

function App() {
  const { data: settings } = useBrandSettings()
  
  const brandName = settings?.find(s => s.key === 'brand_name')?.value || 'Luxky'
  const logoUrl = settings?.find(s => s.key === 'logo_url')?.value || ''
  
  // Hide navigation on admin pages
  const hideNav = typeof window !== 'undefined' && window.location.pathname.startsWith('/admin')
  
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-background flex flex-col">
        {!hideNav && (
          <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container mx-auto px-4 h-16 flex items-center justify-between">
              <a href="/" className="flex items-center gap-2">
                {logoUrl ? (
                  <img src={logoUrl} alt={brandName} className="h-10 w-10 object-contain" />
                ) : null}
              </a>
              
              <MainNav />
              
              <div className="flex items-center gap-4">
                <AdminLink />
                <a
                  href="https://wa.me/6285178965265"
                  className="hover:text-primary transition-colors"
                >
                  <ShoppingBag className="h-6 w-6" />
                </a>
              </div>
            </div>
          </header>
        )}

        <main className="flex-grow">
          <Routes>
            <Route path="/" element={
              <>
                <Hero />
                <ProductGrid />
              </>
            } />
            
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin/register" element={<AdminRegister />} />
            <Route path="/admin/dashboard" element={
              <ProtectedRoute>
                <AdminDashboard />
              </ProtectedRoute>
            } />
            <Route path="/admin/products" element={
              <ProtectedRoute>
                <AdminProducts />
              </ProtectedRoute>
            } />
            <Route path="/admin/categories" element={
              <ProtectedRoute>
                <AdminCategories />
              </ProtectedRoute>
            } />
            <Route path="/admin/customers" element={
              <ProtectedRoute>
                <AdminCustomers />
              </ProtectedRoute>
            } />
            <Route path="/admin/inquiries" element={
              <ProtectedRoute>
                <AdminInquiries />
              </ProtectedRoute>
            } />
            <Route path="/admin/brand-settings" element={
              <ProtectedRoute>
                <AdminBrandSettings />
              </ProtectedRoute>
            } />
            <Route path="/admin/bot-settings" element={
              <ProtectedRoute>
                <AdminBotSettings />
              </ProtectedRoute>
            } />
            <Route path="/inquiry/:id" element={<InquiryForm />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/register" element={<Register />} />
          </Routes>
        </main>

        {/* Chatbot AI - melayang di semua halaman publik */}
        {!hideNav && <ChatBot />}

        <footer className="border-t border-border/40 bg-background">
          <div className="container mx-auto px-4 py-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              <div>
                <a href="/" className="flex items-center gap-2 mb-4">
                  {logoUrl ? (
                    <img src={logoUrl} alt={brandName} className="h-8 w-8 object-contain" />
                  ) : null}
                  <h3 className="text-lg font-bold">{brandName}</h3>
                </a>
                <p className="text-sm text-foreground/60">
                  Premium e-commerce platform
                </p>
              </div>
              
              <div>
                <h4 className="font-semibold mb-4">Shop</h4>
                <ul className="space-y-2">
                  <li><a href="/products" className="text-sm text-foreground/60 hover:text-primary">All Products</a></li>
                  <li><a href="/categories" className="text-sm text-foreground/60 hover:text-primary">Categories</a></li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold mb-4">About</h4>
                <ul className="space-y-2">
                  <li><a href="/about" className="text-sm text-foreground/60 hover:text-primary">About Us</a></li>
                  <li><a href="/contact" className="text-sm text-foreground/60 hover:text-primary">Contact</a></li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold mb-4">Connect</h4>
                <ul className="space-y-2">
                  <li><a href="https://luxky.sija-smkn11malang.my.id/" target="_blank" className="text-sm text-foreground/60 hover:text-primary">View CV</a></li>
                  <li><a href="https://wa.me/6285178965265" className="text-sm text-foreground/60 hover:text-primary">WhatsApp</a></li>
                </ul>
              </div>
            </div>
            
            <div className="mt-8 pt-8 border-t border-border/40 text-center text-sm text-foreground/60">
              <p>© 2026 Luxky E-Commerce. All rights reserved.</p>
            </div>
          </div>
        </footer>
      </div>
    </BrowserRouter>
  )
}

export default App
