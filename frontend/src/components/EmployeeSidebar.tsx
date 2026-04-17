"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

interface EmployeeSidebarProps {
  active: "dashboard" | "inventory" | "orders" | "routing" | "reports";
}

const NAV_ITEMS = [
  { key: "dashboard", label: "Dashboard", href: "/empdashboard" },
  { key: "inventory", label: "Inventory", href: "/inventory" },
  { key: "routing", label: "Deliveries", href: "/routing" },
  { key: "reports", label: "Reports", href: "/reports" },
] as const;

export default function EmployeeSidebar({ active }: EmployeeSidebarProps) {
  const router = useRouter();
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
    router.push("/login-register");
  };

  return (
    <header className="sticky top-0 z-50 border-b border-warm/70 bg-cream/85 backdrop-blur-xl">
      <div className="flex items-center justify-between px-6 py-4">
        {" "}
        <div className="flex items-center gap-8">
          <Link
            href="/"
            className="font-playfair text-2xl tracking-tight text-forest"
          >
            OFS<span className="text-clay italic">.</span>
          </Link>

          <nav className="hidden md:flex items-center gap-2">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.key}
                href={item.href}
                className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                  active === item.key
                    ? "bg-forest text-cream"
                    : "text-forest/65 hover:bg-white/70 hover:text-forest"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
        <button
          onClick={handleLogout}
          className="rounded-full bg-forest px-4 py-2 text-sm font-medium text-cream transition-colors hover:bg-sage"
        >
          Logout
        </button>
      </div>
    </header>
  );
}
