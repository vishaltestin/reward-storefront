import { useEffect } from "react"
import { Link, useParams } from "react-router-dom"
import { CheckCircle2 } from "lucide-react"
import { useQueryClient } from "@tanstack/react-query"

export default function OrderSuccessPage() {
  const { slug, orderNumber } = useParams<{ slug: string; orderNumber: string }>()
  const queryClient = useQueryClient()

  // Fresh data the moment the user lands here. The app-wide QueryClient uses
  // staleTime: 5min + no refetch-on-focus, so without this invalidation the
  // profile's "My Orders" list and the wallet balance would keep serving
  // pre-order cache — the classic "I just ordered but see nothing" bug.
  useEffect(() => {
    if (!slug) return
    void queryClient.invalidateQueries({ queryKey: ["orders", slug] })
    void queryClient.invalidateQueries({ queryKey: ["wallet", slug] })
  }, [queryClient, slug, orderNumber])

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-2xl flex-col items-center justify-center px-4 py-16 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
        <CheckCircle2 className="h-10 w-10 text-green-600" />
      </div>

      <h1 className="mt-6 text-3xl font-bold tracking-tight text-slate-900">
        Order placed successfully!
      </h1>
      <p className="mt-2 max-w-md text-slate-500">
        Thank you for your order. We've received it and it's being processed.
        You can track its status from your profile.
      </p>

      {orderNumber && (
        <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 px-6 py-4">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
            Order Number
          </p>
          <p className="mt-1 font-mono text-lg font-semibold text-slate-900">
            {orderNumber}
          </p>
        </div>
      )}

      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Link
          to={`/${slug}/profile`}
          className="inline-flex h-12 items-center justify-center rounded-xl bg-slate-950 px-6 text-[15px] font-semibold text-white shadow-lg transition-all hover:bg-slate-800 hover:scale-[1.01]"
        >
          View My Orders
        </Link>
        <Link
          to={`/${slug}`}
          className="inline-flex h-12 items-center justify-center rounded-xl border border-slate-200 bg-white px-6 text-[15px] font-semibold text-slate-700 shadow-sm transition-colors hover:bg-slate-50"
        >
          Continue Shopping
        </Link>
      </div>
    </div>
  )
}