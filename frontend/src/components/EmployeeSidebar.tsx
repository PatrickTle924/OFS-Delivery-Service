"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

interface EmployeeSidebarProps {
  active: "dashboard" | "inventory" | "orders" | "routing";
}

const NAV_ITEMS = [
  { key: "dashboard", label: "Dashboard", href: "/empdashboard" },
  { key: "inventory", label: "Inventory", href: "/inventory" },
  { key: "orders", label: "Orders", href: "/orders" },
  { key: "routing", label: "Deliveries", href: "/routing" },
] as const;

export default function EmployeeSidebar({ active }: EmployeeSidebarProps) {
  const router = useRouter();

  const handleLogout = () => {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem("ofsUser");
      window.dispatchEvent(new Event("ofs-auth-changed"));
    }

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
