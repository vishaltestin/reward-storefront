
export function sanitizeUrl(url: string | undefined | null): string {
  if (!url) return "#"

  const safeUrlPattern = /^(?:(?:https?|mailto|tel):|#|\/)/i

  if (safeUrlPattern.test(url)) {
    return url
  }

  return "#"
}
