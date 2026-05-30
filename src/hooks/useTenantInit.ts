import { useEffect } from "react"
import { useQuery } from "@tanstack/react-query"
import { api } from "@/lib/api"
import { useTenantStore } from "@/store/useTenantStore"

export function useTenantInit(slug: string | undefined) {
  const setTenantData = useTenantStore((state) => state.setTenantData)

  const query = useQuery({
    queryKey: ["tenant-init", slug],
    queryFn: async () => {
      if (!slug) throw new Error("Storefront slug is missing")

      const [configRes, categoriesRes] = await Promise.all([
        api.get(`/${slug}/init`),
        api.get(`/${slug}/categories`),
      ])

      return {
        config: configRes.data.data,
        categories: categoriesRes.data.data,
      }
    },
    enabled: !!slug,
    staleTime: 1000 * 60 * 30,
  })

  useEffect(() => {
    if (query.data && slug) {
      setTenantData(slug, query.data.config, query.data.categories)
      if (query.data.config.primary_color) {
        document.documentElement.style.setProperty(
          "--tenant-primary",
          query.data.config.primary_color
        )
      }
    }
  }, [query.data, slug, setTenantData])

  return query
}
