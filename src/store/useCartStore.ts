import { create } from "zustand"
import { persist } from "zustand/middleware"

import { tenantStorageKey } from "@/lib/tenant"
import type { Product, ProductVariant } from "@/hooks/useStorefront"

export interface CartItem {
  id: string
  product: Product
  variant: ProductVariant | null
  quantity: number
}

interface CartState {
  items: CartItem[]
  isOpen: boolean
  addItem: (
    product: Product,
    variant: ProductVariant | null,
    quantity: number
  ) => void
  updateQuantity: (id: string, delta: number) => void
  removeItem: (id: string) => void
  clearCart: () => void
  setCartOpen: (isOpen: boolean) => void
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,

      addItem: (product, variant, quantity) => {
        const id = `${product.id}-${variant ? variant.id : "base"}`
        const { items } = get()
        const existingItem = items.find((item) => item.id === id)

        if (existingItem) {
          const maxStock = variant ? variant.stock_quantity : 9999
          const newQuantity = Math.min(
            existingItem.quantity + quantity,
            maxStock
          )

          set({
            items: items.map((item) =>
              item.id === id ? { ...item, quantity: newQuantity } : item
            ),
            isOpen: true,
          })
        } else {
          set({
            items: [...items, { id, product, variant, quantity }],
            isOpen: true,
          })
        }
      },

      updateQuantity: (id, delta) => {
        const { items } = get()
        set({
          items: items
            .map((item) => {
              if (item.id === id) {
                const maxStock = item.variant
                  ? item.variant.stock_quantity
                  : 9999
                const newQuantity = Math.max(
                  0,
                  Math.min(item.quantity + delta, maxStock)
                )
                return { ...item, quantity: newQuantity }
              }
              return item
            })
            .filter((item) => item.quantity > 0),
        })
      },

      removeItem: (id) => {
        set({ items: get().items.filter((item) => item.id !== id) })
      },

      clearCart: () => set({ items: [] }),

      setCartOpen: (isOpen) => set({ isOpen }),
    }),
    {
      name: tenantStorageKey("storefront-cart"),
    }
  )
)
