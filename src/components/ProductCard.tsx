import { Link } from "react-router-dom"
import { ShoppingCart, Heart } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import type { ProductSummary } from "@/hooks/useStorefront"
import { useWishlistStore } from "@/store/useWishlistStore"

interface ProductCardProps {
    product: ProductSummary
    slug: string
}

export default function ProductCard({ product, slug }: ProductCardProps) {
    const { addItem, removeItem, isInWishlist } = useWishlistStore()
    const isWishlisted = isInWishlist(product.id)

    const toggleWishlist = (e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()
        if (isWishlisted) {
            removeItem(product.id)
        } else {
            addItem(product)
        }
    }

    const discountPercentage =
        product.mrp && product.mrp > product.selling_price
            ? Math.round(((product.mrp - product.selling_price) / product.mrp) * 100)
            : 0

    return (
        <div className="group flex flex-col rounded-2xl border border-slate-100 bg-white p-3.5 transition-all duration-400 ease-out hover:-translate-y-1 hover:border-slate-200/80 hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.07)] font-sans relative">

            <div className="absolute top-5 left-5 z-10 flex flex-col gap-2">
                {discountPercentage > 0 && (
                    <Badge className="bg-rose-500 hover:bg-rose-600 text-white font-bold tracking-wide text-[10px] px-2 py-0.5 shadow-sm border-none">
                        {discountPercentage}% OFF
                    </Badge>
                )}
            </div>

            <button
                onClick={toggleWishlist}
                className="absolute top-5 right-5 z-10 p-2 rounded-full bg-white/90 backdrop-blur-sm border border-slate-100 shadow-sm transition-all duration-200 hover:scale-110 active:scale-95"
            >
                <Heart
                    className={`h-4 w-4 transition-colors ${isWishlisted ? "fill-rose-500 text-rose-500" : "text-slate-400 hover:text-rose-500"
                        }`}
                />
            </button>

            <Link
                to={`/${slug}/product/${product.slug}`}
                className="relative mb-3.5 block aspect-square overflow-hidden rounded-xl bg-slate-50/60 border border-slate-50/50"
            >
                {product.main_image_url ? (
                    <img
                        src={product.main_image_url}
                        alt={product.name}
                        loading="lazy"
                        className="h-full w-full object-contain p-6 transition-transform duration-700 ease-out group-hover:scale-[1.08]"
                    />
                ) : (
                    <div className="flex h-full w-full items-center justify-center text-xs font-medium text-slate-300 uppercase tracking-wider">
                        No Preview Available
                    </div>
                )}
            </Link>

            <div className="flex flex-1 flex-col pt-0.5 px-1">
                {product.brand && (
                    <span className="mb-1.5 text-[10px] font-bold tracking-widest text-indigo-500 uppercase">
                        {product.brand}
                    </span>
                )}

                <Link to={`/${slug}/product/${product.slug}`} className="mb-4">
                    <h3 className="line-clamp-2 text-sm font-heading font-semibold text-slate-800 leading-snug transition-colors group-hover:text-indigo-600">
                        {product.name}
                    </h3>
                </Link>

                <div className="mt-auto flex items-end justify-between pt-2">
                    <div className="space-y-0.5">
                        {product.mrp && product.mrp > product.selling_price && (
                            <p className="text-[11px] font-semibold text-slate-400 line-through decoration-slate-300">
                                ₹{product.mrp.toLocaleString("en-IN")}
                            </p>
                        )}
                        <p className="text-base font-heading font-bold text-slate-950 tracking-tight">
                            ₹{product.selling_price.toLocaleString("en-IN")}
                        </p>
                    </div>

                    <Link to={`/${slug}/product/${product.slug}`}>
                        <Button
                            size="icon"
                            className="rounded-full h-10 w-10 bg-slate-50 text-slate-800 shadow-none border border-slate-100 hover:bg-slate-950 hover:text-white hover:border-slate-950 transition-all duration-300 group-hover:shadow-md group-hover:scale-105"
                        >
                            <ShoppingCart className="h-4 w-4 transition-transform group-hover:-rotate-6" />
                        </Button>
                    </Link>
                </div>
            </div>
        </div>
    )
}