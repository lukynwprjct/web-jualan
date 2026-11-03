"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { UserCog } from "lucide-react";

export function AdminLink() {
  const pathname = usePathname();
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Mock session check - akan diganti dengan Supabase auth nanti
    const checkAuth = async () => {
      try {
        const storedUser = localStorage.getItem("luxky_admin_user");
        if (storedUser) {
          const user = JSON.parse(storedUser);
          setIsAdmin(user.role === "ADMIN" || user.role === "SUPERADMIN");
        }
      } catch (error) {
        console.error("Auth check error:", error);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [pathname]);

  const isAdminPage = pathname?.startsWith("/admin");

  if (loading) return null;

  // If admin and not on admin pages, show link
  if (isAdmin && !isAdminPage) {
    return (
      <Link
        href="/admin/dashboard"
        className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-secondary hover:bg-secondary/80 transition-colors text-xs font-medium"
      >
        <UserCog className="h-4 w-4" />
        Admin
      </Link>
    );
  }

  // If not admin and not on login page, redirect to login
  if (!isAdmin && !isAdminPage && pathname !== "/admin/login") {
    router.push("/admin/login");
    return null;
  }

  return null;
}
