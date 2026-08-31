import { useState, useMemo, useEffect, useRef } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { useQueryClient } from "@tanstack/react-query"
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
import {
  loadRazorpayScript,
  type RazorpaySuccessResponse,
} from "@/lib/razorpay"

export default function CheckoutPage() {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { items, clearCart } = useCartStore()
  const { config } = useTenantStore()
  const { user } = useAuthStore()

  const [walletBalance, setWalletBalance] = useState<number>(0)
  const [pointsToBurn, setPointsToBurn] = useState<number>(0)
  const [couponInput, setCouponInput] = useState<string>("")
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string
    value: number
  } | null>(null)

  // Track whether we're currently inside a payment attempt so the cancel
  // handler doesn't fire on unrelated re-renders.
  const pendingOrderRef = useRef<string | null>(null)

  // Set the moment an order completes (free or paid). clearCart() empties the
  // cart synchronously, which re-renders this page and fires the empty-cart
  // guard effect below — without this flag that guard navigates to the home
  // page a few milliseconds AFTER the success-page navigation and stomps it,
  // so the user never sees the order-success screen.
  const completedOrderRef = useRef(false)

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

  const { mutateAsync: verifyPaymentAsync, isPending: isVerifying } =
    useVerifyPaymentMutation(slug!)

  // Silent fire-and-forget — we don't block the UI on the cancel response
  const { mutate: cancelOrder } = useCancelOrderMutation(slug!)

  const isBusy = isProcessing || isVerifying || isApplyingCoupon

  useEffect(() => {
    // Checkout just completed: the success-page navigation owns routing from
    // here. Do NOT bounce to home even though the cart is now empty.
    if (completedOrderRef.current) return

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
  // Floor (not ceil): burning ceil(total × multiplier) points is worth MORE
  // than the order at fractional multipliers, and the server rejects any burn
  // whose rupee value exceeds the total — the slider/input max must always
  // be a value the backend will accept.
  const maxPointsUsable = Math.min(
    walletBalance,
    Math.floor(totalAfterCoupon * multiplier)
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
          completedOrderRef.current = true
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
                      .then(({ data: w }) =>
                        setWalletBalance(Number(w.balance))
                      )
                      .catch(() => {
                        /* silent */
                      })
                    // ...and drop the cached (pre-refund) wallet query so the
                    // profile page picks the new balance up immediately
                    void queryClient.invalidateQueries({
                      queryKey: ["wallet", slug],
                    })
                  },
                }
              )
            },
          },
          handler: (response: RazorpaySuccessResponse) => {
            // Payment completed — send proof to the backend, with retries.
            // IMPORTANT: if every retry fails, the money is STILL taken.
            // The server webhook fulfils the order on its own, so we must
            // never tell the user the payment failed.
            const proof = {
              order_number: data.order_number,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            }

            const attemptVerify = async (): Promise<boolean> => {
              for (let attempt = 1; attempt <= 3; attempt++) {
                try {
                  await verifyPaymentAsync(proof)
                  return true
                } catch {
                  if (attempt < 3) {
                    await new Promise((r) => setTimeout(r, 1200 * attempt))
                  }
                }
              }
              return false
            }

            attemptVerify().then((verified) => {
              pendingOrderRef.current = null

              // Mark complete BEFORE clearing the cart so the empty-cart
              // guard effect can't navigate home over the success page.
              completedOrderRef.current = true

              clearCart()

              // The order now exists (webhook/verify) and points were debited —
              // invalidate both caches so My Orders / wallet are fresh.
              void queryClient.invalidateQueries({
                queryKey: ["orders", slug],
              })
              void queryClient.invalidateQueries({
                queryKey: ["wallet", slug],
              })

              if (!verified) {
                toast.info(
                  `Payment received! Order ${data.order_number} is being confirmed — it will appear in your orders shortly.`,
                  { duration: 10000 }
                )
              }

              navigate(`/${slug}/order-success/${data.order_number}`)
            })
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
          className="h-11 rounded-xl border border-slate-200 bg-slate-50/50 text-sm shadow-none transition-colors focus:border-slate-300 focus:bg-white"
        />
        {errors[prefix]?.name && (
          <p className="mt-1 text-[11px] font-medium text-rose-500">
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
          className="h-11 rounded-xl border border-slate-200 bg-slate-50/50 text-sm shadow-none transition-colors focus:border-slate-300 focus:bg-white"
        />
        {errors[prefix]?.mobile && (
          <p className="mt-1 text-[11px] font-medium text-rose-500">
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
          className="h-11 rounded-xl border border-slate-200 bg-slate-50/50 text-sm shadow-none transition-colors focus:border-slate-300 focus:bg-white"
        />
        {errors[prefix]?.line1 && (
          <p className="mt-1 text-[11px] font-medium text-rose-500">
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
          className="h-11 rounded-xl border border-slate-200 bg-slate-50/50 text-sm shadow-none transition-colors focus:border-slate-300 focus:bg-white"
        />
        {errors[prefix]?.city && (
          <p className="mt-1 text-[11px] font-medium text-rose-500">
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
          className="h-11 rounded-xl border border-slate-200 bg-slate-50/50 text-sm shadow-none transition-colors focus:border-slate-300 focus:bg-white"
        />
        {errors[prefix]?.state && (
          <p className="mt-1 text-[11px] font-medium text-rose-500">
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
          className="h-11 rounded-xl border border-slate-200 bg-slate-50/50 text-sm shadow-none transition-colors focus:border-slate-300 focus:bg-white"
        />
        {errors[prefix]?.pincode && (
          <p className="mt-1 text-[11px] font-medium text-rose-500">
            {errors[prefix]?.pincode?.message}
          </p>
        )}
      </div>
    </div>
  )

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="mx-auto max-w-7xl py-8 font-sans">
      <div className="mb-8 space-y-2">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-[10px] font-semibold tracking-wide text-slate-600 uppercase">
          <Lock className="h-3 w-3" /> Secure Checkout Validation
        </span>
        <h1 className="font-heading text-3xl font-semibold tracking-tight text-slate-900 md:text-4xl">
          Finalize Allocation
        </h1>
      </div>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="grid grid-cols-1 items-start gap-8 lg:grid-cols-12"
      >
        {/* ── Left column ──────────────────────────────────────────────────── */}
        <div className="space-y-6 lg:col-span-7">
          {/* Cart summary */}
          <section className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm sm:p-8">
            <div className="mb-6 flex items-center gap-2">
              <div className="rounded-lg border border-slate-100 bg-slate-50 p-1.5">
                <Sparkles className="h-4 w-4 text-slate-700" />
              </div>
              <div>
                <h2 className="font-heading text-lg font-semibold tracking-tight text-slate-900">
                  Allocation Summary
                </h2>
                <p className="text-[11px] font-medium tracking-wider text-slate-400 uppercase">
                  {items.length} {items.length === 1 ? "Asset" : "Assets"} in
                  Cart
                </p>
              </div>
            </div>

            <div className="space-y-4 divide-y divide-slate-50">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="group flex py-4 first:pt-0 last:pb-0"
                >
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl border border-slate-100 bg-white p-1.5 transition-all group-hover:border-slate-200">
                    <img
                      src={
                        item.variant?.image_url ||
                        item.product.main_image_url ||
                        ""
                      }
                      alt={item.product.name}
                      className="max-h-full max-w-full object-contain"
                    />
                  </div>
                  <div className="ml-4 flex flex-1 flex-col justify-center">
                    <h4 className="line-clamp-1 text-sm font-semibold text-slate-800">
                      {item.product.name}
                    </h4>
                    {item.variant && (
                      <p className="mt-0.5 text-[11px] font-medium text-slate-400">
                        {Object.values(item.variant.attributes).join(" • ")}
                      </p>
                    )}
                    <div className="mt-1.5 flex items-center gap-3">
                      <span className="rounded-md border border-slate-100 bg-slate-50 px-2 py-0.5 text-[10px] font-bold tracking-wider text-slate-400 uppercase">
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
            <section className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm sm:p-8">
              <div className="mb-6 flex items-center gap-2">
                <div className="rounded-lg border border-slate-100 bg-slate-50 p-1.5">
                  <MapPin className="h-4 w-4 text-slate-700" />
                </div>
                <h2 className="font-heading text-lg font-semibold tracking-tight text-slate-900">
                  Fulfillment Address
                </h2>
              </div>
              {renderAddressFields("shipping_address")}
            </section>
          ) : (
            <section className="flex items-start gap-4 rounded-3xl border border-slate-100 bg-slate-50/50 p-6 shadow-sm sm:p-8">
              <div className="shrink-0 rounded-xl border border-slate-100 bg-white p-2 shadow-sm">
                <Sparkles className="h-5 w-5 text-indigo-500" />
              </div>
              <div>
                <h2 className="font-heading text-base font-semibold text-slate-900">
                  Digital Delivery Secured
                </h2>
                <p className="mt-1 text-xs leading-relaxed text-slate-500">
                  All items in your cart are digital assets. Fulfillment details
                  and instructions will be dispatched to{" "}
                  <strong>{user?.email}</strong> immediately upon completion.
                </p>
              </div>
            </section>
          )}

          {/* Billing address */}
          <section className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm sm:p-8">
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="rounded-lg border border-slate-100 bg-slate-50 p-1.5">
                  <Receipt className="h-4 w-4 text-slate-700" />
                </div>
                <h2 className="font-heading text-lg font-semibold tracking-tight text-slate-900">
                  Billing Details
                </h2>
              </div>
            </div>

            {requiresShipping && (
              <label
                htmlFor="use_shipping_for_billing"
                className="mb-6 flex cursor-pointer items-center gap-3 rounded-xl border border-slate-100 p-4 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
              >
                <div className="relative flex items-center">
                  <input
                    id="use_shipping_for_billing"
                    type="checkbox"
                    className="peer h-5 w-5 cursor-pointer appearance-none rounded-md border border-slate-300 transition-all checked:border-slate-900 checked:bg-slate-900 focus:ring-2 focus:ring-slate-900/20 focus:ring-offset-2 focus:outline-none"
                    {...register("use_shipping_for_billing")}
                  />
                  <CheckCircle2 className="pointer-events-none absolute top-1/2 left-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 text-white opacity-0 transition-opacity peer-checked:opacity-100" />
                </div>
                Use fulfillment address for billing
              </label>
            )}

            {!useShippingForBilling && (
              <div className="animate-in duration-300 fade-in slide-in-from-top-4">
                {renderAddressFields("billing_address")}
              </div>
            )}
          </section>
        </div>

        {/* ── Right column (sticky order summary) ──────────────────────────── */}
        <div className="lg:col-span-5">
          <div className="sticky top-24 space-y-6">
            <div className="overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-xl shadow-slate-200/20">
              {/* Wallet header */}
              <div className="relative overflow-hidden bg-slate-950 p-6 sm:p-8">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.08),transparent_60%)]" />
                <div className="relative z-10">
                  <div className="mb-1.5 flex items-center gap-2">
                    <Wallet className="h-4 w-4 text-slate-400" />
                    <span className="text-[10px] font-semibold tracking-widest text-slate-400 uppercase">
                      Corporate Wallet
                    </span>
                  </div>
                  <p className="font-heading text-3xl font-semibold text-white">
                    {walletBalance.toLocaleString("en-IN")}{" "}
                    <span className="text-sm font-medium text-slate-500">
                      {config?.points_name || "Points"}
                    </span>
                  </p>
                </div>
              </div>

              <div className="space-y-7 p-6 sm:p-8">
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
                      className="h-11 rounded-full border-slate-200 bg-slate-50/50 text-sm font-medium text-slate-900 shadow-none focus:border-slate-300 focus:bg-white"
                      disabled={totalAfterCoupon === 0}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      className="h-11 rounded-full border-slate-200 px-5 text-xs font-bold text-slate-700 shadow-none transition-all hover:bg-slate-900 hover:text-white"
                      onClick={() => setPointsToBurn(maxPointsUsable)}
                      disabled={totalAfterCoupon === 0}
                    >
                      Max
                    </Button>
                  </div>
                  {fiatDiscountFromPoints > 0 && (
                    <p className="mt-1 flex items-center gap-1 text-[11px] font-medium text-emerald-600">
                      <Sparkles className="h-3 w-3" /> Offset applied: ₹
                      {fiatDiscountFromPoints.toLocaleString("en-IN")}
                    </p>
                  )}
                </div>

                <div className="h-px w-full bg-slate-100" />

                {/* Coupon */}
                <div className="space-y-2.5">
                  <label className="flex items-center gap-1.5 text-[11px] font-semibold tracking-wider text-slate-500 uppercase">
                    <Ticket className="h-3.5 w-3.5" /> Voucher Code
                  </label>

                  {appliedCoupon ? (
                    <div className="flex items-center justify-between rounded-xl border border-emerald-100 bg-emerald-50 p-3 text-sm text-emerald-800">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                        <span className="font-semibold">
                          {appliedCoupon.code}
                        </span>{" "}
                        applied
                      </div>
                      <button
                        type="button"
                        onClick={() => setAppliedCoupon(null)}
                        className="text-[11px] font-semibold tracking-wide text-emerald-600/70 uppercase hover:text-emerald-700"
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
                        className="h-11 w-full rounded-full border border-slate-200 bg-slate-50/50 pr-24 pl-4 text-sm uppercase shadow-none focus:border-slate-300 focus:bg-white focus:ring-0"
                      />
                      <Button
                        type="button"
                        onClick={handleApplyCoupon}
                        disabled={!couponInput || isApplyingCoupon}
                        className="absolute top-1 right-1 h-9 rounded-full bg-slate-900 px-4 text-xs font-semibold text-white shadow-none hover:bg-slate-800 disabled:bg-slate-100 disabled:text-slate-400"
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
                    <p className="mt-1 text-[11px] font-medium text-rose-500">
                      {getApiErrorMessage(couponError)}
                    </p>
                  )}
                </div>

                {/* Checkout error */}
                {checkoutError && (
                  <div className="flex items-start gap-2 rounded-xl border border-rose-100 bg-rose-50 p-3 text-xs text-rose-700">
                    <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                    <p>{getApiErrorMessage(checkoutError)}</p>
                  </div>
                )}

                {/* Order totals */}
                <div className="space-y-3 pt-2 text-sm text-slate-600">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Subtotal</span>
                    <span className="font-semibold text-slate-900">
                      ₹{cartTotals.totalFiat.toLocaleString("en-IN")}
                    </span>
                  </div>

                  {appliedCoupon && (
                    <div className="flex items-center justify-between font-medium text-emerald-600">
                      <span>Voucher Discount</span>
                      <span>
                        - ₹{couponDiscountFiat.toLocaleString("en-IN")}
                      </span>
                    </div>
                  )}

                  {pointsToBurn > 0 && (
                    <div className="flex items-center justify-between font-medium text-indigo-600">
                      <span>Wallet Offset</span>
                      <span>
                        - ₹{fiatDiscountFromPoints.toLocaleString("en-IN")}
                      </span>
                    </div>
                  )}

                  <div className="mt-2 flex items-end justify-between border-t border-slate-100 pt-4">
                    <span className="text-xs font-semibold tracking-wider text-slate-500 uppercase">
                      Total Due
                    </span>
                    <span className="font-heading text-2xl font-bold tracking-tight text-slate-900">
                      ₹{finalFiatDue.toLocaleString("en-IN")}
                    </span>
                  </div>
                </div>

                {/* Submit */}
                <Button
                  type="submit"
                  disabled={isBusy}
                  className="group flex h-14 w-full items-center justify-center gap-2 rounded-full bg-slate-950 text-sm font-semibold text-white shadow-md transition-all hover:scale-[1.02] hover:bg-slate-800"
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

                <p className="flex items-center justify-center gap-1.5 pt-2 text-[11px] font-medium text-slate-400">
                  <ShieldCheck className="h-3.5 w-3.5" /> Encrypted & Secured
                  Node
                </p>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}
