import { useQuery } from "@tanstack/react-query"
import { api } from "@/lib/api"
import type { Category } from "@/types"

export interface ProductVariant {
  id: number
  name: string
  sku: string
  image_url: string | null
  gallery_images?: string[] | null
  mrp: number
  selling_price: number
  points_equivalent: number
  stock_quantity: number
  attributes: Record<string, string>
}

export interface TierPrice {
  variant_id: number | null
  min_quantity: number
  selling_price: number
  points_equivalent: number
}

export interface ProductSummary {
  id: number
  name: string
  slug: string
  sku: string | null
  type: "physical" | "digital" | "experience"
  main_image_url: string | null
  brand: string | null
  mrp: number
  selling_price: number
  points_equivalent: number
  has_variants: boolean
  short_description: string | null
}

export interface Product extends ProductSummary {
  gallery_images: string[]
  long_description: string | null
  key_features: string[]
  specifications: Record<string, string>
  terms_and_conditions: string | null
  variants: ProductVariant[]
  tier_prices: TierPrice[]
  type_data?: Record<string, unknown> | null
  video_url: string | null
}

export interface CategoryTreeNode extends Category {
  children: CategoryTreeNode[]
}

export const useProducts = (slug: string, categorySlug?: string) => {
  return useQuery<ProductSummary[]>({
    queryKey: ["products", slug, categorySlug],
    queryFn: async () => {
      const params = categorySlug ? { category_slug: categorySlug } : {}
      const { data } = await api.get(`/${slug}/products`, { params })
      return data.data as ProductSummary[]
    },
    enabled: !!slug,
  })
}

export const useProductDetail = (slug: string, productSlug: string) => {
  return useQuery<Product>({
    queryKey: ["product", slug, productSlug],
    queryFn: async () => {
      const { data } = await api.get(`/${slug}/products/${productSlug}`)
      return data.data as Product
    },
    enabled: !!slug && !!productSlug,
  })
}

export const buildCategoryTree = (
  categories: Category[]
): CategoryTreeNode[] => {
  const map = new Map<number, CategoryTreeNode>()
  const roots: CategoryTreeNode[] = []

  categories.forEach((cat) => map.set(cat.id, { ...cat, children: [] }))

  categories.forEach((cat) => {
    if (cat.parent_id && map.has(cat.parent_id)) {
      const parent = map.get(cat.parent_id)
      const node = map.get(cat.id)
      if (parent && node) parent.children.push(node)
    } else {
      const node = map.get(cat.id)
      if (node) roots.push(node)
    }
  })

  return roots
}

export const useSearchProducts = (slug: string, query: string) => {
  return useQuery({
    queryKey: ["search", slug, query],
    queryFn: async () => {
      const { data } = await api.get(`/${slug}/search`, {
        params: { q: query },
      })
      return data.data as Partial<Product>[]
    },
    enabled: !!slug && query.length > 1,
  })
}

export interface Order {
  id: number
  order_number: string
  total_amount: number
  points_used: number
  fiat_paid: number
  coupon_code: string | null
  discount_amount: number
  status: string
  created_at: string
  items: {
    product_name: string
    quantity: number
    total_price: number
  }[]
}
export const useUserOrders = (slug: string) => {
  return useQuery({
    queryKey: ["orders", slug],
    queryFn: async () => {
      const { data } = await api.get(`/${slug}/user/orders`)
      return data.data as Order[]
    },
    enabled: !!slug,
  })
}

export interface OrderDetailItem {
  product_name: string
  quantity: number
  unit_price: number
  total_price: number
  delivery_status: string | null
}

export interface OrderDetailVoucher {
  code: string
  pin: string | null
  issued_at: string | null
  expires_at: string | null
}

/** Full detail payload of GET /{slug}/user/orders/{orderNumber} */
export interface OrderDetail {
  order_number: string
  status: string
  created_at: string
  total_amount: number
  gst_total: number
  discount_amount: number
  coupon_code: string | null
  points_used: number
  fiat_paid: number
  payment_gateway_reference: string | null
  shipping_name: string | null
  shipping_mobile: string | null
  shipping_address_line_1: string | null
  shipping_city: string | null
  shipping_state: string | null
  shipping_pincode: string | null
  logistics_provider: string | null
  tracking_number: string | null
  billing_address_snapshot: string | null
  items: OrderDetailItem[]
  vouchers: OrderDetailVoucher[]
}

export const useOrderDetail = (slug: string, orderNumber: string) => {
  return useQuery({
    queryKey: ["order", slug, orderNumber],
    queryFn: async () => {
      const { data } = await api.get(`/${slug}/user/orders/${orderNumber}`)
      return data.data as OrderDetail
    },
    enabled: !!slug && !!orderNumber,
    retry: false,
  })
}

export interface FilterParams {
  q?: string
  category_slug?: string
  min_price?: number
  max_price?: number
  sort_by?: "default" | "price_asc" | "price_desc" | "newest"
  per_page?: number
  page?: number
}

export interface PaginatedProducts {
  data: ProductSummary[]
  current_page: number
  last_page: number
  per_page: number
  total: number
  from: number
  to: number
}

export const useFilterProducts = (slug: string, params: FilterParams) => {
  return useQuery<PaginatedProducts>({
    queryKey: ["products-filter", slug, params],
    queryFn: async () => {
      const cleanParams = Object.fromEntries(
        Object.entries(params).filter(
          ([, v]) => v !== undefined && v !== "" && v !== null
        )
      )
      const { data } = await api.get(`/${slug}/products/filter`, {
        params: cleanParams,
      })
      return data as PaginatedProducts
    },
    enabled: !!slug,
  })
}
