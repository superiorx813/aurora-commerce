"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { CartItem, Product } from "@/types/store";

type StoreContextType = {
  cart: CartItem[];
  wishlist: number[];
  addToCart: (product: Product) => void;
  removeFromCart: (id: number) => void;
  updateQuantity: (id: number, quantity: number) => void;
  toggleWishlist: (id: number) => void;
  cartCount: number;
  cartTotal: number;
};

const StoreContext = createContext<StoreContextType | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [wishlist, setWishlist] = useState<number[]>([]);

  useEffect(() => {
    try {
      setCart(JSON.parse(localStorage.getItem("aurora_cart") || "[]"));
      setWishlist(JSON.parse(localStorage.getItem("aurora_wishlist") || "[]"));
    } catch {}
  }, []);

  useEffect(() => localStorage.setItem("aurora_cart", JSON.stringify(cart)), [cart]);
  useEffect(() => localStorage.setItem("aurora_wishlist", JSON.stringify(wishlist)), [wishlist]);

  const value = useMemo(() => ({
    cart,
    wishlist,
    addToCart(product: Product) {
      setCart(items => {
        const existing = items.find(i => i.id === product.id);
        if (existing) return items.map(i => i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i);
        return [...items, { ...product, quantity: 1 }];
      });
    },
    removeFromCart(id: number) {
      setCart(items => items.filter(i => i.id !== id));
    },
    updateQuantity(id: number, quantity: number) {
      setCart(items => items.map(i => i.id === id ? { ...i, quantity: Math.max(1, quantity) } : i));
    },
    toggleWishlist(id: number) {
      setWishlist(items => items.includes(id) ? items.filter(x => x !== id) : [...items, id]);
    },
    cartCount: cart.reduce((s, i) => s + i.quantity, 0),
    cartTotal: cart.reduce((s, i) => s + Number(i.price) * i.quantity, 0)
  }), [cart, wishlist]);

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const value = useContext(StoreContext);
  if (!value) throw new Error("useStore must be used inside StoreProvider");
  return value;
}
