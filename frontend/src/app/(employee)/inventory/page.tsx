"use client";

import { useState, useEffect } from "react";
import EmployeeRoute from "@/components/EmployeeRoute";
import EmployeeSidebar from "@/components/EmployeeSidebar";
import {
  fetchInventory,
  createProduct,
  updateProduct,
  deleteProduct,
  type InventoryItem,
} from "@/lib/api-service";

const CATEGORIES = [
  "fruits",
  "vegetables",
  "meats",
  "dairy",
  "bakery",
  "pantry",
];

export default function InventoryPage() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategories, setSelectedCategories] =
    useState<string[]>(CATEGORIES);
  const [showLowStockOnly, setShowLowStockOnly] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [formData, setFormData] = useState<Partial<InventoryItem>>({});

  useEffect(() => {
    loadInventory();
  }, []);

  const loadInventory = async () => {
    try {
      setLoading(true);
      const data = await fetchInventory();
      setItems(data);
    } catch (error) {
      console.error("Failed to fetch inventory:", error);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryToggle = (category: string) => {
    setSelectedCategories((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category],
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
      reorderLevel: 10,
      image_url: "",
      image: undefined,
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

  const handleFormChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        name === "quantity" || name === "price" || name === "reorderLevel"
          ? Number(value)
          : value,
    }));
  };


  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = () => {
    setFormData((prev) => ({
      ...prev,
      image: file,
      image_url: reader.result as string, // preview only
    }));
  };
  reader.readAsDataURL(file);
};

  const handleSaveItem = async () => {
  if (!formData.name?.trim()) {
    alert("Please fill in the product name");
    return;
  }

  try {
    const data = new FormData();

    // text fields
    data.append("name", formData.name);
    data.append("description", "");
    data.append("category", formData.category || "fruits");
    data.append("quantity", String(Number(formData.quantity ?? 0)));
    data.append("weight", String(Number(formData.weight) || 0));
    data.append("price", String(Number(formData.price ?? 0)));

    // image (only if selected)
    if (formData.image) {
      data.append("image", formData.image);
    }

    if (editingItem) {
      await updateProduct(editingItem.id, data);
    } else {
      await createProduct(data);
    }

    await loadInventory();
    handleCloseModal();
  } catch (error) {
    console.error("Failed to save item:", error);
    alert("Failed to save item");
  }
};

  const handleDeleteItem = async (id: string) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this item?",
    );
    if (!confirmed) return;

    try {
      await deleteProduct(id);
      await loadInventory();
    } catch (error) {
      console.error("Failed to delete item:", error);
      alert("Failed to delete item");
    }
  };

  const filteredItems = items.filter((item) => {
    const matchesSearch = item.name
      .toLowerCase()
      .includes(searchTerm.toLowerCase());

    const matchesCategory = selectedCategories.includes(
      item.category.toLowerCase(),
    );

    const isLowStock = item.quantity <= item.reorderLevel;
    const matchesLowStockFilter = showLowStockOnly ? isLowStock : true;

    return matchesSearch && matchesCategory && matchesLowStockFilter;
  });

  const lowStockItems = items.filter(
    (item) => item.quantity <= item.reorderLevel,
  );

  return (
    <EmployeeRoute>
      <div className="min-h-screen bg-cream font-dm">
        <EmployeeSidebar active="inventory" />

        <main className="p-8">
          <div className="max-w-7xl mx-auto">
            <div className="mb-8 flex items-start justify-between gap-6">
              <div>
                <h1 className="font-playfair text-4xl text-forest mb-2">
                  Inventory Management
                </h1>
                <p className="text-[#666] font-light">
                  Track and manage product stock levels
                </p>
              </div>

              <button
                onClick={handleOpenAddModal}
                className="px-6 py-2 bg-sage text-white rounded-xl font-medium text-sm hover:bg-forest transition-colors shadow-md"
              >
                + Add Item
              </button>
            </div>

            <div className="mb-6">
              <input
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full max-w-md px-4 py-2 rounded-xl border-[1.5px] border-[#ddd] bg-white text-sm outline-none focus:border-sage focus:ring-2 focus:ring-sage/10"
              />
            </div>

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

            {lowStockItems.length > 0 && (
              <div className="mb-6 p-4 rounded-xl bg-warm/20 border border-warm/40">
                <p className="text-sm text-forest font-medium">
                  ⚠️ {lowStockItems.length} item(s) below reorder level
                </p>
              </div>
            )}

            {loading ? (
              <p className="text-center text-[#666]">Loading inventory...</p>
            ) : filteredItems.length === 0 ? (
              <p className="text-center text-[#666] py-8">
                No items found matching your filters.
              </p>
            ) : (
              <div className="overflow-x-auto bg-white rounded-xl border border-[#ddd]">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[#ddd] bg-warm/20">
                      <th className="px-6 py-4 text-left text-sm font-medium text-forest">
                        Product Name
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-medium text-forest">
                        SKU
                      </th>
                      <th className="px-6 py-4 text-center text-sm font-medium text-forest">
                        Quantity
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-medium text-forest">
                        Weight
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-medium text-forest">
                        Category
                      </th>
                      <th className="px-6 py-4 text-right text-sm font-medium text-forest">
                        Price
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-medium text-forest">
                        Last Restock
                      </th>
                      <th className="px-6 py-4 text-center text-sm font-medium text-forest">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredItems.map((item) => (
                      <tr
                        key={item.id}
                        className="border-b border-[#ddd] hover:bg-cream/50 transition-colors"
                      >
                        <td className="px-6 py-4 text-sm text-[#1a1a14] font-medium">
                          {item.name}
                        </td>
                        <td className="px-6 py-4 text-sm text-[#666]">
                          {item.sku}
                        </td>
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
                        <td className="px-6 py-4 text-sm text-[#666]">
                          {item.weight}
                        </td>
                        <td className="px-6 py-4 text-sm text-[#666] capitalize">
                          {item.category}
                        </td>
                        <td className="px-6 py-4 text-right text-sm text-[#1a1a14] font-medium">
                          ${item.price.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 text-sm text-[#666]">
                          {item.lastRestocked}
                        </td>
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

            {isAddModalOpen && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full">
                  <h2 className="font-playfair text-2xl text-forest mb-6">
                    {editingItem ? "Edit Item" : "Add New Item"}
                  </h2>

                  <div className="space-y-4">
                        {/* product name */}
                    <div>
                      <label className="block text-sm font-medium text-forest mb-2">
                        Product Name *
                      </label>
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
                      <label className="block text-sm font-medium text-forest mb-2">
                        Image
                      </label>
                      <input
                        type="file"
                        name="image"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="w-full px-4 py-2 rounded-lg border border-[#ddd] text-sm outline-none focus:border-sage focus:ring-2 focus:ring-sage/10"
                      />
                    </div>
                      {/* Categories */}
                    <div>
                      <label className="block text-sm font-medium text-forest mb-2">
                        Category
                      </label>
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
                          {/* product quantity */}
                      <div>
                        <label className="block text-sm font-medium text-forest mb-2">
                          Quantity
                        </label>
                        <input
                          type="number"
                          name="quantity"
                          value={formData.quantity || 0}
                          onChange={handleFormChange}
                          className="w-full px-4 py-2 rounded-lg border border-[#ddd] text-sm outline-none focus:border-sage focus:ring-2 focus:ring-sage/10"
                        />
                      </div>
                      
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                          {/* product weight */}
                      <div>
                        <label className="block text-sm font-medium text-forest mb-2">
                          Weight
                        </label>
                        <input
                          type="text"
                          name="weight"
                          value={formData.weight || ""}
                          onChange={handleFormChange}
                          placeholder="e.g., 1.5"
                          className="w-full px-4 py-2 rounded-lg border border-[#ddd] text-sm outline-none focus:border-sage focus:ring-2 focus:ring-sage/10"
                        />
                      </div>
                          {/* Product Price */}
                      <div>
                        <label className="block text-sm font-medium text-forest mb-2">
                          Price
                        </label>
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
                      {/* last restocked */}
                    <div>
                      <label className="block text-sm font-medium text-forest mb-2">
                        Last Restocked
                      </label>
                      <input
                        type="date"
                        name="lastRestocked"
                        value={formData.lastRestocked || ""}
                        onChange={handleFormChange}
                        className="w-full px-4 py-2 rounded-lg border border-[#ddd] text-sm outline-none focus:border-sage focus:ring-2 focus:ring-sage/10"
                      />
                    </div>
                  </div>
                        {/* final action buttons */}
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
        </main>
      </div>
    </EmployeeRoute>
  );
}
