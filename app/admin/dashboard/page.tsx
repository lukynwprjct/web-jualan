import { useState, useEffect } from "react";
import { redirect } from "next/navigation";
import Link from "next/link";

export default function AdminDashboardPage() {
  // Mock session - akan diganti dengan auth Supabase nanti
  const [session] = useState({
    user: {
      id: "mock-user-id",
      email: "admin@luxky.com",
      role: "SUPERADMIN",
      user_metadata: {
        role: "SUPERADMIN"
      }
    }
  });

  if (!session?.user) {
    redirect("/admin/login");
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
        <p className="text-foreground/70">
          Welcome, {session.user.email} ({session.user.role})
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-gray-800 p-4 rounded-lg">
          <h3 className="text-lg font-semibold mb-2">Products</h3>
          <p className="text-3xl font-bold text-white">0</p>
          <Link href="/admin/products" className="text-primary hover:underline text-sm">
            Manage Products
          </Link>
        </div>

        <div className="bg-gray-800 p-4 rounded-lg">
          <h3 className="text-lg font-semibold mb-2">Categories</h3>
          <p className="text-3xl font-bold text-white">0</p>
          <Link href="/admin/categories" className="text-primary hover:underline text-sm">
            Manage Categories
          </Link>
        </div>

        <div className="bg-gray-800 p-4 rounded-lg">
          <h3 className="text-lg font-semibold mb-2">Inquiries</h3>
          <p className="text-3xl font-bold text-white">0</p>
          <Link href="/admin/inquiries" className="text-primary hover:underline text-sm">
            View Inquiries
          </Link>
        </div>

        <div className="bg-gray-800 p-4 rounded-lg">
          <h3 className="text-lg font-semibold mb-2">Customers</h3>
          <p className="text-3xl font-bold text-white">0</p>
          <Link href="/admin/customers" className="text-primary hover:underline text-sm">
            View Customers
          </Link>
        </div>
      </div>

      <div className="bg-gray-800 p-6 rounded-lg mb-8">
        <h2 className="text-xl font-bold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link
            href="/admin/products/new"
            className="bg-primary text-primary-foreground px-4 py-2 rounded-md text-center hover:bg-primary/90"
          >
            Add Product
          </Link>
          <Link
            href="/admin/categories/new"
            className="bg-primary text-primary-foreground px-4 py-2 rounded-md text-center hover:bg-primary/90"
          >
            Add Category
          </Link>
          <Link
            href="/admin/settings"
            className="bg-primary text-primary-foreground px-4 py-2 rounded-md text-center hover:bg-primary/90"
          >
            Store Settings
          </Link>
          <button className="bg-destructive text-destructive-foreground px-4 py-2 rounded-md text-center hover:bg-destructive/90">
            Logout
          </button>
        </div>
      </div>

      <div className="bg-gray-800 p-6 rounded-lg">
        <h2 className="text-xl font-bold mb-4">System Status</h2>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-foreground/70">Supabase Connection:</span>
            <span className="text-green-500">✓ Connected</span>
          </div>
          <div className="flex justify-between">
            <span className="text-foreground/70">WhatsApp Bot:</span>
            <span className="text-yellow-500">⚠ Offline</span>
          </div>
          <div className="flex justify-between">
            <span className="text-foreground/70">Last Sync:</span>
            <span className="text-foreground/60">Never</span>
          </div>
        </div>
      </div>
    </div>
  );
}
