import { useParams, Link } from "react-router-dom"
import { useProducts } from "@/hooks/useStorefront"
import { useTenantStore } from "@/store/useTenantStore"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { ShoppingCart } from "lucide-react"

export default function HomePage() {
  const { slug } = useParams<{ slug: string }>()
  const { config } = useTenantStore()
  const { data: products, isLoading } = useProducts(slug!)

  return (
    <div className="space-y-12">
      <section className="flex flex-col items-start justify-center rounded-3xl bg-slate-900 bg-linear-to-r from-slate-900 to-slate-800 p-8 text-white shadow-xl md:p-16">
        <h1 className="mb-4 text-4xl font-bold tracking-tight md:text-5xl">
          Welcome to {config?.name}
        </h1>
        <p className="mb-8 max-w-2xl text-lg text-slate-300">
          Browse our premium catalog for high-quality physical goods, digital
          vouchers, and exclusive experiences.
        </p>
        <Button
          size="lg"
          className="rounded-full bg-white px-8 font-semibold text-slate-900 hover:bg-slate-100"
        >
          Explore Catalog
        </Button>
      </section>

      <section>
        <div className="mb-8 flex items-center justify-between">
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            Featured Products
          </h2>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="space-y-4">
                <Skeleton className="aspect-square w-full rounded-2xl" />
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {products?.map((product) => (
              <div
                key={product.id}
                className="group flex flex-col rounded-2xl border bg-white p-4 transition-all duration-300 hover:border-slate-300 hover:shadow-lg"
              >
                <Link
                  to={`/${slug}/product/${product.slug}`}
                  className="relative mb-4 block aspect-square overflow-hidden rounded-xl bg-slate-50"
                >
                  {product.main_image_url ? (
                    <img
                      src={product.main_image_url}
                      alt={product.name}
                      className="h-full w-full object-contain mix-blend-multiply transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-slate-300">
                      No Image
                    </div>
                  )}
                </Link>

                <div className="flex flex-1 flex-col">
                  {product.brand && (
                    <span className="mb-1 text-xs font-semibold tracking-wider text-slate-400 uppercase">
                      {product.brand}
                    </span>
                  )}

                  <Link to={`/${slug}/product/${product.slug}`}>
                    <h3 className="mb-2 line-clamp-2 leading-tight font-semibold text-slate-900 transition-colors group-hover:text-blue-600">
                      {product.name}
                    </h3>
                  </Link>

                  <div className="mt-auto flex items-end justify-between pt-4">
                    <div>
                      {product.mrp && product.mrp > product.selling_price && (
                        <p className="text-xs text-slate-500 line-through">
                          ₹{product.mrp}
                        </p>
                      )}
                      <p className="text-lg leading-none font-bold text-slate-900">
                        ₹{product.selling_price}
                      </p>
                    </div>

                    <Link to={`/${slug}/product/${product.slug}`}>
                      <Button
                        variant="secondary"
                        size="icon"
                        className="rounded-full bg-slate-100 text-slate-900 hover:bg-slate-200"
                      >
                        <ShoppingCart className="h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
