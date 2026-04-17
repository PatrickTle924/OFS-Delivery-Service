"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  ReactNode,
} from "react";
import { CartItem, Product } from "@/types/shop";
import { useAuth } from "@/context/AuthContext";

interface CartContextType {
  cart: CartItem[];
  totalItems: number;
  totalPrice: number;
  addToCart: (product: Product) => void;
  removeOne: (id: number) => void;
  removeFromCart: (id: number) => void;
  clearCart: () => void;
  getQuantity: (id: number) => number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const getCartStorageKey = (userId?: string | null) =>
  userId ? `ofs-cart-${userId}` : "ofs-cart-guest";

export function CartProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();

  const [cart, setCart] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  const storageKey = useMemo(
    () => getCartStorageKey(user?.id ?? null),
    [user?.id],
  );

  // Load the correct cart whenever the logged-in user changes
  useEffect(() => {
    try {
      const savedCart = localStorage.getItem(storageKey);
      setCart(savedCart ? JSON.parse(savedCart) : []);
    } catch (error) {
      console.error("Failed to load cart from localStorage", error);
      setCart([]);
    } finally {
      setHydrated(true);
    }
  }, [storageKey]);

  // Save current cart for the current user
  useEffect(() => {
    if (!hydrated) return;

    try {
      localStorage.setItem(storageKey, JSON.stringify(cart));
    } catch (error) {
      console.error("Failed to save cart to localStorage", error);
    }
  }, [cart, hydrated, storageKey]);

  const addToCart = (product: Product) => {
    if (product.stock === 0) return;

    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);

      if (existing) {
        if (existing.quantity >= product.stock) return prev;

        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item,
        );
      }

      return [...prev, { product, quantity: 1 }];
    });
  };

  const removeOne = (id: number) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === id);
      if (!existing) return prev;

      if (existing.quantity === 1) {
        return prev.filter((item) => item.product.id !== id);
      }

      return prev.map((item) =>
        item.product.id === id
          ? { ...item, quantity: item.quantity - 1 }
          : item,
      );
    });
  };

  const removeFromCart = (id: number) => {
    setCart((prev) => prev.filter((item) => item.product.id !== id));
  };

  const clearCart = () => {
    setCart([]);
  };

  const getQuantity = (id: number) => {
    return cart.find((item) => item.product.id === id)?.quantity ?? 0;
  };

  const totalItems = useMemo(
    () => cart.reduce((sum, item) => sum + item.quantity, 0),
    [cart],
  );

  const totalPrice = useMemo(
    () =>
      cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0),
    [cart],
  );

  const value = useMemo(
    () => ({
      cart,
      totalItems,
      totalPrice,
      addToCart,
      removeOne,
      removeFromCart,
      clearCart,
      getQuantity,
    }),
    [cart, totalItems, totalPrice],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }

  return context;
}
