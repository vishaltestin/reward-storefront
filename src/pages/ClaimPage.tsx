import { useEffect } from "react"
import { Link, useParams, useSearchParams } from "react-router-dom"
import {
  Loader2,
  ShieldX,
  PartyPopper,
  Clock,
  PackageSearch,
} from "lucide-react"

import { useValidateClaimTokenQuery } from "@/hooks/useClaimQueries"
import { useClaimStore } from "@/store/useClaimStore"
import { StorefrontBlockRenderer } from "@/components/blocks/StorefrontBlockRenderer"
import { ClaimCheckoutModal } from "@/components/blocks/ClaimCheckoutModal"
import type { PageBlock } from "@/types/claim"

/**
 * Landing/claim templates request fonts by bare family name ("Inter",
 * "Plus Jakarta Sans") in their global theme tokens, but the app self-hosts
 * variable fonts under the names "Inter Variable" / "Plus Jakarta Sans
 * Variable" (@fontsource-variable). Requesting the bare name matched no
 * @font-face, so the browser silently fell back to system fonts and the
 * claim/landing pages rendered in a different typeface than the rest of
 * the site. Map template requests onto the families that are loaded.
 */
const resolveFontFamily = (requested?: string | null): string => {
  const name = (requested ?? "").toLowerCase()
  if (name.includes("jakarta"))
    return "'Plus Jakarta Sans Variable', sans-serif"
  if (name.includes("inter")) return "'Inter Variable', sans-serif"
  if (name.includes("georgia") || name.includes("serif"))
    return "Georgia, serif"
  return requested || "'Inter Variable', sans-serif"
}

/**
 * Client-side safety net mirroring ClaimController::defaultClaimSchema().
 * Used when the API response carries no renderable RewardSelector block
 * (legacy-dialect template, template deleted, older backend) so the claim
 * page can NEVER render as a blank white screen — without a selector the
 * user would have no way to pick a product and claim their reward.
 */
