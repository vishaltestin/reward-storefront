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

interface ExecuteClaimPayload {
  token: string
  product_variant_id: number
  shipping_address: ClaimAddressValues
  fiat_paid: number
  payment_reference: string | null
}

export const useExecuteClaimMutation = (slug: string) => {
  return useMutation({
    mutationFn: async (payload: ExecuteClaimPayload) => {
      const { data } = await api.post(
        `/${slug}/user/claim/execute`,
        payload
      )
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
