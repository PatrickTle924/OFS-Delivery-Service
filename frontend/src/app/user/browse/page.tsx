"use client";

import { useState, useMemo } from "react";
import Navbar from "@/components/Navbar";
import ProductCard from "@/components/ProductCard";
import CartDrawer from "@/components/CartDrawer";
import { Product, CartItem, Category } from "@/types/shop";

// ── Mock product data (replace with GET /api/products) ─────────────
const PRODUCTS: Product[] = [
    {
        id: 1,
        name: "Organic Fuji Apples",
        category: "Fruits",
        price: 4.99,
        weight: 2.0,
        stock: 50,
        description: "Crisp, sweet apples from local orchards.",
        imageUrl: "https://images.unsplash.com/photo-1567306226416-28f0efdc88ce?w=400&q=80",
    },
    {
        id: 2,
        name: "Fresh Blueberries",
        category: "Fruits",
        price: 5.49,
        weight: 0.75,
        stock: 30,
        description: "Plump, antioxidant-rich blueberries.",
        imageUrl: "https://images.unsplash.com/photo-1498557850523-fd3d118b962e?w=400&q=80",
    },
    {
        id: 3,
        name: "Heirloom Tomatoes",
        category: "Vegetables",
        price: 3.99,
        weight: 1.5,
        stock: 40,
        description: "Vine-ripened heirloom varieties.",
        imageUrl: "https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=400&q=80",
    },
    {
        id: 4,
        name: "Baby Spinach",
        category: "Vegetables",
        price: 2.99,
        weight: 0.5,
        stock: 60,
        description: "Tender baby spinach, triple-washed.",
        imageUrl: "https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=400&q=80",
    },
    {
        id: 5,
        name: "Organic Broccoli",
        category: "Vegetables",
        price: 2.49,
        weight: 1.25,
        stock: 45,
        description: "Locally sourced, no pesticides.",
        imageUrl: "https://images.unsplash.com/photo-1459411621453-7b03977f4bfc?w=400&q=80",
    },
    {
        id: 6,
        name: "Free-Range Chicken Breast",
        category: "Meats",
        price: 11.99,
        weight: 2.5,
        stock: 20,
        description: "Humanely raised, no hormones.",
        imageUrl: "https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=400&q=80",
    },
    {
        id: 7,
        name: "Grass-Fed Ribeye",
        category: "Meats",
        price: 13.49,
        weight: 2.0,
        stock: 15,
        description: "100% grass-fed, rich in omega-3.",
        imageUrl: "https://images.unsplash.com/photo-1603048297172-c92544798d5a?w=400&q=80",
    },
    {
        id: 8,
        name: "Wild Salmon Fillet",
        category: "Meats",
        price: 16.99,
        weight: 1.5,
        stock: 12,
        description: "Alaskan wild-caught, fresh-frozen.",
        imageUrl: "https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=400&q=80",
    },
    {
        id: 9,
        name: "Organic Whole Milk",
        category: "Dairy",
        price: 5.29,
        weight: 8.6,
        stock: 35,
        description: "From pasture-raised, local cows.",
        imageUrl: "https://images.unsplash.com/photo-1563636619-e9143da7973b?w=400&q=80",
    },
    {
        id: 10,
        name: "Greek Yogurt",
        category: "Dairy",
        price: 4.49,
        weight: 2.0,
        stock: 28,
        description: "Thick, creamy, protein-packed.",
        imageUrl: "https://images.unsplash.com/photo-1488477181946-6428a0291777?w=400&q=80",
    },
    {
        id: 11,
        name: "Aged Cheddar",
        category: "Dairy",
        price: 6.99,
        weight: 1.0,
        stock: 22,
        description: "Sharp 12-month aged cheddar block.",
        imageUrl: "https://images.unsplash.com/photo-1618164435735-413d3b066c9a?w=400&q=80",
    },
    {
        id: 12,
        name: "Sourdough Loaf",
        category: "Bakery",
        price: 7.49,
        weight: 2.0,
        stock: 18,
        description: "Long-fermented, hand-shaped loaf.",
        imageUrl: "https://images.unsplash.com/photo-1586444248902-2f64eddc13df?w=400&q=80",
    },
    {
        id: 13,
        name: "Multigrain Rolls",
        category: "Bakery",
        price: 4.99,
        weight: 1.25,
        stock: 24,
        description: "Six-seed blend, baked daily.",
        imageUrl: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&q=80",
    },
    {
        id: 14,
        name: "Extra Virgin Olive Oil",
        category: "Pantry",
        price: 12.99,
        weight: 2.5,
        stock: 30,
        description: "Cold-pressed, single-origin.",
        imageUrl: "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=400&q=80",
    },
    {
        id: 15,
        name: "Organic Brown Rice",
        category: "Pantry",
        price: 3.99,
        weight: 4.0,
        stock: 50,
        description: "Long-grain, whole grain goodness.",
        imageUrl: "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400&q=80",
    },
    {
        id: 16,
        name: "Raw Wildflower Honey",
        category: "Pantry",
        price: 9.49,
        weight: 1.5,
        stock: 20,
        description: "Unfiltered, local wildflower honey.",
        imageUrl: "https://images.unsplash.com/photo-1558642452-9d2a7deb7f62?w=400&q=80",
    },
];

