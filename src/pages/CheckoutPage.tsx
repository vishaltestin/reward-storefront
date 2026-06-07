import { useState, useMemo, useEffect, useRef } from "react"
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
  Sparkles,
  Lock,
  ArrowRight,
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
  type CheckoutResponse,
  useCheckoutMutation,
  useValidateCouponMutation,
  useCancelOrderMutation,
  getApiErrorMessage,
  useVerifyPaymentMutation,
} from "@/hooks/useCheckoutMutations"

declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => RazorpayInstance
  }
}

interface RazorpayOptions {
  key: string
  amount: number
  currency: string
  name: string
  description: string
  order_id: string
  prefill?: { name?: string; email?: string }
  handler: (response: RazorpaySuccessResponse) => void
  modal?: { ondismiss?: () => void }
  theme?: { color?: string }
}

interface RazorpayInstance {
  open: () => void
}

interface RazorpaySuccessResponse {
  razorpay_order_id: string
  razorpay_payment_id: string
  razorpay_signature: string
}


function loadRazorpayScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.Razorpay) return resolve()

    const existing = document.querySelector(
      'script[src="https://checkout.razorpay.com/v1/checkout.js"]'
    )
    if (existing) {
      existing.addEventListener("load", () => resolve())
      existing.addEventListener("error", () =>
        reject(new Error("Razorpay script failed to load"))
      )
      return
    }

    const script = document.createElement("script")
    script.src = "https://checkout.razorpay.com/v1/checkout.js"
    script.async = true
    script.onload = () => resolve()
    script.onerror = () =>
      reject(new Error("Failed to load Razorpay SDK. Check your connection."))
    document.body.appendChild(script)
  })
}


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

  // Track whether we're currently inside a payment attempt so the cancel
  // handler doesn't fire on unrelated re-renders.
  const pendingOrderRef = useRef<string | null>(null)

  const requiresShipping = items.some((i) => i.product.type === "physical")

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors },
  } = useForm<CheckoutFormValues>({
    resolver: zodResolver(createCheckoutSchema(requiresShipping)),
    defaultValues: {
      use_shipping_for_billing: requiresShipping,
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

  const shippingAddress = useWatch({
    control,
    name: "shipping_address",
  })

  useEffect(() => {
    if (useShippingForBilling && requiresShipping) {
      setValue("billing_address", shippingAddress)
    }
  }, [useShippingForBilling, shippingAddress, setValue, requiresShipping])

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

  // Silent fire-and-forget — we don't block the UI on the cancel response
  const { mutate: cancelOrder } = useCancelOrderMutation(slug!)

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
  const totalAfterCoupon = Math.max(0, cartTotals.totalFiat - couponDiscountFiat)
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

  // ── Main submit ─────────────────────────────────────────────────────────────

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

    processCheckout(payload, {
      onSuccess: async (data: CheckoutResponse) => {
        // ── Free order: already paid server-side ─────────────────────────────
        if (data.status === "paid" || data.fiat_amount_due <= 0) {
          clearCart()
          navigate(`/${slug}/order-success/${data.order_number}`)
          return
        }

        // ── Paid order: open Razorpay modal ──────────────────────────────────

        // Store order number so the dismiss handler can cancel it
        pendingOrderRef.current = data.order_number

        try {
          await loadRazorpayScript()
        } catch {
          // Script failed — cancel escrowed order and tell the user
          cancelOrder(
            { order_number: data.order_number },
            {
              onSettled: () => {
                pendingOrderRef.current = null
              },
            }
          )
          alert(
            "Failed to load the payment gateway. Please check your connection and try again."
          )
          return
        }

        const rzp = new window.Razorpay({
          key: data.razorpay_key_id!,
          amount: data.razorpay_amount!,
          currency: data.razorpay_currency ?? "INR",
          name: data.company_name ?? "Store",
          description: `Order ${data.order_number}`,
          order_id: data.razorpay_order_id!,
          prefill: {
            name: data.user_name,
            email: data.user_email,
          },
          theme: {
            color: "#0f172a", // slate-950 — matches your brand
          },
          modal: {
            ondismiss: () => {
              // ── Edge case fix ─────────────────────────────────────────────
              // The user closed the modal without paying. The backend has
              // already escrowed their points and created a 'pending' order.
              // We cancel it here to refund the points and clean up.
              const orderNumber = pendingOrderRef.current
              if (!orderNumber) return

              cancelOrder(
                { order_number: orderNumber },
                {
                  onSettled: () => {
                    pendingOrderRef.current = null
                    // Refresh wallet balance to reflect refunded points
                    api
                      .get(`/${slug}/user/wallet`)
                      .then(({ data: w }) => setWalletBalance(Number(w.balance)))
                      .catch(() => {/* silent */ })
                  },
                }
              )
            },
          },
          handler: (response: RazorpaySuccessResponse) => {
            // Payment completed — send proof to backend for verification
            verifyPayment(
              {
                order_number: data.order_number,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              },
              {
                onSuccess: () => {
                  pendingOrderRef.current = null
                  clearCart()
                  navigate(`/${slug}/order-success/${data.order_number}`)
                },
                onError: () => {
                  pendingOrderRef.current = null
                  alert(
                    "Payment was received but verification failed. Please contact support with your order number: " +
                    data.order_number
                  )
                },
              }
            )
          },
        })

        rzp.open()
      },
    })
  }

  // ── Address field renderer ──────────────────────────────────────────────────

  const renderAddressFields = (
    prefix: "shipping_address" | "billing_address"
  ) => (
    <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
      <div className="space-y-1.5">
        <label className="text-[10px] font-semibold tracking-wider text-slate-500 uppercase">
          Full Name <span className="text-rose-500">*</span>
        </label>
        <Input
          {...register(`${prefix}.name`)}
          aria-invalid={!!errors[prefix]?.name}
          className="h-11 rounded-xl border border-slate-200 bg-slate-50/50 text-sm focus:bg-white focus:border-slate-300 transition-colors shadow-none"
        />
        {errors[prefix]?.name && (
          <p className="text-[11px] font-medium text-rose-500 mt-1">
            {errors[prefix]?.name?.message}
          </p>
        )}
      </div>
      <div className="space-y-1.5">
        <label className="text-[10px] font-semibold tracking-wider text-slate-500 uppercase">
          Mobile Number <span className="text-rose-500">*</span>
        </label>
        <Input
          type="tel"
          {...register(`${prefix}.mobile`)}
          aria-invalid={!!errors[prefix]?.mobile}
          className="h-11 rounded-xl border border-slate-200 bg-slate-50/50 text-sm focus:bg-white focus:border-slate-300 transition-colors shadow-none"
        />
        {errors[prefix]?.mobile && (
          <p className="text-[11px] font-medium text-rose-500 mt-1">
            {errors[prefix]?.mobile?.message}
          </p>
        )}
      </div>
      <div className="space-y-1.5 md:col-span-2">
        <label className="text-[10px] font-semibold tracking-wider text-slate-500 uppercase">
          Street Address <span className="text-rose-500">*</span>
        </label>
        <Input
          placeholder="Flat, House no., Building, Company, Apartment"
          {...register(`${prefix}.line1`)}
          aria-invalid={!!errors[prefix]?.line1}
          className="h-11 rounded-xl border border-slate-200 bg-slate-50/50 text-sm focus:bg-white focus:border-slate-300 transition-colors shadow-none"
        />
        {errors[prefix]?.line1 && (
          <p className="text-[11px] font-medium text-rose-500 mt-1">
            {errors[prefix]?.line1?.message}
          </p>
        )}
      </div>
      <div className="space-y-1.5">
        <label className="text-[10px] font-semibold tracking-wider text-slate-500 uppercase">
          City <span className="text-rose-500">*</span>
        </label>
        <Input
          {...register(`${prefix}.city`)}
          aria-invalid={!!errors[prefix]?.city}
          className="h-11 rounded-xl border border-slate-200 bg-slate-50/50 text-sm focus:bg-white focus:border-slate-300 transition-colors shadow-none"
        />
        {errors[prefix]?.city && (
          <p className="text-[11px] font-medium text-rose-500 mt-1">
            {errors[prefix]?.city?.message}
          </p>
        )}
      </div>
      <div className="space-y-1.5">
        <label className="text-[10px] font-semibold tracking-wider text-slate-500 uppercase">
          State <span className="text-rose-500">*</span>
        </label>
        <Input
          {...register(`${prefix}.state`)}
          aria-invalid={!!errors[prefix]?.state}
          className="h-11 rounded-xl border border-slate-200 bg-slate-50/50 text-sm focus:bg-white focus:border-slate-300 transition-colors shadow-none"
        />
        {errors[prefix]?.state && (
          <p className="text-[11px] font-medium text-rose-500 mt-1">
            {errors[prefix]?.state?.message}
          </p>
        )}
      </div>
      <div className="space-y-1.5">
        <label className="text-[10px] font-semibold tracking-wider text-slate-500 uppercase">
          Pincode <span className="text-rose-500">*</span>
        </label>
        <Input
          {...register(`${prefix}.pincode`)}
          aria-invalid={!!errors[prefix]?.pincode}
          className="h-11 rounded-xl border border-slate-200 bg-slate-50/50 text-sm focus:bg-white focus:border-slate-300 transition-colors shadow-none"
        />
        {errors[prefix]?.pincode && (
          <p className="text-[11px] font-medium text-rose-500 mt-1">
            {errors[prefix]?.pincode?.message}
          </p>
        )}
      </div>
    </div>
  )

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="max-w-7xl mx-auto py-8 font-sans">
      <div className="mb-8 space-y-2">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-[10px] font-semibold tracking-wide text-slate-600 uppercase">
          <Lock className="h-3 w-3" /> Secure Checkout Validation
        </span>
        <h1 className="text-3xl font-heading font-semibold tracking-tight text-slate-900 md:text-4xl">
          Finalize Allocation
        </h1>
      </div>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="grid grid-cols-1 gap-8 lg:grid-cols-12 items-start"
      >
        {/* ── Left column ──────────────────────────────────────────────────── */}
        <div className="space-y-6 lg:col-span-7">

          {/* Cart summary */}
          <section className="rounded-3xl border border-slate-100 bg-white p-6 sm:p-8 shadow-sm">
            <div className="flex items-center gap-2 mb-6">
              <div className="bg-slate-50 p-1.5 rounded-lg border border-slate-100">
                <Sparkles className="h-4 w-4 text-slate-700" />
              </div>
              <div>
                <h2 className="text-lg font-heading font-semibold text-slate-900 tracking-tight">
                  Allocation Summary
                </h2>
                <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
                  {items.length} {items.length === 1 ? "Asset" : "Assets"} in Cart
                </p>
              </div>
            </div>

            <div className="space-y-4 divide-y divide-slate-50">
              {items.map((item) => (
                <div key={item.id} className="flex py-4 first:pt-0 last:pb-0 group">
                  <div className="h-16 w-16 shrink-0 rounded-xl border border-slate-100 bg-white p-1.5 flex items-center justify-center transition-all group-hover:border-slate-200">
                    <img
                      src={item.variant?.image_url || item.product.main_image_url || ""}
                      alt={item.product.name}
                      className="max-h-full max-w-full object-contain"
                    />
                  </div>
                  <div className="ml-4 flex flex-1 flex-col justify-center">
                    <h4 className="line-clamp-1 text-sm font-semibold text-slate-800">
                      {item.product.name}
                    </h4>
                    {item.variant && (
                      <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                        {Object.values(item.variant.attributes).join(" • ")}
                      </p>
                    )}
                    <div className="mt-1.5 flex items-center gap-3">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-100">
                        Qty: {item.quantity}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Shipping address */}
          {requiresShipping ? (
            <section className="rounded-3xl border border-slate-100 bg-white p-6 sm:p-8 shadow-sm">
              <div className="flex items-center gap-2 mb-6">
                <div className="bg-slate-50 p-1.5 rounded-lg border border-slate-100">
                  <MapPin className="h-4 w-4 text-slate-700" />
                </div>
                <h2 className="text-lg font-heading font-semibold text-slate-900 tracking-tight">
                  Fulfillment Address
                </h2>
              </div>
              {renderAddressFields("shipping_address")}
            </section>
          ) : (
            <section className="rounded-3xl border border-slate-100 bg-slate-50/50 p-6 sm:p-8 shadow-sm flex items-start gap-4">
              <div className="bg-white p-2 rounded-xl border border-slate-100 shadow-sm shrink-0">
                <Sparkles className="h-5 w-5 text-indigo-500" />
              </div>
              <div>
                <h2 className="text-base font-heading font-semibold text-slate-900">
                  Digital Delivery Secured
                </h2>
                <p className="text-xs text-slate-500 leading-relaxed mt-1">
                  All items in your cart are digital assets. Fulfillment details
                  and instructions will be dispatched to{" "}
                  <strong>{user?.email}</strong> immediately upon completion.
                </p>
              </div>
            </section>
          )}

          {/* Billing address */}
          <section className="rounded-3xl border border-slate-100 bg-white p-6 sm:p-8 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <div className="bg-slate-50 p-1.5 rounded-lg border border-slate-100">
                  <Receipt className="h-4 w-4 text-slate-700" />
                </div>
                <h2 className="text-lg font-heading font-semibold text-slate-900 tracking-tight">
                  Billing Details
                </h2>
              </div>
            </div>

            {requiresShipping && (
              <label
                htmlFor="use_shipping_for_billing"
                className="flex cursor-pointer items-center gap-3 text-sm font-medium text-slate-700 p-4 border border-slate-100 rounded-xl hover:bg-slate-50 transition-colors mb-6"
              >
                <div className="relative flex items-center">
                  <input
                    id="use_shipping_for_billing"
                    type="checkbox"
                    className="peer h-5 w-5 cursor-pointer appearance-none rounded-md border border-slate-300 checked:border-slate-900 checked:bg-slate-900 transition-all focus:outline-none focus:ring-2 focus:ring-slate-900/20 focus:ring-offset-2"
                    {...register("use_shipping_for_billing")}
                  />
                  <CheckCircle2 className="pointer-events-none absolute left-1/2 top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 text-white opacity-0 peer-checked:opacity-100 transition-opacity" />
                </div>
                Use fulfillment address for billing
              </label>
            )}

            {!useShippingForBilling && (
              <div className="animate-in fade-in slide-in-from-top-4 duration-300">
                {renderAddressFields("billing_address")}
              </div>
            )}
          </section>
        </div>

        {/* ── Right column (sticky order summary) ──────────────────────────── */}
        <div className="lg:col-span-5">
          <div className="sticky top-24 space-y-6">
            <div className="rounded-3xl border border-slate-100 bg-white shadow-xl shadow-slate-200/20 overflow-hidden">

              {/* Wallet header */}
              <div className="bg-slate-950 p-6 sm:p-8 relative overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.08),transparent_60%)]" />
                <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-1.5">
                    <Wallet className="h-4 w-4 text-slate-400" />
                    <span className="text-[10px] font-semibold tracking-widest uppercase text-slate-400">
                      Corporate Wallet
                    </span>
                  </div>
                  <p className="text-3xl font-heading font-semibold text-white">
                    {walletBalance.toLocaleString("en-IN")}{" "}
                    <span className="text-sm font-medium text-slate-500">
                      {config?.points_name || "Points"}
                    </span>
                  </p>
                </div>
              </div>

              <div className="p-6 sm:p-8 space-y-7">

                {/* Points burn */}
                <div className="space-y-2.5">
                  <label className="text-[11px] font-semibold tracking-wider text-slate-500 uppercase">
                    Allocate Points
                  </label>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      min={0}
                      max={maxPointsUsable}
                      value={pointsToBurn || ""}
                      placeholder="0"
                      onChange={(e) =>
                        setPointsToBurn(
                          Math.min(
                            maxPointsUsable,
                            Math.max(0, Number(e.target.value))
                          )
                        )
                      }
                      className="h-11 rounded-full border-slate-200 bg-slate-50/50 text-sm font-medium focus:bg-white focus:border-slate-300 shadow-none text-slate-900"
                      disabled={totalAfterCoupon === 0}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      className="h-11 rounded-full px-5 text-xs font-bold border-slate-200 text-slate-700 hover:bg-slate-900 hover:text-white transition-all shadow-none"
                      onClick={() => setPointsToBurn(maxPointsUsable)}
                      disabled={totalAfterCoupon === 0}
                    >
                      Max
                    </Button>
                  </div>
                  {fiatDiscountFromPoints > 0 && (
                    <p className="text-[11px] font-medium text-emerald-600 flex items-center gap-1 mt-1">
                      <Sparkles className="h-3 w-3" /> Offset applied: ₹
                      {fiatDiscountFromPoints.toLocaleString("en-IN")}
                    </p>
                  )}
                </div>

                <div className="h-px bg-slate-100 w-full" />

                {/* Coupon */}
                <div className="space-y-2.5">
                  <label className="text-[11px] font-semibold tracking-wider text-slate-500 uppercase flex items-center gap-1.5">
                    <Ticket className="h-3.5 w-3.5" /> Voucher Code
                  </label>

                  {appliedCoupon ? (
                    <div className="flex items-center justify-between rounded-xl border border-emerald-100 bg-emerald-50 p-3 text-sm text-emerald-800">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                        <span className="font-semibold">{appliedCoupon.code}</span>{" "}
                        applied
                      </div>
                      <button
                        type="button"
                        onClick={() => setAppliedCoupon(null)}
                        className="text-[11px] font-semibold text-emerald-600/70 hover:text-emerald-700 uppercase tracking-wide"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <div className="relative">
                      <Input
                        placeholder="Enter authorization code"
                        value={couponInput}
                        onChange={(e) => setCouponInput(e.target.value)}
                        className="h-11 w-full rounded-full border border-slate-200 bg-slate-50/50 pl-4 pr-24 text-sm uppercase focus:border-slate-300 focus:bg-white focus:ring-0 shadow-none"
                      />
                      <Button
                        type="button"
                        onClick={handleApplyCoupon}
                        disabled={!couponInput || isApplyingCoupon}
                        className="absolute right-1 top-1 h-9 rounded-full bg-slate-900 px-4 text-xs font-semibold text-white hover:bg-slate-800 disabled:bg-slate-100 disabled:text-slate-400 shadow-none"
                      >
                        {isApplyingCoupon ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          "Apply"
                        )}
                      </Button>
                    </div>
                  )}
                  {couponError && (
                    <p className="text-[11px] font-medium text-rose-500 mt-1">
                      {getApiErrorMessage(couponError)}
                    </p>
                  )}
                </div>

                {/* Checkout error */}
                {checkoutError && (
                  <div className="flex items-start gap-2 rounded-xl bg-rose-50 p-3 text-xs text-rose-700 border border-rose-100">
                    <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                    <p>{getApiErrorMessage(checkoutError)}</p>
                  </div>
                )}

                {/* Order totals */}
                <div className="space-y-3 pt-2 text-sm text-slate-600">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Subtotal</span>
                    <span className="font-semibold text-slate-900">
                      ₹{cartTotals.totalFiat.toLocaleString("en-IN")}
                    </span>
                  </div>

                  {appliedCoupon && (
                    <div className="flex justify-between items-center font-medium text-emerald-600">
                      <span>Voucher Discount</span>
                      <span>- ₹{couponDiscountFiat.toLocaleString("en-IN")}</span>
                    </div>
                  )}

                  {pointsToBurn > 0 && (
                    <div className="flex justify-between items-center font-medium text-indigo-600">
                      <span>Wallet Offset</span>
                      <span>
                        - ₹{fiatDiscountFromPoints.toLocaleString("en-IN")}
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between items-end border-t border-slate-100 pt-4 mt-2">
                    <span className="text-xs font-semibold tracking-wider text-slate-500 uppercase">
                      Total Due
                    </span>
                    <span className="text-2xl font-heading font-bold text-slate-900 tracking-tight">
                      ₹{finalFiatDue.toLocaleString("en-IN")}
                    </span>
                  </div>
                </div>

                {/* Submit */}
                <Button
                  type="submit"
                  disabled={isBusy}
                  className="w-full h-14 rounded-full bg-slate-950 text-sm font-semibold text-white hover:bg-slate-800 hover:scale-[1.02] transition-all shadow-md group flex items-center justify-center gap-2"
                >
                  {isBusy ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" /> Finalizing...
                    </>
                  ) : finalFiatDue > 0 ? (
                    <>
                      Pay ₹{finalFiatDue.toLocaleString("en-IN")}{" "}
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </>
                  ) : (
                    <>
                      Confirm Allocation (Free){" "}
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </>
                  )}
                </Button>

                <p className="flex items-center justify-center gap-1.5 text-[11px] font-medium text-slate-400 pt-2">
                  <ShieldCheck className="h-3.5 w-3.5" /> Encrypted & Secured Node
                </p>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}