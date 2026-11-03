import Link from "next/link";
import { MainNav } from "@/components/MainNav";
import { AdminLink } from "@/components/AdminLink";
import { ShoppingBag } from "lucide-react";

export default function Navbar() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="text-xl font-bold">
          Luxky
        </Link>
        
        <MainNav />
        
        <div className="flex items-center gap-4">
          <AdminLink />
          <Link href="/cart" className="hover:text-primary">
            <ShoppingBag className="h-6 w-6" />
          </Link>
        </div>
      </div>
    </header>
  );
}
