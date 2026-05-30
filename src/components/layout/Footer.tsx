import { Link, useParams } from "react-router-dom"
import { useTenantStore } from "@/store/useTenantStore"

export default function Footer() {
  const { slug } = useParams<{ slug: string }>()
  const { config, categories } = useTenantStore()

  return (
    <footer className="mt-auto border-t bg-white">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          <div className="space-y-4">
            {config?.logo_url ? (
              <img
                src={config.logo_url}
                alt={config.name}
                className="h-8 object-contain opacity-80 grayscale transition-all duration-300 hover:opacity-100 hover:grayscale-0"
              />
            ) : (
              <span className="text-xl font-bold">{config?.name}</span>
            )}
            <p className="text-sm leading-relaxed text-gray-500">
              The premium corporate rewards marketplace for {config?.name}{" "}
              employees and partners.
            </p>
          </div>

          <div>
            <h3 className="mb-4 text-sm font-bold tracking-wider text-gray-900 uppercase">
              Shop Categories
            </h3>
            <ul className="space-y-2 text-sm text-gray-500">
              {categories.slice(0, 6).map((cat) => (
                <li key={cat.id}>
                  <Link
                    to={`/${slug}/category/${cat.slug}`}
                    className="transition-colors hover:text-primary hover:underline"
                  >
                    {cat.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="mb-4 text-sm font-bold tracking-wider text-gray-900 uppercase">
              Support
            </h3>
            <ul className="space-y-2 text-sm text-gray-500">
              <li>
                <Link
                  to={`/${slug}/orders`}
                  className="transition-colors hover:text-primary"
                >
                  Track Order
                </Link>
              </li>
              <li>
                <Link
                  to={`/${slug}/faq`}
                  className="transition-colors hover:text-primary"
                >
                  FAQ
                </Link>
              </li>
              <li>
                <Link
                  to={`/${slug}/contact`}
                  className="transition-colors hover:text-primary"
                >
                  Contact Us
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="mb-4 text-sm font-bold tracking-wider text-gray-900 uppercase">
              Legal
            </h3>
            <ul className="space-y-2 text-sm text-gray-500">
              <li>
                <Link
                  to={`/${slug}/terms`}
                  className="transition-colors hover:text-primary"
                >
                  Terms & Conditions
                </Link>
              </li>
              <li>
                <Link
                  to={`/${slug}/privacy`}
                  className="transition-colors hover:text-primary"
                >
                  Privacy Policy
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between border-t border-gray-100 pt-8 text-sm text-gray-400 md:flex-row">
          <p>
            © {new Date().getFullYear()} {config?.name}. All rights reserved.
          </p>
          <p className="mt-4 md:mt-0">Powered by RewardsApp</p>
        </div>
      </div>
    </footer>
  )
}
