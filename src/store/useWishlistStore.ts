import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { ProductSummary } from "@/hooks/useStorefront"

interface WishlistState {
    items: ProductSummary[]
    addItem: (product: ProductSummary) => void
    removeItem: (productId: number) => void
    isInWishlist: (productId: number) => boolean
    clearWishlist: () => void
}

export const useWishlistStore = create<WishlistState>()(
    persist(
        (set, get) => ({
            items: [],
            addItem: (product) => {
                if (!get().isInWishlist(product.id)) {
                    set({ items: [...get().items, product] })
                }
            },
            removeItem: (productId) =>
                set({ items: get().items.filter((i) => i.id !== productId) }),
            isInWishlist: (productId) =>
                get().items.some((i) => i.id === productId),
            clearWishlist: () => set({ items: [] }),
        }),
        {
            name: "tenant-wishlist-storage",
        }
    )
)