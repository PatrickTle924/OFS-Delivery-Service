"use client";

import { useState, useEffect, useMemo } from "react";
import EmployeeRoute from "@/components/EmployeeRoute";
import { useAuth } from "@/context/AuthContext";
import {
  fetchInventory,
  fetchAllOrders,
  type EmployeeOrderItem,
} from "@/lib/api-service";
import EmployeeSidebar from "@/components/EmployeeSidebar";

interface Order {
  id: number;
  customerName: string;
  status: "pending" | "assigned" | "in_progress" | "delivered" | "cancelled";
  total: number;
  orderedAt: string | null;
  completedAt: string | null;
}

interface LowStockItem {
  id: string;
  name: string;
  quantity: number;
  reorderLevel: number;
}

const ORDERS_PER_PAGE = 6;

export default function DashboardPage() {
  const { user } = useAuth();

  const [userName, setUserName] = useState("Employee");
  const [orders, setOrders] = useState<Order[]>([]);
  const [lowStockItems, setLowStockItems] = useState<LowStockItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAllOrders, setShowAllOrders] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const isToday = (dateString: string | null) => {
    if (!dateString) return false;

    const date = new Date(dateString);
    const today = new Date();

    return (
      date.getFullYear() === today.getFullYear() &&
      date.getMonth() === today.getMonth() &&
      date.getDate() === today.getDate()
    );
  };

  const formatDateTime = (dateString: string | null) => {
    if (!dateString) return "—";

    return new Date(dateString).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      const [inventoryData, ordersData] = await Promise.all([
        fetchInventory(),
        fetchAllOrders(),
      ]);

      const lowStock = (inventoryData as LowStockItem[]).filter(
        (item) => item.quantity <= item.reorderLevel,
      );
      setLowStockItems(lowStock);

      const mappedOrders: Order[] = (ordersData as EmployeeOrderItem[]).map(
        (order) => ({
          id: order.id,
          customerName:
            order.customerName ?? `Customer #${order.customerId ?? "—"}`,
          status: order.status as Order["status"],
          total: order.price,
          orderedAt: order.orderedAt ?? null,
          completedAt: order.completedAt ?? null,
        }),
      );

      setOrders(mappedOrders);
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
      setLowStockItems([]);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      setUserName(`${user.firstName} ${user.lastName}`);
    }

    void loadDashboardData();

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        void loadDashboardData();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", loadDashboardData);

    const interval = window.setInterval(() => {
      void loadDashboardData();
    }, 30000);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", loadDashboardData);
      window.clearInterval(interval);
    };
  }, [user]);

  useEffect(() => {
    setCurrentPage(1);
  }, [showAllOrders]);

  const todaysOrders = useMemo(
    () => orders.filter((o) => isToday(o.orderedAt)),
    [orders],
  );

  const pendingOrders = todaysOrders.filter(
    (o) => o.status === "pending",
  ).length;
  const completedOrders = todaysOrders.filter(
    (o) => o.status === "delivered",
  ).length;

  const displayedOrdersBase = showAllOrders ? orders : todaysOrders;
  const totalPages = Math.max(
    1,
    Math.ceil(displayedOrdersBase.length / ORDERS_PER_PAGE),
  );

  const paginatedOrders = displayedOrdersBase.slice(
    (currentPage - 1) * ORDERS_PER_PAGE,
    currentPage * ORDERS_PER_PAGE,
  );

  const getStatusBadgeColor = (status: Order["status"]) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-700";
      case "assigned":
      case "in_progress":
        return "bg-blue-100 text-blue-700";
      case "delivered":
        return "bg-green-100 text-green-700";
      case "cancelled":
        return "bg-red-100 text-red-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const formatStatus = (status: Order["status"]) => {
    if (status === "in_progress") return "in progress";
    return status;
  };

  return (
    <EmployeeRoute>
      <div className="min-h-screen bg-cream font-dm">
        <EmployeeSidebar active="dashboard" />

        <main className="p-8">
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

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
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
                {loading ? "..." : lowStockItems.length}
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-md border-l-4 border-blue-400">
              <p className="text-[#666] text-sm font-medium mb-2">
                Total Orders Today
              </p>
              <p className="font-playfair text-3xl text-forest">
                {todaysOrders.length}
              </p>
            </div>
          </div>

          <div className="space-y-8">
            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-playfair text-xl text-forest">
                  Low Stock Items
                </h2>
                <a
                  href="/inventory?lowStockOnly=true"
                  className="text-sage font-medium text-sm hover:text-forest transition-colors"
                >
                  View All →
                </a>
              </div>

              {loading ? (
                <p className="text-[#666] py-4">Loading inventory...</p>
              ) : lowStockItems.length > 0 ? (
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

            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-playfair text-xl text-forest">
                  {showAllOrders ? "All Orders" : "Today's Orders"}
                </h2>
                <button
                  onClick={() => setShowAllOrders((prev) => !prev)}
                  className="text-sage font-medium text-sm hover:text-forest transition-colors"
                >
                  {showAllOrders ? "Show Today Only" : "View All →"}
                </button>
              </div>

              {loading ? (
                <p className="text-[#666] py-4">Loading orders...</p>
              ) : displayedOrdersBase.length === 0 ? (
                <p className="text-[#666] py-4">
                  {showAllOrders
                    ? "No orders found."
                    : "No orders placed today."}
                </p>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-[#ddd]">
                          <th className="text-left py-3 px-4 font-medium text-forest">
                            Order ID
                          </th>
                          <th className="text-left py-3 px-4 font-medium text-forest">
                            Placed By
                          </th>
                          <th className="text-left py-3 px-4 font-medium text-forest">
                            Status
                          </th>
                          <th className="text-left py-3 px-4 font-medium text-forest">
                            Originally Placed
                          </th>
                          <th className="text-left py-3 px-4 font-medium text-forest">
                            Completed At
                          </th>
                          <th className="text-right py-3 px-4 font-medium text-forest">
                            Total
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {paginatedOrders.map((order) => (
                          <tr
                            key={order.id}
                            className="border-b border-[#ddd] hover:bg-cream/50"
                          >
                            <td className="py-3 px-4 font-medium text-[#1a1a14]">
                              #{order.id}
                            </td>
                            <td className="py-3 px-4 text-[#666]">
                              {order.customerName}
                            </td>
                            <td className="py-3 px-4">
                              <span
                                className={`inline-block px-3 py-1 rounded-full text-xs font-medium capitalize ${getStatusBadgeColor(
                                  order.status,
                                )}`}
                              >
                                {formatStatus(order.status)}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-[#666]">
                              {formatDateTime(order.orderedAt)}
                            </td>
                            <td className="py-3 px-4 text-[#666]">
                              {order.status === "delivered"
                                ? formatDateTime(order.completedAt)
                                : "—"}
                            </td>
                            <td className="py-3 px-4 text-right font-medium text-[#1a1a14]">
                              ${order.total.toFixed(2)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {totalPages > 1 && (
                    <div className="mt-6 flex items-center justify-between">
                      <p className="text-sm text-[#666]">
                        Page {currentPage} of {totalPages}
                      </p>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() =>
                            setCurrentPage((prev) => Math.max(prev - 1, 1))
                          }
                          disabled={currentPage === 1}
                          className="rounded-lg border border-[#ddd] bg-white px-4 py-2 text-sm font-medium text-forest transition-colors hover:bg-cream/50 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          Previous
                        </button>

                        <button
                          onClick={() =>
                            setCurrentPage((prev) =>
                              Math.min(prev + 1, totalPages),
                            )
                          }
                          disabled={currentPage === totalPages}
                          className="rounded-lg border border-[#ddd] bg-white px-4 py-2 text-sm font-medium text-forest transition-colors hover:bg-cream/50 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </main>
      </div>
    </EmployeeRoute>
  );
}
