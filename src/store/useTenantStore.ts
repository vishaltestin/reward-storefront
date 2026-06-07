import type { Category } from "@/types"
import { create } from "zustand"
export interface SocialLink {
  platform: string;
  url: string;
}
interface CompanyConfig {
  company_id: number
  name: string
  alias: string
  logo_url: string | null
  industry: string | null
  points_name: string
  point_multiplier: number
  primary_color?: string
  social_links: SocialLink[]
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
