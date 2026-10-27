import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Link, useParams, useSearchParams } from "react-router-dom"
import { ArrowLeft, CheckCircle2, Loader2, Mail, Send } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  forgotPasswordSchema,
  getApiErrorMessage,
  useForgotPasswordMutation,
  type ForgotPasswordFormValues,
} from "@/hooks/useAuthMutations"
import { useTenantStore } from "@/store/useTenantStore"

export default function ForgotPasswordPage() {
  const { slug } = useParams<{ slug: string }>()
  const [searchParams] = useSearchParams()
  const { config } = useTenantStore()
  const [successMessage, setSuccessMessage] = useState("")

  const { mutate, isPending, error } = useForgotPasswordMutation(slug!)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: searchParams.get("email") ?? "" },
  })

  const onSubmit = (data: ForgotPasswordFormValues) => {
    setSuccessMessage("")
    mutate(data, {
      onSuccess: (response) => setSuccessMessage(response.message),
    })
  }

  return (
    <div className="flex min-h-[85vh] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md overflow-hidden rounded-3xl border border-border bg-card shadow-2xl">
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
            <Mail className="h-6 w-6" />
          </div>
          <h2 className="text-xl font-semibold text-foreground">
            Forgot your password?
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Enter your account email and we&apos;ll send you a reset link.
          </p>
        </div>

        <div className="p-8">
          {successMessage && (
            <div className="mb-6 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-800 dark:border-green-900 dark:bg-green-950/30 dark:text-green-300">
              <div className="flex gap-3">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
                <div>
                  <p className="font-medium">{successMessage}</p>
                  <p className="mt-1">The link is valid for 60 minutes.</p>
                </div>
              </div>
            </div>
          )}

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

            <Button type="submit" className="h-11 w-full" disabled={isPending}>
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending reset link...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Send reset link
                </>
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <Link
              to={`/${slug}/login`}
              className="inline-flex items-center text-sm font-medium text-primary hover:underline"
            >
              <ArrowLeft className="mr-1.5 h-4 w-4" />
              Back to login
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
