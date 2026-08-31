/**
 * Per-tenant localStorage key helper.
 *
 * The storefront serves many companies under /marketplace/{slug}. All persisted
 * zustand stores used GLOBAL keys ("storefront-auth", "storefront-cart", …), so
 * visiting company B after company A showed company A's cart, token and
 * wishlist. Namespacing every persistence key by the slug in the URL fixes the
 * cross-tenant leak — and because tenants are separate deployments/origins in
 * production, the key is resolved once at module load (tenant switches are
 * always full page loads, never in-SPA navigation).
 */
export function tenantStorageKey(base: string): string {
  if (typeof window === "undefined") return `${base}:global`

  const match = window.location.pathname.match(/\/marketplace\/([^/]+)/)
  return `${base}:${match?.[1] ?? "global"}`
}
