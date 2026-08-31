import { useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { useQueryClient } from "@tanstack/react-query"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { X, Loader2, Gift } from "lucide-react"
import { toast } from "sonner"

import { useClaimStore } from "@/store/useClaimStore"
import { claimAddressSchema, type ClaimAddressValues } from "@/types/claim"
import {
  useExecuteClaimMutation,
  useVerifyClaimMutation,
} from "@/hooks/useClaimQueries"
import { loadRazorpayScript } from "@/lib/razorpay"
import { getErrorMessage } from "@/lib/api"

export function ClaimCheckoutModal() {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const {
    token,
    selectedProduct,
    rewardValue,
    setCheckoutModalOpen,
    clearClaimContext,
  } = useClaimStore()
  const { mutateAsync: executeClaim, isPending } = useExecuteClaimMutation(
    slug!
  )
  const { mutateAsync: verifyClaim } = useVerifyClaimMutation(slug!)

  const [selectedVariantId, setSelectedVariantId] = useState<number | null>(
    selectedProduct?.variants?.[0]?.id || null
  )
  const [isPaying, setIsPaying] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ClaimAddressValues>({
    resolver: zodResolver(claimAddressSchema),
  })

  if (!selectedProduct) return null

  const activeVariant = selectedProduct.variants?.find(
    (v) => v.id === selectedVariantId
  )
  const activePrice = activeVariant
    ? activeVariant.selling_price
    : selectedProduct.selling_price
  const activeImage = activeVariant?.image_url || selectedProduct.main_image_url

  const fiatDue = Math.max(0, activePrice - rewardValue)
  const remainingReward = Math.max(0, rewardValue - activePrice)

  const finishClaim = (orderNumber: string) => {
    clearClaimContext()
    // Refresh the profile order list, then land the user straight on the
    // new order's detail page (items, address, tracking) instead of a bare
    // profile page — immediate confirmation of what was just placed.
    queryClient.invalidateQueries({ queryKey: ["orders", slug] })
    toast.success(`Order placed: ${orderNumber}`)
    navigate(`/${slug}/orders/${orderNumber}`)
  }

  const onSubmit = async (formData: ClaimAddressValues) => {
    if (!token || !selectedProduct) return
    // Variant products need an explicit choice; single-SKU products are
    // claimed with product_id alone (no variant exists to choose).
    if (selectedProduct.has_variants && !selectedVariantId) return

    try {
      // ── Step 1: create the claim server-side ────────────────────────────
      // The server computes the amount; the client never declares it.
      const data = await executeClaim({
        token,
        product_id: selectedProduct.id,
        product_variant_id: selectedVariantId,
        shipping_address: formData,
      })

      if (data.fulfilled) {
        finishClaim(data.order_number)
        return
      }

      if (!data.payment_required || !data.razorpay_order_id) {
        finishClaim(data.order_number)
        return
      }

      // ── Step 2: pay the exact server-created amount ─────────────────────
      setIsPaying(true)
      await loadRazorpayScript()

      await new Promise<void>((resolve, reject) => {
        const rzp = new window.Razorpay({
          key: data.razorpay_key_id!,
          amount: data.razorpay_amount!,
          currency: data.razorpay_currency ?? "INR",
          name: data.company_name ?? "Rewards",
          description: "Complete your claim",
          order_id: data.razorpay_order_id!,
          prefill: {
            name: data.user_name,
            email: data.user_email,
          },
          theme: { color: "#2563eb" },
          modal: {
            ondismiss: () =>
              reject(
                Object.assign(new Error("PAYMENT_CANCELLED"), { silent: true })
              ),
          },
          handler: async (response) => {
            // Payment completed — verify with the server, with retries.
            // IMPORTANT: if every retry fails, the money is STILL taken.
            // The server webhook fulfils the claim on its own, so we never
            // tell the user the payment failed.
            const proof = {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            }

            try {
              let verified = false

              for (let attempt = 1; attempt <= 3 && !verified; attempt++) {
                try {
                  // ── Step 3: server verifies signature + gateway amount ──
                  await verifyClaim(proof)
                  verified = true
                } catch {
                  if (attempt < 3) {
                    await new Promise((r) => setTimeout(r, 1200 * attempt))
                  }
                }
              }

              if (verified) {
                finishClaim(data.order_number)
              } else {
                toast.info(
                  `Payment received! Order ${data.order_number} is being confirmed — it will appear in your profile shortly.`,
                  { duration: 10000 }
                )
                clearClaimContext()
                queryClient.invalidateQueries({ queryKey: ["orders", slug] })
                navigate(`/${slug}/profile`)
              }

              resolve()
            } catch {
              // Never reject after a successful payment — resolve so the
              // outer catch (error toast) cannot show "payment failed".
              resolve()
            }
          },
        })
        rzp.open()
      })
    } catch (error) {
      const message = getErrorMessage(error)
      if (message === "PAYMENT_CANCELLED") {
        toast.info(
          "Payment cancelled. Your reward link is still valid — you can try again."
        )
      } else {
        toast.error(
          message || "Could not complete your claim. Please try again."
        )
      }
    } finally {
      setIsPaying(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
      <div className="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white text-left shadow-2xl md:flex-row">
        <div className="flex w-full flex-col border-r bg-slate-50 p-6 md:w-5/12">
          <div className="mb-4 flex justify-between">
            <h2 className="flex items-center gap-2 text-lg font-bold">
              <Gift className="h-5 w-5 text-blue-600" /> Review Gift
            </h2>
            <button
              className="md:hidden"
              onClick={() => setCheckoutModalOpen(false)}
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <img
            src={activeImage || ""}
            alt={selectedProduct.name}
            className="mb-4 h-32 rounded border bg-white object-contain p-2"
          />
          <h3 className="leading-tight font-bold text-slate-900">
            {selectedProduct.name}
          </h3>

          {selectedProduct.has_variants && (
            <div className="mt-4">
              <label className="text-xs font-semibold text-slate-500 uppercase">
                Select Option
              </label>
              <select
                className="mt-1 w-full rounded-md border-slate-300 p-2 text-sm shadow-sm focus:border-blue-500 focus:ring-blue-500"
                value={selectedVariantId || ""}
                onChange={(e) => setSelectedVariantId(Number(e.target.value))}
              >
                {selectedProduct.variants.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name} - ₹{v.selling_price}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="mt-auto space-y-2 border-t pt-4 text-sm">
            <div className="flex justify-between">
              <span>Item Value</span>
              <span>₹{activePrice}</span>
            </div>
            <div className="flex justify-between font-bold text-green-600">
              <span>Reward Applied</span>
              <span>-₹{Math.min(rewardValue, activePrice)}</span>
            </div>
            <div className="flex justify-between border-t pt-2 text-xl font-bold text-slate-900">
              <span>You Pay</span>
              <span>₹{fiatDue}</span>
            </div>
            {remainingReward > 0 && (
              <p className="mt-4 rounded-md bg-blue-50 p-3 text-xs font-medium text-blue-800">
                You have ₹{remainingReward} left over! This will be deposited
                into your wallet for future purchases.
              </p>
            )}
          </div>
        </div>

        <div className="flex w-full flex-col overflow-y-auto p-6 md:w-7/12">
          <div className="mb-6 hidden justify-between md:flex">
            <h2 className="text-lg font-bold">Shipping Address</h2>
            <button onClick={() => setCheckoutModalOpen(false)}>
              <X className="h-5 w-5 text-slate-400 hover:text-slate-900" />
            </button>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-slate-700">
                  Full Name
                </label>
                <input
                  {...register("name")}
                  className="mt-1 w-full rounded border p-2 text-sm"
                />
                {errors.name && (
                  <p className="mt-1 text-xs text-red-500">
                    {errors.name.message}
                  </p>
                )}
              </div>
              <div>
                <label className="text-xs font-medium text-slate-700">
                  Mobile
                </label>
                <input
                  {...register("mobile")}
                  className="mt-1 w-full rounded border p-2 text-sm"
                />
                {errors.mobile && (
                  <p className="mt-1 text-xs text-red-500">
                    {errors.mobile.message}
                  </p>
                )}
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-slate-700">
                Street Address
              </label>
              <input
                {...register("line1")}
                className="mt-1 w-full rounded border p-2 text-sm"
              />
              {errors.line1 && (
                <p className="mt-1 text-xs text-red-500">
                  {errors.line1.message}
                </p>
              )}
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-medium text-slate-700">
                  City
                </label>
                <input
                  {...register("city")}
                  className="mt-1 w-full rounded border p-2 text-sm"
                />
                {errors.city && (
                  <p className="mt-1 text-xs text-red-500">
                    {errors.city.message}
                  </p>
                )}
              </div>
              <div>
                <label className="text-xs font-medium text-slate-700">
                  State
                </label>
                <input
                  {...register("state")}
                  className="mt-1 w-full rounded border p-2 text-sm"
                />
                {errors.state && (
                  <p className="mt-1 text-xs text-red-500">
                    {errors.state.message}
                  </p>
                )}
              </div>
              <div>
                <label className="text-xs font-medium text-slate-700">
                  Pincode
                </label>
                <input
                  {...register("pincode")}
                  className="mt-1 w-full rounded border p-2 text-sm"
                />
                {errors.pincode && (
                  <p className="mt-1 text-xs text-red-500">
                    {errors.pincode.message}
                  </p>
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={
                isPending ||
                isPaying ||
                (selectedProduct.has_variants && !selectedVariantId)
              }
              className="mt-6 w-full rounded-lg bg-blue-600 py-4 font-bold text-white transition hover:bg-blue-700 disabled:opacity-50"
            >
              {isPending || isPaying ? (
                <Loader2 className="mx-auto h-5 w-5 animate-spin" />
              ) : fiatDue > 0 ? (
                `Pay ₹${fiatDue} & Claim`
              ) : (
                "Confirm & Claim Gift"
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
