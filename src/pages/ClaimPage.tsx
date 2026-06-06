import { useEffect } from "react"
import { useParams, useSearchParams } from "react-router-dom"
import { Loader2, ShieldX } from "lucide-react"

import { useValidateClaimTokenQuery } from "@/hooks/useClaimQueries"
import { useClaimStore } from "@/store/useClaimStore"
import { StorefrontBlockRenderer } from "@/components/blocks/StorefrontBlockRenderer"
import { ClaimCheckoutModal } from "@/components/blocks/ClaimCheckoutModal"
import type { PageBlock } from "@/types/claim"

export default function ClaimPage() {
  const { slug } = useParams<{ slug: string }>()
  const [searchParams] = useSearchParams()
  const token = searchParams.get("token")

  const { setClaimContext, isCheckoutModalOpen } = useClaimStore()
  const { data, isLoading, error } = useValidateClaimTokenQuery(slug!, token)

  useEffect(() => {
    if (data && token) {
      setClaimContext(
        token,
        data.reward_value,
        data.recipient,
        data.campaign_config?.catalog_selection || []
      )
    }
  }, [data, token, setClaimContext])

  if (!token)
    return (
      <div className="p-12 text-center text-slate-500">No token provided.</div>
    )
  if (isLoading)
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="animate-spin text-blue-600" />
      </div>
    )
  if (error)
    return (
      <div className="p-12 text-center text-red-500">
        <ShieldX className="mx-auto h-12 w-12" /> Link Invalid or Expired.
        {error.message}
      </div>
    )
  if (!data) return null

  const theme = data.template_theme || {
    primaryColor: "#2563eb",
    textColor: "#111827",
    fontFamily: "Inter",
  }

  return (
    <div
      className="min-h-screen bg-white"
      style={
        {
          "--theme-primary": theme.primaryColor,
          "--theme-text": theme.textColor,
          fontFamily: theme.fontFamily,
        } as React.CSSProperties
      }
    >
      {data.template_schema.map((block: PageBlock) => (
        <StorefrontBlockRenderer key={block.id} block={block} />
      ))}

      {isCheckoutModalOpen && <ClaimCheckoutModal />}
    </div>
  )
}
