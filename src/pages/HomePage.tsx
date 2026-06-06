import { useParams } from "react-router-dom"
import { useProducts } from "@/hooks/useStorefront"
import { useTenantStore } from "@/store/useTenantStore"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { ArrowRight, Sparkles, Box, Bookmark } from "lucide-react"
import ProductCard from "@/components/ProductCard"

export default function HomePage() {
  const { slug } = useParams<{ slug: string }>()
  const { config } = useTenantStore()
  const { data: products, isLoading } = useProducts(slug!)

  return (
    <div className="space-y-12 py-2 font-sans">

      <section className="relative flex flex-col items-start justify-center overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-8 text-white shadow-xl md:p-16 border border-slate-900">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.03),transparent_45%)]" />
        <div className="relative max-w-2xl z-10 space-y-5">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/5 px-3 py-1 text-[10px] font-semibold tracking-wide text-slate-300 ring-1 ring-inset ring-white/10 uppercase">
            <Sparkles className="h-3.5 w-3.5 text-slate-400" /> Platform Allotment
          </span>
          <h1 className="text-3xl font-heading font-semibold tracking-tight sm:text-4xl md:text-5xl text-white leading-tight">
            Welcome to <span className="text-slate-200">{config?.name || "Marketplace"}</span>
          </h1>
          <p className="text-sm sm:text-base text-slate-400 font-normal leading-relaxed max-w-xl">
            Access your curated catalog for high-end physical assets, corporate vouchers, and premium tokenized client experiences built exclusively around you.
          </p>
          <div className="pt-3">
            <Button
              size="lg"
              className="rounded-full bg-white px-7 py-6 text-sm font-semibold text-slate-950 shadow-xs hover:bg-slate-100 hover:scale-[1.02] transition-all flex items-center gap-2 group"
            >
              <span>Explore Catalog</span>
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Button>
          </div>
        </div>
      </section>

      <section className="space-y-6">
        <div className="flex items-end justify-between border-b border-slate-100 pb-5">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <Box className="h-5 w-5 text-slate-800" />
              <h2 className="text-xl font-heading font-semibold tracking-tight text-slate-900 sm:text-2xl">
                Featured Allocation Catalog
              </h2>
            </div>
            <p className="text-sm text-slate-400 font-normal">Handpicked selections mapped dynamically into your profile segment</p>
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="space-y-4 rounded-2xl border border-slate-100 p-5 bg-white shadow-sm">
                <Skeleton className="aspect-square w-full rounded-xl bg-slate-50" />
                <Skeleton className="h-4 w-2/3 bg-slate-100" />
                <Skeleton className="h-4 w-1/2 bg-slate-100" />
              </div>
            ))}
          </div>
        ) : (
          <div>
            {products && products.length > 0 ? (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} slug={slug!} />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center text-center py-20 border border-dashed rounded-3xl border-slate-200 bg-white px-4">
                <Bookmark className="h-8 w-8 text-slate-300 mb-3" />
                <h4 className="text-sm font-heading font-semibold text-slate-800">No Allocation Available</h4>
                <p className="text-xs text-slate-400 mt-1.5 max-w-xs leading-relaxed">
                  There are currently no catalog products assigned to this portal node instance. Check back shortly.
                </p>
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  )
}