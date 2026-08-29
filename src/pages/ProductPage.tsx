import { useState, useMemo } from "react"
import { useParams } from "react-router-dom"
import {
  Minus,
  Plus,
  Info,
  CheckCircle2,
  Check,
  Sparkles,
  ShieldCheck,
  Package,
  MapPin,
  Calendar,
  Users,
  ExternalLink,
  ArrowLeft,
  Zap,
  Star,
  ChevronRight,
} from "lucide-react"
import { useProductDetail, type ProductVariant } from "@/hooks/useStorefront"
import {
  normalizeVariantAttributes,
  isColorKey,
  isCssColor,
} from "@/lib/variants"
import { useTenantStore } from "@/store/useTenantStore"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel"
import { Link } from "react-router-dom"
import ProductCTA from "@/components/ProductCTA"

interface DigitalTypeData {
  storeName?: string
  couponCode?: string
  validUntil?: string
  phone?: string
  website?: string
  address?: string
  aboutBrand?: string
  redemptionLink?: string
  backgroundColor?: string
  pincode?: string
  mapLocation_lat?: string
  mapLocation_lng?: string
}

interface ExperienceTypeData {
  destination?: string
  duration?: string
  groupSize?: string
  departureDate?: string
  includes_excludes?: string
  guest?: number
  departureTime?: string
  availableDates?: string
  Availability?: string
}

const getYouTubeEmbedUrl = (url: string | null) => {
  if (!url) return null
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/
  const match = url.match(regExp)
  return match && match[2].length === 11
    ? `https://www.youtube.com/embed/${match[2]}`
    : null
}

export default function ProductPage() {
  const { slug, productSlug } = useParams<{ slug: string; productSlug: string }>()

  // Remount (resetting all selection state) whenever the product being viewed changes.
  return <ProductPageContent key={`${slug}/${productSlug}`} />
}

