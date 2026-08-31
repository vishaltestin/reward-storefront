import { create } from "zustand"
import { persist } from "zustand/middleware"
import { tenantStorageKey } from "@/lib/tenant"

export interface User {
  id: number
  first_name: string
  last_name: string
  email: string
  mobile?: string | null
  user_type?: string
  is_active?: boolean
  wallet_balance?: number

  gender?: string | null
  dob?: string | null

  address_line_1?: string | null
  address_line_2?: string | null
  city?: string | null
  state?: string | null
  pincode?: string | null
  country?: string | null

  shipping_address_line_1?: string | null
  shipping_address_line_2?: string | null
  shipping_city?: string | null
  shipping_state?: string | null
  shipping_pincode?: string | null
  shipping_country?: string | null
}

interface AuthState {
  token: string | null
  user: User | null
  isAuthenticated: boolean
  login: (token: string, user: User) => void
  logout: () => void
  setUser: (user: User) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      isAuthenticated: false,
      login: (token, user) => set({ token, user, isAuthenticated: true }),
      logout: () => set({ token: null, user: null, isAuthenticated: false }),
      setUser: (user) => set({ user }),
    }),
    { name: tenantStorageKey("storefront-auth") }
  )
)
