import type { Category } from "@/types"
import { create } from "zustand"

interface CompanyConfig {
  company_id: number
  name: string
  alias: string
  logo_url: string | null
  industry: string | null
  points_name: string
  point_multiplier: number
  primary_color?: string
  social_links: Record<string, string>
  terms_text: string | null
  privacy_text: string | null
}

interface TenantState {
  slug: string | null
  config: CompanyConfig | null
  categories: Category[]
  setTenantData: (
    slug: string,
    config: CompanyConfig,
    categories: Category[]
  ) => void
}

export const useTenantStore = create<TenantState>((set) => ({
  slug: null,
  config: null,
  categories: [],
  setTenantData: (slug, config, categories) =>
    set({ slug, config, categories }),
}))