function ProductPageContent() {
  const { slug, productSlug } = useParams<{ slug: string; productSlug: string }>()
  // const navigate = useNavigate()
  const { config } = useTenantStore()
  // const addItem = useCartStore((state) => state.addItem)

  const { data: product, isLoading, isError } = useProductDetail(slug!, productSlug!)

  const [quantity, setQuantity] = useState<number>(1)
  const [selectedAttributes, setSelectedAttributes] = useState<Record<string, string>>({})
  const [activeThumbnail, setActiveThumbnail] = useState<string | null>(null)

  // Legacy data may contain the same attribute spelled differently
  // ("size", "Size", " SIZE "). Normalize every variant so those collapse
  // into one option group instead of rendering duplicate rows.
  const normalizedVariants = useMemo<ProductVariant[]>(() => {
    return (product?.variants ?? []).map((v) => ({
      ...v,
      attributes: normalizeVariantAttributes(v.attributes),
    }))
  }, [product])

  // Attribute option groups across all variants,
  // e.g. { Size: ["S", "M"], Color: ["#ff0000", "Navy Blue"] }.
  const attributeGroups = useMemo<Record<string, string[]>>(() => {
    const groups: Record<string, string[]> = {}
    normalizedVariants.forEach((v) => {
      Object.entries(v.attributes).forEach(([key, value]) => {
        if (!groups[key]) groups[key] = []
        if (!groups[key].includes(value)) groups[key].push(value)
      })
    })
    return groups
  }, [normalizedVariants])

  const attributeKeyCount = Object.keys(attributeGroups).length

  // A variant only resolves once the user picked a value for every attribute
  // group. Nothing is pre-selected — until then the page shows the plain
  // product defaults (main image, base price, global SKU).
  const selectedVariant = useMemo<ProductVariant | null>(() => {
    if (!normalizedVariants.length || attributeKeyCount === 0) return null
    const selectedKeys = Object.keys(selectedAttributes)
    if (selectedKeys.length < attributeKeyCount) return null

    return (
      normalizedVariants.find((v) =>
        selectedKeys.every((key) => v.attributes[key] === selectedAttributes[key])
      ) || null
    )
  }, [normalizedVariants, attributeKeyCount, selectedAttributes])

  const matchesSelection = (variant: ProductVariant, selection: Record<string, string>) =>
    Object.entries(selection).every(([key, value]) => variant.attributes[key] === value)

  // An option is clickable only if at least one variant matches
  // the current selection plus that option — no more jumping to
  // whatever variant happens to be first.
  const isOptionAvailable = (key: string, value: string) =>
    normalizedVariants.some((v) => matchesSelection(v, { ...selectedAttributes, [key]: value }))

  // Gallery: resolved variant images first (main + its own gallery),
  // then the product-level images. Until a variant is resolved the
  // product defaults are shown.
  const galleryImages = useMemo(() => {
    if (!product) return []
    const images: (string | null | undefined)[] = []
    if (selectedVariant) {
      images.push(selectedVariant.image_url)
      selectedVariant.gallery_images?.forEach((img) => images.push(img))
    }
    images.push(product.main_image_url)
    product.gallery_images?.forEach((img) => images.push(img))

    const unique = new Set<string>()
    images.forEach((img) => {
      if (img) unique.add(img)
    })
    return Array.from(unique)
  }, [product, selectedVariant])

  const displayImage = activeThumbnail || galleryImages[0] || null

  const allImages = useMemo(() => {
    const unique = new Set<string>()
    if (displayImage) unique.add(displayImage)
    galleryImages.forEach((img) => unique.add(img))
    return Array.from(unique)
  }, [displayImage, galleryImages])

  const pricing = useMemo(() => {
    if (!product) return { unitFiat: 0, unitPoints: 0, mrpFiat: 0, totalFiat: 0, isTierApplied: false }

    let currentFiat = selectedVariant ? Number(selectedVariant.selling_price) : Number(product.selling_price)
    let currentPoints = selectedVariant ? selectedVariant.points_equivalent : product.points_equivalent
    const currentMrp = selectedVariant ? Number(selectedVariant.mrp) : Number(product.mrp)
    let isTierApplied = false

    if (product.tier_prices && product.tier_prices.length > 0) {
      const applicableTiers = product.tier_prices.filter(
        (t) => t.variant_id == null || t.variant_id === selectedVariant?.id
      )
      const applicableTier = [...applicableTiers]
        .sort((a, b) => b.min_quantity - a.min_quantity)
        .find((t) => quantity >= t.min_quantity)

      if (applicableTier) {
        currentFiat = Number(applicableTier.selling_price)
        currentPoints = applicableTier.points_equivalent
        isTierApplied = true
      }
    }

    return {
      unitFiat: currentFiat,
      unitPoints: currentPoints,
      mrpFiat: currentMrp,
      totalFiat: currentFiat * quantity,
      isTierApplied,
    }
  }, [product, selectedVariant, quantity])

  const maxStock = selectedVariant ? selectedVariant.stock_quantity : 9999

  const handleAttributeSelect = (key: string, value: string) => {
    setSelectedAttributes((prev) => ({ ...prev, [key]: value }))
    // Let the gallery fall back to the first image of the new selection.
    setActiveThumbnail(null)
    setQuantity(1)
  }

  const handleQuantityChange = (delta: number) => {
    const newQ = quantity + delta
    if (newQ >= 1 && newQ <= maxStock) setQuantity(newQ)
  }

  if (isLoading) return <PDP_Skeleton />
  if (isError || !product)
    return (
      <div className="flex flex-col items-center justify-center py-40 text-center">
        <div className="w-20 h-20 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center mb-6">
          <Package className="h-8 w-8 text-slate-300" />
        </div>
        <h2 className="text-2xl font-semibold text-slate-900 tracking-tight">Asset Not Found</h2>
        <p className="text-slate-400 mt-2 text-sm max-w-xs">This allocation may have been removed or is currently unavailable.</p>
        <Link to={`/${slug}`} className="mt-8">
          <Button variant="outline" className="rounded-full gap-2 border-slate-200">
            <ArrowLeft className="h-4 w-4" /> Return to Catalog
          </Button>
        </Link>
      </div>
    )

  const isOutOfStock = product?.variants?.length > 0 && (!selectedVariant || selectedVariant.stock_quantity === 0)
  const embedUrl = getYouTubeEmbedUrl(product.video_url)
  const digitalData = product.type_data as DigitalTypeData | undefined
  const expData = product.type_data as ExperienceTypeData | undefined
  const discountPct = pricing.mrpFiat > pricing.unitFiat
    ? Math.round(((pricing.mrpFiat - pricing.unitFiat) / pricing.mrpFiat) * 100)
    : 0

  return (
    <div className="max-w-7xl mx-auto py-6 font-sans">
      <nav className="mb-8 flex items-center gap-2 text-[11px] font-semibold tracking-wider uppercase text-slate-400">
        <Link to={`/${slug}`} className="hover:text-slate-700 transition-colors flex items-center gap-1.5">
          <ArrowLeft className="h-3 w-3" /> Catalog
        </Link>
        <ChevronRight className="h-3 w-3 text-slate-300" />
        <span className="text-slate-600 line-clamp-1 max-w-xs">{product.name}</span>
      </nav>

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 items-start">

        <div className="lg:col-span-6 xl:col-span-7 space-y-3 lg:sticky lg:top-6">
          <div className="group relative aspect-4/3.5 w-full overflow-hidden rounded-2xl bg-linear-to-br from-slate-50 to-slate-100 border border-slate-200/80 shadow-sm">
            <div className="absolute top-4 left-4 z-10">
              <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-widest backdrop-blur-md border ${product.type === "digital"
                ? "bg-violet-50/90 text-violet-700 border-violet-200/60"
                : product.type === "experience"
                  ? "bg-amber-50/90 text-amber-700 border-amber-200/60"
                  : "bg-white/90 text-slate-600 border-slate-200/60"
                }`}>
                <Sparkles className="h-3 w-3" />
                {product.type}
              </span>
            </div>
            {discountPct > 0 && (
              <div className="absolute top-4 right-4 z-10">
                <div className="bg-rose-600 text-white text-[11px] font-bold px-2.5 py-1 rounded-full tracking-wide">
                  −{discountPct}%
                </div>
              </div>
            )}

            {allImages.length > 0 ? (
              <Carousel key={selectedVariant?.id ?? "base"} className="w-full h-full" opts={{ loop: true }}>
                <CarouselContent className="h-full">
                  {allImages.map((img, idx) => (
                    <CarouselItem key={idx} className="h-full">
                      <div className="flex h-full w-full items-center justify-center p-10">
                        <img
                          src={img}
                          alt={`${product.name} view ${idx + 1}`}
                          className="max-h-full max-w-full object-contain mix-blend-multiply transition-transform duration-700 group-hover:scale-[1.03]"
                        />
                      </div>
                    </CarouselItem>
                  ))}
                </CarouselContent>
                {allImages.length > 1 && (
                  <>
                    <CarouselPrevious className="absolute left-3 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full bg-white/90 backdrop-blur-md border-slate-200 text-slate-600 shadow-md opacity-0 group-hover:opacity-100 transition-all hover:bg-white hover:scale-105" />
                    <CarouselNext className="absolute right-3 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full bg-white/90 backdrop-blur-md border-slate-200 text-slate-600 shadow-md opacity-0 group-hover:opacity-100 transition-all hover:bg-white hover:scale-105" />
                  </>
                )}
              </Carousel>
            ) : (
              <div className="flex h-full flex-col items-center justify-center gap-2 text-slate-300">
                <Package className="h-12 w-12 opacity-40" />
                <span className="text-xs font-medium">No image available</span>
              </div>
            )}
          </div>
          {allImages.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {allImages.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveThumbnail(img)}
                  className={`relative h-18 w-18 shrink-0 overflow-hidden rounded-xl bg-white border-2 transition-all duration-200 p-1.5 ${displayImage === img
                    ? "border-slate-900 shadow-md scale-[1.03]"
                    : "border-slate-200 hover:border-slate-400 opacity-60 hover:opacity-100"
                    }`}
                >
                  <img src={img} alt="" className="h-full w-full object-contain mix-blend-multiply" />
                </button>
              ))}
            </div>
          )}

          <div className="grid grid-cols-3 gap-2 pt-1">
            {[
              { icon: ShieldCheck, label: "Secure Checkout" },
              { icon: Zap, label: "Instant Allocation" },
              { icon: Star, label: "Premium Quality" },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-2 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2.5">
                <Icon className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide leading-tight">{label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-6 xl:col-span-5 flex flex-col gap-6">

          <div>
            {product.brand && (
              <p className="mb-2 text-[11px] font-black tracking-[0.2em] text-slate-400 uppercase">{product.brand}</p>
            )}
            <h1 className="text-[2rem] font-bold tracking-tight text-slate-950 leading-[1.15] sm:text-[2.25rem]">
              {product.name}
            </h1>
            <p className="mt-2 text-[11px] font-medium text-slate-400 tracking-widest uppercase">
              SKU: {selectedVariant ? selectedVariant.sku : product.sku}
            </p>
          </div>

          {product.short_description && (
            <p className="text-[15px] text-slate-500 leading-relaxed border-l-2 border-slate-200 pl-4">
              {product.short_description}
            </p>
          )}


          {product.selling_price > 0 &&
            (

              <div className="rounded-2xl overflow-hidden border border-slate-200 shadow-sm">
                <div className="bg-white px-6 py-5">
                  <p className="text-[10px] font-bold tracking-[0.15em] uppercase text-slate-400 mb-2">Allocation Value</p>
                  <div className="flex items-end gap-3 mb-1">
                    <span className="text-[2.5rem] font-black tracking-tight text-slate-950 leading-none">
                      ₹{pricing.unitFiat.toLocaleString("en-IN")}
                    </span>
                    {pricing.mrpFiat > pricing.unitFiat && (
                      <div className="mb-1 flex flex-col items-start">
                        <span className="text-[13px] font-medium text-slate-400 line-through">
                          ₹{pricing.mrpFiat.toLocaleString("en-IN")}
                        </span>
                        <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                          Save {discountPct}%
                        </span>
                      </div>
                    )}
                  </div>

                  {pricing.isTierApplied && (
                    <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-100 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-700">
                      <CheckCircle2 className="h-3 w-3" /> Volume Price Applied
                    </div>
                  )}
                </div>

                <div className="bg-slate-950 px-6 py-3.5 flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">or redeem with</span>
                  <span className="text-sm font-bold text-white bg-white/10 border border-white/10 px-4 py-1.5 rounded-full">
                    {pricing.unitPoints.toLocaleString("en-IN")} {config?.points_name || "Points"}
                  </span>
                </div>
              </div>

            )
          }
          {product.tier_prices && product.tier_prices.filter(
            (t) => t.variant_id == null || t.variant_id === selectedVariant?.id
          ).length > 0 && (
              <div className="rounded-2xl border border-blue-100 bg-blue-50/50 p-5">
                <h4 className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-blue-900 mb-4">
                  <Info className="h-3.5 w-3.5" /> Volume Discounts
                </h4>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {product.tier_prices
                    .filter((t) => t.variant_id == null || t.variant_id === selectedVariant?.id)
                    .map((tier, i) => (
                      <div key={i} className={`rounded-xl border bg-white p-3 text-center shadow-sm transition-all ${quantity >= tier.min_quantity ? "border-blue-400 ring-1 ring-blue-300" : "border-blue-100/50"
                        }`}>
                        <p className="text-[10px] font-bold text-slate-700 uppercase tracking-wide">Qty {tier.min_quantity}+</p>
                        <p className="mt-1 text-sm font-bold text-blue-700">
                          ₹{Number(tier.selling_price).toLocaleString("en-IN")}
                        </p>
                      </div>
                    ))}
                </div>
              </div>
            )}

          {normalizedVariants.length > 0 && attributeKeyCount > 0 && (
            <div className="space-y-5">
              {Object.entries(attributeGroups).map(([attrKey, values]) => {
                const colorGroup = isColorKey(attrKey)
                const selectedValue = selectedAttributes[attrKey]

                return (
                  <div key={attrKey}>
                    <h4 className="mb-3 text-[11px] font-bold uppercase tracking-widest text-slate-500">
                      {attrKey}
                      {selectedValue && (
                        <span className="ml-2 normal-case tracking-normal font-semibold text-slate-900">
                          — {selectedValue}
                        </span>
                      )}
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {values.map((val) => {
                        const isSelected = selectedValue === val
                        const available = isOptionAvailable(attrKey, val)

                        if (colorGroup) {
                          const swatchable = isCssColor(val)
                          return (
                            <button
                              key={val}
                              type="button"
                              disabled={!available}
                              onClick={() => handleAttributeSelect(attrKey, val)}
                              title={val}
                              aria-label={`${attrKey}: ${val}`}
                              className={`relative flex h-11 w-11 items-center justify-center rounded-full border-2 transition-all duration-150 ${isSelected
                                ? "border-slate-950 ring-2 ring-slate-950 ring-offset-2 scale-105"
                                : "border-slate-200 hover:border-slate-400"
                                } ${!available ? "cursor-not-allowed opacity-35" : ""}`}
                            >
                              <span
                                className={`flex h-8 w-8 items-center justify-center overflow-hidden rounded-full border border-black/10 shadow-inner ${!swatchable ? "bg-slate-100" : ""}`}
                                style={swatchable ? { backgroundColor: val } : undefined}
                              >
                                {!swatchable && (
                                  <span className="text-[9px] font-black uppercase text-slate-500">
                                    {val.slice(0, 2)}
                                  </span>
                                )}
                              </span>
                              {isSelected && (
                                <span className="absolute -top-1 -right-1 h-3.5 w-3.5 rounded-full bg-emerald-500 flex items-center justify-center">
                                  <Check className="h-2 w-2 text-white" />
                                </span>
                              )}
                            </button>
                          )
                        }

                        return (
                          <button
                            key={val}
                            type="button"
                            disabled={!available}
                            onClick={() => handleAttributeSelect(attrKey, val)}
                            className={`relative min-w-13 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all duration-150 ${isSelected
                              ? "bg-slate-950 text-white shadow-lg scale-[1.04] border border-slate-950"
                              : "bg-white text-slate-700 border border-slate-200 hover:border-slate-400 hover:bg-slate-50"
                              } ${!available ? "cursor-not-allowed opacity-40 line-through hover:border-slate-200 hover:bg-white" : ""}`}
                          >
                            {isSelected && (
                              <span className="absolute -top-1 -right-1 h-3.5 w-3.5 rounded-full bg-emerald-500 flex items-center justify-center">
                                <Check className="h-2 w-2 text-white" />
                              </span>
                            )}
                            {val}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          )}


          {product.selling_price > 0 &&
            (

              <div className="flex items-center justify-between py-1">
                <div className="flex items-center rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
                  <button
                    onClick={() => handleQuantityChange(-1)}
                    disabled={quantity <= 1}
                    className="px-4 py-3 text-slate-500 hover:bg-slate-50 hover:text-slate-900 disabled:opacity-30 transition-colors border-r border-slate-100"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="w-14 text-center text-base font-bold text-slate-900 tabular-nums">
                    {quantity}
                  </span>
                  <button
                    onClick={() => handleQuantityChange(1)}
                    disabled={quantity >= maxStock}
                    className="px-4 py-3 text-slate-500 hover:bg-slate-50 hover:text-slate-900 disabled:opacity-30 transition-colors border-l border-slate-100"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>

                {product.variants && product.variants.length > 0 && (
                  <div>
                    {selectedVariant ? (
                      selectedVariant.stock_quantity > 0 ? (
                        <div className="flex items-center gap-2">
                          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                          <span className="text-sm font-semibold text-emerald-700">
                            {selectedVariant.stock_quantity} in stock
                          </span>
                        </div>
                      ) : (
                        <span className="text-sm font-bold text-rose-600 bg-rose-50 px-3 py-1 rounded-full border border-rose-100">
                          Out of Stock
                        </span>
                      )
                    ) : (
                      <span className="text-sm text-slate-400 italic">Choose a variant</span>
                    )}
                  </div>
                )}
              </div>

            )
          }
          {/* <div className="flex flex-col gap-3">
            <Button
              size="lg"
              disabled={isOutOfStock}
              className="h-14 w-full rounded-xl bg-slate-950 font-bold text-white text-[15px] hover:bg-slate-800 transition-all shadow-lg hover:shadow-xl hover:scale-[1.01] disabled:opacity-40 disabled:scale-100"
              onClick={() => {
                useCartStore.getState().clearCart()
                addItem(product, selectedVariant, quantity)
                navigate(`/${slug}/checkout`)
              }}
            >
              <Zap className="mr-2 h-4 w-4" />
              Buy Now — ₹{pricing.totalFiat.toLocaleString("en-IN")}
            </Button>
            <Button
              size="lg"
              variant="outline"
              disabled={isOutOfStock}
              className="h-12 w-full rounded-xl border-slate-200 font-semibold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all disabled:opacity-40"
              onClick={() => addItem(product, selectedVariant, quantity)}
            >
              <ShoppingCart className="mr-2 h-4 w-4" /> Add to Cart
            </Button>
          </div> */}
          <ProductCTA
            product={product}
            selectedVariant={selectedVariant}
            quantity={quantity}
            pricing={pricing}
            isOutOfStock={isOutOfStock}
          />

          <p className="flex items-center justify-center gap-2 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
            <ShieldCheck className="h-3.5 w-3.5" /> 256-bit Encrypted · Secure Transaction
          </p>
        </div>
      </div>

      <div className="mt-20 space-y-16 border-t border-slate-100 pt-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          <div className="lg:col-span-7 space-y-12">
            {product.long_description && (
              <div>
                <h3 className="mb-1 text-[10px] font-bold tracking-[0.2em] uppercase text-slate-400">Overview</h3>
                <h2 className="mb-6 text-2xl font-bold tracking-tight text-slate-950">Asset Details</h2>
                <div
                  className="prose prose-slate prose-img:rounded-2xl prose-headings:font-bold prose-p:text-slate-500 prose-p:leading-relaxed max-w-none"
                  dangerouslySetInnerHTML={{ __html: product.long_description }}
                />
              </div>
            )}

            {product.key_features && product.key_features.length > 0 && (
              <div>
                <h3 className="mb-1 text-[10px] font-bold tracking-[0.2em] uppercase text-slate-400">Highlights</h3>
                <h2 className="mb-6 text-2xl font-bold tracking-tight text-slate-950">Key Features</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {product.key_features.map((feature, idx) => (
                    <div
                      key={idx}
                      className="flex items-start gap-3 bg-white p-4 rounded-xl border border-slate-100 hover:border-slate-200 hover:shadow-sm transition-all"
                    >
                      <div className="h-6 w-6 rounded-full bg-slate-950 flex items-center justify-center shrink-0 mt-0.5">
                        <Check className="h-3.5 w-3.5 text-white" />
                      </div>
                      <span className="text-sm text-slate-700 leading-snug">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="lg:col-span-5 space-y-10">
            {product.specifications && Object.keys(product.specifications).length > 0 && (
              <div>
                <h3 className="mb-1 text-[10px] font-bold tracking-[0.2em] uppercase text-slate-400">Technical</h3>
                <h2 className="mb-6 text-2xl font-bold tracking-tight text-slate-950">Specifications</h2>
                <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
                  {Object.entries(product.specifications).map(([key, value], i, arr) => (
                    <div
                      key={key}
                      className={`flex justify-between items-start gap-4 px-6 py-4 text-sm ${i !== arr.length - 1 ? "border-b border-slate-50" : ""
                        } ${i % 2 === 0 ? "bg-white" : "bg-slate-50/50"}`}
                    >
                      <span className="font-medium text-slate-500 shrink-0 w-2/5">{key}</span>
                      <span className="font-semibold text-slate-900 text-right">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {embedUrl && (
              <div>
                <h3 className="mb-1 text-[10px] font-bold tracking-[0.2em] uppercase text-slate-400">Media</h3>
                <h2 className="mb-6 text-2xl font-bold tracking-tight text-slate-950">Product Overview</h2>
                <div className="aspect-video w-full overflow-hidden rounded-2xl border border-slate-200 shadow-sm bg-slate-950">
                  <iframe
                    width="100%"
                    height="100%"
                    src={embedUrl}
                    title="Product Video"
                    frameBorder="0"
                    allowFullScreen
                  />
                </div>
              </div>
            )}
          </div>
        </div>
        {product.type === "digital" && digitalData && (
          <div
            className="relative overflow-hidden rounded-3xl border p-8 md:p-12"
            style={{
              backgroundColor: digitalData.backgroundColor || "#f5f3ff",
              borderColor: "transparent",
            }}
          >
            <div className="pointer-events-none absolute -top-12 -right-12 h-64 w-64 rounded-full bg-white/20 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-16 -left-12 h-64 w-64 rounded-full bg-black/5 blur-3xl" />

            <div className="relative z-10">
              <div className="mb-8 flex items-start justify-between gap-4">
                <div>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-white/60 backdrop-blur-sm px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-700 mb-4">
                    <Sparkles className="h-3 w-3" /> Digital Voucher
                  </span>
                  <h3 className="text-3xl font-bold tracking-tight text-slate-950">Voucher Details</h3>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-8">
                {[
                  digitalData.storeName && { label: "Store / Merchant", value: digitalData.storeName, icon: null },
                  digitalData.couponCode && { label: "Coupon Format", value: digitalData.couponCode, mono: true },
                  digitalData.validUntil && { label: "Valid Until", value: digitalData.validUntil, icon: Calendar },
                  digitalData.phone && { label: "Phone", value: digitalData.phone },
                  digitalData.address && {
                    label: "Address",
                    value: `${digitalData.address}${digitalData.pincode ? ` – ${digitalData.pincode}` : ""}`,
                    icon: MapPin,
                    wide: true,
                  },
                ]
                  .filter(Boolean)
                  .map((item: any, i) => (
                    <div
                      key={i}
                      className={`bg-white/60 backdrop-blur-sm border border-white/50 rounded-2xl p-5 shadow-sm ${item.wide ? "sm:col-span-2 lg:col-span-2" : ""}`}
                    >
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5 flex items-center gap-1.5">
                        {item.icon && <item.icon className="h-3 w-3" />}
                        {item.label}
                      </p>
                      <p className={`font-semibold text-slate-900 ${item.mono ? "font-mono bg-white/70 px-2 py-0.5 rounded text-sm inline-block" : ""}`}>
                        {item.value}
                      </p>
                    </div>
                  ))}

                {digitalData.website && (
                  <div className="bg-white/60 backdrop-blur-sm border border-white/50 rounded-2xl p-5 shadow-sm">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Website</p>
                    <a href={digitalData.website} target="_blank" rel="noreferrer"
                      className="inline-flex items-center gap-1.5 font-semibold text-blue-700 hover:text-blue-900 text-sm transition-colors">
                      Visit Website <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  </div>
                )}
              </div>

              {digitalData.aboutBrand && (
                <div className="bg-white/50 backdrop-blur-sm border border-white/50 rounded-2xl p-6 mb-6">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-3">About the Brand</p>
                  <div className="prose prose-sm max-w-none text-slate-700" dangerouslySetInnerHTML={{ __html: digitalData.aboutBrand }} />
                </div>
              )}

              {digitalData.redemptionLink && (
                <a href={digitalData.redemptionLink} target="_blank" rel="noreferrer">
                  <Button className="h-12 rounded-full bg-slate-950 px-8 font-bold text-white hover:bg-slate-800 shadow-md gap-2">
                    Redemption Portal <ExternalLink className="h-4 w-4" />
                  </Button>
                </a>
              )}
            </div>
          </div>
        )}
        {product.type === "experience" && expData && (
          <div className="rounded-3xl overflow-hidden border border-amber-200/60 shadow-sm">
            <div className="bg-linear-to-r from-amber-950 to-orange-950 px-8 py-10 md:px-12">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 border border-white/20 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-200 mb-4">
                Curated Journey
              </span>
              <h3 className="text-3xl font-bold tracking-tight text-white">Experience Itinerary</h3>
            </div>

            <div className="bg-linear-to-br from-amber-50/80 to-orange-50/50 p-8 md:p-12 space-y-8">
              <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                {[
                  expData.destination && { icon: MapPin, label: "Destination", value: expData.destination },
                  expData.duration && { icon: Calendar, label: "Duration", value: expData.duration },
                  expData.groupSize && { icon: Users, label: "Group Size", value: expData.groupSize },
                  expData.departureDate && {
                    icon: Calendar,
                    label: "Departure",
                    value: expData.departureDate,
                    sub: expData.departureTime,
                  },
                ]
                  .filter(Boolean)
                  .map((item: any, i) => (
                    <div key={i} className="bg-white rounded-2xl border border-orange-100 p-5 shadow-sm">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1.5">
                        <item.icon className="h-3 w-3" /> {item.label}
                      </p>
                      <p className="font-bold text-orange-950 text-sm">{item.value}</p>
                      {item.sub && <p className="text-xs text-slate-400 mt-0.5">@ {item.sub}</p>}
                    </div>
                  ))}
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {expData.guest && (
                  <div className="rounded-2xl border border-orange-200/50 bg-orange-100/40 p-6">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-orange-800 mb-1">Total Capacity</p>
                    <p className="text-xl font-bold text-orange-950">{expData.guest} Confirmed Seats</p>
                  </div>
                )}
                {expData.availableDates && (
                  <div className="rounded-2xl border border-orange-200/50 bg-orange-100/40 p-6">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-orange-800 mb-1">Alternative Dates</p>
                    <p className="font-semibold text-orange-950">{expData.availableDates}</p>
                  </div>
                )}
              </div>
              {expData.includes_excludes && (
                <div className="bg-white rounded-2xl border border-orange-100 p-8 shadow-sm">
                  <h4 className="font-bold text-lg text-orange-950 mb-4">What's Included</h4>
                  <div
                    className="prose prose-sm max-w-none text-slate-600 marker:text-orange-400"
                    dangerouslySetInnerHTML={{ __html: expData.includes_excludes }}
                  />
                </div>
              )}

              {expData.Availability && (
                <a href={expData.Availability} target="_blank" rel="noreferrer">
                  <Button className="h-12 rounded-full bg-orange-600 px-8 font-bold text-white hover:bg-orange-700 shadow-md gap-2">
                    Check Availability <ExternalLink className="h-4 w-4" />
                  </Button>
                </a>
              )}
            </div>
          </div>
        )}
        {product.terms_and_conditions && (
          <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-6">
            <h4 className="text-[10px] font-bold tracking-[0.15em] uppercase text-slate-400 mb-3">Terms & Conditions</h4>
            <div
              className="prose prose-sm max-w-none text-slate-500"
              dangerouslySetInnerHTML={{ __html: product.terms_and_conditions }}
            />
          </div>
        )}
      </div>
    </div>
  )
}

function PDP_Skeleton() {
  return (
    <div className="max-w-7xl mx-auto py-6 animate-pulse">
      <Skeleton className="h-4 w-48 rounded-full mb-8" />
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-12">
        <div className="lg:col-span-7 space-y-3">
          <Skeleton className="aspect-4/3.5 w-full rounded-2xl" />
          <div className="flex gap-2">
            {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-18 w-18 rounded-xl" />)}
          </div>
          <Skeleton className="h-12 w-full rounded-xl" />
        </div>
        <div className="lg:col-span-5 space-y-5 pt-2">
          <Skeleton className="h-5 w-24 rounded" />
          <Skeleton className="h-14 w-full rounded-xl" />
          <Skeleton className="h-4 w-32 rounded" />
          <Skeleton className="h-20 w-full rounded-xl" />
          <Skeleton className="h-28 w-full rounded-2xl" />
          <Skeleton className="h-14 w-full rounded-xl" />
          <Skeleton className="h-12 w-full rounded-xl" />
        </div>
      </div>
    </div>
  )
}