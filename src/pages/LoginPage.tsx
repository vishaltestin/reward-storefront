import {
  Link,
  useNavigate,
  useParams,
  useLocation,
  useSearchParams,
} from "react-router-dom"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { AlertCircle, Loader2, Lock, ArrowRight, Sparkles } from "lucide-react"

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

  const from = location.state?.from || `/${slug}`

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
    <div className="relative flex min-h-[85vh] items-center justify-center overflow-hidden bg-slate-50/50 px-4 py-12 font-sans sm:px-6 lg:px-8">
      {/* Subtle Corporate Grid Background */}
      <div className="absolute inset-0 z-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:24px_24px]" />

      <div className="relative z-10 w-full max-w-[420px]">
        <div className="rounded-[2rem] border border-slate-100 bg-white p-8 shadow-xl shadow-slate-200/20 sm:p-10">
          <div className="mb-8 flex flex-col items-center text-center">
            <span className="mb-6 inline-flex items-center gap-1.5 rounded-full border border-slate-100 bg-slate-50 px-3 py-1 text-[9px] font-semibold tracking-widest text-slate-500 uppercase">
              <Lock className="h-3 w-3 text-slate-400" /> Restricted Access
            </span>

            {config?.logo_url ? (
              <img
                src={config.logo_url}
                alt={config?.name || "Logo"}
                className="mx-auto mb-5 h-10 object-contain"
              />
            ) : (
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-slate-950 shadow-inner">
                <Sparkles className="h-6 w-6 text-slate-300" />
              </div>
            )}

            <h2 className="font-heading text-2xl font-semibold tracking-tight text-slate-900">
              {config?.name
                ? `Sign in to ${config.name}`
                : "Portal Authentication"}
            </h2>
            <p className="mt-2.5 max-w-[280px] text-xs leading-relaxed text-slate-500">
              Enter your corporate credentials to access your curated allocation
              catalog and assets.
            </p>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
            {apiError && (
              <div className="flex animate-in items-start gap-2.5 rounded-xl border border-rose-100 bg-rose-50 p-3.5 text-xs text-rose-700 fade-in slide-in-from-top-2">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-500" />
                <p className="font-medium">{getApiErrorMessage(apiError)}</p>
              </div>
            )}

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label
                  htmlFor="email"
                  className="ml-1 text-[10px] font-semibold tracking-wider text-slate-500 uppercase"
                >
                  Corporate Email
                </label>
                <Input
                  id="email"
                  type="email"
                  {...register("email")}
                  className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 text-sm shadow-none transition-colors focus:border-slate-300 focus:bg-white"
                  placeholder="name@organization.com"
                  aria-invalid={!!errors.email}
                />
                {errors.email && (
                  <p className="mt-1 ml-1 text-[11px] font-medium text-rose-500">
                    {errors.email.message}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <div className="ml-1 flex items-center justify-between">
                  <label
                    htmlFor="password"
                    className="text-[10px] font-semibold tracking-wider text-slate-500 uppercase"
                  >
                    Security Key
                  </label>
                  <Link
                    to={`/${slug}/forgot-password`}
                    className="text-[10px] font-semibold text-indigo-500 transition-colors hover:text-indigo-600"
                  >
                    Forgot password?
                  </Link>
                </div>
                <Input
                  id="password"
                  type="password"
                  {...register("password")}
                  className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 text-sm tracking-widest shadow-none transition-colors placeholder:tracking-normal focus:border-slate-300 focus:bg-white"
                  placeholder="••••••••"
                  aria-invalid={!!errors.password}
                />
                {errors.password && (
                  <p className="mt-1 ml-1 text-[11px] font-medium text-rose-500">
                    {errors.password.message}
                  </p>
                )}
              </div>
            </div>

            <div className="pt-2">
              <Button
                type="submit"
                disabled={isPending}
                className="group flex h-12 w-full items-center justify-center gap-2 rounded-full bg-slate-950 text-sm font-semibold text-white shadow-md transition-all hover:scale-[1.02] hover:bg-slate-800"
              >
                {isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Authenticating...
                  </>
                ) : (
                  <>
                    Log In{" "}
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
