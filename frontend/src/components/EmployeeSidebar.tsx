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
    logout(); // clears token + user from context
    router.push("/login-register");
  };

  return (
    <aside className="w-64 bg-forest text-cream p-6 shadow-lg min-h-screen">
      <div className="mb-8">
        <h2 className="font-playfair text-2xl font-bold mb-2">OFS</h2>
        <p className="text-cream/80 text-sm">Organic Food Service</p>
      </div>

      <nav className="space-y-2">
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.key}
            href={item.href}
            className={`block px-4 py-3 rounded-lg font-medium transition-colors ${
              active === item.key
                ? "bg-sage text-white"
                : "text-cream hover:bg-forest/80"
            }`}
          >
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="mt-8 pt-6 border-t border-cream/20">
        <button
          onClick={handleLogout}
          className="w-full px-4 py-2 rounded-lg bg-warm/30 text-cream font-medium transition-colors hover:bg-warm/50"
        >
          Logout
        </button>
      </div>
    </aside>
  );
}
