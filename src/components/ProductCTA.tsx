import { useState } from "react"
import { useNavigate, useParams, Link } from "react-router-dom"
import {
    ShoppingCart,
    Zap,
    Lock,
    CheckCircle2,
    Loader2,
    CalendarCheck,
    Ticket,
    ExternalLink,
    Users,
    Calendar,
} from "lucide-react"
import { useMutation } from "@tanstack/react-query"
import { toast } from "sonner"

import { useAuthStore } from "@/store/useAuthStore"
import { useCartStore } from "@/store/useCartStore"
import { api } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import type { Product, ProductVariant } from "@/hooks/useStorefront"

// ─── Types ────────────────────────────────────────────────────────────────────

interface Pricing {
    unitFiat: number
    unitPoints: number
    mrpFiat: number
    totalFiat: number
    isTierApplied: boolean
}

interface ProductCTAProps {
    product: Product
    selectedVariant: ProductVariant | null
    quantity: number
    pricing: Pricing
    isOutOfStock: boolean
    guestCount?: number
    setGuestCount?: (count: number) => void
}

// function useClaimVoucher(slug: string) {
//     return useMutation({
//         mutationFn: async (productSlug: string) => {
//             const { data } = await api.post(`/${slug}/experiences/${productSlug}/enquire`)
//             return data
//         },
//     })
// }

function useClaimDigital(slug: string) {
    return useMutation({
        mutationFn: async (productSlug: string) => {
            const { data } = await api.post(`/${slug}/vouchers/${productSlug}/claim`)
            return data as {
                message: string
                coupon_code: string | null
                redemption_link: string | null
                valid_until: string | null
                claimed_at: string
            }
        },
    })
}

function useSubmitEnquiry(slug: string) {
    return useMutation({
        mutationFn: async (payload: {
            productSlug: string
            guest_count?: number
            preferred_date?: string
            message?: string
        }) => {
            const { productSlug, ...body } = payload
            const { data } = await api.post(`/${slug}/experiences/${productSlug}/enquire`, body)
            return data
        },
    })
}

function LoginPrompt({ slug }: { slug: string }) {
    return (
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 flex flex-col items-center gap-4 text-center">
            <div className="h-12 w-12 rounded-full bg-white border border-slate-200 flex items-center justify-center shadow-sm">
                <Lock className="h-5 w-5 text-slate-400" />
            </div>
            <div>
                <p className="text-sm font-semibold text-slate-800">Login required to redeem</p>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    This reward is exclusively available to registered members of this programme.
                </p>
            </div>
            <Link to={`/${slug}/login`} className="w-full">
                <Button className="w-full h-12 rounded-xl bg-slate-950 text-sm font-semibold text-white hover:bg-slate-800 transition-all">
                    Login to Redeem
                </Button>
            </Link>
        </div>
    )
}

function PhysicalCTA({
    product,
    selectedVariant,
    quantity,
    pricing,
    isOutOfStock,
}: ProductCTAProps) {
    const { slug } = useParams<{ slug: string }>()
    const navigate = useNavigate()
    const addItem = useCartStore((s) => s.addItem)

    return (
        <div className="flex flex-col gap-3">
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
        </div>
    )
}

function DigitalCTA({ product }: Pick<ProductCTAProps, "product">) {
    const { slug } = useParams<{ slug: string }>()
    const { mutate: claimVoucher, isPending, isSuccess, data } = useClaimDigital(slug!)

    if (isSuccess && data) {
        return (
            <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-6 space-y-3">
                <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                    <p className="text-sm font-semibold text-emerald-800">Voucher Claimed Successfully</p>
                </div>
                {data.coupon_code && (
                    <div className="rounded-xl bg-white border border-emerald-200 px-4 py-3 flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Your Code</span>
                        <span className="font-mono font-bold text-slate-900 text-sm tracking-widest">
                            {data.coupon_code}
                        </span>
                    </div>
                )}
                {data.redemption_link && (
                    <a href={data.redemption_link} target="_blank" rel="noreferrer">
                        <Button className="w-full h-11 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm gap-2">
                            Redeem Now <ExternalLink className="h-3.5 w-3.5" />
                        </Button>
                    </a>
                )}
                {data.valid_until && (
                    <p className="text-[11px] text-slate-400 text-center">Valid until: {data.valid_until}</p>
                )}
            </div>
        )
    }

    return (
        <Button
            size="lg"
            disabled={isPending}
            className="h-14 w-full rounded-xl bg-violet-600 font-bold text-white text-[15px] hover:bg-violet-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-60"
            onClick={() => {
                claimVoucher(product.slug, {
                    onError: (err: any) => {
                        toast.error(err?.response?.data?.message ?? "Could not claim voucher.")
                    },
                })
            }}
        >
            {isPending ? (
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            ) : (
                <Ticket className="mr-2 h-5 w-5" />
            )}
            Claim Voucher
        </Button>
    )
}

