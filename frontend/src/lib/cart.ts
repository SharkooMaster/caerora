"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface CartLine {
  variantId: number;
  productSlug: string;
  productName: string;
  variantName: string;
  price: number;
  image: string | null;
  quantity: number;
}

interface CartState {
  lines: CartLine[];
  isOpen: boolean;
  addItem: (line: Omit<CartLine, "quantity">, qty?: number) => void;
  removeItem: (variantId: number) => void;
  setQuantity: (variantId: number, qty: number) => void;
  clear: () => void;
  open: () => void;
  close: () => void;
  count: () => number;
  subtotal: () => number;
}

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      lines: [],
      isOpen: false,
      addItem: (line, qty = 1) =>
        set((state) => {
          const existing = state.lines.find((l) => l.variantId === line.variantId);
          if (existing) {
            return {
              lines: state.lines.map((l) =>
                l.variantId === line.variantId ? { ...l, quantity: l.quantity + qty } : l,
              ),
              isOpen: true,
            };
          }
          return { lines: [...state.lines, { ...line, quantity: qty }], isOpen: true };
        }),
      removeItem: (variantId) =>
        set((state) => ({ lines: state.lines.filter((l) => l.variantId !== variantId) })),
      setQuantity: (variantId, qty) =>
        set((state) => ({
          lines: state.lines
            .map((l) => (l.variantId === variantId ? { ...l, quantity: Math.max(1, qty) } : l))
            .filter((l) => l.quantity > 0),
        })),
      clear: () => set({ lines: [] }),
      open: () => set({ isOpen: true }),
      close: () => set({ isOpen: false }),
      count: () => get().lines.reduce((sum, l) => sum + l.quantity, 0),
      subtotal: () => get().lines.reduce((sum, l) => sum + l.price * l.quantity, 0),
    }),
    { name: "caerora-cart", partialize: (state) => ({ lines: state.lines }) },
  ),
);
