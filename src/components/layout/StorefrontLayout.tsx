import { Outlet, useParams } from "react-router-dom"
import { useTenantInit } from "@/hooks/useTenantInit"
import Navbar from "./Navbar"
import Footer from "./Footer"
import { Skeleton } from "@/components/ui/skeleton"
import CartSidebar from "@/components/CartSidebar"
import { Toaster } from "sonner"

export default function StorefrontLayout() {
  const { slug } = useParams<{ slug: string }>()
  const { isLoading, isError } = useTenantInit(slug)

  if (isError) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50 text-center px-4">
        <div className="max-w-md space-y-4 rounded-2xl border border-slate-100 bg-white p-8 shadow-sm">
          <h1 className="text-2xl font-bold text-slate-900">Storefront Offline</h1>
          <p className="text-sm text-slate-500 leading-relaxed">
            This marketplace storefront configuration might be suspended, restricted, or does not exist. Please check your spelling settings.
          </p>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex h-screen flex-col bg-slate-50">
        <Skeleton className="h-11 w-full rounded-none bg-slate-200" />
        <Skeleton className="h-20 w-full rounded-none bg-slate-100" />
        <div className="mx-auto w-full max-w-7xl flex-1 p-8">
          <Skeleton className="h-[55vh] w-full rounded-3xl" />
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-50/50 font-sans antialiased selection:bg-slate-900 selection:text-white">
      <Navbar />
      <CartSidebar />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
        <Outlet />
      </main>
      <Toaster />
      <Footer />
    </div>
  )
}