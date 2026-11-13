import { useNavigate } from "react-router-dom"
import {
  X,
  Minus,
  Plus,
  Trash2,
  ShoppingBag,
  ShoppingCart,
  Tag,
  ArrowRight,
} from "lucide-react"
import { useCartStore, type CartItem } from "@/store/useCartStore"
import { useTenantStore } from "@/store/useTenantStore"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"

export default function CartSidebar() {
  const { items, isOpen, setCartOpen, updateQuantity, removeItem } =
    useCartStore()
  const { config, slug } = useTenantStore()
  const navigate = useNavigate()

  const getEffectivePrice = (item: CartItem) => {
    let fiat = item.variant
      ? Number(item.variant.selling_price)
      : Number(item.product.selling_price)
    let points = item.variant
      ? Number(item.variant.points_equivalent)
      : Number(item.product.points_equivalent)

    let isTierApplied = false

    if (
      item.product.tier_prices &&
      Array.isArray(item.product.tier_prices) &&
      item.product.tier_prices.length > 0
    ) {
      const applicableTiers = item.product.tier_prices.filter(
        (t) => t.variant_id == null || t.variant_id === item.variant?.id
      )

      const applicableTier = [...applicableTiers]
        .sort((a, b) => b.min_quantity - a.min_quantity)
        .find((t) => item.quantity >= t.min_quantity)

      if (applicableTier) {
        fiat = Number(applicableTier.selling_price)
        points = Number(applicableTier.points_equivalent)
        isTierApplied = true
      }
    }
    return { fiat, points, isTierApplied }
  }

  const totals = items.reduce(
    (acc, item) => {
      const { fiat, points } = getEffectivePrice(item)
      acc.fiat += fiat * item.quantity
      acc.points += points * item.quantity
      return acc
    },
    { fiat: 0, points: 0 }
  )

  const handleCheckout = () => {
    setCartOpen(false)
    navigate(`/${slug}/checkout`)
  }

  return (
    <Sheet open={isOpen} onOpenChange={setCartOpen}>
      <SheetContent className="flex h-full w-full flex-col border-l border-slate-100 bg-white p-0 shadow-2xl sm:max-w-md">
        {/* Header Section */}
        <SheetHeader className="sticky top-0 z-10 flex flex-row items-center justify-between space-y-0 border-b border-slate-100 bg-white px-6 py-5">
          <div className="space-y-0.5">
            <SheetTitle className="flex items-center gap-2 text-lg font-bold tracking-tight text-slate-900">
              <ShoppingBag className="h-5 w-5 stroke-[2] text-slate-900" />
              Your Cart
            </SheetTitle>
            <SheetDescription className="text-xs font-medium text-slate-400">
              {items.length} {items.length === 1 ? "item" : "items"} selected
            </SheetDescription>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-900"
            onClick={() => setCartOpen(false)}
          >
            <X className="h-5 w-5" />
          </Button>
        </SheetHeader>

        {/* Cart Items List */}
        <div className="flex-1 overflow-hidden">
          <ScrollArea className="h-full px-6 py-4">
            {items.length === 0 ? (
              <div className="flex h-[65vh] flex-col items-center justify-center p-4 text-center">
                <div className="mb-4 rounded-full border border-slate-100 bg-slate-50 p-5 text-slate-400">
                  <ShoppingCart className="h-8 w-8 stroke-[1.5]" />
                </div>
                <h3 className="text-sm font-bold text-slate-900">
                  Your cart is empty
                </h3>
                <p className="mt-1 max-w-[200px] text-xs leading-relaxed text-slate-400">
                  Explore our premium catalog items and digital vouchers to fill
                  your basket.
                </p>
                <Button
                  variant="outline"
                  className="mt-5 rounded-full border-slate-200 px-5 text-xs font-bold text-slate-700 hover:bg-slate-950 hover:text-white"
                  onClick={() => setCartOpen(false)}
                >
                  Continue Shopping
                </Button>
              </div>
            ) : (
              <div className="space-y-4 pb-4">
                {items.map((item) => {
                  const { fiat, points, isTierApplied } =
                    getEffectivePrice(item)
                  const image =
                    item.variant?.image_url || item.product.main_image_url

                  return (
                    <div
                      key={item.id}
                      className="group relative flex gap-4 rounded-xl border border-slate-100 bg-white p-3 transition-all duration-200 hover:border-slate-200"
                    >
                      {/* Product Image */}
                      <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-slate-100 bg-slate-50 p-1">
                        {image ? (
                          <img
                            src={image}
                            alt={item.product.name}
                            className="h-full w-full object-contain mix-blend-multiply"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center rounded bg-slate-100 text-[10px] font-bold text-slate-300 uppercase">
                            No Img
                          </div>
                        )}
                      </div>

                      {/* Product Content Details */}
                      <div className="flex flex-1 flex-col justify-between">
                        <div className="space-y-1">
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="line-clamp-2 text-xs leading-snug font-bold tracking-tight text-slate-900">
                              {item.product.name}
                            </h4>
                            <button
                              onClick={() => removeItem(item.id)}
                              className="shrink-0 p-0.5 text-slate-300 transition-colors hover:text-rose-600"
                              title="Remove item"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>

                          {/* Variant Attributes */}
                          {item.variant && (
                            <div className="flex flex-wrap gap-1 pt-0.5">
                              {Object.entries(item.variant.attributes).map(
                                ([key, value]) => (
                                  <span
                                    key={key}
                                    className="inline-flex items-center rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600"
                                  >
                                    {String(value)}
                                  </span>
                                )
                              )}
                            </div>
                          )}

                          {/* Tier Discount Tag */}
                          {isTierApplied && (
                            <Badge
                              variant="secondary"
                              className="flex w-fit items-center gap-1 rounded border border-emerald-100/50 bg-emerald-50 px-1.5 py-0 text-[9px] font-bold text-emerald-700"
                            >
                              <Tag className="h-2.5 w-2.5" />
                              Tier Discount Applied
                            </Badge>
                          )}
                        </div>

                        {/* Quantity controls and calculations row */}
                        <div className="mt-2 flex items-center justify-between gap-2">
                          {/* Gift cards and vouchers are issued one per person,
                              so there is nothing to increment. */}
                          {item.product.type === "physical" ? (
                            <div className="flex items-center overflow-hidden rounded-lg border border-slate-200 bg-white">
                              <button
                                disabled={item.quantity <= 1}
                                onClick={() => updateQuantity(item.id, -1)}
                                className="p-1.5 text-slate-400 hover:bg-slate-50 hover:text-slate-900 disabled:opacity-30"
                              >
                                <Minus className="h-3 w-3 stroke-[2.5]" />
                              </button>
                              <span className="w-7 text-center text-xs font-bold text-slate-900">
                                {item.quantity}
                              </span>
                              <button
                                onClick={() => updateQuantity(item.id, 1)}
                                className="p-1.5 text-slate-400 hover:bg-slate-50 hover:text-slate-900"
                              >
                                <Plus className="h-3 w-3 stroke-[2.5]" />
                              </button>
                            </div>
                          ) : (
                            <span className="rounded bg-slate-50 px-2 py-1 text-[10px] font-semibold tracking-wide text-slate-500 uppercase">
                              Qty 1
                            </span>
                          )}

                          <div className="text-right">
                            <p className="text-sm font-bold tracking-tight text-slate-900">
                              ₹{(fiat * item.quantity).toLocaleString("en-IN")}
                            </p>
                            <p className="text-[10px] font-medium text-blue-600">
                              or{" "}
                              {Math.round(
                                points * item.quantity
                              ).toLocaleString("en-IN")}{" "}
                              {config?.points_name || "Points"}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </ScrollArea>
        </div>

        {/* Simple Footer Component */}
        {items.length > 0 && (
          <SheetFooter className="sticky bottom-0 z-10 flex-col space-y-4 border-t border-slate-100 bg-white p-6 sm:flex-col">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-slate-900">Subtotal</span>
              <div className="text-right">
                <span className="text-xl font-black tracking-tight text-slate-950">
                  ₹{totals.fiat.toLocaleString("en-IN")}
                </span>
                <p className="text-xs font-semibold text-blue-600">
                  or {Math.round(totals.points).toLocaleString("en-IN")}{" "}
                  {config?.points_name || "Points"}
                </p>
              </div>
            </div>

            <div className="pt-1">
              <Button
                className="group flex h-11 w-full items-center justify-center gap-1.5 rounded-full bg-slate-950 text-xs font-bold tracking-wider text-white uppercase shadow-sm transition-all hover:bg-slate-900 active:scale-[0.99]"
                onClick={handleCheckout}
              >
                <span>Proceed to Checkout</span>
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
              </Button>
            </div>
          </SheetFooter>
        )}
      </SheetContent>
    </Sheet>
  )
}
