import { z } from "zod"

export const claimAddressSchema = z.object({
  name: z.string().min(2, "Name is required"),
  mobile: z.string().regex(/^[0-9]{10}$/, "Valid 10-digit mobile required"),
  line1: z.string().min(5, "Street address is required"),
  city: z.string().min(2, "City is required"),
  state: z.string().min(2, "State is required"),
  pincode: z.string().regex(/^[0-9]{6}$/, "Valid 6-digit pincode required"),
})

export type ClaimAddressValues = z.infer<typeof claimAddressSchema>

export interface ThemeTokens {
  primaryColor: string
  textColor: string
  fontFamily: string
}

export interface ClaimRecipient {
  id: number
  first_name: string
  last_name: string
  email: string
}

export interface ProductVariant {
  id: number
  name: string
  sku: string
  image_url: string | null
  mrp: number
  selling_price: number
  stock_quantity: number
}

export interface StorefrontProduct {
  id: number
  name: string
  slug: string
  main_image_url: string | null
  mrp: number
  selling_price: number
  has_variants: boolean
  variants: ProductVariant[]
}

export interface BaseBlock {
  id: string
  isVisible: boolean
  type: string
}

export interface RewardSelectorBlock extends BaseBlock {
  type: "RewardSelector"
  variant: "grid" | "list"
  content: { heading: string; subtext: string }
  styles: {
    backgroundColor: string
    headingColor: string
    cardBackgroundColor: string
  }
}

export type PageBlock = RewardSelectorBlock