function ExperienceCTA({
    product,
    guestCount = 1,
    setGuestCount,
}: Pick<ProductCTAProps, "product"> & { guestCount: number; setGuestCount: (count: number) => void }) {
    const { slug } = useParams<{ slug: string }>()
    const { mutate: submitEnquiry, isPending, isSuccess } = useSubmitEnquiry(slug!)
    const [preferredDate, setPreferredDate] = useState("")
    const [message, setMessage] = useState("")

    if (isSuccess) {
        return (
            <div className="rounded-2xl border border-amber-100 bg-amber-50 p-6 flex flex-col items-center gap-3 text-center">
                <CheckCircle2 className="h-8 w-8 text-amber-500" />
                <p className="text-sm font-semibold text-amber-900">Enquiry Submitted!</p>
                <p className="text-xs text-amber-700 leading-relaxed">
                    Our team will reach out within 24 hours to confirm your booking.
                </p>
            </div>
        )
    }

    return (
        <div className="rounded-2xl border border-amber-200 bg-linear-to-br from-amber-50/80 to-orange-50/50 p-6 shadow-sm space-y-5">
            <div className="flex items-center gap-2">
                <CalendarCheck className="h-5 w-5 text-amber-600" />
                <h3 className="text-lg font-bold text-amber-900">Request this experience</h3>
            </div>

            <div className="space-y-4">
                <div className="space-y-1">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                        <Users className="h-3 w-3" /> Number of guests
                    </label>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-9 w-9 rounded-xl border-amber-200"
                            onClick={() => setGuestCount(Math.max(1, guestCount - 1))}
                        >
                            -
                        </Button>
                        <span className="w-12 text-center font-bold text-amber-900">{guestCount}</span>
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-9 w-9 rounded-xl border-amber-200"
                            onClick={() => setGuestCount(guestCount + 1)}
                        >
                            +
                        </Button>
                    </div>
                </div>

                <div className="space-y-1">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                        <Calendar className="h-3 w-3" /> Preferred date
                    </label>
                    <Input
                        type="date"
                        value={preferredDate}
                        min={new Date().toISOString().split("T")[0]}
                        onChange={(e) => setPreferredDate(e.target.value)}
                        className="h-10 rounded-xl border-amber-200 bg-white focus:border-amber-400"
                    />
                </div>

                <div className="space-y-1">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Message (optional)</label>
                    <Textarea
                        placeholder="Special requests, dietary needs, etc."
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        rows={3}
                        className="rounded-xl border-amber-200 bg-white focus:border-amber-400 resize-none"
                    />
                </div>
            </div>

            <Button
                size="lg"
                disabled={isPending}
                className="h-12 w-full rounded-xl bg-amber-600 font-bold text-white hover:bg-amber-700 transition-all shadow-md gap-2"
                onClick={() => {
                    submitEnquiry(
                        {
                            productSlug: product.slug,
                            guest_count: guestCount,
                            preferred_date: preferredDate || undefined,
                            message: message || undefined,
                        },
                        {
                            onError: (err: any) => {
                                toast.error(err?.response?.data?.message ?? "Could not submit enquiry.")
                            },
                        }
                    )
                }}
            >
                {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CalendarCheck className="h-4 w-4" />}
                {isPending ? "Submitting..." : "Send Enquiry"}
            </Button>
        </div>
    )
}

export default function ProductCTA(props: ProductCTAProps) {
    const { slug } = useParams<{ slug: string }>()
    const { user } = useAuthStore()

    if (!user) {
        return <LoginPrompt slug={slug!} />
    }

    switch (props.product.type) {
        case "digital":
            return <DigitalCTA product={props.product} />
        case "experience":
            return (
                <ExperienceCTA
                    product={props.product}
                    guestCount={props.guestCount || 1}
                    setGuestCount={props.setGuestCount || (() => { })}
                />
            )
        case "physical":
        default:
            return <PhysicalCTA {...props} />
    }
}