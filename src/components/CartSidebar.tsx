import { useNavigate } from "react-router-dom"
import { X, Minus, Plus, Trash2, ShoppingBag } from "lucide-react"
import { useCartStore, type CartItem } from "@/store/useCartStore"
import { useTenantStore } from "@/store/useTenantStore"
import { Button } from "@/components/ui/button"

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
      }
    }
    return { fiat, points }
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

  if (!isOpen) return null

  return (
    <>
      <div
        className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
        onClick={() => setCartOpen(false)}
      />
      <div className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md animate-in flex-col bg-white shadow-2xl slide-in-from-right">
        <div className="flex items-center justify-between border-b px-6 py-4">
          <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900">
            <ShoppingBag className="h-5 w-5" />
            Your Cart ({items.length})
          </h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCartOpen(false)}
          >
            <X className="h-5 w-5 text-slate-500" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {items.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center text-slate-500">
              <ShoppingBag className="mb-4 h-12 w-12 text-slate-300" />
              <p className="text-lg font-medium text-slate-900">
                Your cart is empty
              </p>
              <Button
                variant="outline"
                className="mt-6 rounded-full"
                onClick={() => setCartOpen(false)}
              >
                Continue Shopping
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              {items.map((item) => {
                const { fiat, points } = getEffectivePrice(item)
                const image =
                  item.variant?.image_url || item.product.main_image_url

                return (
                  <div key={item.id} className="flex gap-4">
                    <div className="h-20 w-20 shrink-0 rounded-xl border bg-slate-50 p-2">
                      {image ? (
                        <img
                          src={image}
                          alt={item.product.name}
                          className="h-full w-full object-contain mix-blend-multiply"
                        />
                      ) : (
                        <div className="h-full w-full bg-slate-200" />
                      )}
                    </div>

                    <div className="flex flex-1 flex-col">
                      <div className="flex justify-between">
                        <h3 className="line-clamp-2 text-sm font-semibold text-slate-900">
                          {item.product.name}
                        </h3>
                        <button
                          onClick={() => removeItem(item.id)}
                          className="ml-2 text-slate-400 hover:text-red-500"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>

                      {item.variant && (
                        <p className="mt-1 text-xs text-slate-500">
                          {Object.values(item.variant.attributes).join(" • ")}
                        </p>
                      )}

                      <div className="mt-auto flex items-end justify-between pt-2">
                        <div className="flex items-center rounded-lg border bg-slate-50">
                          <button
                            onClick={() => updateQuantity(item.id, -1)}
                            className="p-1.5 text-slate-500 hover:bg-slate-200"
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="w-8 text-center text-sm font-semibold">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.id, 1)}
                            className="p-1.5 text-slate-500 hover:bg-slate-200"
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-slate-900">
                            ₹{(fiat * item.quantity).toLocaleString("en-IN")}
                          </p>
                          <p className="text-xs text-blue-600">
                            or {points * item.quantity} {config?.points_name}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {items.length > 0 && (
          <div className="border-t bg-slate-50 p-6">
            <div className="mb-6 flex items-end justify-between">
              <span className="text-lg font-bold text-slate-900">Subtotal</span>
              <div className="text-right">
                <span className="text-2xl font-bold text-slate-900">
                  ₹{totals.fiat.toLocaleString("en-IN")}
                </span>
                <p className="text-sm font-medium text-blue-600">
                  or {totals.points} {config?.points_name}
                </p>
              </div>
            </div>
            <Button
              className="w-full rounded-full bg-slate-900 py-6 text-lg font-semibold text-white hover:bg-slate-800"
              onClick={handleCheckout}
            >
              Proceed to Checkout
            </Button>
          </div>
        )}
      </div>
    </>
  )
}