const CATEGORIES: Category[] = ["Fruits", "Vegetables", "Meats", "Dairy", "Bakery", "Pantry"];

// ── Search icon ────────────────────────────────────────────────────
const IconSearch = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
        <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
);

// ── Page ──────────────────────────────────────────────────────────
export default function BrowsePage() {
    const [search, setSearch] = useState("");
    const [activeCategory, setActiveCategory] = useState<Category | "All">("All");
    const [cart, setCart] = useState<CartItem[]>([]);
    const [cartOpen, setCartOpen] = useState(false);

    const filtered = useMemo(() => PRODUCTS.filter((p) => {
        const matchesCategory = activeCategory === "All" || p.category === activeCategory;
        const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());
        return matchesCategory && matchesSearch;
    }), [search, activeCategory]);

    const totalItems = cart.reduce((s, i) => s + i.quantity, 0);
    const getQuantity = (id: number) => cart.find((i) => i.product.id === id)?.quantity ?? 0;

    const addToCart = (product: Product) => {
        if (product.stock === 0) return;
        setCart((prev) => {
            const existing = prev.find((i) => i.product.id === product.id);
            if (existing) {
                if (existing.quantity >= product.stock) return prev;
                return prev.map((i) =>
                    i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i
                );
            }
            return [...prev, { product, quantity: 1 }];
        });
    };

    const removeOne = (id: number) => {
        setCart((prev) => {
            const existing = prev.find((i) => i.product.id === id);
            if (!existing) return prev;
            if (existing.quantity === 1) return prev.filter((i) => i.product.id !== id);
            return prev.map((i) => i.product.id === id ? { ...i, quantity: i.quantity - 1 } : i);
        });
    };

    const removeFromCart = (id: number) =>
        setCart((prev) => prev.filter((i) => i.product.id !== id));

    return (
        <div className="min-h-screen bg-cream font-dm relative">

            {/* Background gradients */}
            <div className="pointer-events-none fixed top-[-10%] left-[-10%] w-150 h-150 rounded-full bg-[radial-gradient(ellipse_at_center,rgba(168,213,181,0.18)_0%,transparent_65%)] -z-10" />
            <div className="pointer-events-none fixed bottom-[-10%] right-[-10%] w-150 h-150 rounded-full bg-[radial-gradient(ellipse_at_center,rgba(196,133,90,0.10)_0%,transparent_65%)] -z-10" />

            {/* Navbar — browse mode */}
            <Navbar
                alwaysFrosted
                cartItemCount={totalItems}
                onCartClick={() => setCartOpen(true)}
            />

            <div className="max-w-7xl mx-auto px-8 pt-28 pb-16">

                {/* Page header */}
                <div className="mb-10">
                    <p className="text-sage text-xs font-medium tracking-[0.14em] uppercase mb-2">OFS Market</p>
                    <h1 className="font-playfair text-4xl md:text-5xl text-forest leading-tight">
                        Fresh <em className="text-clay">Organics</em>,<br />delivered today.
                    </h1>
                </div>

                {/* Search + category filters */}
                <div className="flex flex-col sm:flex-row gap-4 mb-10">
                    <div className="relative flex-1 max-w-md">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-forest/40">
                            <IconSearch />
                        </span>
                        <input
                            type="text"
                            placeholder="Search products..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 rounded-xl border-[1.5px] border-warm bg-white/70 text-sm text-forest placeholder:text-forest/35 outline-none focus:border-sage focus:ring-2 focus:ring-sage/10 transition-all duration-200 backdrop-blur-sm"
                        />
                    </div>

                    <div className="flex gap-2 flex-wrap">
                        {(["All", ...CATEGORIES] as (Category | "All")[]).map((cat) => (
                            <button
                                key={cat}
                                onClick={() => setActiveCategory(cat)}
                                className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 border-[1.5px] ${activeCategory === cat
                                        ? "bg-forest text-cream border-forest shadow-md shadow-forest/20"
                                        : "bg-white/70 text-forest/60 border-warm hover:border-sage/50 hover:text-forest"
                                    }`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Product grid */}
                {filtered.length === 0 ? (
                    <div className="text-center py-24 text-forest/40">
                        <p className="font-playfair text-2xl mb-2">No products found</p>
                        <p className="text-sm font-light">Try a different search or category.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                        {filtered.map((product) => (
                            <ProductCard
                                key={product.id}
                                product={product}
                                quantity={getQuantity(product.id)}
                                onAdd={() => addToCart(product)}
                                onRemove={() => removeOne(product.id)}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Cart drawer */}
            <CartDrawer
                open={cartOpen}
                onClose={() => setCartOpen(false)}
                cart={cart}
                onAdd={addToCart}
                onRemove={removeOne}
                onDelete={removeFromCart}
            />
        </div>
    );
}