import {
  useNavigate,
  useParams,
  useLocation,
  useSearchParams,
} from "react-router-dom"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { AlertCircle, Loader2 } from "lucide-react"

import { useTenantStore } from "@/store/useTenantStore"
import {
  useLoginMutation,
  loginSchema,
  type LoginFormValues,
  getApiErrorMessage,
} from "@/hooks/useAuthMutations"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export default function LoginPage() {
  const { slug } = useParams<{ slug: string }>()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const location = useLocation()
  const { config } = useTenantStore()

  const from = location.state?.from || `/marketplace/${slug}`

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  })

  const {
    mutate: loginMutation,
    isPending,
    error: apiError,
  } = useLoginMutation(slug!)

  const onSubmit = (data: LoginFormValues) => {
    loginMutation(data, {
      onSuccess: () => {
        const redirectUrl = searchParams.get("redirect")

        if (redirectUrl) {
          navigate(decodeURIComponent(redirectUrl), { replace: true })
        } else {
          navigate(from, { replace: true })
        }
      },
    })
  }

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8 rounded-3xl border bg-white p-10 shadow-xl">
        <div className="text-center">
          {config?.logo_url ? (
            <img
              src={config.logo_url}
              alt="Logo"
              className="mx-auto h-12 object-contain"
            />
          ) : (
            <h2 className="text-3xl font-bold tracking-tight text-slate-900">
              {config?.name}
            </h2>
          )}
          <h2 className="mt-6 text-2xl font-bold tracking-tight text-slate-900">
            Sign in to your account
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            Access your rewards and track your orders.
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          {apiError && (
            <div className="flex items-center gap-2 rounded-lg bg-red-50 p-4 text-sm text-red-700">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <p>{getApiErrorMessage(apiError)}</p>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="mb-1 block text-sm font-medium text-slate-700"
              >
                Email address
              </label>
              <Input
                id="email"
                type="email"
                {...register("email")}
                className="w-full"
                placeholder="you@company.com"
                aria-invalid={!!errors.email}
              />
              {errors.email && (
                <p className="mt-1 text-xs text-red-500">
                  {errors.email.message}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-1 block text-sm font-medium text-slate-700"
              >
                Password
              </label>
              <Input
                id="password"
                type="password"
                {...register("password")}
                className="w-full"
                aria-invalid={!!errors.password}
              />
              {errors.password && (
                <p className="mt-1 text-xs text-red-500">
                  {errors.password.message}
                </p>
              )}
            </div>
          </div>

          <Button
            type="submit"
            disabled={isPending}
            className="w-full rounded-full bg-slate-900 py-6 text-lg font-semibold text-white hover:bg-slate-800"
          >
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Signing in...
              </>
            ) : (
              "Sign in"
            )}
          </Button>
        </form>
      </div>
    </div>
  )
}
