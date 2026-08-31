import { useEffect } from "react"
import { useParams, useNavigate, Link } from "react-router-dom"
import {
  ArrowLeft,
  Loader2,
  Package,
  PackageCheck,
  MapPin,
  TruckIcon,
  ReceiptText,
  Ticket,
  Wallet,
  FileWarning,
} from "lucide-react"

import { useAuthStore } from "@/store/useAuthStore"
import { useOrderDetail } from "@/hooks/useStorefront"

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  paid: "bg-blue-50 text-blue-700 border-blue-200",
  processing: "bg-indigo-50 text-indigo-700 border-indigo-200",
  shipped: "bg-violet-50 text-violet-700 border-violet-200",
  completed: "bg-emerald-50 text-emerald-700 border-emerald-200",
  cancelled: "bg-rose-50 text-rose-700 border-rose-200",
}

const DELIVERY_STYLES: Record<string, string> = {
  pending: "bg-slate-100 text-slate-600 border-slate-200",
  processing: "bg-indigo-50 text-indigo-700 border-indigo-200",
  shipped: "bg-violet-50 text-violet-700 border-violet-200",
  delivered: "bg-emerald-50 text-emerald-700 border-emerald-200",
  instant: "bg-emerald-50 text-emerald-700 border-emerald-200",
}

const inr = (value: number | null | undefined) =>
  `₹${Number(value ?? 0).toLocaleString("en-IN")}`