const DEFAULT_CLAIM_BLOCKS: PageBlock[] = [
  {
    id: "default_hero",
    isVisible: true,
    type: "HeroBanner",
    variant: "centered",
    content: {
      heading: "You have a reward waiting!",
      subtext:
        "Pick any product from your company's reward catalog below. The value of this reward is applied automatically at checkout.",
      buttonText: "Choose your reward",
      buttonLink: "#rewards",
    },
    styles: {
      backgroundImage: "",
      overlayOpacity: 0.35,
      backgroundColor: "#0f172a",
      headingColor: "#ffffff",
      subtextColor: "#cbd5e1",
      buttonBgColor: "#ffffff",
      buttonTextColor: "#0f172a",
    },
  },
  {
    id: "default_selector",
    isVisible: true,
    type: "RewardSelector",
    variant: "grid",
    content: {
      heading: "Choose Your Reward",
      subtext: "Tap a product to claim it with this reward.",
    },
    styles: {
      backgroundColor: "#ffffff",
      headingColor: "#0f172a",
      cardBackgroundColor: "#f8fafc",
    },
  },
  {
    id: "default_cta",
    isVisible: true,
    type: "CallToAction",
    variant: "standard",
    content: {
      heading: "Questions about your reward?",
      buttonText: "Contact your HR team",
      buttonLink: "#",
    },
    styles: {
      backgroundColor: "#f1f5f9",
      headingColor: "#0f172a",
      buttonBgColor: "#0f172a",
      buttonTextColor: "#ffffff",
    },
  },
]

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

  // The API distinguishes why a link can't be claimed via error_code
  // (already_claimed / expired / campaign_inactive / reward_owner_mismatch /
  // invalid_token) — show a matching card instead of one generic error.
  if (error) {
    const errorData = (
      error as { response?: { data?: Record<string, unknown> } }
    )?.response?.data
    const errorCode =
      (errorData?.error_code as string | undefined) ?? "invalid_token"

    if (errorCode === "already_claimed") {
      return (
        <div className="flex min-h-[70vh] items-center justify-center px-4 py-16">
          <div className="w-full max-w-md rounded-3xl border border-emerald-100 bg-white p-8 text-center shadow-xl shadow-emerald-100/40">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50">
              <PartyPopper className="h-7 w-7 text-emerald-500" />
            </div>
            <h1 className="font-heading text-2xl font-semibold tracking-tight text-slate-900">
              You've already claimed this reward
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-slate-500">
              This reward link has been used. Your order is safe — you can
              review it any time under Profile → Orders.
            </p>
            <Link
              to={`/${slug}/profile`}
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              <PackageSearch className="h-4 w-4" /> View Your Order
            </Link>
          </div>
        </div>
      )
    }

    if (errorCode === "expired") {
      return (
        <div className="flex min-h-[70vh] items-center justify-center px-4 py-16">
          <div className="w-full max-w-md rounded-3xl border border-amber-100 bg-white p-8 text-center shadow-xl shadow-amber-100/40">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-50">
              <Clock className="h-7 w-7 text-amber-500" />
            </div>
            <h1 className="font-heading text-2xl font-semibold tracking-tight text-slate-900">
              This reward link has expired
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-slate-500">
              Reward links are only valid for a limited time. Please reach out
              to your HR or rewards team — they can re-issue the reward for you.
            </p>
          </div>
        </div>
      )
    }

    return (
      <div className="flex min-h-[70vh] items-center justify-center px-4 py-16">
        <div className="w-full max-w-md rounded-3xl border border-rose-100 bg-white p-8 text-center shadow-xl shadow-rose-100/40">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-50">
            <ShieldX className="h-7 w-7 text-rose-500" />
          </div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight text-slate-900">
            Link Invalid or Expired
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-slate-500">
            {errorCode === "reward_owner_mismatch"
              ? "This reward was issued to a different employee. Please log in with the email that received it."
              : errorCode === "campaign_inactive"
                ? "This rewards campaign is no longer active."
                : "This reward link doesn't look right. Please double-check the link from your email, or contact your HR team."}
          </p>
        </div>
      </div>
    )
  }
  if (!data) return null

  // Only blocks the renderer understands, and only when visible. If nothing
  // renderable remains (empty schema or a foreign block dialect), fall back
  // to the default claim blocks rather than rendering a white page.
  const blocks: PageBlock[] = (data.template_schema ?? []).filter(
    (block: PageBlock) => block?.isVisible
  )
  const hasSelector = blocks.some((block) => block.type === "RewardSelector")
  const renderBlocks =
    blocks.length > 0 && hasSelector ? blocks : DEFAULT_CLAIM_BLOCKS

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
          fontFamily: resolveFontFamily(theme.fontFamily),
        } as React.CSSProperties
      }
    >
      {/* Always-present reward summary — independent of the chosen template,
          so the employee always sees WHAT they got and WHO it's for before
          the (template-provided) product picker below. */}
      <div
        className="flex flex-wrap items-center justify-center gap-x-5 gap-y-1 px-6 py-3 text-center"
        style={{ backgroundColor: theme.primaryColor, color: "#ffffff" }}
      >
        <span className="text-[10px] font-semibold tracking-widest uppercase opacity-80">
          Reward value
        </span>
        <span className="text-base font-bold">
          ₹{Number(data.reward_value ?? 0).toLocaleString("en-IN")}
        </span>
        {data.recipient && (
          <span className="text-xs opacity-80">
            for {data.recipient.first_name} {data.recipient.last_name}
          </span>
        )}
        <span className="text-[10px] tracking-widest uppercase opacity-60">
          · One product per link
        </span>
      </div>

      {renderBlocks.map((block: PageBlock) => (
        <StorefrontBlockRenderer key={block.id} block={block} />
      ))}

      {isCheckoutModalOpen && <ClaimCheckoutModal />}
    </div>
  )
}
