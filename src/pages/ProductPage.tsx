import { useState, useMemo } from "react"
import { useParams, useNavigate } from "react-router-dom"
import {
  Minus,
  Plus,
  ShoppingCart,
  Info,
  CheckCircle2,
  Check,
} from "lucide-react"
import { useProductDetail, type ProductVariant } from "@/hooks/useStorefront"
import { useTenantStore } from "@/store/useTenantStore"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { useCartStore } from "@/store/useCartStore"

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
  const { slug, productSlug } = useParams<{
    slug: string
    productSlug: string
  }>()
  const navigate = useNavigate()
  const { config } = useTenantStore()
  const addItem = useCartStore((state) => state.addItem)

  const {
    data: product,
    isLoading,
    isError,
  } = useProductDetail(slug!, productSlug!)

  const [quantity, setQuantity] = useState<number>(1)
  const [selectedAttributes, setSelectedAttributes] = useState<
    Record<string, string>
  >({})
  const [activeThumbnail, setActiveThumbnail] = useState<string | null>(null)

  const activeAttributes = useMemo(() => {
    if (Object.keys(selectedAttributes).length > 0) return selectedAttributes
    return product?.variants?.[0]?.attributes || {}
  }, [selectedAttributes, product])

  const selectedVariant = useMemo<ProductVariant | null>(() => {
    if (!product?.variants?.length) return null
    return (
      product.variants.find((v) =>
        Object.entries(activeAttributes).every(
          ([key, value]) => v.attributes[key] === value
        )
      ) || null
    )
  }, [product, activeAttributes])

  const displayImage =
    activeThumbnail ||
    selectedVariant?.image_url ||
    product?.main_image_url ||
    null

  const availableAttributes = useMemo<Record<string, string[]>>(() => {
    if (!product?.variants?.length) return {}
    const attrMap: Record<string, Set<string>> = {}
    product.variants.forEach((v) => {
      Object.entries(v.attributes).forEach(([key, val]) => {
        if (!attrMap[key]) attrMap[key] = new Set<string>()
        attrMap[key].add(val)
      })
    })
    const formatted: Record<string, string[]> = {}
    Object.keys(attrMap).forEach((key) => {
      formatted[key] = Array.from(attrMap[key])
    })
    return formatted
  }, [product])

  const pricing = useMemo(() => {
    if (!product)
      return {
        unitFiat: 0,
        unitPoints: 0,
        mrpFiat: 0,
        totalFiat: 0,
        isTierApplied: false,
      }

    let currentFiat = selectedVariant
      ? Number(selectedVariant.selling_price)
      : Number(product.selling_price)
    let currentPoints = selectedVariant
      ? selectedVariant.points_equivalent
      : product.points_equivalent
    const currentMrp = selectedVariant
      ? Number(selectedVariant.mrp)
      : Number(product.mrp)
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

  const maxStock = product?.variants?.length
    ? selectedVariant
      ? selectedVariant.stock_quantity
      : 9999
    : 9999

  const handleAttributeSelect = (key: string, value: string) => {
    const proposedAttributes = { ...activeAttributes, [key]: value }
    const exactMatchExists = product?.variants.some((v) =>
      Object.entries(proposedAttributes).every(
        ([k, val]) => v.attributes[k] === val
      )
    )

    let finalVariantMatch = null

    if (exactMatchExists) {
      setSelectedAttributes(proposedAttributes)
      finalVariantMatch = product?.variants.find((v) =>
        Object.entries(proposedAttributes).every(
          ([k, val]) => v.attributes[k] === val
        )
      )
    } else {
      const fallbackVariant = product?.variants.find(
        (v) => v.attributes[key] === value
      )
      if (fallbackVariant) {
        setSelectedAttributes(fallbackVariant.attributes)
        finalVariantMatch = fallbackVariant
      }
    }

    if (finalVariantMatch && finalVariantMatch.image_url) {
      setActiveThumbnail(finalVariantMatch.image_url)
    } else {
      setActiveThumbnail(null)
    }

    setQuantity(1)
  }

  const handleQuantityChange = (delta: number) => {
    const newQ = quantity + delta
    if (newQ >= 1 && newQ <= maxStock) setQuantity(newQ)
  }

  if (isLoading) return <PDP_Skeleton />
  if (isError || !product)
    return (
      <div className="py-20 text-center text-xl font-semibold text-slate-500">
        Product not found.
      </div>
    )

  const isOutOfStock =
    product?.variants?.length > 0 &&
    (!selectedVariant || selectedVariant.stock_quantity === 0)
  const embedUrl = getYouTubeEmbedUrl(product.video_url)

  const digitalData = product.type_data as DigitalTypeData | undefined
  const expData = product.type_data as ExperienceTypeData | undefined

  return (
    <div className="grid grid-cols-1 gap-12 lg:grid-cols-2">
      <div className="space-y-4">
        <div className="aspect-square w-full overflow-hidden rounded-2xl border bg-white p-8">
          {displayImage ? (
            <img
              src={displayImage}
              alt={product.name}
              className="h-full w-full object-contain mix-blend-multiply"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-slate-300">
              No Image Available
            </div>
          )}
        </div>
        {((product.gallery_images && product.gallery_images.length > 0) ||
          product.main_image_url) && (
          <div className="flex gap-4 overflow-x-auto pb-2">
            {[product.main_image_url, ...(product.gallery_images || [])]
              .filter(Boolean)
              .map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveThumbnail(img as string)}
                  className={`h-20 w-20 shrink-0 overflow-hidden rounded-xl border bg-white p-2 transition-all ${
                    displayImage === img
                      ? "ring-2 ring-slate-900"
                      : "hover:border-slate-400"
                  }`}
                >
                  <img
                    src={img as string}
                    alt="Thumb"
                    className="h-full w-full object-contain mix-blend-multiply"
                  />
                </button>
              ))}
          </div>
        )}
      </div>

      <div className="flex flex-col">
        {product.brand && (
          <span className="mb-2 text-sm font-bold tracking-widest text-slate-400 uppercase">
            {product.brand}
          </span>
        )}
        <h1 className="mb-2 text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">
          {product.name}
        </h1>
        <p className="mb-6 text-sm text-slate-500">
          SKU: {selectedVariant ? selectedVariant.sku : product.sku}
        </p>

        {product.short_description && (
          <p className="mb-6 text-lg text-slate-600">
            {product.short_description}
          </p>
        )}

        <div className="mb-8 rounded-2xl border bg-slate-50 p-6">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">
                Price per unit
              </p>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold text-slate-900">
                  ₹{pricing.unitFiat.toLocaleString("en-IN")}
                </span>
                {pricing.mrpFiat > pricing.unitFiat && (
                  <span className="text-lg font-medium text-slate-400 line-through">
                    ₹{pricing.mrpFiat.toLocaleString("en-IN")}
                  </span>
                )}
              </div>
              <p className="mt-1 text-sm font-medium text-blue-600">
                (or use up to {pricing.unitPoints.toLocaleString("en-IN")}{" "}
                {config?.points_name || "Points"})
              </p>
            </div>
            {pricing.isTierApplied && (
              <div className="flex items-center gap-1 rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                <CheckCircle2 className="h-4 w-4" /> Bulk Discount Applied
              </div>
            )}
          </div>
        </div>

        {product.tier_prices &&
          product.tier_prices.filter(
            (t) => t.variant_id == null || t.variant_id === selectedVariant?.id
          ).length > 0 && (
            <div className="mb-8 space-y-2 rounded-xl border border-blue-100 bg-blue-50 p-4">
              <h4 className="flex items-center gap-2 text-sm font-semibold text-blue-900">
                <Info className="h-4 w-4" /> Volume Discounts
              </h4>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {product.tier_prices
                  .filter(
                    (t) =>
                      t.variant_id == null ||
                      t.variant_id === selectedVariant?.id
                  )
                  .map((tier, i) => (
                    <div
                      key={i}
                      className="rounded-lg bg-white p-2 text-center text-sm shadow-sm"
                    >
                      <p className="font-semibold text-slate-900">
                        Buy {tier.min_quantity}+
                      </p>
                      <p className="text-blue-600">
                        ₹{Number(tier.selling_price).toLocaleString("en-IN")}/ea
                      </p>
                    </div>
                  ))}
              </div>
            </div>
          )}

        {product.variants && product.variants.length > 0 && (
          <div className="mb-8 space-y-6">
            {Object.entries(availableAttributes).map(([attrKey, values]) => (
              <div key={attrKey}>
                <h4 className="mb-3 text-sm font-semibold text-slate-900">
                  {attrKey}
                </h4>
                <div className="flex flex-wrap gap-2">
                  {values.map((val) => {
                    const isSelected = activeAttributes[attrKey] === val
                    return (
                      <button
                        key={val}
                        onClick={() => handleAttributeSelect(attrKey, val)}
                        className={`min-w-12 rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
                          isSelected
                            ? "border-slate-900 bg-slate-900 text-white"
                            : "bg-white text-slate-700 hover:border-slate-400 hover:bg-slate-50"
                        }`}
                      >
                        {val}
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-auto space-y-6 border-t pt-8">
          <div className="flex items-center gap-6">
            <div className="flex items-center rounded-lg border bg-white p-1">
              <button
                onClick={() => handleQuantityChange(-1)}
                disabled={quantity <= 1}
                className="rounded-md p-2 text-slate-500 hover:bg-slate-100 disabled:opacity-50"
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="w-12 text-center font-semibold text-slate-900">
                {quantity}
              </span>
              <button
                onClick={() => handleQuantityChange(1)}
                disabled={quantity >= maxStock}
                className="rounded-md p-2 text-slate-500 hover:bg-slate-100 disabled:opacity-50"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
            {product.variants && product.variants.length > 0 && (
              <span className="text-sm text-slate-500">
                {selectedVariant ? (
                  selectedVariant.stock_quantity > 0 ? (
                    `${selectedVariant.stock_quantity} available`
                  ) : (
                    <span className="font-semibold text-red-500">
                      Out of Stock
                    </span>
                  )
                ) : (
                  <span className="text-slate-400">
                    Please choose variations
                  </span>
                )}
              </span>
            )}
          </div>

          <div className="flex gap-4">
            <Button
              size="lg"
              variant="outline"
              disabled={isOutOfStock}
              className="flex-1 rounded-full border-2 font-semibold"
              onClick={() => addItem(product, selectedVariant, quantity)}
            >
              <ShoppingCart className="mr-2 h-5 w-5" /> Add to Cart
            </Button>
            <Button
              size="lg"
              disabled={isOutOfStock}
              className="flex-1 rounded-full bg-slate-900 font-semibold text-white hover:bg-slate-800"
              onClick={() => {
                useCartStore.getState().clearCart()
                addItem(product, selectedVariant, quantity)
                navigate(`/${slug}/checkout`)
              }}
            >
              Buy Now — ₹{pricing.totalFiat.toLocaleString("en-IN")}
            </Button>
          </div>
        </div>
      </div>

      <div className="mt-8 space-y-12 border-t pt-12 lg:col-span-2">
        {product.long_description && (
          <div>
            <h3 className="mb-4 text-2xl font-bold text-slate-900">
              Product Details
            </h3>
            <div
              className="prose prose-slate prose-img:rounded-xl max-w-none text-slate-600"
              dangerouslySetInnerHTML={{ __html: product.long_description }}
            />
          </div>
        )}

        <div className="grid grid-cols-1 gap-12 md:grid-cols-2">
          {product.key_features && product.key_features.length > 0 && (
            <div>
              <h3 className="mb-6 text-xl font-bold text-slate-900">
                Key Features
              </h3>
              <ul className="space-y-3">
                {product.key_features.map((feature, idx) => (
                  <li
                    key={idx}
                    className="flex items-start gap-3 text-slate-600"
                  >
                    <Check className="mt-0.5 h-5 w-5 shrink-0 text-green-500" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {product.specifications &&
            Object.keys(product.specifications).length > 0 && (
              <div>
                <h3 className="mb-6 text-xl font-bold text-slate-900">
                  Specifications
                </h3>
                <div className="divide-y overflow-hidden rounded-xl border">
                  {Object.entries(product.specifications).map(
                    ([key, value]) => (
                      <div
                        key={key}
                        className="flex grid-cols-3 bg-white p-4 text-sm transition-colors hover:bg-slate-50 sm:grid"
                      >
                        <span className="w-1/3 font-semibold text-slate-900 sm:w-auto">
                          {key}
                        </span>
                        <span className="w-2/3 text-slate-600 sm:col-span-2 sm:w-auto">
                          {value}
                        </span>
                      </div>
                    )
                  )}
                </div>
              </div>
            )}
        </div>

        {embedUrl && (
          <div>
            <h3 className="mb-6 text-xl font-bold text-slate-900">
              Product Video
            </h3>
            <div className="aspect-video w-full overflow-hidden rounded-2xl border shadow-sm">
              <iframe
                width="100%"
                height="100%"
                src={embedUrl}
                title="Product Video"
                frameBorder="0"
                allowFullScreen
                className="h-full w-full object-cover"
              ></iframe>
            </div>
          </div>
        )}
      </div>

      {product.type === "digital" && digitalData && (
        <div
          className="rounded-2xl border p-6 shadow-sm transition-all md:p-8 lg:col-span-2"
          style={{
            backgroundColor: digitalData.backgroundColor || "#faf5ff",
            borderColor: digitalData.backgroundColor
              ? "transparent"
              : "#f3e8ff",
          }}
        >
          <h3 className="mb-6 text-2xl font-bold text-slate-900">
            Voucher Details
          </h3>
          <div className="mb-6 grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="space-y-3 text-sm text-slate-700">
              {digitalData.storeName && (
                <p>
                  <span className="font-semibold text-slate-900">Store:</span>{" "}
                  {digitalData.storeName}
                </p>
              )}
              {digitalData.couponCode && (
                <p>
                  <span className="font-semibold text-slate-900">
                    Code Format:
                  </span>{" "}
                  <span className="rounded border bg-white/60 px-1 py-0.5 font-mono text-xs font-bold">
                    {digitalData.couponCode}
                  </span>
                </p>
              )}
              {digitalData.validUntil && (
                <p>
                  <span className="font-semibold text-slate-900">
                    Validity:
                  </span>{" "}
                  {digitalData.validUntil}
                </p>
              )}
            </div>
            <div className="space-y-3 text-sm text-slate-700">
              {digitalData.phone && (
                <p>
                  <span className="font-semibold text-slate-900">Contact:</span>{" "}
                  {digitalData.phone}
                </p>
              )}
              {digitalData.website && (
                <p>
                  <span className="font-semibold text-slate-900">Website:</span>{" "}
                  <a
                    href={digitalData.website}
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-600 underline hover:text-blue-800"
                  >
                    {digitalData.website}
                  </a>
                </p>
              )}
              {digitalData.address && (
                <p>
                  <span className="font-semibold text-slate-900">Address:</span>{" "}
                  {digitalData.address}{" "}
                  {digitalData.pincode ? `- ${digitalData.pincode}` : ""}
                </p>
              )}
            </div>
          </div>

          {digitalData.aboutBrand && (
            <div
              className="prose prose-sm max-w-none border-t border-slate-200 pt-4 text-slate-600"
              dangerouslySetInnerHTML={{ __html: digitalData.aboutBrand }}
            />
          )}

          {digitalData.redemptionLink && (
            <div className="mt-6">
              <a
                href={digitalData.redemptionLink}
                target="_blank"
                rel="noreferrer"
              >
                <Button className="rounded-full bg-slate-900 text-white hover:bg-slate-800">
                  View Redemption Link →
                </Button>
              </a>
            </div>
          )}
        </div>
      )}

      {product.type === "experience" && expData && (
        <div className="rounded-2xl border border-orange-100 bg-orange-50/50 p-6 shadow-sm md:p-8 lg:col-span-2">
          <h3 className="mb-6 text-2xl font-bold text-orange-900">
            Experience Itinerary
          </h3>
          <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4">
            {expData.destination && (
              <div className="rounded-xl border bg-white p-4 text-center shadow-sm">
                <p className="mb-1 text-xs font-bold tracking-wider text-slate-400 uppercase">
                  Destination
                </p>
                <p className="font-semibold text-orange-950">
                  {expData.destination}
                </p>
              </div>
            )}
            {expData.duration && (
              <div className="rounded-xl border bg-white p-4 text-center shadow-sm">
                <p className="mb-1 text-xs font-bold tracking-wider text-slate-400 uppercase">
                  Duration
                </p>
                <p className="font-semibold text-orange-950">
                  {expData.duration}
                </p>
              </div>
            )}
            {expData.groupSize && (
              <div className="rounded-xl border bg-white p-4 text-center shadow-sm">
                <p className="mb-1 text-xs font-bold tracking-wider text-slate-400 uppercase">
                  Group Size
                </p>
                <p className="font-semibold text-orange-950">
                  {expData.groupSize}
                </p>
              </div>
            )}
            {expData.departureDate && (
              <div className="rounded-xl border bg-white p-4 text-center shadow-sm">
                <p className="mb-1 text-xs font-bold tracking-wider text-slate-400 uppercase">
                  Departure
                </p>
                <p className="font-semibold text-orange-950">
                  {expData.departureDate}{" "}
                  {expData.departureTime ? `@ ${expData.departureTime}` : ""}
                </p>
              </div>
            )}
          </div>

          <div className="mb-6 grid grid-cols-1 gap-6 rounded-xl border bg-white p-4 text-sm shadow-sm md:grid-cols-2">
            {expData.guest && (
              <div>
                <span className="mb-1 block font-bold text-slate-900">
                  Max Allocation Capacity:
                </span>
                <p className="text-slate-600">
                  {expData.guest} Total Seats Confirmed
                </p>
              </div>
            )}
            {expData.availableDates && (
              <div>
                <span className="mb-1 block font-bold text-slate-900">
                  Alternative Schedule Openings:
                </span>
                <p className="text-slate-600">{expData.availableDates}</p>
              </div>
            )}
          </div>

          {expData.includes_excludes && (
            <div className="border-t border-orange-200 pt-6">
              <h4 className="mb-2 font-bold text-orange-950">
                What's Included
              </h4>
              <div
                className="prose prose-sm max-w-none text-slate-700"
                dangerouslySetInnerHTML={{ __html: expData.includes_excludes }}
              />
            </div>
          )}

          {expData.Availability && (
            <div className="mt-6 border-t border-orange-200 pt-4">
              <a href={expData.Availability} target="_blank" rel="noreferrer">
                <Button className="rounded-full bg-orange-600 text-white hover:bg-orange-700">
                  Check Real-Time Availability →
                </Button>
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function PDP_Skeleton() {
  return (
    <div className="grid grid-cols-1 gap-12 lg:grid-cols-2">
      <Skeleton className="aspect-square w-full rounded-2xl" />
      <div className="space-y-6">
        <Skeleton className="h-6 w-24" />
        <Skeleton className="h-12 w-3/4" />
        <Skeleton className="h-24 w-full" />
      </div>
    </div>
  )
}
