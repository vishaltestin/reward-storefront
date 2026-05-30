import { useState, useEffect, useRef, useMemo } from "react" 
import { Link, useNavigate, useParams } from "react-router-dom"
import { Search, ShoppingCart, User, Loader2 } from "lucide-react"
import { useTenantStore } from "@/store/useTenantStore"
import { useCartStore } from "@/store/useCartStore"
import {
  buildCategoryTree,
  type CategoryTreeNode,
  useSearchProducts,
} from "@/hooks/useStorefront"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay)
    return () => clearTimeout(handler)
  }, [value, delay])
  return debouncedValue
}

export default function Navbar() {
  const { slug } = useParams<{ slug: string }>()
  const { config, categories } = useTenantStore()
  const navigate = useNavigate()
  const { items, setCartOpen } = useCartStore()

  const categoryTree = useMemo(
    () => buildCategoryTree(categories),
    [categories]
  )

  const [searchInput, setSearchInput] = useState("")
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const debouncedSearch = useDebounce(searchInput, 300)
  const searchRef = useRef<HTMLDivElement>(null)

  const { data: searchResults, isFetching } = useSearchProducts(
    slug!,
    debouncedSearch
  )

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target as Node)
      ) {
        setIsSearchOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  return (
    <nav className="sticky top-0 z-50 border-b bg-white shadow-sm">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-8">
          <Link to={`/${slug}`} className="flex shrink-0 items-center">
            {config?.logo_url ? (
              <img
                src={config.logo_url}
                alt={config.name}
                className="h-8 object-contain"
              />
            ) : (
              <span className="text-xl font-bold tracking-tight text-slate-900">
                {config?.name}
              </span>
            )}
          </Link>

          <div className="hidden h-full items-center gap-6 md:flex">
            {categoryTree.slice(0, 5).map((parent) => (
              <div
                key={parent.id}
                className="group relative flex h-full items-center"
              >
                <Link
                  to={`/${slug}/category/${parent.slug}`}
                  className="py-2 text-sm font-medium text-slate-600 transition-colors group-hover:text-black"
                >
                  {parent.name}
                </Link>
                {parent.children.length > 0 && (
                  <div className="absolute top-full left-0 hidden min-w-50 rounded-md border bg-white py-2 opacity-0 shadow-lg transition-all group-hover:block group-hover:opacity-100">
                    {parent.children.map((child: CategoryTreeNode) => (
                      <Link
                        key={child.id}
                        to={`/${slug}/category/${child.slug}`}
                        className="block px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 hover:text-black"
                      >
                        {child.name}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          <div
            className="relative hidden max-w-md flex-1 sm:block"
            ref={searchRef}
          >
            <div className="relative">
              <Search className="absolute top-2.5 left-3 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search rewards..."
                className="w-full border-transparent bg-slate-100 pl-9 transition-colors focus:bg-white focus:ring-2 focus:ring-slate-200"
                value={searchInput}
                onChange={(e) => {
                  setSearchInput(e.target.value)
                  setIsSearchOpen(true)
                }}
                onFocus={() => {
                  if (searchInput.length > 1) setIsSearchOpen(true)
                }}
              />
              {isFetching && (
                <Loader2 className="absolute top-2.5 right-3 h-4 w-4 animate-spin text-slate-400" />
              )}
            </div>

            {isSearchOpen && searchInput.length > 1 && (
              <div className="absolute top-full left-0 mt-2 max-h-96 w-full overflow-y-auto rounded-xl border bg-white py-2 shadow-2xl">
                {searchResults && searchResults.length > 0 ? (
                  <div className="flex flex-col">
                    <span className="px-4 py-2 text-xs font-bold tracking-wider text-slate-400 uppercase">
                      Results
                    </span>
                    {searchResults.map((result) => (
                      <Link
                        key={result.id}
                        to={`/${slug}/product/${result.slug}`}
                        onClick={() => setIsSearchOpen(false)}
                        className="flex items-center gap-4 px-4 py-2 transition-colors hover:bg-slate-50"
                      >
                        <div className="h-10 w-10 shrink-0 rounded bg-slate-100 p-1">
                          {result.main_image_url && (
                            <img
                              src={result.main_image_url}
                              alt=""
                              className="h-full w-full object-contain mix-blend-multiply"
                            />
                          )}
                        </div>
                        <div className="flex-1 overflow-hidden">
                          <p className="truncate text-sm font-semibold text-slate-900">
                            {result.name}
                          </p>
                          <p className="text-xs font-medium text-blue-600">
                            {result.points_equivalent} {config?.points_name}
                          </p>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  !isFetching && (
                    <div className="p-4 text-center text-sm text-slate-500">
                      No rewards found for "{searchInput}"
                    </div>
                  )
                )}
              </div>
            )}
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="text-slate-600 hover:bg-slate-100 hover:text-black"
              onClick={() => navigate(`/${slug}/profile`)}
            >
              <User className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="relative text-slate-600 hover:bg-slate-100 hover:text-black"
              onClick={() => setCartOpen(true)}
            >
              <ShoppingCart className="h-5 w-5" />
              {items.length > 0 && (
                <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white ring-2 ring-white">
                  {items.length}
                </span>
              )}
            </Button>
          </div>
        </div>
      </div>
    </nav>
  )
}
