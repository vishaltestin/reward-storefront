import { sanitizeUrl } from "@/lib/sanitize"
import { type CallToActionBlock } from "@/types/builder"

interface Props {
  block: CallToActionBlock
}

export function CallToAction({ block }: Props) {
  const { content, styles, variant } = block

  const bgColor = styles.backgroundColor || "var(--theme-primary)"
  const headingColor = styles.headingColor || "#ffffff"
  const buttonBg = styles.buttonBgColor || "#ffffff"
  const buttonText = styles.buttonTextColor || "var(--theme-primary)"

  if (variant === "card") {
    return (
      <div className="px-6 py-16 sm:py-24">
        <div
          className="mx-auto max-w-4xl rounded-3xl p-8 text-center shadow-xl sm:p-16"
          style={{ backgroundColor: bgColor }}
        >
          <h2
            className="mb-8 text-3xl font-bold tracking-tight sm:text-4xl"
            style={{ color: headingColor }}
          >
            {content.heading}
          </h2>
          {content.buttonText && (
            <a
              href={sanitizeUrl(content.buttonLink)}
              className="inline-flex h-12 items-center justify-center rounded-md px-8 font-semibold shadow-sm transition-opacity hover:opacity-90"
              style={{ backgroundColor: buttonBg, color: buttonText }}
            >
              {content.buttonText}
            </a>
          )}
        </div>
      </div>
    )
  }

  return (
    <div
      className="px-6 py-16 text-center sm:py-24"
      style={{ backgroundColor: bgColor }}
    >
      <div className="mx-auto max-w-4xl">
        <h2
          className="mb-8 text-3xl font-extrabold tracking-tight sm:text-5xl"
          style={{ color: headingColor }}
        >
          {content.heading}
        </h2>
        {content.buttonText && (
          <a
            href={sanitizeUrl(content.buttonLink)}
            className="inline-flex h-14 items-center justify-center rounded-md px-10 text-lg font-bold shadow-sm transition-opacity hover:opacity-90"
            style={{ backgroundColor: buttonBg, color: buttonText }}
          >
            {content.buttonText}
          </a>
        )}
      </div>
    </div>
  )
}
