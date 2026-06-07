import { createBrowserRouter } from "react-router-dom"

import StorefrontLayout from "@/components/layout/StorefrontLayout"
import ProtectedRoute from "@/components/auth/ProtectedRoute"

import HomePage from "@/pages/HomePage"
import LoginPage from "@/pages/LoginPage"
import ProductPage from "@/pages/ProductPage"
import CategoryPage from "@/pages/CategoryPage"

import CheckoutPage from "@/pages/CheckoutPage"
import ProfilePage from "@/pages/ProfilePage"
import ClaimPage from "@/pages/ClaimPage"
import TermsPage from "@/pages/TermsPage"
import PrivacyPage from "@/pages/PrivacyPage"
// import OrdersPage from "@/pages/OrdersPage"

export const router = createBrowserRouter(
  [
    {
      path: "/:slug",
      element: <StorefrontLayout />,
      errorElement: (
        <div className="flex h-screen flex-col items-center justify-center space-y-4 text-center">
          <h1 className="text-2xl font-bold text-red-600">
            Oops! Something went wrong.
          </h1>
          <p className="text-gray-500">
            We are having trouble loading this page. Please try refreshing.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="text-blue-600 hover:underline"
          >
            Refresh Page
          </button>
        </div>
      ),
      children: [
        { index: true, element: <HomePage /> },
        { path: "login", element: <LoginPage /> },
        { path: "product/:productSlug", element: <ProductPage /> },
        { path: "category/:categorySlug", element: <CategoryPage /> },
        { path: "terms", element: <TermsPage /> },
        { path: "privacy", element: <PrivacyPage /> },
        {
          element: <ProtectedRoute />,
          children: [
            { path: "checkout", element: <CheckoutPage /> },
            { path: "profile", element: <ProfilePage /> },
            { path: "claim", element: <ClaimPage /> },
            // { path: "orders", element: <OrdersPage /> },
          ],
        },
      ],
    },
    {
      path: "*",
      element: (
        <div className="flex h-screen flex-col items-center justify-center gap-2">
          <h1 className="text-3xl font-bold">404 - Storefront Not Found</h1>
          <p className="text-gray-500">Please check the URL and try again.</p>
        </div>
      ),
    },
  ],
  {
    basename: import.meta.env.BASE_URL,
  }
)
