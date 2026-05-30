import { useParams, Link } from "react-router-dom"
import { ShoppingCart } from "lucide-react"
import { useProducts } from "@/hooks/useStorefront"
import { useTenantStore } from "@/store/useTenantStore"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"

export default function CategoryPage() {
  const { slug, categorySlug } = useParams<{
    slug: string
    categorySlug: string
  }>()
  const { config, categories } = useTenantStore()

  const { data: products, isLoading } = useProducts(slug!, categorySlug)

  const currentCategory = categories.find((c) => c.slug === categorySlug)

  return (
    <div className="space-y-8">
      <div className="border-b pb-6">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">
          {currentCategory?.name || "Category"}
        </h1>
        <p className="mt-2 text-slate-500">
          Browse all available rewards in this category.
        </p>
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
      ) : products?.length === 0 ? (
        <div className="py-20 text-center text-slate-500">
          <p className="text-lg font-medium text-slate-900">
            No products found
          </p>
          <p>We couldn't find any rewards in this category right now.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {products?.map((product) => (
            <div
              key={product.id}
              className="group flex flex-col rounded-2xl border bg-white p-4 transition-all hover:border-slate-300 hover:shadow-lg"
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
                    <p className="text-xs text-slate-500 line-through">
                      ₹{product.mrp}
                    </p>
                    <p className="text-lg leading-none font-bold text-slate-900">
                      {product.points_equivalent}{" "}
                      <span className="text-sm font-normal text-slate-500">
                        {config?.points_name}
                      </span>
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
    </div>
  )
}
