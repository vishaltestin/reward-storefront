import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Link, useParams, useSearchParams } from "react-router-dom"
import { CheckCircle2, KeyRound, Loader2, ShieldAlert } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  getApiErrorMessage,
  resetPasswordSchema,
  useResetPasswordMutation,
  type ResetPasswordFormValues,
} from "@/hooks/useAuthMutations"
import { useTenantStore } from "@/store/useTenantStore"

export default function ResetPasswordPage() {
  const { slug } = useParams<{ slug: string }>()
  const [searchParams] = useSearchParams()
  const { config } = useTenantStore()
  const [successMessage, setSuccessMessage] = useState("")

  const token = searchParams.get("token") ?? ""
  const email = searchParams.get("email") ?? ""
  const { mutate, isPending, error } = useResetPasswordMutation(slug!)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      email,
      password: "",
      password_confirmation: "",
    },
  })

  const onSubmit = (data: ResetPasswordFormValues) => {
    if (!token) return
    mutate(
      { ...data, token },
      { onSuccess: (response) => setSuccessMessage(response.message) }
    )
  }

  const branding = (
    <div className="bg-primary/5 p-8 text-center">
      <div className="mb-4 flex justify-center">
        {config?.logo_url ? (
          <img
            src={config.logo_url}
            alt={config.name}
            className="h-12 object-contain"
          />
        ) : (
          <h1 className="text-2xl font-bold tracking-tight text-primary">
            {config?.name || "Employee Portal"}
          </h1>
        )}
      </div>
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
        {successMessage ? (
          <CheckCircle2 className="h-6 w-6" />
        ) : (
          <KeyRound className="h-6 w-6" />
        )}
      </div>
      <h2 className="text-xl font-semibold text-foreground">
        {successMessage ? "Password updated" : "Choose a new password"}
      </h2>
      <p className="mt-2 text-sm text-muted-foreground">
        {successMessage
          ? "Your previous sessions have been signed out."
          : "Your new password must be at least 8 characters."}
      </p>
    </div>
  )

  if (!token) {
    return (
      <div className="flex min-h-[85vh] items-center justify-center px-4 py-12">
        <div className="w-full max-w-md overflow-hidden rounded-3xl border border-border bg-card p-8 text-center shadow-2xl">
          <ShieldAlert className="mx-auto mb-4 h-12 w-12 text-destructive" />
          <h2 className="text-xl font-semibold">Invalid reset link</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            This link is incomplete. Request a new password reset link to
            continue.
          </p>
          <Button asChild className="mt-6 w-full">
            <Link to={`/${slug}/forgot-password`}>Request a new link</Link>
          </Button>
          <Link
            to={`/${slug}/login`}
            className="mt-4 inline-block text-sm font-medium text-primary hover:underline"
          >
            Back to login
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-[85vh] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md overflow-hidden rounded-3xl border border-border bg-card shadow-2xl">
        {branding}

        <div className="p-8">
          {successMessage ? (
            <div className="text-center">
              <div className="mb-6 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-800 dark:border-green-900 dark:bg-green-950/30 dark:text-green-300">
                {successMessage}
              </div>
              <Button asChild className="h-11 w-full">
                <Link to={`/${slug}/login`}>Continue to login</Link>
              </Button>
            </div>
          ) : (
            <>
              {error && (
                <div className="mb-6 rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm font-medium text-destructive">
                  {getApiErrorMessage(error)}
                </div>
              )}

              <form
                onSubmit={handleSubmit(onSubmit)}
                className="space-y-5"
                noValidate
              >
                <div className="space-y-2">
                  <label className="text-sm font-medium" htmlFor="email">
                    Account Email
                  </label>
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    placeholder="name@company.com"
                    className="h-11"
                    {...register("email")}
                  />
                  {errors.email && (
                    <p className="text-xs text-destructive">
                      {errors.email.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium" htmlFor="password">
                    New Password
                  </label>
                  <Input
                    id="password"
                    type="password"
                    autoComplete="new-password"
                    placeholder="At least 8 characters"
                    className="h-11"
                    {...register("password")}
                  />
                  {errors.password && (
                    <p className="text-xs text-destructive">
                      {errors.password.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <label
                    className="text-sm font-medium"
                    htmlFor="password_confirmation"
                  >
                    Confirm New Password
                  </label>
                  <Input
                    id="password_confirmation"
                    type="password"
                    autoComplete="new-password"
                    placeholder="Repeat your new password"
                    className="h-11"
                    {...register("password_confirmation")}
                  />
                  {errors.password_confirmation && (
                    <p className="text-xs text-destructive">
                      {errors.password_confirmation.message}
                    </p>
                  )}
                </div>

                <Button
                  type="submit"
                  className="h-11 w-full"
                  disabled={isPending}
                >
                  {isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Updating password...
                    </>
                  ) : (
                    "Reset password"
                  )}
                </Button>
              </form>

              <div className="mt-6 flex flex-col items-center gap-2 text-sm">
                <Link
                  to={`/${slug}/forgot-password?email=${encodeURIComponent(email)}`}
                  className="font-medium text-primary hover:underline"
                >
                  Request a new reset link
                </Link>
                <Link
                  to={`/${slug}/login`}
                  className="text-muted-foreground hover:text-primary"
                >
                  Back to login
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
