import { useState, useMemo, useEffect } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import {
  ShieldCheck,
  Wallet,
  Ticket,
  MapPin,
  Loader2,
  CheckCircle2,
  Receipt,
  AlertCircle,
} from "lucide-react"

import { useCartStore } from "@/store/useCartStore"
import { useTenantStore } from "@/store/useTenantStore"
import { useAuthStore } from "@/store/useAuthStore"
import { api } from "@/lib/api"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

import {
  createCheckoutSchema,
  type CheckoutFormValues,
  useCheckoutMutation,
  useValidateCouponMutation,
  getApiErrorMessage,
  useVerifyPaymentMutation,
} from "@/hooks/useCheckoutMutations"

export default function CheckoutPage() {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()

  const { items, clearCart } = useCartStore()
  const { config } = useTenantStore()
  const { user } = useAuthStore()

  const [walletBalance, setWalletBalance] = useState<number>(0)
  const [pointsToBurn, setPointsToBurn] = useState<number>(0)

  const [couponInput, setCouponInput] = useState("")
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string
    value: number
  } | null>(null)

  const requiresShipping = items.some((i) => i.product.type === "physical")

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<CheckoutFormValues>({
    resolver: zodResolver(createCheckoutSchema(requiresShipping)),
    defaultValues: {
      use_shipping_for_billing: true,
      shipping_address: {
        name: `${user?.first_name || ""} ${user?.last_name || ""}`.trim(),
        mobile: "",
        line1: "",
        city: "",
        state: "",
        pincode: "",
      },
      billing_address: {
        name: "",
        mobile: "",
        line1: "",
        city: "",
        state: "",
        pincode: "",
      },
    },
  })

  const useShippingForBilling = useWatch({
    control,
    name: "use_shipping_for_billing",
  })

  const {
    mutate: validateCoupon,
    isPending: isApplyingCoupon,
    error: couponError,
  } = useValidateCouponMutation(slug!)
  const {
    mutate: processCheckout,
    isPending: isProcessing,
    error: checkoutError,
  } = useCheckoutMutation(slug!)

  const { mutate: verifyPayment, isPending: isVerifying } =
    useVerifyPaymentMutation(slug!)

  const isBusy = isProcessing || isVerifying || isApplyingCoupon
  useEffect(() => {
    if (items.length === 0) {
      navigate(`/${slug}`)
      return
    }
    const fetchWallet = async () => {
      try {
        const { data } = await api.get(`/${slug}/user/wallet`)
        setWalletBalance(Number(data.balance))
      } catch (err) {
        console.error("Failed to fetch wallet balance", err)
      }
    }
    fetchWallet()
  }, [items.length, navigate, slug])

  const multiplier = Number(config?.point_multiplier || 1.0)

  const cartTotals = useMemo(() => {
    let totalFiat = 0
    let totalPoints = 0

    items.forEach((item) => {
      let fiat = item.variant
        ? Number(item.variant.selling_price)
        : Number(item.product.selling_price)
      let pts = item.variant
        ? item.variant.points_equivalent
        : item.product.points_equivalent

      if (item.product.tier_prices && Array.isArray(item.product.tier_prices)) {
        const applicableTiers = item.product.tier_prices.filter(
          (t) => t.variant_id == null || t.variant_id === item.variant?.id
        )
        const tier = [...applicableTiers]
          .sort((a, b) => b.min_quantity - a.min_quantity)
          .find((t) => item.quantity >= t.min_quantity)
        if (tier) {
          fiat = Number(tier.selling_price)
          pts = tier.points_equivalent
        }
      }

      totalFiat += fiat * item.quantity
      totalPoints += pts * item.quantity
    })
    return { totalFiat, totalPoints }
  }, [items])

  const couponDiscountFiat = appliedCoupon ? appliedCoupon.value : 0
  const totalAfterCoupon = Math.max(
    0,
    cartTotals.totalFiat - couponDiscountFiat
  )

  const maxPointsUsable = Math.min(
    walletBalance,
    Math.ceil(totalAfterCoupon * multiplier)
  )
  const fiatDiscountFromPoints = pointsToBurn / multiplier
  const finalFiatDue = Math.max(0, totalAfterCoupon - fiatDiscountFromPoints)

  const handleApplyCoupon = () => {
    if (!couponInput) return
    const cartProductIds = Array.from(
      new Set(items.map((item) => Number(item.product.id)))
    )

    validateCoupon(
      { code: couponInput, cart_product_ids: cartProductIds },
      {
        onSuccess: (data) => {
          setAppliedCoupon(data)
          setCouponInput("")
          setPointsToBurn(0)
        },
      }
    )
  }

  const onSubmit = (formData: CheckoutFormValues) => {
    const payload = {
      items: items.map((i) => ({
        product_id: Number(i.product.id),
        variant_id: i.variant ? Number(i.variant.id) : null,
        quantity: i.quantity,
      })),
      points_to_burn: pointsToBurn,
      applied_coupon: appliedCoupon?.code || null,
      shipping_address: requiresShipping
        ? (formData.shipping_address as Record<string, string>)
        : null,
      billing_address: formData.use_shipping_for_billing
        ? (formData.shipping_address as Record<string, string>)
        : (formData.billing_address as Record<string, string>),
    }

    // PHASE 1: Initialize Checkout (Escrow & Math)
    processCheckout(payload, {
      onSuccess: (data) => {
        // SCENARIO A: 100% Free Order (Paid entirely by points/coupons)
        if (data.status === "paid" || data.fiat_amount_due <= 0) {
          clearCart()
          navigate(`/${slug}/order-success/${data.order_number}`)
          return
        }

        // SCENARIO B: Requires Fiat Payment
        // This is where you will eventually put the Razorpay/Stripe JS SDK trigger.
        // For now, we simulate it with a browser popup.
        const userApprovedPayment = window.confirm(
          `*** MOCK PAYMENT GATEWAY ***\n\nOrder Total: ₹${data.fiat_amount_due.toLocaleString("en-IN")}\n\nClick OK to simulate a successful credit card charge.\nClick Cancel to simulate a failed/abandoned payment.`
        )

        if (userApprovedPayment) {
          // PHASE 2: Verification & Fulfillment
          // The gateway gave us a success ID, now tell the backend to deduct stock!
          const mockPaymentId = `pay_${Math.random().toString(36).substring(2, 15)}`

          verifyPayment(
            { order_number: data.order_number, payment_id: mockPaymentId },
            {
              onSuccess: () => {
                clearCart()
                navigate(`/${slug}/order-success/${data.order_number}`)
              },
              onError: (error) => {
                alert("Payment verification failed! Please contact support.")
                console.error(error)
              },
            }
          )
        } else {
          // User clicked Cancel on the mock gateway.
          // The order remains 'Pending' in the DB. The points remain in escrow.
          alert(
            "Payment was cancelled. You can complete this payment later from your Orders dashboard."
          )
        }
      },
    })
  }

  const renderAddressFields = (
    prefix: "shipping_address" | "billing_address"
  ) => (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <div className="space-y-1">
        <label className="text-sm font-medium text-slate-700">
          Full Name *
        </label>
        <Input
          {...register(`${prefix}.name`)}
          aria-invalid={!!errors[prefix]?.name}
        />
        {errors[prefix]?.name && (
          <p className="text-xs text-red-500">
            {errors[prefix]?.name?.message}
          </p>
        )}
      </div>
      <div className="space-y-1">
        <label className="text-sm font-medium text-slate-700">
          Mobile Number *
        </label>
        <Input
          type="tel"
          {...register(`${prefix}.mobile`)}
          aria-invalid={!!errors[prefix]?.mobile}
        />
        {errors[prefix]?.mobile && (
          <p className="text-xs text-red-500">
            {errors[prefix]?.mobile?.message}
          </p>
        )}
      </div>
      <div className="space-y-1 md:col-span-2">
        <label className="text-sm font-medium text-slate-700">
          Street Address *
        </label>
        <Input
          placeholder="Flat, House no., Building"
          {...register(`${prefix}.line1`)}
          aria-invalid={!!errors[prefix]?.line1}
        />
        {errors[prefix]?.line1 && (
          <p className="text-xs text-red-500">
            {errors[prefix]?.line1?.message}
          </p>
        )}
      </div>
      <div className="space-y-1">
        <label className="text-sm font-medium text-slate-700">City *</label>
        <Input
          {...register(`${prefix}.city`)}
          aria-invalid={!!errors[prefix]?.city}
        />
        {errors[prefix]?.city && (
          <p className="text-xs text-red-500">
            {errors[prefix]?.city?.message}
          </p>
        )}
      </div>
      <div className="space-y-1">
        <label className="text-sm font-medium text-slate-700">State *</label>
        <Input
          {...register(`${prefix}.state`)}
          aria-invalid={!!errors[prefix]?.state}
        />
        {errors[prefix]?.state && (
          <p className="text-xs text-red-500">
            {errors[prefix]?.state?.message}
          </p>
        )}
      </div>
      <div className="space-y-1">
        <label className="text-sm font-medium text-slate-700">Pincode *</label>
        <Input
          {...register(`${prefix}.pincode`)}
          aria-invalid={!!errors[prefix]?.pincode}
        />
        {errors[prefix]?.pincode && (
          <p className="text-xs text-red-500">
            {errors[prefix]?.pincode?.message}
          </p>
        )}
      </div>
    </div>
  )

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="grid grid-cols-1 gap-12 lg:grid-cols-12"
    >
      <div className="space-y-8 lg:col-span-7">
        <h1 className="text-3xl font-bold text-slate-900">Checkout</h1>

        {requiresShipping ? (
          <section className="rounded-2xl border bg-white p-6 shadow-sm">
            <h2 className="mb-4 flex items-center gap-2 text-xl font-bold text-slate-900">
              <MapPin className="h-5 w-5 text-slate-400" /> Shipping Address
            </h2>
            {renderAddressFields("shipping_address")}
          </section>
        ) : (
          <section className="rounded-2xl border bg-white p-6 shadow-sm">
            <h2 className="mb-2 text-xl font-bold text-slate-900">
              Digital Delivery
            </h2>
            <p className="text-sm text-slate-600">
              All items in your cart are digital. Details will be sent to{" "}
              <strong>{user?.email}</strong> immediately.
            </p>
          </section>
        )}

        <section className="rounded-2xl border bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-xl font-bold text-slate-900">
              <Receipt className="h-5 w-5 text-slate-400" /> Billing Address
            </h2>
          </div>

          <label className="mb-6 flex cursor-pointer items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
              {...register("use_shipping_for_billing")}
            />
            Same as shipping address
          </label>

          {!useShippingForBilling && renderAddressFields("billing_address")}
        </section>

        <section className="rounded-2xl border bg-white p-6 shadow-sm">
          <h2 className="mb-6 text-xl font-bold text-slate-900">
            Order Summary ({items.length} items)
          </h2>
          <div className="space-y-4 divide-y">
            {items.map((item) => (
              <div key={item.id} className="flex py-4 first:pt-0 last:pb-0">
                <div className="h-16 w-16 shrink-0 rounded-lg border bg-slate-50 p-2">
                  <img
                    src={
                      item.variant?.image_url ||
                      item.product.main_image_url ||
                      ""
                    }
                    alt={item.product.name}
                    className="h-full w-full object-contain mix-blend-multiply"
                  />
                </div>
                <div className="ml-4 flex flex-1 flex-col justify-center">
                  <h4 className="line-clamp-1 font-semibold text-slate-900">
                    {item.product.name}
                  </h4>
                  {item.variant && (
                    <p className="text-xs text-slate-500">
                      {Object.values(item.variant.attributes).join(" • ")}
                    </p>
                  )}
                  <p className="mt-1 text-sm font-medium text-slate-500">
                    Qty: {item.quantity}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      <div className="lg:col-span-5">
        <div className="sticky top-24 space-y-6 rounded-2xl border bg-slate-50 p-6 shadow-sm">
          <h2 className="text-xl font-bold text-slate-900">Payment Summary</h2>

          {checkoutError && (
            <div className="flex items-start gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <p>{getApiErrorMessage(checkoutError)}</p>
            </div>
          )}

          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-bold text-slate-900">
              <Ticket className="h-4 w-4" /> Have a Promo Code?
            </label>

            {appliedCoupon ? (
              <div className="flex items-center justify-between rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-800">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span className="font-bold">{appliedCoupon.code}</span>{" "}
                  applied!
                </div>
                <button
                  type="button"
                  onClick={() => setAppliedCoupon(null)}
                  className="text-xs text-slate-500 underline hover:text-slate-700"
                >
                  Remove
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <Input
                  placeholder="Enter code"
                  value={couponInput}
                  onChange={(e) => setCouponInput(e.target.value)}
                  className="bg-white uppercase"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleApplyCoupon}
                  disabled={!couponInput || isApplyingCoupon}
                >
                  {isApplyingCoupon ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Apply"
                  )}
                </Button>
              </div>
            )}
            {couponError && (
              <p className="text-xs text-red-500">
                {getApiErrorMessage(couponError)}
              </p>
            )}
          </div>

          <div className="rounded-xl border border-blue-100 bg-white p-4">
            <div className="mb-4 flex items-center gap-3 text-blue-900">
              <Wallet className="h-5 w-5" />
              <h3 className="font-bold">Your Wallet</h3>
            </div>
            <p className="mb-1 text-sm text-slate-500">Available Balance</p>
            <p className="mb-4 text-2xl font-bold text-slate-900">
              {walletBalance}{" "}
              <span className="text-sm font-normal text-slate-500">
                {config?.points_name}
              </span>
            </p>

            <div className="space-y-2 border-t pt-4">
              <label className="block text-sm font-medium text-slate-700">
                Points to apply to this order:
              </label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  min={0}
                  max={maxPointsUsable}
                  value={pointsToBurn}
                  onChange={(e) =>
                    setPointsToBurn(
                      Math.min(
                        maxPointsUsable,
                        Math.max(0, Number(e.target.value))
                      )
                    )
                  }
                  className="bg-slate-50"
                  disabled={totalAfterCoupon === 0}
                />
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setPointsToBurn(maxPointsUsable)}
                  disabled={totalAfterCoupon === 0}
                >
                  Max
                </Button>
              </div>
              {fiatDiscountFromPoints > 0 && (
                <p className="mt-1 text-xs font-medium text-blue-600">
                  Saves you ₹{fiatDiscountFromPoints.toLocaleString("en-IN")}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-3 pt-4 text-sm text-slate-600">
            <div className="flex justify-between">
              <span>Cart Total</span>
              <span className="font-semibold text-slate-900">
                ₹{cartTotals.totalFiat.toLocaleString("en-IN")}
              </span>
            </div>

            {appliedCoupon && (
              <div className="flex justify-between font-medium text-green-600">
                <span>Promo Code ({appliedCoupon.code})</span>
                <span>- ₹{couponDiscountFiat.toLocaleString("en-IN")}</span>
              </div>
            )}

            {pointsToBurn > 0 && (
              <div className="flex justify-between font-medium text-blue-600">
                <span>Wallet Points Applied</span>
                <span>- ₹{fiatDiscountFromPoints.toLocaleString("en-IN")}</span>
              </div>
            )}

            <div className="flex justify-between border-t border-slate-200 pt-3 text-xl font-bold text-slate-900">
              <span>Total to Pay</span>
              <span>₹{finalFiatDue.toLocaleString("en-IN")}</span>
            </div>
          </div>

          <Button
            type="submit"
            size="lg"
            disabled={isBusy}
            className="w-full rounded-full bg-slate-900 py-6 text-lg text-white hover:bg-slate-800"
          >
            {isBusy ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Processing...
              </>
            ) : finalFiatDue > 0 ? (
              `Pay ₹${finalFiatDue.toLocaleString("en-IN")}`
            ) : (
              "Place Order (Free)"
            )}
          </Button>

          <p className="flex items-center justify-center gap-2 text-xs text-slate-400">
            <ShieldCheck className="h-4 w-4" /> Secure 256-bit encrypted
            checkout
          </p>
        </div>
      </div>
    </form>
  )
}
