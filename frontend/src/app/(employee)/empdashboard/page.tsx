"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import EmployeeSidebar from "@/components/EmployeeSidebar";

interface Order {
  id: string;
  customerName: string;
  status: "pending" | "in-progress" | "completed";
  total: number;
  date: string;
}

interface LowStockItem {
  id: string;
  name: string;
  quantity: number;
  reorderLevel: number;
}

export default function DashboardPage() {
  const router = useRouter();
  const [userName, setUserName] = useState("Employee");
  const [orders, setOrders] = useState<Order[]>([]);
  const [lowStockItems, setLowStockItems] = useState<LowStockItem[]>([]);

  useEffect(() => {
    //placeholder
    setUserName("Sarah Johnson");

    //placeholder
    setOrders([
      {
        id: "ORD-001",
        customerName: "Green Garden Co.",
        status: "pending",
        total: 245.5,
        date: "2026-04-08",
      },
      {
        id: "ORD-002",
        customerName: "Healthy Eats Cafe",
        status: "in-progress",
        total: 189.99,
        date: "2026-04-08",
      },
      {
        id: "ORD-003",
        customerName: "Organic Market",
        status: "completed",
        total: 325.75,
        date: "2026-04-07",
      },
    ]);

    //filters lowstock
    fetchInventoryData();

    //referesh inventory data
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        fetchInventoryData();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    //refetch on focus and every 30 seconds
    window.addEventListener("focus", fetchInventoryData);
    const interval = setInterval(fetchInventoryData, 30000);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", fetchInventoryData);
      clearInterval(interval);
    };
  }, []);

  const fetchInventoryData = async () => {
    try {
      const response = await fetch("/api/inventory");
      if (!response.ok) {
        throw new Error("Failed to fetch inventory");
      }
      const data = (await response.json()) as LowStockItem[];
      const lowStock = data.filter(
        (item) => item.quantity <= item.reorderLevel,
      );
      setLowStockItems(lowStock);
    } catch (error) {
      console.error("Failed to fetch inventory:", error);
      setLowStockItems([]);
    }
  };

  const pendingOrders = orders.filter((o) => o.status === "pending").length;
  const completedOrders = orders.filter((o) => o.status === "completed").length;

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-700";
      case "in-progress":
        return "bg-blue-100 text-blue-700";
      case "completed":
        return "bg-green-100 text-green-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  return (
    <div className="flex min-h-screen bg-cream font-dm">
      <EmployeeSidebar active="dashboard" />

      {/* Main Content */}
      <div className="flex-1 p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-playfair text-4xl text-forest mb-2">
            Welcome, {userName}!
          </h1>
          <p className="text-[#666]">
            {new Date().toLocaleDateString("en-US", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-md border-l-4 border-sage">
            <p className="text-[#666] text-sm font-medium mb-2">
              Pending Orders
            </p>
            <p className="font-playfair text-3xl text-forest">
              {pendingOrders}
            </p>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-md border-l-4 border-mint">
            <p className="text-[#666] text-sm font-medium mb-2">
              Completed Today
            </p>
            <p className="font-playfair text-3xl text-forest">
              {completedOrders}
            </p>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-md border-l-4 border-warm">
            <p className="text-[#666] text-sm font-medium mb-2">
              Low Stock Items
            </p>
            <p className="font-playfair text-3xl text-forest">
              {lowStockItems.length}
            </p>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-md border-l-4 border-blue-400">
            <p className="text-[#666] text-sm font-medium mb-2">
              Total Revenue
            </p>
            <p className="font-playfair text-3xl text-forest">$760.24</p>
          </div>
        </div>

        {/* Main Sections */}
        <div className="grid grid-cols-3 gap-8">
          {/* Low Stock Alert */}
          <div className="col-span-2">
            <div className="bg-white rounded-xl shadow-md p-6 mb-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-playfair text-xl text-forest">
                  Low Stock Items
                </h2>
                <Link
                  href="/inventory?lowStockOnly=true"
                  className="text-sage font-medium text-sm hover:text-forest transition-colors"
                >
                  View All →
                </Link>
              </div>

              {lowStockItems.length > 0 ? (
                <div className="space-y-3">
                  {lowStockItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200"
                    >
                      <div>
                        <p className="font-medium text-[#1a1a14]">
                          {item.name}
                        </p>
                        <p className="text-xs text-[#666]">
                          Reorder Level: {item.reorderLevel}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-red-700 text-lg">
                          {item.quantity}
                        </p>
                        <p className="text-xs text-red-600">units left</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[#666] py-4">All items are in stock!</p>
              )}
            </div>

            {/* Today's Orders */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-playfair text-xl text-forest">
                  Today&apos;s Orders
                </h2>
                <Link
                  href="/orders"
                  className="text-sage font-medium text-sm hover:text-forest transition-colors"
                >
                  View All →
                </Link>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[#ddd]">
                      <th className="text-left py-3 px-4 font-medium text-forest">
                        Order ID
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-forest">
                        Customer
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-forest">
                        Status
                      </th>
                      <th className="text-right py-3 px-4 font-medium text-forest">
                        Total
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.slice(0, 5).map((order) => (
                      <tr
                        key={order.id}
                        className="border-b border-[#ddd] hover:bg-cream/50"
                      >
                        <td className="py-3 px-4 font-medium text-[#1a1a14]">
                          {order.id}
                        </td>
                        <td className="py-3 px-4 text-[#666]">
                          {order.customerName}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`inline-block px-3 py-1 rounded-full text-xs font-medium capitalize ${getStatusBadgeColor(order.status)}`}
                          >
                            {order.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right font-medium text-[#1a1a14]">
                          ${order.total.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div>
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="font-playfair text-xl text-forest mb-4">
                Quick Actions
              </h2>

              <div className="space-y-3">
                <Link
                  href="/inventory"
                  className="block p-4 rounded-lg bg-sage/10 border border-sage/30 hover:bg-sage/20 transition-colors text-center"
                >
                  <p className="font-medium text-forest text-sm font-bold">
                    Manage Inventory
                  </p>
                </Link>

                <Link
                  href="/orders/new"
                  className="block p-4 rounded-lg bg-mint/10 border border-mint/30 hover:bg-mint/20 transition-colors text-center"
                >
                  <p className="font-medium text-forest text-sm font-bold">
                    Create Order
                  </p>
                </Link>

                <Link
                  href="/reports"
                  className="block p-4 rounded-lg bg-blue-100/50 border border-blue-200/50 hover:bg-blue-100 transition-colors text-center"
                >
                  <p className="font-medium text-forest text-sm font-bold">
                    View Reports
                  </p>
                </Link>

                <Link
                  href="/routing"
                  className="block p-4 rounded-lg bg-warm/10 border border-warm/30 hover:bg-warm/20 transition-colors text-center"
                >
                  <p className="font-medium text-forest text-sm font-bold">
                    Schedule Delivery
                  </p>
                </Link>
              </div>
            </div>

            {/* Info Card */}
            <div className="bg-sage/10 rounded-xl p-6 mt-6 border border-sage/20">
              <p className="text-sm text-forest">
                <strong>Need help?</strong> Check our documentation or contact
                support.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
