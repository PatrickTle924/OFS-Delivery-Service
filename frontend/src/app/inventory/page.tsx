"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface InventoryItem {
  id: string;
  name: string;
  sku: string;
  category: string;
  quantity: number;
  weight: string;
  price: number;
  reorderLevel: number;
  lastRestocked: string;
}

const CATEGORIES = ["fruits", "vegetables", "produce", "meat"];

export default function InventoryPage() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>(CATEGORIES);
  const [showLowStockOnly, setShowLowStockOnly] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [formData, setFormData] = useState<Partial<InventoryItem>>({});

  useEffect(() => {
    fetchInventory(); //placeholder API fetch inventory
  }, []);

  const fetchInventory = async () => {
    try {
      // placeholder, insert API endpoint to fetch inventory data
      const response = await fetch("/api/inventory");
      const data = await response.json();
      setItems(data);
    } catch (error) {
      console.error("Failed to fetch inventory:", error);
      // placeholder data for development
      setItems([
        {
          id: "1",
          name: "Organic Apples",
          sku: "ORG-APPLE-001",
          category: "fruits",
          quantity: 45,
          weight: "1 lb",
          price: 4.99,
          reorderLevel: 20,
          lastRestocked: "2026-03-16",
        },
        {
          id: "2",
          name: "Fresh Spinach",
          sku: "ORG-SPIN-002",
          category: "vegetables",
          quantity: 12,
          weight: "5 oz",
          price: 3.49,
          reorderLevel: 15,
          lastRestocked: "2026-03-18",
        },
        {
          id: "3",
          name: "Carrots Bundle",
          sku: "ORG-CARR-003",
          category: "vegetables",
          quantity: 60,
          weight: "2 lbs",
          price: 2.99,
          reorderLevel: 25,
          lastRestocked: "2026-03-17",
        },
        {
          id: "4",
          name: "Organic Bananas",
          sku: "ORG-BAN-004",
          category: "fruits",
          quantity: 35,
          weight: "1.5 lbs",
          price: 0.59,
          reorderLevel: 30,
          lastRestocked: "2026-03-15",
        },
        {
          id: "5",
          name: "Grass-Fed Beef",
          sku: "ORG-BEEF-005",
          category: "meat",
          quantity: 8,
          weight: "1 lb",
          price: 12.99,
          reorderLevel: 10,
          lastRestocked: "2026-03-18",
        },
        {
          id: "6",
          name: "Organic Tomatoes",
          sku: "ORG-TOM-006",
          category: "produce",
          quantity: 28,
          weight: "1.5 lbs",
          price: 3.99,
          reorderLevel: 15,
          lastRestocked: "2026-03-17",
        },
        {
          id: "7",
          name: "Free-Range Chicken",
          sku: "ORG-CHICK-007",
          category: "meat",
          quantity: 5,
          weight: "1.5 lbs",
          price: 8.99,
          reorderLevel: 8,
          lastRestocked: "2026-03-16",
        },
        {
          id: "8",
          name: "Bell Peppers Mix",
          sku: "ORG-BELL-008",
          category: "vegetables",
          quantity: 42,
          weight: "2 lbs",
          price: 4.49,
          reorderLevel: 20,
          lastRestocked: "2026-03-18",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryToggle = (category: string) => {
    setSelectedCategories((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category]
    );
  };

  const handleOpenAddModal = () => {
    setEditingItem(null);
    setFormData({
      name: "",
      sku: "",
      category: "fruits",
      quantity: 0,
      weight: "",
      price: 0,
      reorderLevel: 0,
      lastRestocked: new Date().toISOString().split("T")[0],
    });
    setIsAddModalOpen(true);
  };

  const handleOpenEditModal = (item: InventoryItem) => {
    setEditingItem(item);
    setFormData(item);
    setIsAddModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsAddModalOpen(false);
    setEditingItem(null);
    setFormData({});
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "quantity" || name === "price" || name === "reorderLevel" ? parseFloat(value) : value,
    }));
  };

  const handleSaveItem = () => {
    if (!formData.name || !formData.sku) {
      alert("Please fill in all required fields");
      return;
    }

    if (editingItem) {
      // Edit existing item
      setItems(items.map((item) => (item.id === editingItem.id ? { ...formData as InventoryItem } : item)));
    } else {
      // Add new item
      const newItem: InventoryItem = {
        id: Date.now().toString(),
        name: formData.name || "",
        sku: formData.sku || "",
        category: formData.category || "fruits",
        quantity: formData.quantity || 0,
        weight: formData.weight || "",
        price: formData.price || 0,
        reorderLevel: formData.reorderLevel || 0,
        lastRestocked: formData.lastRestocked || new Date().toISOString().split("T")[0],
      };
      setItems([...items, newItem]);
    }

    handleCloseModal();
  };

  const handleDeleteItem = (id: string) => {
    if (confirm("Are you sure you want to delete this item?")) {
      setItems(items.filter((item) => item.id !== id));
    }
  };

  const filteredItems = items.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategories.includes(item.category.toLowerCase());
    const isLowStock = item.quantity <= item.reorderLevel;
    const matchesLowStockFilter = showLowStockOnly ? isLowStock : true;
    return matchesSearch && matchesCategory && matchesLowStockFilter;
  });

  const lowStockItems = filteredItems.filter((item) => item.quantity <= item.reorderLevel);

  return (
    <div className="min-h-screen bg-cream p-8 font-dm">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="font-playfair text-4xl text-forest mb-2">Inventory Management</h1>
            <p className="text-[#666] font-light">Track and manage product stock levels</p>
          </div>
          <div className="flex gap-4">
            <button
              onClick={handleOpenAddModal}
              className="px-6 py-2 bg-sage text-white rounded-xl font-medium text-sm hover:bg-forest transition-colors shadow-md"
            >
              + Add Item
            </button>
            <Link
              href="/dashboard"
              className="text-sage font-medium underline underline-offset-2 hover:text-forest transition-colors"
            >
              ← Back to Dashboard
            </Link>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <input
            type="text"
            placeholder="Search inventory..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border-[1.5px] border-[#ddd] bg-white/80 text-sm text-[#1a1a14] placeholder:text-[#bbb] outline-none focus:border-sage focus:ring-2 focus:ring-sage/10 transition-all duration-200"
          />
        </div>

        {/* Category Filters */}
        <div className="mb-6 flex flex-wrap gap-3">
          {CATEGORIES.map((category) => (
            <button
              key={category}
              onClick={() => handleCategoryToggle(category)}
              className={`px-4 py-2 rounded-xl font-medium text-sm capitalize transition-all duration-200 ${
                selectedCategories.includes(category)
                  ? "bg-sage text-white shadow-md"
                  : "bg-white border-[1.5px] border-[#ddd] text-[#666] hover:border-sage"
              }`}
            >
              {category}
            </button>
          ))}

          {/* Low Stock Filter */}
          <button
            onClick={() => setShowLowStockOnly(!showLowStockOnly)}
            className={`px-4 py-2 rounded-xl font-medium text-sm transition-all duration-200 ${
              showLowStockOnly
                ? "bg-red-500 text-white shadow-md"
                : "bg-white border-[1.5px] border-[#ddd] text-[#666] hover:border-red-500"
            }`}
          >
            Low Stock Only
          </button>
        </div>

        {/* Low Stock Alert */}
        {lowStockItems.length > 0 && (
          <div className="mb-6 p-4 rounded-xl bg-warm/20 border border-warm/40">
            <p className="text-sm text-forest font-medium">
              ⚠️ {lowStockItems.length} item(s) below reorder level
            </p>
          </div>
        )}

        {/* Inventory Table */}
        {loading ? (
          <p className="text-center text-[#666]">Loading inventory...</p>
        ) : filteredItems.length === 0 ? (
          <p className="text-center text-[#666] py-8">No items found matching your filters.</p>
        ) : (
          <div className="overflow-x-auto bg-white rounded-xl border border-[#ddd]">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#ddd] bg-warm/20">
                  <th className="px-6 py-4 text-left text-sm font-medium text-forest">Product Name</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-forest">SKU</th>
                  <th className="px-6 py-4 text-center text-sm font-medium text-forest">Quantity</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-forest">Weight</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-forest">Category</th>
                  <th className="px-6 py-4 text-right text-sm font-medium text-forest">Price</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-forest">Last Restock</th>
                  <th className="px-6 py-4 text-center text-sm font-medium text-forest">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((item) => (
                  <tr key={item.id} className="border-b border-[#ddd] hover:bg-cream/50 transition-colors">
                    <td className="px-6 py-4 text-sm text-[#1a1a14] font-medium">{item.name}</td>
                    <td className="px-6 py-4 text-sm text-[#666]">{item.sku}</td>
                    <td className="px-6 py-4 text-center text-sm">
                      <span
                        className={`inline-block px-3 py-1 rounded-lg font-medium ${
                          item.quantity <= item.reorderLevel
                            ? "bg-red-100 text-red-700"
                            : "bg-mint/30 text-sage"
                        }`}
                      >
                        {item.quantity}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-[#666]">{item.weight}</td>
                    <td className="px-6 py-4 text-sm text-[#666] capitalize">{item.category}</td>
                    <td className="px-6 py-4 text-right text-sm text-[#1a1a14] font-medium">${item.price.toFixed(2)}</td>
                    <td className="px-6 py-4 text-sm text-[#666]">{item.lastRestocked}</td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => handleOpenEditModal(item)}
                        className="inline-block px-3 py-2 text-sm font-bold text-sage hover:text-forest transition-colors mr-3"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteItem(item.id)}
                        className="inline-block px-3 py-2 text-sm font-bold text-warm hover:text-red-600 transition-colors"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full">
            <h2 className="font-playfair text-2xl text-forest mb-6">
              {editingItem ? "Edit Item" : "Add New Item"}
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-forest mb-2">Product Name *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name || ""}
                  onChange={handleFormChange}
                  placeholder="e.g., Organic Apples"
                  className="w-full px-4 py-2 rounded-lg border border-[#ddd] text-sm outline-none focus:border-sage focus:ring-2 focus:ring-sage/10"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-forest mb-2">SKU *</label>
                <input
                  type="text"
                  name="sku"
                  value={formData.sku || ""}
                  onChange={handleFormChange}
                  placeholder="e.g., ORG-APPLE-001"
                  className="w-full px-4 py-2 rounded-lg border border-[#ddd] text-sm outline-none focus:border-sage focus:ring-2 focus:ring-sage/10"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-forest mb-2">Category</label>
                <select
                  name="category"
                  value={formData.category || "fruits"}
                  onChange={handleFormChange}
                  className="w-full px-4 py-2 rounded-lg border border-[#ddd] text-sm outline-none focus:border-sage focus:ring-2 focus:ring-sage/10"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat.charAt(0).toUpperCase() + cat.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-forest mb-2">Quantity</label>
                  <input
                    type="number"
                    name="quantity"
                    value={formData.quantity || 0}
                    onChange={handleFormChange}
                    className="w-full px-4 py-2 rounded-lg border border-[#ddd] text-sm outline-none focus:border-sage focus:ring-2 focus:ring-sage/10"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-forest mb-2">Reorder Level</label>
                  <input
                    type="number"
                    name="reorderLevel"
                    value={formData.reorderLevel || 0}
                    onChange={handleFormChange}
                    className="w-full px-4 py-2 rounded-lg border border-[#ddd] text-sm outline-none focus:border-sage focus:ring-2 focus:ring-sage/10"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-forest mb-2">Weight</label>
                  <input
                    type="text"
                    name="weight"
                    value={formData.weight || ""}
                    onChange={handleFormChange}
                    placeholder="e.g., 1 lb"
                    className="w-full px-4 py-2 rounded-lg border border-[#ddd] text-sm outline-none focus:border-sage focus:ring-2 focus:ring-sage/10"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-forest mb-2">Price</label>
                  <input
                    type="number"
                    name="price"
                    value={formData.price || 0}
                    onChange={handleFormChange}
                    step="0.01"
                    className="w-full px-4 py-2 rounded-lg border border-[#ddd] text-sm outline-none focus:border-sage focus:ring-2 focus:ring-sage/10"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-forest mb-2">Last Restocked</label>
                <input
                  type="date"
                  name="lastRestocked"
                  value={formData.lastRestocked || ""}
                  onChange={handleFormChange}
                  className="w-full px-4 py-2 rounded-lg border border-[#ddd] text-sm outline-none focus:border-sage focus:ring-2 focus:ring-sage/10"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-8">
              <button
                onClick={handleCloseModal}
                className="flex-1 px-4 py-2 rounded-lg border border-[#ddd] text-forest font-medium text-sm hover:bg-cream/50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveItem}
                className="flex-1 px-4 py-2 rounded-lg bg-sage text-white font-medium text-sm hover:bg-forest transition-colors"
              >
                {editingItem ? "Save Changes" : "Add Item"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}