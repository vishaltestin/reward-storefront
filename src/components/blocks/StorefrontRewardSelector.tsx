import { useParams } from "react-router-dom"
import { Loader2, ArrowRight } from "lucide-react"
import { useClaimStore } from "@/store/useClaimStore"
import { useClaimCatalogQuery } from "@/hooks/useClaimQueries"
import type { RewardSelectorBlock, StorefrontProduct } from "@/types/claim"

export function StorefrontRewardSelector({
  block,
}: {
  block: RewardSelectorBlock
}) {
  const { slug } = useParams<{ slug: string }>()
  const { content, styles } = block

  const {
    allowedProductIds,
    rewardValue,
    setSelectedProduct,
    setCheckoutModalOpen,
  } = useClaimStore()
  const { data: products, isLoading } = useClaimCatalogQuery(
    slug!,
    allowedProductIds
  )

  const handleOpenClaimModal = (product: StorefrontProduct) => {
    setSelectedProduct(product)
    setCheckoutModalOpen(true)
  }

  return (
    <div
      className="px-6 py-16"
      style={{ backgroundColor: styles.backgroundColor }}
    >
      <div className="mx-auto max-w-6xl text-center">
        <h2
          className="mb-4 text-3xl font-bold"
          style={{ color: styles.headingColor }}
        >
          {content.heading}
        </h2>

        {isLoading ? (
          <Loader2 className="mx-auto animate-spin" />
        ) : (
          <div className="grid gap-6 md:grid-cols-3">
            {products?.map((product: StorefrontProduct) => {
              const fiatDue = Math.max(0, product.selling_price - rewardValue)

              return (
                <div
                  key={product.id}
                  className="flex flex-col rounded-xl border bg-white p-4 text-left shadow-sm"
                >
                  <img
                    src={product.main_image_url || ""}
                    alt={product.name}
                    className="mb-4 h-48 object-contain"
                  />
                  <h3 className="line-clamp-2 font-bold">{product.name}</h3>

                  <div className="mt-auto space-y-1 pt-4 text-sm">
                    <div className="flex justify-between text-slate-500">
                      <span>Price:</span> <span>₹{product.selling_price}</span>
                    </div>
                    <div className="flex justify-between border-b pb-2 font-medium text-green-600">
                      <span>Reward:</span> <span>-₹{rewardValue}</span>
                    </div>
                    <div className="flex justify-between pt-2 text-lg font-bold">
                      <span>You Pay:</span> <span>₹{fiatDue}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleOpenClaimModal(product)}
                    className="mt-4 flex w-full items-center justify-center gap-2 rounded-md bg-slate-900 py-3 font-medium text-white hover:bg-slate-800"
                  >
                    {fiatDue > 0
                      ? `Pay ₹${fiatDue} to Claim`
                      : "Claim for Free"}{" "}
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
