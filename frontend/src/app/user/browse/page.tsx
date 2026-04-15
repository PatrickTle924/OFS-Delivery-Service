"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import ProductCard from "@/components/ProductCard";
import CartDrawer from "@/components/CartDrawer";
import { Product, CartItem, Category } from "@/types/shop";
import { fetchProducts } from "@/lib/api-service";
import { getStoredUser, isCustomerUser } from "@/lib/auth";

const CATEGORIES: Category[] = ["Fruits", "Vegetables", "Meats", "Dairy", "Bakery", "Pantry"];

// ── Search icon ────────────────────────────────────────────────────
const IconSearch = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
        <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
);

// ── Page ──────────────────────────────────────────────────────────
export default function BrowsePage() {
    const router = useRouter();
    const [products, setProducts] = useState<Product[]>([]);
    const [loadingProducts, setLoadingProducts] = useState(true);
    const [productsError, setProductsError] = useState<string | null>(null);
    const [search, setSearch] = useState("");
    const [activeCategory, setActiveCategory] = useState<Category | "All">("All");
    const [cart, setCart] = useState<CartItem[]>([]);
    const [cartOpen, setCartOpen] = useState(false);

    useEffect(() => {
        const user = getStoredUser();
        if (!isCustomerUser(user)) {
            router.replace("/login-register");
            return;
        }

        const loadProducts = async () => {
            try {
                const data = await fetchProducts();
                setProducts(data);
                setProductsError(null);
            } catch (error) {
                setProductsError("Unable to load products right now.");
            } finally {
                setLoadingProducts(false);
            }
        };

        loadProducts();
    }, [router]);

    const filtered = useMemo(() => products.filter((p) => {
        const matchesCategory = activeCategory === "All" || p.category === activeCategory;
        const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());
        return matchesCategory && matchesSearch;
    }), [products, search, activeCategory]);

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
                {loadingProducts ? (
                    <div className="text-center py-24 text-forest/40">
                        <p className="font-playfair text-2xl mb-2">Loading products...</p>
                    </div>
                ) : productsError ? (
                    <div className="text-center py-24 text-forest/40">
                        <p className="font-playfair text-2xl mb-2">Couldn&apos;t load products</p>
                        <p className="text-sm font-light">{productsError}</p>
                    </div>
                ) : filtered.length === 0 ? (
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
