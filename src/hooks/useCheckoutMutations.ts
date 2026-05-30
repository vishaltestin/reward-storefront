import { useMutation } from "@tanstack/react-query"
import { z } from "zod"
import { api } from "@/lib/api"
import { getApiErrorMessage } from "./useAuthMutations"

const addressSchema = z.object({
  name: z.string().min(1, "Name is required"),
  mobile: z.string().min(10, "Valid mobile number required"),
  line1: z.string().min(1, "Street address is required"),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  pincode: z.string().min(5, "Pincode is required"),
})

export const createCheckoutSchema = (requiresShipping: boolean) => {
  return z
    .object({
      use_shipping_for_billing: z.boolean(),
      shipping_address: requiresShipping
        ? addressSchema
        : addressSchema.partial().optional(),
      billing_address: addressSchema.partial().optional(),
    })
    .superRefine((data, ctx) => {
      if (!data.use_shipping_for_billing) {
        const fields: (keyof z.infer<typeof addressSchema>)[] = [
          "name",
          "mobile",
          "line1",
          "city",
          "state",
          "pincode",
        ]
        fields.forEach((field) => {
          if (
            !data.billing_address?.[field] ||
            data.billing_address[field]!.trim() === ""
          ) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: `${field} is required for billing`,
              path: ["billing_address", field],
            })
          }
        })
      }
    })
}

export type CheckoutFormValues = z.infer<
  ReturnType<typeof createCheckoutSchema>
>

export interface ValidateCouponPayload {
  code: string
  cart_product_ids: number[]
}

export interface CheckoutPayload {
  items: { product_id: number; variant_id: number | null; quantity: number }[]
  points_to_burn: number
  applied_coupon: string | null
  shipping_address: Record<string, string> | null
  billing_address: Record<string, string> | null
}

export const useValidateCouponMutation = (slug: string) => {
  return useMutation({
    mutationFn: async (payload: ValidateCouponPayload) => {
      const { data } = await api.post(
        `/${slug}/user/claim/validate-code`,
        payload
      )
      return data.data as { code: string; value: number }
    },
  })
}

export interface CheckoutResponse {
  message: string
  order_number: string
  fiat_amount_due: number
  points_burned: number
  gateway_reference: string | null
  status: string
}

export const useCheckoutMutation = (slug: string) => {
  return useMutation({
    mutationFn: async (payload: CheckoutPayload) => {
      const { data } = await api.post(`/${slug}/checkout`, payload)
      return data as CheckoutResponse
    },
  })
}

export { getApiErrorMessage }

export const useVerifyPaymentMutation = (slug: string) => {
  return useMutation({
    mutationFn: async (payload: {
      order_number: string
      payment_id: string
    }) => {
      const { data } = await api.post(`/${slug}/checkout/verify`, payload)
      return data
    },
  })
}
