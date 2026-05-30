import { Navigate, Outlet, useLocation, useParams } from "react-router-dom"
import { useAuthStore } from "@/store/useAuthStore"

export default function ProtectedRoute() {
  const { isAuthenticated } = useAuthStore()
  const { slug } = useParams<{ slug: string }>()
  const location = useLocation()

  if (!isAuthenticated) {
    const returnUrl = encodeURIComponent(location.pathname + location.search)
    return <Navigate to={`/${slug}/login?redirect=${returnUrl}`} replace />
  }

  return <Outlet />
}
