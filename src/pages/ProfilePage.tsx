import { useEffect, useState } from "react"
import { useParams } from "react-router-dom"
import { Package, User, Wallet, Loader2, LogOut } from "lucide-react"
import { useAuthStore } from "@/store/useAuthStore"
import { useTenantStore } from "@/store/useTenantStore"
import { useUserOrders } from "@/hooks/useStorefront"
import { api } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function ProfilePage() {
  const { slug } = useParams<{ slug: string }>()
  const { user, logout } = useAuthStore()
  const { config } = useTenantStore()
  const { data: orders, isLoading: isLoadingOrders } = useUserOrders(slug!)

  const [walletBalance, setWalletBalance] = useState<number | null>(null)

  useEffect(() => {
    const fetchWallet = async () => {
      try {
        const { data } = await api.get(`/${slug}/user/wallet`)
        setWalletBalance(Number(data.balance))
      } catch (err) {
        console.error("Failed to fetch wallet", err)
      }
    }
    fetchWallet()
  }, [slug])

  const handleLogout = () => {
    logout()
  }

  return (
    <div className="grid grid-cols-1 gap-8 md:grid-cols-12">
      <div className="space-y-6 md:col-span-4">
        <Card className="rounded-2xl border-none shadow-md">
          <CardHeader className="rounded-t-2xl bg-slate-900 pt-8 pb-8 text-center text-white">
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-white/20 backdrop-blur-md">
              <User className="h-10 w-10 text-white" />
            </div>
            <CardTitle className="text-2xl">
              {user?.first_name} {user?.last_name}
            </CardTitle>
            <p className="font-medium text-slate-300">{user?.email}</p>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="rounded-xl border border-blue-100 bg-blue-50 p-6 text-center">
              <Wallet className="mx-auto mb-2 h-6 w-6 text-blue-600" />
              <p className="text-sm font-semibold tracking-wider text-blue-900 uppercase">
                Available Balance
              </p>
              <p className="mt-2 text-3xl font-black text-blue-700">
                {walletBalance !== null ? walletBalance : "..."}{" "}
                <span className="text-base font-normal">
                  {config?.points_name}
                </span>
              </p>
            </div>

            <Button
              variant="outline"
              className="mt-6 w-full border-red-100 text-red-600 hover:bg-red-50 hover:text-red-700"
              onClick={handleLogout}
            >
              <LogOut className="mr-2 h-4 w-4" /> Sign Out
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="md:col-span-8">
        <h2 className="mb-6 flex items-center text-2xl font-bold text-slate-900">
          <Package className="mr-3 h-6 w-6 text-slate-400" /> Order History
        </h2>

        {isLoadingOrders ? (
          <div className="flex items-center justify-center rounded-2xl border bg-white py-20">
            <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
          </div>
        ) : !orders || orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border bg-white py-20 text-center">
            <Package className="mb-4 h-12 w-12 text-slate-200" />
            <h3 className="text-lg font-bold text-slate-900">No orders yet</h3>
            <p className="text-slate-500">
              When you claim rewards, they will appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => (
              <div
                key={order.id}
                className="rounded-2xl border bg-white p-6 shadow-sm"
              >
                <div className="mb-4 flex flex-wrap items-center justify-between gap-4 border-b pb-4">
                  <div>
                    <p className="text-xs font-bold tracking-wider text-slate-500 uppercase">
                      Order Placed
                    </p>
                    <p className="font-semibold text-slate-900">
                      {new Date(order.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-bold tracking-wider text-slate-500 uppercase">
                      Order #
                    </p>
                    <p className="font-mono text-sm font-semibold text-slate-900">
                      {order.order_number}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold tracking-wider text-slate-500 uppercase">
                      Status
                    </p>
                    <span className="mt-1 inline-flex items-center rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700 ring-1 ring-blue-700/10 ring-inset">
                      {order.status.toUpperCase()}
                    </span>
                  </div>
                </div>

                <div className="space-y-3">
                  {order.items.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between text-sm"
                    >
                      <div className="font-semibold text-slate-900">
                        {item.quantity}x {item.product_name}
                      </div>
                      <div className="font-medium text-slate-600">
                        ₹{item.total_price}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 rounded-xl bg-slate-50 p-4 text-sm">
                  <div className="flex justify-between py-1">
                    <span className="text-slate-500">Cart Subtotal</span>
                    <span className="font-medium text-slate-900">
                      ₹{order.total_amount}
                    </span>
                  </div>

                  {order.coupon_code && (
                    <div className="flex justify-between py-1 text-green-600">
                      <span>Coupon ({order.coupon_code})</span>
                      <span className="font-medium">
                        - ₹{order.discount_amount}
                      </span>
                    </div>
                  )}

                  {Number(order.points_used) > 0 && (
                    <div className="flex justify-between py-1 text-blue-600">
                      <span>Points Redeemed</span>
                      <span className="font-medium">
                        - {order.points_used} {config?.points_name}
                      </span>
                    </div>
                  )}

                  <div className="mt-3 flex justify-between border-t border-slate-200 pt-3 text-base font-bold text-slate-900">
                    <span>Final Amount Paid</span>
                    <span>₹{order.fiat_paid}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
