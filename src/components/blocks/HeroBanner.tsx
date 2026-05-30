import { sanitizeUrl } from "@/lib/sanitize"
import { type HeroBannerBlock } from "@/types/builder"

interface Props {
  block: HeroBannerBlock
}

export function HeroBanner({ block }: Props) {
  const { content, styles, variant } = block

  const bgColor = styles.backgroundColor || "transparent"
  const headingColor = styles.headingColor || "var(--theme-text)"
  const subtextColor = styles.subtextColor || "var(--theme-text)"
  const buttonBg = styles.buttonBgColor || "var(--theme-primary)"
  const buttonText = styles.buttonTextColor || "#ffffff"

  if (variant === "split") {
    return (
      <div
        className="relative flex min-h-100 flex-col items-center overflow-hidden md:flex-row"
        style={{ backgroundColor: bgColor }}
      >
        <div className="z-10 flex-1 p-12">
          <h1
            className="mb-4 text-4xl font-bold tracking-tight"
            style={{ color: headingColor }}
          >
            {content.heading}
          </h1>
          <p
            className="mb-8 text-lg whitespace-pre-wrap opacity-90"
            style={{ color: subtextColor }}
          >
            {content.subtext}
          </p>
          {content.buttonText && (
            <a
              href={sanitizeUrl(content.buttonLink)}
              className="inline-flex h-12 items-center justify-center rounded-md px-8 font-medium shadow transition-opacity hover:opacity-90"
              style={{ backgroundColor: buttonBg, color: buttonText }}
            >
              {content.buttonText}
            </a>
          )}
        </div>
        <div
          className="h-full min-h-100 flex-1 bg-cover bg-center"
          style={{
            backgroundImage: styles.backgroundImage
              ? `url(${styles.backgroundImage})`
              : "none",
          }}
        />
      </div>
    )
  }

  return (
    <div
      className="relative flex min-h-100 flex-col items-center justify-center overflow-hidden px-6 py-24 text-center"
      style={{
        backgroundColor: bgColor,
        backgroundImage: styles.backgroundImage
          ? `url(${styles.backgroundImage})`
          : "none",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      {styles.overlayOpacity > 0 && (
        <div
          className="absolute inset-0 bg-black"
          style={{ opacity: styles.overlayOpacity / 100 }}
        />
      )}

      <div className="relative z-10 max-w-3xl">
        <h1
          className="mb-6 text-4xl font-extrabold tracking-tight sm:text-5xl"
          style={{ color: headingColor }}
        >
          {content.heading}
        </h1>
        <p
          className="mb-8 text-lg whitespace-pre-wrap opacity-90"
          style={{ color: subtextColor }}
        >
          {content.subtext}
        </p>
        {content.buttonText && (
          <a
            href={sanitizeUrl(content.buttonLink)}
            className="inline-flex h-12 items-center justify-center rounded-md px-8 font-medium shadow transition-opacity hover:opacity-90"
            style={{ backgroundColor: buttonBg, color: buttonText }}
          >
            {content.buttonText}
          </a>
        )}
      </div>
    </div>
  )
}
