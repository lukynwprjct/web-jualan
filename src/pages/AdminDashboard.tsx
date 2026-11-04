import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  Package, 
  Users, 
  ShoppingBag, 
  TrendingUp, 
  Settings, 
  LogOut,
  CheckCircle,
  AlertCircle,
  Clock,
  Grid3X3
} from 'lucide-react'
import { useAuthStore } from '@/lib/auth'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useState, useEffect } from 'react'

interface Stats {
  totalProducts: number
  totalCustomers: number
  totalInquiries: number
  pendingInquiries: number
  reservedProducts: number
  soldProducts: number
  newCustomers: number
}

export default function AdminDashboard() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const [stats, setStats] = useState<Stats>({
    totalProducts: 0,
    totalCustomers: 0,
    totalInquiries: 0,
    pendingInquiries: 0,
    reservedProducts: 0,
    soldProducts: 0,
  })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  async function fetchStats() {
    setIsLoading(true)
    
    // Get latest customers (registered in last 24 hours)
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    
    const { data: newCustomers, error: customerError } = await supabase
      .from('customers')
      .select('count', { count: 'exact' })
      .gte('created_at', yesterday.toISOString())

    // Parallel queries for better performance
    const [products, customers, inquiries] = await Promise.all([
      supabase.from('products').select('count', { count: 'exact' }),
      supabase.from('customers').select('count', { count: 'exact' }),
      supabase.from('inquiries').select('count', { count: 'exact' })
    ])

    const pendingInquiries = await supabase
      .from('inquiries')
      .select('count', { count: 'exact' })
      .eq('status', 'PENDING')

    const reservedProducts = await supabase
      .from('products')
      .select('count', { count: 'exact' })
      .eq('status', 'RESERVED')

    const soldProducts = await supabase
      .from('products')
      .select('count', { count: 'exact' })
      .eq('status', 'SOLD')

    setStats({
      totalProducts: products.count || 0,
      totalCustomers: customers.count || 0,
      totalInquiries: inquiries.count || 0,
      pendingInquiries: pendingInquiries.count || 0,
      reservedProducts: reservedProducts.count || 0,
      soldProducts: soldProducts.count || 0,
      newCustomers: newCustomers?.count || 0,
    })
    setIsLoading(false)
  }

  const handleLogout = async () => {
    await logout()
    navigate('/admin/login')
  }

  const StatCard = ({ title, value, icon: Icon, color }: any) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className={`h-4 w-4 text-${color}-500`} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
      </CardContent>
    </Card>
  )

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-foreground/60">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border/40 bg-background px-4 py-4">
        <div className="container mx-auto flex items-center justify-between">
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>
          <div className="flex items-center gap-4">
            <div className="text-sm">
              <p className="font-medium">{user?.email}</p>
              <p className="text-foreground/60">Superadmin</p>
            </div>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <StatCard 
            title="Total Products" 
            value={stats.totalProducts} 
            icon={Package} 
            color="blue" 
          />
          <StatCard 
            title="Total Customers" 
            value={stats.totalCustomers} 
            icon={Users} 
            color="green" 
          />
          {stats.newCustomers > 0 && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">New Today</CardTitle>
                <Users className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline gap-2">
                  <div className="text-2xl font-bold">{stats.newCustomers}</div>
                  <span className="text-xs text-green-600 font-medium">+{stats.newCustomers} today</span>
                </div>
              </CardContent>
            </Card>
          )}
          <StatCard 
            title="Total Inquiries" 
            value={stats.totalInquiries} 
            icon={ShoppingBag} 
            color="purple" 
          />
          <StatCard 
            title="Pending Inquiries" 
            value={stats.pendingInquiries} 
            icon={Clock} 
            color="yellow" 
          />
          <StatCard 
            title="Reserved Products" 
            value={stats.reservedProducts} 
            icon={AlertCircle} 
            color="orange" 
          />
          <StatCard 
            title="Sold Products" 
            value={stats.soldProducts} 
            icon={CheckCircle} 
            color="teal" 
          />
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-xl font-bold mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Button variant="outline" className="h-auto py-8" onClick={() => navigate('/admin/products')}>
              <Package className="h-8 w-8 mb-2" />
              <div className="text-left">
                <div className="font-semibold">Manage Products</div>
                <div className="text-sm text-foreground/60">Add, edit, delete products</div>
              </div>
            </Button>
            
            <Button variant="outline" className="h-auto py-8" onClick={() => navigate('/admin/categories')}>
              <Grid3X3 className="h-8 w-8 mb-2" />
              <div className="text-left">
                <div className="font-semibold">Categories</div>
                <div className="text-sm text-foreground/60">Manage product categories</div>
              </div>
            </Button>
            
            <Button variant="outline" className="h-auto py-8" onClick={() => navigate('/admin/customers')}>
              <Users className="h-8 w-8 mb-2" />
              <div className="text-left">
                <div className="font-semibold">Customers</div>
                <div className="text-sm text-foreground/60">Manage customer data</div>
              </div>
            </Button>
            
            <Button variant="outline" className="h-auto py-8" onClick={() => navigate('/admin/inquiries')}>
              <ShoppingBag className="h-8 w-8 mb-2" />
              <div className="text-left">
                <div className="font-semibold">Inquiries</div>
                <div className="text-sm text-foreground/60">View and respond to inquiries</div>
              </div>
            </Button>
            
            <Button variant="outline" className="h-auto py-8" onClick={() => navigate('/admin/brand-settings')}>
              <Settings className="h-8 w-8 mb-2" />
              <div className="text-left">
                <div className="font-semibold">Settings</div>
                <div className="text-sm text-foreground/60">Store settings and brand info</div>
              </div>
            </Button>
          </div>
        </div>

        {/* Recent Activity */}
        <div>
          <h2 className="text-xl font-bold mb-4">Recent Activity</h2>
          <div className="space-y-3">
            {[
              { title: 'New inquiry received', description: 'John Doe - Luxury Gold Watch', time: '2 hours ago' },
              { title: 'Product reserved', description: 'Diamond Bracelet (ID: 123)', time: '4 hours ago' },
              { title: 'New customer registered', description: 'Sarah Widya (0812-3456-7890)', time: '5 hours ago' },
              { title: 'Product updated', description: 'Classic Leather Bag price changed', time: '1 day ago' },
            ].map((activity, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-lg border border-border/40 bg-card/50 hover:bg-card">
                <div>
                  <div className="font-medium">{activity.title}</div>
                  <div className="text-sm text-foreground/60">{activity.description}</div>
                </div>
                <div className="text-sm text-foreground/40">{activity.time}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}