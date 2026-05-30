import { Outlet, useParams } from "react-router-dom"
import { useTenantInit } from "@/hooks/useTenantInit"
import Navbar from "./Navbar"
import Footer from "./Footer"
import { Skeleton } from "@/components/ui/skeleton"
import CartSidebar from "@/components/CartSidebar"

export default function StorefrontLayout() {
  const { slug } = useParams<{ slug: string }>()
  const { isLoading, isError } = useTenantInit(slug)

  if (isError) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50 text-center">
        <div className="max-w-md space-y-4 rounded-xl border border-gray-100 bg-white p-8 shadow-sm">
          <h1 className="text-2xl font-bold text-gray-900">Store Not Found</h1>
          <p className="text-gray-500">
            This marketplace might be suspended or doesn't exist. Please check
            the URL.
          </p>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex h-screen flex-col bg-gray-50">
        <Skeleton className="h-16 w-full rounded-none" />
        <div className="mx-auto w-full max-w-7xl flex-1 p-8">
          <Skeleton className="h-[60vh] w-full rounded-xl" />
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col bg-gray-50 font-sans">
      <Navbar />
      <CartSidebar />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}
