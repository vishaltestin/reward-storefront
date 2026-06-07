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


/**
 * Returned by POST /{slug}/checkout
 *
 * When fiat_amount_due > 0, the Razorpay fields are populated and the
 * frontend must open the Razorpay modal before the order is confirmed.
 *
 * When fiat_amount_due === 0 (covered entirely by points/coupon), the
 * order is already marked as paid and no gateway interaction is needed.
 */
export interface CheckoutResponse {
  message: string
  order_number: string
  fiat_amount_due: number
  points_burned: number
  gateway_reference: string | null
  status: string
  razorpay_order_id?: string
  razorpay_amount?: number 
  razorpay_currency?: string
  razorpay_key_id?: string
  company_name?: string
  user_name?: string
  user_email?: string
}

// ─── Mutations ────────────────────────────────────────────────────────────────

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

export const useCheckoutMutation = (slug: string) => {
  return useMutation({
    mutationFn: async (payload: CheckoutPayload) => {
      const { data } = await api.post(`/${slug}/checkout`, payload)
      return data as CheckoutResponse
    },
  })
}

/**
 * useVerifyPaymentMutation
 *
 * Sends the three Razorpay proof values to the backend for HMAC-SHA256
 * signature verification. Only called inside the Razorpay modal's
 * `handler` callback after the user completes payment.
 */
export const useVerifyPaymentMutation = (slug: string) => {
  return useMutation({
    mutationFn: async (payload: {
      order_number: string
      razorpay_order_id: string
      razorpay_payment_id: string
      razorpay_signature: string
    }) => {
      const { data } = await api.post(`/${slug}/checkout/verify`, payload)
      return data
    },
  })
}

/**
 * useCancelOrderMutation
 *
 * Called when the user dismisses the Razorpay modal without completing
 * payment. The backend will:
 *   1. Refund any escrowed wallet points back to the user's balance.
 *   2. Mark the order as 'cancelled' so it doesn't ghost as 'pending'.
 *
 * This is fire-and-forget from the UX perspective — the user is already
 * back on the checkout page and we silently clean up server-side.
 */
export const useCancelOrderMutation = (slug: string) => {
  return useMutation({
    mutationFn: async (payload: { order_number: string }) => {
      const { data } = await api.post(`/${slug}/checkout/cancel`, payload)
      return data as {
        message: string
        order_number: string
        points_refunded: number
      }
    },
  })
}

export { getApiErrorMessage }