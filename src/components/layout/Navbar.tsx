import { useState, useEffect, useRef, useMemo } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"
import {
  Search, ShoppingCart, User, Loader2, Heart, Menu,
  Truck, MapPin, Headphones, ChevronDown, Sparkles,
  ChevronRight, ArrowRight, FolderOpen, Tag, Trash2
} from "lucide-react"
import { useTenantStore } from "@/store/useTenantStore"
import { useCartStore } from "@/store/useCartStore"
import { useWishlistStore } from "@/store/useWishlistStore"
import { useSearchProducts } from "@/hooks/useStorefront"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"

interface SafeCategoryNode {
  id: number
  name: string
  slug: string
  children: SafeCategoryNode[]
}

export default function Navbar() {
  const { slug } = useParams<{ slug: string }>()
  const { config, categories } = useTenantStore()
  const navigate = useNavigate()
  const { items: cartItems, setCartOpen } = useCartStore()
  const { items: wishlistItems, removeItem: removeWishlistItem } = useWishlistStore()

  const [searchInput, setSearchInput] = useState("")
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [activeMegaMenu, setActiveMegaMenu] = useState<number | null>(null)
  const searchRef = useRef<HTMLDivElement>(null)

  const debouncedSearch = useMemo(() => searchInput, [searchInput])
  const { data: searchResults, isFetching } = useSearchProducts(slug!, debouncedSearch)

  const matchedCategories = useMemo(() => {
    if (!searchInput || searchInput.trim().length < 2 || !categories) return []
    const query = searchInput.toLowerCase().trim()
    return categories
      .filter(cat => cat.name.toLowerCase().includes(query))
      .slice(0, 4)
  }, [categories, searchInput])

  const safeCategoryTree = useMemo(() => {
    if (!categories || !Array.isArray(categories)) return []
    const itemMap = new Map<number, SafeCategoryNode>()

    categories.forEach(cat => {
      itemMap.set(cat.id, { ...cat, children: [] })
    })

    const roots: SafeCategoryNode[] = []
    categories.forEach(cat => {
      const mappedItem = itemMap.get(cat.id)!
      if (cat.parent_id === null) {
        roots.push(mappedItem)
      } else {
        const parent = itemMap.get(cat.parent_id)
        if (parent) {
          parent.children.push(mappedItem)
        } else {
          roots.push(mappedItem)
        }
      }
    })
    return roots
  }, [categories])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsSearchOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-slate-100 bg-white/95 backdrop-blur-md font-sans">

      <div className="bg-slate-950 text-slate-300 text-[11px] font-normal tracking-normal py-2.5 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl flex justify-between items-center">
          <p className="font-medium text-slate-400 flex items-center gap-1.5 hidden sm:flex">
            <Sparkles className="h-3 w-3 text-slate-400" />
            Premium corporate catalog allocation layout.
          </p>
          <div className="flex items-center gap-6 ml-auto text-slate-400 font-medium">
            <div className="flex items-center gap-1.5 hover:text-white transition-colors cursor-pointer">
              <Truck className="h-3.5 w-3.5" />
              <span>Free Delivery above ₹999</span>
            </div>
            <span className="text-slate-800">|</span>
            <div className="flex items-center gap-1.5 hover:text-white transition-colors cursor-pointer">
              <MapPin className="h-3.5 w-3.5" />
              <span>Track Orders</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-20 items-center justify-between gap-6">

          <div className="flex md:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full hover:bg-slate-50">
                  <Menu className="h-5 w-5 text-slate-700" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[300px] p-0 flex flex-col bg-white border-r border-slate-100">
                <SheetHeader className="p-5 border-b border-slate-100 text-left">
                  <SheetTitle className="text-base font-heading font-semibold text-slate-900 tracking-tight">
                    {config?.name || "Navigation"}
                  </SheetTitle>
                </SheetHeader>
                <div className="flex-1 overflow-y-auto px-5 py-4 space-y-6">
                  <div className="space-y-3">
                    <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Categories</p>
                    <div className="flex flex-col gap-1">
                      {safeCategoryTree.map((parent) => (
                        <div key={parent.id} className="py-0.5">
                          <Link
                            to={`/${slug}/category/${parent.slug}`}
                            className="flex items-center justify-between font-medium text-sm text-slate-900 py-2 hover:text-slate-600"
                          >
                            <span>{parent.name}</span>
                            <ChevronRight className="h-3.5 w-3.5 text-slate-300" />
                          </Link>
                          {parent.children.length > 0 && (
                            <div className="pl-3 border-l border-slate-100 ml-1 mt-0.5 space-y-1">
                              {parent.children.map((child) => (
                                <Link
                                  key={child.id}
                                  to={`/${slug}/category/${child.slug}`}
                                  className="block text-xs font-medium text-slate-500 py-1.5 hover:text-slate-900"
                                >
                                  {child.name}
                                </Link>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>

          <Link to={`/${slug}`} className="flex shrink-0 items-center">
            {config?.logo_url ? (
              <img src={config.logo_url} alt={config.name} className="h-15 w-auto object-contain" />
            ) : (
              <span className="text-xl font-heading font-bold text-slate-900 tracking-tight">
                {config?.name || "STAR"}
              </span>
            )}
          </Link>

          <div className="relative flex-1 max-w-xl hidden md:block" ref={searchRef}>
            <div className="relative">
              <Search className="absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-slate-400 stroke-[2]" />
              <Input
                placeholder="Search products, brands, categories..."
                className="w-full h-10 pl-11 pr-10 rounded-full border border-slate-200 bg-slate-50/50 text-xs font-normal transition-all focus:border-slate-300 focus:bg-white focus:ring-0 focus-visible:ring-0"
                value={searchInput}
                onChange={(e) => {
                  setSearchInput(e.target.value)
                  setIsSearchOpen(true)
                }}
                onFocus={() => setIsSearchOpen(true)}
              />
              {isFetching && (
                <Loader2 className="absolute top-3 right-4 h-4 w-4 animate-spin text-slate-400" />
              )}
            </div>

            {isSearchOpen && (
              <div className="absolute top-full left-0 mt-1.5 max-h-[420px] w-full overflow-y-auto rounded-xl border border-slate-100 bg-white py-3 shadow-xl z-50">
                {searchInput.trim().length < 2 ? (
                  <div className="px-4 py-2 space-y-2.5">
                    <p className="text-[10px] font-semibold tracking-wider text-slate-400 uppercase">Trending Lookups</p>
                    <div className="flex flex-wrap gap-1.5">
                      {["Electronics", "Televisions", "Bags", "Mugs"].map((tag) => (
                        <Badge
                          key={tag}
                          variant="secondary"
                          className="bg-slate-50 text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer font-medium px-2.5 py-1 text-[10px] border border-transparent hover:border-slate-200 shadow-none rounded-md"
                          onClick={() => setSearchInput(tag)}
                        >
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col space-y-4">
                    {matchedCategories.length > 0 && (
                      <div className="flex flex-col">
                        <span className="px-4 py-1 text-[10px] font-semibold tracking-wider text-slate-400 uppercase flex items-center gap-1">
                          <FolderOpen className="h-3 w-3" /> Matching Categories
                        </span>
                        <div className="mt-1 divide-y divide-slate-50">
                          {matchedCategories.map((cat) => (
                            <Link
                              key={cat.id}
                              to={`/${slug}/category/${cat.slug}`}
                              onClick={() => setIsSearchOpen(false)}
                              className="flex items-center justify-between px-4 py-2 hover:bg-slate-50 transition-colors group"
                            >
                              <span className="text-xs font-medium text-slate-700 group-hover:text-slate-900">{cat.name}</span>
                              <span className="text-[10px] text-slate-400 font-medium flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                Go to category <ChevronRight className="h-3 w-3" />
                              </span>
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}
                    <div className="flex flex-col">
                      <span className="px-4 py-1 text-[10px] font-semibold tracking-wider text-slate-400 uppercase flex items-center gap-1">
                        <Tag className="h-3 w-3" /> Matching Products
                      </span>

                      {searchResults && searchResults.length > 0 ? (
                        <div className="mt-1 divide-y divide-slate-50">
                          {searchResults.map((result) => (
                            <Link
                              key={result.id}
                              to={`/${slug}/product/${result.slug}`}
                              onClick={() => setIsSearchOpen(false)}
                              className="flex items-center gap-3.5 px-4 py-2.5 hover:bg-slate-50 transition-colors"
                            >
                              <div className="h-9 w-9 shrink-0 rounded-md border border-slate-100 bg-white p-1 flex items-center justify-center">
                                {result.main_image_url && (
                                  <img src={result.main_image_url} alt="" className="max-h-full max-w-full object-contain" />
                                )}
                              </div>
                              <div className="flex-1 overflow-hidden">
                                <p className="truncate text-xs font-semibold text-slate-800">{result.name}</p>
                                <p className="text-[11px] font-medium text-slate-500">
                                  {result.points_equivalent} {config?.points_name || "Points"}
                                </p>
                              </div>
                              <ArrowRight className="h-3 w-3 text-slate-300" />
                            </Link>
                          ))}
                        </div>
                      ) : (
                        !isFetching && matchedCategories.length === 0 && (
                          <div className="p-6 text-center text-xs font-medium text-slate-400">
                            No matches found for "{searchInput}"
                          </div>
                        )
                      )}
                    </div>

                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex shrink-0 items-center gap-2 sm:gap-4">

            <div className="hidden lg:flex items-center gap-2.5 border border-slate-100 rounded-xl pl-3 pr-3.5 py-1.5 bg-slate-50/40">
              <div className="bg-white p-1 rounded-md border border-slate-100">
                <Headphones className="h-3.5 w-3.5 text-slate-600 stroke-[2]" />
              </div>
              <div className="text-left leading-tight">
                <p className="text-[9px] font-medium text-slate-400 uppercase">Support</p>
                <p className="text-xs font-semibold text-slate-800">+919625456422</p>
              </div>
            </div>

            <div className="relative group/wishlist hidden sm:flex items-center h-full py-4 -my-4">
              <Button
                variant="ghost"
                size="icon"
                className="relative text-slate-700 hover:bg-rose-50 rounded-full transition-colors group-hover/wishlist:bg-rose-50 group-hover/wishlist:text-rose-500"
              >
                <Heart className="h-4 w-4" />
                {wishlistItems.length > 0 && (
                  <span className="absolute top-1 right-0 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-rose-500 text-[8px] font-bold text-white ring-2 ring-white">
                    {wishlistItems.length}
                  </span>
                )}
              </Button>

              <div className="absolute top-[85%] right-0 mt-2 w-[340px] opacity-0 invisible translate-y-2 group-hover/wishlist:opacity-100 group-hover/wishlist:visible group-hover/wishlist:translate-y-0 transition-all duration-200 z-50">
                <div className="rounded-2xl border border-slate-100 bg-white shadow-2xl overflow-hidden flex flex-col">

                  <div className="bg-slate-50/80 px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                    <span className="text-xs font-heading font-semibold text-slate-900 tracking-wide">Saved Items</span>
                    <Badge variant="secondary" className="bg-white border-slate-200 text-slate-600 text-[9px] px-1.5 py-0">
                      {wishlistItems.length} {wishlistItems.length === 1 ? "Item" : "Items"}
                    </Badge>
                  </div>

                  {wishlistItems.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-8 text-center bg-white">
                      <div className="h-12 w-12 rounded-full bg-rose-50 flex items-center justify-center mb-3">
                        <Heart className="h-5 w-5 text-rose-300 fill-rose-100" />
                      </div>
                      <h4 className="text-sm font-heading font-semibold text-slate-800">Your wishlist is empty</h4>
                      <p className="text-[11px] text-slate-400 mt-1 max-w-[200px]">
                        Save items you love by clicking the heart icon on any product.
                      </p>
                    </div>
                  ) : (
                    <div className="max-h-[320px] overflow-y-auto p-2 bg-white flex flex-col gap-1">
                      {wishlistItems.map((item) => (
                        <div key={item.id} className="group/item flex items-center gap-3 p-2 rounded-xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100">

                          <Link to={`/${slug}/product/${item.slug}`} className="h-12 w-12 shrink-0 rounded-lg bg-white border border-slate-100 p-1 flex items-center justify-center overflow-hidden">
                            {item.main_image_url ? (
                              <img src={item.main_image_url} alt={item.name} className="max-h-full max-w-full object-contain" />
                            ) : (
                              <span className="text-[8px] font-medium text-slate-300 uppercase">No Img</span>
                            )}
                          </Link>

                          <div className="flex-1 overflow-hidden">
                            <Link to={`/${slug}/product/${item.slug}`} className="block truncate text-xs font-semibold text-slate-800 hover:text-indigo-600 transition-colors">
                              {item.name}
                            </Link>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[11px] font-bold text-slate-900">₹{item.selling_price.toLocaleString("en-IN")}</span>
                              {item.mrp && item.mrp > item.selling_price && (
                                <span className="text-[9px] font-medium text-slate-400 line-through">₹{item.mrp.toLocaleString("en-IN")}</span>
                              )}
                            </div>
                          </div>

                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              removeWishlistItem(item.id);
                            }}
                            className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-md transition-colors shrink-0"
                            title="Remove from Wishlist"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <Button
              variant="ghost"
              size="icon"
              className="text-slate-700 hover:bg-slate-50 rounded-full"
              onClick={() => navigate(`/${slug}/profile`)}
            >
              <User className="h-4 w-4" />
            </Button>

            <Button
              variant="outline"
              className="relative h-9 rounded-full border-slate-200 text-slate-700 hover:bg-slate-900 hover:text-white px-3.5 font-medium text-xs shadow-none gap-2 group"
              onClick={() => setCartOpen(true)}
            >
              <ShoppingCart className="h-3.5 w-3.5 stroke-[2]" />
              <span>Basket</span>
              {cartItems.length > 0 && (
                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-slate-900 text-[9px] font-semibold text-white group-hover:bg-white group-hover:text-slate-900">
                  {cartItems.length}
                </span>
              )}
            </Button>
          </div>
        </div>
      </div>

      <div className="border-t border-slate-100 bg-white hidden md:block" onMouseLeave={() => setActiveMegaMenu(null)}>
        <div className="mx-auto max-w-7xl px-8 flex items-center gap-7 h-11 relative">
          {safeCategoryTree.slice(0, 8).map((parent) => (
            <div
              key={parent.id}
              className="h-full flex items-center"
              onMouseEnter={() => setActiveMegaMenu(parent.id)}
            >
              <Link
                to={`/${slug}/category/${parent.slug}`}
                className={`text-xs font-heading font-medium transition-colors py-2 flex items-center gap-1 border-b-2 h-full ${activeMegaMenu === parent.id
                  ? "text-slate-900 border-slate-900"
                  : "text-slate-500 border-transparent hover:text-slate-900"
                  }`}
              >
                <span>{parent.name}</span>
                {parent.children.length > 0 && <ChevronDown className="h-3 w-3 opacity-50" />}
              </Link>

              {parent.children.length > 0 && activeMegaMenu === parent.id && (
                <div className="absolute top-full left-0 w-full bg-white border-b border-slate-100 shadow-lg px-8 py-5 z-50 grid grid-cols-4 gap-6 animate-in fade-in duration-100">
                  <div className="col-span-1 space-y-1 border-r border-slate-100 pr-4">
                    <h5 className="text-xs font-heading font-semibold text-slate-900 uppercase tracking-wider">{parent.name}</h5>
                    <p className="text-[11px] text-slate-400 font-normal leading-relaxed">
                      Curated options available inside your portfolio segment.
                    </p>
                    <Link
                      to={`/${slug}/category/${parent.slug}`}
                      className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-600 hover:text-slate-900 pt-1"
                    >
                      <span>Browse Section</span>
                      <ArrowRight className="h-3 w-3" />
                    </Link>
                  </div>
                  <div className="col-span-3 grid grid-cols-3 gap-y-1.5 gap-x-4">
                    {parent.children.map((child) => (
                      <Link
                        key={child.id}
                        to={`/${slug}/category/${child.slug}`}
                        className="group flex items-center justify-between p-1.5 rounded-md hover:bg-slate-50 transition-colors"
                      >
                        <span className="text-xs font-medium text-slate-600 group-hover:text-slate-900 transition-colors">
                          {child.name}
                        </span>
                        <ChevronRight className="h-3 w-3 text-slate-300 opacity-0 group-hover:opacity-100 transition-all transform group-hover:translate-x-0.5" />
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </nav>
  )
}