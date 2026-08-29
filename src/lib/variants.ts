/**
 * Variant attribute helpers — mirrors the backend
 * (App\Helpers\VariantAttributeHelper) so legacy data with inconsistent
 * attribute keys ("size", "Size", " SIZE ") collapses into a single
 * option group instead of rendering duplicate rows.
 */

/**
 * Normalize an attribute key: trim, collapse whitespace, canonical Title Case.
 * "size" / "Size" / "SIZE" -> "Size", "neck size" -> "Neck Size".
 * Returns null for empty keys.
 */
export function normalizeAttributeKey(
  key: string | number | null | undefined
): string | null {
  if (key === null || key === undefined) return null

  const trimmed = String(key).replace(/\s+/g, " ").trim()
  if (!trimmed) return null

  return trimmed
    .toLowerCase()
    .split(" ")
    .map((word) => (word ? word.charAt(0).toUpperCase() + word.slice(1) : word))
    .join(" ")
}

/** Whether an attribute key represents a color ("Color", "colour", "Frame Color"...). */
export function isColorKey(key: string | number | null | undefined): boolean {
  const normalized = normalizeAttributeKey(key)
  if (!normalized) return false

  return (
    normalized === "Color" ||
    normalized === "Colour" ||
    normalized.endsWith(" Color") ||
    normalized.endsWith(" Colour")
  )
}

/**
 * Normalize a full attributes map:
 * - keys trimmed + Title Cased (case-insensitive duplicates merge, last wins)
 * - values trimmed, empty entries dropped
 */
export function normalizeVariantAttributes(
  attributes: Record<string, string> | null | undefined
): Record<string, string> {
  if (!attributes || typeof attributes !== "object") return {}

  const normalized: Record<string, string> = {}

  Object.entries(attributes).forEach(([key, value]) => {
    const normalizedKey = normalizeAttributeKey(key)
    if (!normalizedKey) return
    if (typeof value !== "string") return

    const trimmed = value.trim()
    if (!trimmed) return

    normalized[normalizedKey] = trimmed
  })

  return normalized
}

let colorProbe: CSSStyleDeclaration | null = null

/**
 * Whether a value can be used directly as a CSS color
 * (#hex, rgb()/rgba()/hsl()/hsla() or any named CSS color like "navy").
 * Values like "Navy Blue" are not valid CSS colors and need a fallback swatch.
 */
export function isCssColor(value: string): boolean {
  const v = value.trim()
  if (!v) return false

  if (/^#([0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(v)) return true
  if (/^(rgb|rgba|hsl|hsla)\(/i.test(v)) return true

  if (typeof document === "undefined") return false

  if (!colorProbe) colorProbe = document.createElement("span").style
  colorProbe.color = ""
  colorProbe.color = v
  return colorProbe.color !== ""
}
