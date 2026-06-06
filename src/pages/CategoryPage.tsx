import { useState, useCallback } from "react"
import { useParams, Link } from "react-router-dom"
import {
  LayoutGrid,
  PackageOpen,
  ArrowLeft,
  Search,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react"
import { useFilterProducts, type FilterParams } from "@/hooks/useStorefront"
import { useTenantStore } from "@/store/useTenantStore"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Input } from "@/components/ui/input"
import ProductCard from "@/components/ProductCard"

const SORT_OPTIONS = [
  { value: "default", label: "Default" },
  { value: "price_asc", label: "Price: Low → High" },
  { value: "price_desc", label: "Price: High → Low" },
  { value: "newest", label: "Newest First" },
] as const

export default function CategoryPage() {
  const { slug, categorySlug } = useParams<{ slug: string; categorySlug: string }>()
  const { categories } = useTenantStore()
  const currentCategory = categories.find((c) => c.slug === categorySlug)

  const [search, setSearch] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [sortBy, setSortBy] = useState<FilterParams["sort_by"]>("default")
  const [minPrice, setMinPrice] = useState("")
  const [maxPrice, setMaxPrice] = useState("")
  const [page, setPage] = useState(1)
  const [filtersOpen, setFiltersOpen] = useState(false)

  // Debounce search input
  const handleSearchChange = useCallback((val: string) => {
    setSearch(val)
    clearTimeout((window as any).__searchTimeout)
      ; (window as any).__searchTimeout = setTimeout(() => {
        setDebouncedSearch(val)
        setPage(1)
      }, 400)
  }, [])

  const filterParams: FilterParams = {
    category_slug: categorySlug,
    sort_by: sortBy,
    per_page: 16,
    page,
    ...(debouncedSearch ? { q: debouncedSearch } : {}),
    ...(minPrice ? { min_price: parseFloat(minPrice) } : {}),
    ...(maxPrice ? { max_price: parseFloat(maxPrice) } : {}),
  }

  const { data: paginatedData, isLoading } = useFilterProducts(slug!, filterParams)

  const products = paginatedData?.data ?? []
  const totalPages = paginatedData?.last_page ?? 1
  const total = paginatedData?.total ?? 0

  const hasActiveFilters = debouncedSearch || minPrice || maxPrice || sortBy !== "default"

  const clearFilters = () => {
    setSearch("")
    setDebouncedSearch("")
    setSortBy("default")
    setMinPrice("")
    setMaxPrice("")
    setPage(1)
  }

  return (
    <div className="max-w-7xl mx-auto space-y-10 py-8 font-sans">

      {/* Header Banner */}
      <section className="relative flex flex-col items-start justify-center overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-8 text-white shadow-xl md:p-12 border border-slate-900">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.03),transparent_45%)]" />
        <div className="relative z-10 w-full">
          <Link
            to={`/${slug}`}
            className="inline-flex items-center gap-1.5 text-[11px] font-semibold tracking-wider text-slate-400 hover:text-white transition-colors uppercase mb-6"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back to Catalog
          </Link>
          <div className="space-y-4 max-w-2xl">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/5 px-3 py-1 text-[10px] font-semibold tracking-wide text-slate-300 ring-1 ring-inset ring-white/10 uppercase">
              <LayoutGrid className="h-3.5 w-3.5 text-slate-400" /> Category Allocation
            </span>
            <h1 className="text-3xl font-heading font-semibold tracking-tight text-white sm:text-4xl md:text-5xl">
              {currentCategory?.name || "Category"}
            </h1>
            <p className="text-sm text-slate-400 font-normal leading-relaxed sm:text-base">
              Browse all available rewards and allocations curated specifically for this segment.
            </p>
          </div>
        </div>
      </section>

      {/* Filters Bar */}
      <section className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
            <Input
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Search products..."
              className="pl-9 rounded-full border-slate-200 bg-white shadow-none h-10 text-sm focus-visible:ring-slate-300"
            />
            {search && (
              <button
                onClick={() => handleSearchChange("")}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => { setSortBy(e.target.value as FilterParams["sort_by"]); setPage(1) }}
            className="h-10 rounded-full border border-slate-200 bg-white px-4 text-sm text-slate-700 shadow-none outline-none focus:ring-2 focus:ring-slate-300 cursor-pointer"
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>

          {/* Price Filter Toggle */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setFiltersOpen((v) => !v)}
            className={`rounded-full border-slate-200 h-10 px-4 text-sm shadow-none gap-2 ${filtersOpen ? "bg-slate-900 text-white border-slate-900 hover:bg-slate-800 hover:text-white" : "text-slate-700 hover:bg-slate-50"}`}
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            Price Range
          </Button>

          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="rounded-full h-10 px-4 text-sm text-slate-500 hover:text-slate-900 shadow-none gap-1.5"
            >
              <X className="h-3.5 w-3.5" /> Clear
            </Button>
          )}
        </div>

        {/* Price inputs */}
        {filtersOpen && (
          <div className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-white px-5 py-4 shadow-sm">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">Price Range</span>
            <Input
              type="number"
              placeholder="Min ₹"
              value={minPrice}
              onChange={(e) => { setMinPrice(e.target.value); setPage(1) }}
              className="h-9 max-w-[140px] rounded-full border-slate-200 text-sm shadow-none"
            />
            <span className="text-slate-300">–</span>
            <Input
              type="number"
              placeholder="Max ₹"
              value={maxPrice}
              onChange={(e) => { setMaxPrice(e.target.value); setPage(1) }}
              className="h-9 max-w-[140px] rounded-full border-slate-200 text-sm shadow-none"
            />
          </div>
        )}
      </section>

      {/* Results Section */}
      <section className="space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-5">
          <h2 className="text-xl font-heading font-semibold tracking-tight text-slate-900">
            Available Assets
          </h2>
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            {isLoading ? "Loading..." : `${total} ${total === 1 ? "Result" : "Results"}`}
          </span>
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
        ) : products.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center py-24 border border-dashed rounded-3xl border-slate-200 bg-white px-4 shadow-sm">
            <div className="bg-slate-50 p-4 rounded-full mb-4 border border-slate-100">
              <PackageOpen className="h-8 w-8 text-slate-300" />
            </div>
            <h4 className="text-base font-heading font-semibold text-slate-800">
              No Allocations Found
            </h4>
            <p className="text-sm text-slate-400 mt-2 max-w-sm leading-relaxed">
              {hasActiveFilters
                ? "No products match your current filters. Try adjusting the search or price range."
                : "We couldn't find any rewards mapped to this category right now."}
            </p>
            {hasActiveFilters ? (
              <Button
                variant="outline"
                onClick={clearFilters}
                className="mt-6 rounded-full border-slate-200 text-slate-700 hover:bg-slate-50 shadow-none px-6"
              >
                Clear Filters
              </Button>
            ) : (
              <Link to={`/${slug}`} className="mt-6">
                <Button variant="outline" className="rounded-full border-slate-200 text-slate-700 hover:bg-slate-50 shadow-none px-6">
                  Browse Full Catalog
                </Button>
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} slug={slug!} />
            ))}
          </div>
        )}

        {/* Pagination */}
        {!isLoading && totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 pt-6">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="h-9 w-9 rounded-full border-slate-200 shadow-none"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const pageNum = totalPages <= 5
                  ? i + 1
                  : page <= 3
                    ? i + 1
                    : page >= totalPages - 2
                      ? totalPages - 4 + i
                      : page - 2 + i
                return (
                  <button
                    key={pageNum}
                    onClick={() => setPage(pageNum)}
                    className={`h-9 w-9 rounded-full text-sm font-medium transition-colors ${page === pageNum
                      ? "bg-slate-900 text-white"
                      : "text-slate-600 hover:bg-slate-100"
                      }`}
                  >
                    {pageNum}
                  </button>
                )
              })}
            </div>

            <Button
              variant="outline"
              size="icon"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="h-9 w-9 rounded-full border-slate-200 shadow-none"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </section>
    </div>
  )
}