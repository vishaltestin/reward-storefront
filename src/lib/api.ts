import axios, { isAxiosError } from "axios"
import { useAuthStore } from "@/store/useAuthStore"

export const api = axios.create({
  baseURL:
    import.meta.env.VITE_API_URL || "http://localhost:8000/api/storefront",
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
})

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  const match = window.location.pathname.match(/\/marketplace\/([^/]+)/)
  const slug = match ? match[1] : null

  if (slug && config.url && !config.url.startsWith(`/${slug}`)) {
    config.url = `/${slug}${config.url}`
  }

  return config
})

// Endpoints where 401/403 are expected BUSINESS responses, not session
// expiry. The login endpoint answers 401 for wrong credentials and 403 for
// suspended / tenant-mismatch accounts — those errors must render inline on
// the login form. Without this guard the interceptor below "handled" them by
// hard-navigating to the login page, so the page appeared to simply refresh
// and the actual error message never showed.
const INLINE_AUTH_ENDPOINTS = ["/auth/login"]

api.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (isAxiosError(error)) {
      const status = error.response?.status
      const requestUrl = error.config?.url ?? ""

      const isInlineAuthEndpoint = INLINE_AUTH_ENDPOINTS.some((path) =>
        requestUrl.includes(path)
      )

      // Session expiry / invalid token on any other endpoint: drop the
      // stale session and return to the login page (unchanged behavior).
      if ((status === 401 || status === 403) && !isInlineAuthEndpoint) {
        useAuthStore.getState().logout()
        const match = window.location.pathname.match(/\/marketplace\/([^/]+)/)
        const slug = match ? match[1] : ""
        if (slug) {
          window.location.href = `${import.meta.env.BASE_URL}${slug}/login`
        }
      }
    }
    return Promise.reject(error)
  }
)

export const getErrorMessage = (error: unknown): string => {
  if (isAxiosError(error)) {
    return error.response?.data?.message || error.message
  }
  if (error instanceof Error) {
    return error.message
  }
  return "An unexpected error occurred. Please try again."
}
