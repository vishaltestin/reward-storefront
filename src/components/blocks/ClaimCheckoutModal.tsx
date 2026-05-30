import { useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { X, Loader2, Gift } from "lucide-react"

import { useClaimStore } from "@/store/useClaimStore"
import { claimAddressSchema, type ClaimAddressValues } from "@/types/claim"
import { useExecuteClaimMutation } from "@/hooks/useClaimQueries"

export function ClaimCheckoutModal() {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()

  const {
    token,
    selectedProduct,
    rewardValue,
    setCheckoutModalOpen,
    clearClaimContext,
  } = useClaimStore()
  const { mutate: executeClaim, isPending } = useExecuteClaimMutation(slug!)

  const [selectedVariantId, setSelectedVariantId] = useState<number | null>(
    selectedProduct?.variants?.[0]?.id || null
  )

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ClaimAddressValues>({
    resolver: zodResolver(claimAddressSchema),
  })
  const generatePaymentRef = useState(() => () => `pay_ref_${Date.now()}`)[0]

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

  const onSubmit = async (formData: ClaimAddressValues) => {
    if (!token || !selectedVariantId) return

    let paymentReference = null
    if (fiatDue > 0) {
      const userApproved = window.confirm(`Pay ₹${fiatDue} via Gateway?`)
      if (!userApproved) return
      paymentReference = generatePaymentRef()
    }

    executeClaim(
      {
        token,
        product_variant_id: selectedVariantId,
        shipping_address: formData,
        fiat_paid: fiatDue,
        payment_reference: paymentReference,
      },
      {
        onSuccess: (data) => {
          clearClaimContext()
          alert(`Order Placed: ${data.order_number}`)
          navigate(`/${slug}/profile`)
        },
      }
    )
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
            ={" "}
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
              disabled={isPending || !selectedVariantId}
              className="mt-6 w-full rounded-lg bg-blue-600 py-4 font-bold text-white transition hover:bg-blue-700 disabled:opacity-50"
            >
              {isPending ? (
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
