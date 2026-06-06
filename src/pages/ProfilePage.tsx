import { useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { Package, User as UserIcon, Wallet, Loader2, LogOut, UserCog, Lock, Sparkles } from "lucide-react"

import { useAuthStore } from "@/store/useAuthStore"
import { useTenantStore } from "@/store/useTenantStore"
import { useUserOrders } from "@/hooks/useStorefront"
import { useUserWallet } from "@/hooks/useProfileMutations"
import { useMeQuery, useLogoutMutation } from "@/hooks/useAuthMutations"

import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ProfileSettingsForm } from "@/components/profile/ProfileSettingsForm"
import { SecuritySettingsForm } from "@/components/profile/SecuritySettingsForm"

export default function ProfilePage() {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()

  const { user, isAuthenticated } = useAuthStore()
  const { config } = useTenantStore()

  const { data: orders, isLoading: isLoadingOrders } = useUserOrders(slug!)
  const { data: walletBalance, isLoading: isLoadingWallet } = useUserWallet(slug!)

  useMeQuery(slug!)

  const logoutMutation = useLogoutMutation(slug!)

  useEffect(() => {
    if (!isAuthenticated) navigate(`/${slug}`)
  }, [isAuthenticated, navigate, slug])

  if (!user) return null

  return (
    <div className="max-w-7xl mx-auto py-8 font-sans px-4 sm:px-6 lg:px-8">
      <div className="mb-8 space-y-2">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-[10px] font-semibold tracking-wide text-slate-600 uppercase">
          <UserCog className="h-3 w-3" /> Account Management
        </span>
        <h1 className="text-3xl font-heading font-semibold tracking-tight text-slate-900 md:text-4xl">
          Profile Settings
        </h1>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 items-start">
        <div className="space-y-6 lg:col-span-4">
          <div className="rounded-3xl border border-slate-100 bg-white shadow-xl shadow-slate-200/20 overflow-hidden">
            <div className="bg-slate-950 p-8 text-center relative overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.08),transparent_60%)]" />
              <div className="relative z-10 flex flex-col items-center">
                <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-white/10 border border-white/20 backdrop-blur-md shadow-inner">
                  <UserIcon className="h-8 w-8 text-white" />
                </div>
                <h2 className="text-xl font-heading font-semibold text-white tracking-tight">
                  {user.first_name} {user.last_name}
                </h2>
                <p className="mt-1 text-xs font-medium text-slate-400">{user.email}</p>
              </div>
            </div>

            <div className="p-6 sm:p-8 space-y-6">
              <div className="rounded-2xl border border-indigo-100 bg-indigo-50/50 p-5 text-center">
                <div className="mx-auto mb-2.5 flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 text-indigo-600">
                  <Wallet className="h-5 w-5" />
                </div>
                <p className="text-[10px] font-semibold tracking-widest text-indigo-900 uppercase opacity-70">Corporate Allowance</p>
                <p className="mt-1 text-3xl font-heading font-bold text-indigo-950">
                  {isLoadingWallet ? "..." : walletBalance?.toLocaleString("en-IN")} <span className="text-sm font-medium text-indigo-600/70">{config?.points_name || "Pts"}</span>
                </p>
              </div>

              <Button
                variant="outline"
                disabled={logoutMutation.isPending}
                className="w-full h-12 rounded-full border-rose-100 text-rose-600 hover:bg-rose-50 hover:text-rose-700 shadow-none font-semibold text-sm transition-colors"
                onClick={() => logoutMutation.mutate()}
              >
                {logoutMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <LogOut className="mr-2 h-4 w-4" />}
                {logoutMutation.isPending ? "Logging Out..." : "Log Out"}
              </Button>
            </div>
          </div>
        </div>

        <div className="lg:col-span-8">
          <Tabs defaultValue="orders" className="w-full">
            <TabsList className="mb-6 inline-flex w-full sm:w-auto h-14 items-center justify-start rounded-full bg-slate-100 p-1.5 min-h-15 shadow-inner overflow-x-auto no-scrollbar">
              <TabsTrigger value="orders" className="rounded-full px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500 data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm transition-all">Orders</TabsTrigger>
              <TabsTrigger value="profile" className="rounded-full px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500 data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm transition-all">Profile Details</TabsTrigger>
              <TabsTrigger value="security" className="rounded-full px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500 data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm transition-all">Security</TabsTrigger>
            </TabsList>

            <TabsContent value="orders" className="space-y-6 focus-visible:outline-none">
              <div className="rounded-3xl border border-slate-100 bg-white p-6 sm:p-8 shadow-sm">
                <div className="flex items-center gap-2 mb-6">
                  <div className="bg-slate-50 p-1.5 rounded-lg border border-slate-100"><Package className="h-4 w-4 text-slate-700" /></div>
                  <h2 className="text-lg font-heading font-semibold text-slate-900 tracking-tight">Order History</h2>
                </div>

                {isLoadingOrders ? (
                  <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 py-20">
                    <Loader2 className="h-6 w-6 animate-spin text-slate-400 mb-3" />
                  </div>
                ) : !orders || orders.length === 0 ? (
                  <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 py-20 text-center px-4">
                    <div className="h-12 w-12 rounded-xl bg-white shadow-sm flex items-center justify-center mb-4"><Sparkles className="h-5 w-5 text-slate-300" /></div>
                    <h3 className="text-sm font-heading font-semibold text-slate-900">No active allocations</h3>
                  </div>
                ) : (
                  <div className="space-y-5">
                    {orders.map((order) => (
                      <div key={order.id} className="rounded-2xl border border-slate-100 bg-white p-5 hover:border-slate-200 transition-colors shadow-sm shadow-slate-100/50">
                        <div className="mb-4 flex flex-wrap items-center justify-between gap-4 border-b border-slate-50 pb-4">
                          <div>
                            <p className="text-[9px] font-bold tracking-widest text-slate-400 uppercase">Date</p>
                            <p className="text-sm font-semibold text-slate-900 mt-0.5">{new Date(order.created_at).toLocaleDateString()}</p>
                          </div>
                          <div>
                            <p className="text-[9px] font-bold tracking-widest text-slate-400 uppercase">Reference</p>
                            <p className="text-sm font-mono font-semibold text-slate-700 mt-0.5">{order.order_number}</p>
                          </div>
                          <div className="text-right">
                            <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-bold tracking-wider uppercase text-slate-600 border border-slate-200">{order.status}</span>
                          </div>
                        </div>

                        <div className="space-y-2 mb-5">
                          {order.items.map((item, idx) => (
                            <div key={idx} className="flex items-center justify-between text-sm py-1">
                              <div className="font-semibold text-slate-800"><span className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-500 mr-2">x{item.quantity}</span>{item.product_name}</div>
                              <div className="font-medium text-slate-500 text-xs">₹{Number(item.total_price).toLocaleString("en-IN")}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="profile" className="focus-visible:outline-none">
              <div className="rounded-3xl border border-slate-100 bg-white p-6 sm:p-8 shadow-sm">
                <div className="flex items-center gap-2 mb-8">
                  <div className="bg-slate-50 p-1.5 rounded-lg border border-slate-100"><UserCog className="h-4 w-4 text-slate-700" /></div>
                  <div>
                    <h2 className="text-lg font-heading font-semibold text-slate-900 tracking-tight">Edit Profile Information</h2>
                  </div>
                </div>
                <ProfileSettingsForm slug={slug!} />
              </div>
            </TabsContent>

            <TabsContent value="security" className="focus-visible:outline-none">
              <div className="rounded-3xl border border-slate-100 bg-white p-6 sm:p-8 shadow-sm">
                <div className="flex items-center gap-2 mb-8">
                  <div className="bg-slate-50 p-1.5 rounded-lg border border-slate-100"><Lock className="h-4 w-4 text-slate-700" /></div>
                  <div>
                    <h2 className="text-lg font-heading font-semibold text-slate-900 tracking-tight">Authorization & Security</h2>
                  </div>
                </div>
                <SecuritySettingsForm slug={slug!} />
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}