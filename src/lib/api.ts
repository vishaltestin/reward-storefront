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

api.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (isAxiosError(error)) {
      if (error.response?.status === 401 || error.response?.status === 403) {
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