export default function OrderDetailPage() {
  const { slug, orderNumber } = useParams<{
    slug: string
    orderNumber: string
  }>()
  const navigate = useNavigate()
  const { isAuthenticated } = useAuthStore()

  const { data: order, isLoading, error } = useOrderDetail(slug!, orderNumber!)

  useEffect(() => {
    if (!isAuthenticated) navigate(`/${slug}`)
  }, [isAuthenticated, navigate, slug])

  if (isLoading)
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-7 w-7 animate-spin text-slate-400" />
      </div>
    )

  if (error || !order)
    return (
      <div className="mx-auto flex max-w-xl flex-col items-center gap-4 px-4 py-24 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50">
          <FileWarning className="h-6 w-6 text-rose-500" />
        </div>
        <h1 className="font-heading text-xl font-semibold text-slate-900">
          Order not found
        </h1>
        <p className="text-sm text-slate-500">
          We couldn't load order{" "}
          <span className="font-mono">{orderNumber}</span>. It may belong to a
          different account.
        </p>
        <Link
          to={`/${slug}/profile`}
          className="mt-2 rounded-full bg-slate-900 px-6 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
        >
          Back to Profile
        </Link>
      </div>
    )

  const statusStyle =
    STATUS_STYLES[order.status] ??
    "bg-slate-100 text-slate-600 border-slate-200"

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 font-sans sm:px-6 lg:px-8">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="mb-8">
        <Link
          to={`/${slug}/profile`}
          className="mb-4 inline-flex items-center gap-1.5 text-xs font-semibold tracking-wide text-slate-500 uppercase transition-colors hover:text-slate-900"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Profile
        </Link>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">
              Order Reference
            </p>
            <h1 className="mt-1 font-mono text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              {order.order_number}
            </h1>
            <p className="mt-1.5 text-sm text-slate-500">
              Placed on{" "}
              {new Date(order.created_at).toLocaleString("en-IN", {
                dateStyle: "medium",
                timeStyle: "short",
              })}
            </p>
          </div>
          <span
            className={`inline-flex items-center rounded-full border px-3.5 py-1.5 text-[11px] font-bold tracking-wider uppercase ${statusStyle}`}
          >
            {order.status}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
        {/* ── Left column: items + financials ─────────────────────────── */}
        <div className="space-y-6 lg:col-span-7">
          {/* Items */}
          <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm sm:p-8">
            <div className="mb-6 flex items-center gap-2">
              <div className="rounded-lg border border-slate-100 bg-slate-50 p-1.5">
                <Package className="h-4 w-4 text-slate-700" />
              </div>
              <h2 className="font-heading text-lg font-semibold tracking-tight text-slate-900">
                Items
              </h2>
            </div>

            <div className="space-y-4">
              {order.items.map((item, idx) => {
                const delivery = item.delivery_status ?? "pending"
                return (
                  <div
                    key={idx}
                    className="rounded-2xl border border-slate-100 bg-slate-50/50 p-4"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="font-semibold text-slate-800">
                        <span className="mr-2 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-500">
                          x{item.quantity}
                        </span>
                        {item.product_name}
                      </div>
                      <div className="text-sm font-semibold text-slate-900">
                        {inr(item.total_price)}
                      </div>
                    </div>
                    <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                      <span>Unit price {inr(item.unit_price)}</span>
                      <span
                        className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] font-bold tracking-wider uppercase ${
                          DELIVERY_STYLES[delivery] ?? DELIVERY_STYLES.pending
                        }`}
                      >
                        {delivery === "instant" ? (
                          <PackageCheck className="h-3 w-3" />
                        ) : null}
                        {delivery === "instant" ? "issued" : delivery}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Financial breakdown */}
          <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm sm:p-8">
            <div className="mb-6 flex items-center gap-2">
              <div className="rounded-lg border border-slate-100 bg-slate-50 p-1.5">
                <ReceiptText className="h-4 w-4 text-slate-700" />
              </div>
              <h2 className="font-heading text-lg font-semibold tracking-tight text-slate-900">
                Payment Summary
              </h2>
            </div>

            <dl className="space-y-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-slate-500">Items total</dt>
                <dd className="font-semibold text-slate-900">
                  {inr(order.total_amount)}
                </dd>
              </div>
              <div className="flex justify-between text-xs">
                <dt className="text-slate-400">GST (included)</dt>
                <dd className="font-medium text-slate-400">
                  {inr(order.gst_total)}
                </dd>
              </div>
              {Number(order.discount_amount) > 0 && (
                <div className="flex justify-between font-semibold text-emerald-600">
                  <dt>
                    {order.coupon_code
                      ? `Discount (${order.coupon_code})`
                      : "Reward applied"}
                  </dt>
                  <dd>-{inr(order.discount_amount)}</dd>
                </div>
              )}
              {Number(order.points_used) > 0 && (
                <div className="flex justify-between">
                  <dt className="text-slate-500">Wallet points used</dt>
                  <dd className="font-medium text-slate-700">
                    {Number(order.points_used).toLocaleString("en-IN")}
                  </dd>
                </div>
              )}
              <div className="flex justify-between border-t border-slate-100 pt-3 text-base font-bold text-slate-900">
                <dt>
                  {Number(order.fiat_paid) > 0 ? "Paid online" : "Amount paid"}
                </dt>
                <dd>
                  {inr(Number(order.fiat_paid) > 0 ? order.fiat_paid : 0)}
                </dd>
              </div>
              {order.payment_gateway_reference && (
                <div className="flex justify-between text-xs">
                  <dt className="text-slate-400">Payment reference</dt>
                  <dd className="font-mono text-slate-400">
                    {order.payment_gateway_reference}
                  </dd>
                </div>
              )}
            </dl>
          </div>

          {/* Voucher codes (digital items) */}
          {order.vouchers.length > 0 && (
            <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm sm:p-8">
              <div className="mb-6 flex items-center gap-2">
                <div className="rounded-lg border border-slate-100 bg-slate-50 p-1.5">
                  <Ticket className="h-4 w-4 text-slate-700" />
                </div>
                <h2 className="font-heading text-lg font-semibold tracking-tight text-slate-900">
                  Your Voucher Codes
                </h2>
              </div>
              <div className="space-y-3">
                {order.vouchers.map((voucher, idx) => (
                  <div
                    key={idx}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-dashed border-indigo-200 bg-indigo-50/40 p-4"
                  >
                    <div>
                      <p className="font-mono text-base font-bold tracking-wider text-indigo-900">
                        {voucher.code}
                      </p>
                      {voucher.pin && (
                        <p className="mt-0.5 text-xs text-indigo-500">
                          PIN: {voucher.pin}
                        </p>
                      )}
                    </div>
                    <div className="text-right text-[11px] text-slate-500">
                      {voucher.expires_at &&
                        `Valid till ${new Date(voucher.expires_at).toLocaleDateString("en-IN")}`}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── Right column: shipping + tracking ──────────────────────── */}
        <div className="space-y-6 lg:col-span-5">
          {/* Shipping address */}
          <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm sm:p-8">
            <div className="mb-5 flex items-center gap-2">
              <div className="rounded-lg border border-slate-100 bg-slate-50 p-1.5">
                <MapPin className="h-4 w-4 text-slate-700" />
              </div>
              <h2 className="font-heading text-lg font-semibold tracking-tight text-slate-900">
                Shipping Address
              </h2>
            </div>
            {order.shipping_address_line_1 ||
            order.shipping_city ||
            order.shipping_name ? (
              <address className="space-y-1 text-sm text-slate-600 not-italic">
                {order.shipping_name && (
                  <p className="font-semibold text-slate-800">
                    {order.shipping_name}
                  </p>
                )}
                {order.shipping_mobile && <p>{order.shipping_mobile}</p>}
                {order.shipping_address_line_1 && (
                  <p>{order.shipping_address_line_1}</p>
                )}
                {(order.shipping_city || order.shipping_state) && (
                  <p>
                    {[order.shipping_city, order.shipping_state]
                      .filter(Boolean)
                      .join(", ")}
                  </p>
                )}
                {order.shipping_pincode && <p>{order.shipping_pincode}</p>}
              </address>
            ) : (
              <p className="text-sm text-slate-400">
                No shipping address on this order.
              </p>
            )}
          </div>

          {/* Tracking */}
          <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm sm:p-8">
            <div className="mb-5 flex items-center gap-2">
              <div className="rounded-lg border border-slate-100 bg-slate-50 p-1.5">
                <TruckIcon className="h-4 w-4 text-slate-700" />
              </div>
              <h2 className="font-heading text-lg font-semibold tracking-tight text-slate-900">
                Delivery Tracking
              </h2>
            </div>
            {order.tracking_number ? (
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Courier</span>
                  <span className="font-semibold text-slate-800">
                    {order.logistics_provider ?? "—"}
                  </span>
                </div>
                <div className="flex justify-between gap-3 text-sm">
                  <span className="shrink-0 text-slate-500">Tracking no.</span>
                  <span className="font-mono font-semibold text-slate-800">
                    {order.tracking_number}
                  </span>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 p-4 text-center">
                <p className="text-sm font-medium text-slate-500">
                  Not shipped yet
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  Tracking details will appear here once your order is handed to
                  the courier.
                </p>
              </div>
            )}
          </div>

          {/* Wallet note (claims with leftover reward) */}
          {Number(order.discount_amount) > 0 &&
            Number(order.fiat_paid) === 0 &&
            Number(order.points_used) === 0 && (
              <div className="flex items-start gap-3 rounded-2xl border border-indigo-100 bg-indigo-50/50 p-4">
                <Wallet className="mt-0.5 h-4 w-4 shrink-0 text-indigo-500" />
                <p className="text-xs leading-relaxed text-indigo-800">
                  This order was fully covered by your reward. If any reward
                  balance was left over after this purchase, it was deposited
                  into your wallet — see{" "}
                  <Link
                    to={`/${slug}/profile`}
                    className="font-semibold underline"
                  >
                    Profile → Corporate Allowance
                  </Link>
                  .
                </p>
              </div>
            )}
        </div>
      </div>
    </div>
  )
}
