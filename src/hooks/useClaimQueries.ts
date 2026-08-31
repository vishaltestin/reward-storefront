import { useQuery, useMutation } from "@tanstack/react-query"
import type { ClaimAddressValues, StorefrontProduct } from "@/types/claim"
import { api } from "@/lib/api"

export const useValidateClaimTokenQuery = (
  slug: string,
  token: string | null
) => {
  return useQuery({
    queryKey: ["claim-validate", slug, token],
    queryFn: async () => {
      const { data } = await api.get(
        `/${slug}/user/claim/validate?token=${token}`
      )
      return data
    },
    enabled: !!token && !!slug,
    retry: false,
  })
}

export interface ExecuteClaimPayload {
  token: string
  /** Always sent — with a variant this is derived server-side anyway. */
  product_id: number
  /** Null/omitted for single-SKU products that have no variants. */
  product_variant_id?: number | null
  shipping_address: ClaimAddressValues
}

/**
 * Response when starting a claim:
 * - fulfilled === true            → free claim, order is placed
 * - fulfilled === false + razorpay fields → payment required; open
 *   Razorpay Checkout with these values, then POST the proof to /claim/verify
 */
export interface ExecuteClaimResponse {
  message: string
  order_number: string
  fulfilled: boolean
  payment_required: boolean
  razorpay_order_id?: string
  razorpay_amount?: number // paise
  razorpay_currency?: string
  razorpay_key_id?: string
  company_name?: string
  user_name?: string
  user_email?: string
}

export const useExecuteClaimMutation = (slug: string) => {
  return useMutation({
    mutationFn: async (payload: ExecuteClaimPayload) => {
      const { data } = await api.post<ExecuteClaimResponse>(
        `/${slug}/user/claim/execute`,
        payload
      )
      return data
    },
  })
}

export interface VerifyClaimPayload {
  razorpay_order_id: string
  razorpay_payment_id: string
  razorpay_signature: string
}

/**
 * Sends the three Razorpay proof values to the backend. The server verifies
 * the HMAC signature, fetches the payment from Razorpay to confirm the real
 * captured amount, and fulfils the claim exactly once (idempotent).
 */
export const useVerifyClaimMutation = (slug: string) => {
  return useMutation({
    mutationFn: async (payload: VerifyClaimPayload) => {
      const { data } = await api.post<{
        message: string
        order_number: string
      }>(`/${slug}/user/claim/verify`, payload)
      return data
    },
  })
}

export const useClaimCatalogQuery = (
  slug: string,
  allowedProductIds: number[]
) => {
  return useQuery({
    queryKey: ["claim-catalog", slug, allowedProductIds],
    queryFn: async () => {
      const { data } = await api.get<{ data: StorefrontProduct[] }>(
        `/${slug}/user/claim/catalog`,
        {
          params: { allowed_ids: allowedProductIds },
        }
      )
      return data.data
    },
    enabled: !!slug,
  })
}
