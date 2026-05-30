import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { ClaimRecipient, StorefrontProduct } from "@/types/claim"

interface ClaimState {
  token: string | null
  rewardValue: number
  recipient: ClaimRecipient | null
  allowedProductIds: number[]

  selectedProduct: StorefrontProduct | null
  isCheckoutModalOpen: boolean

  setClaimContext: (
    token: string,
    value: number,
    recipient: ClaimRecipient,
    productIds: number[]
  ) => void
  setSelectedProduct: (product: StorefrontProduct) => void
  setCheckoutModalOpen: (isOpen: boolean) => void
  clearClaimContext: () => void
}

export const useClaimStore = create<ClaimState>()(
  persist(
    (set) => ({
      token: null,
      rewardValue: 0,
      recipient: null,
      allowedProductIds: [],
      selectedProduct: null,
      isCheckoutModalOpen: false,

      setClaimContext: (token, value, recipient, productIds) =>
        set({
          token,
          rewardValue: value,
          recipient,
          allowedProductIds: productIds,
        }),

      setSelectedProduct: (product) => set({ selectedProduct: product }),

      setCheckoutModalOpen: (isOpen) => set({ isCheckoutModalOpen: isOpen }),

      clearClaimContext: () =>
        set({
          token: null,
          rewardValue: 0,
          recipient: null,
          allowedProductIds: [],
          selectedProduct: null,
          isCheckoutModalOpen: false,
        }),
    }),
    { name: "storefront-claim-storage" }
  )
)
