import { useMutation, useQuery } from "@tanstack/react-query"
import { isAxiosError } from "axios"
import { z } from "zod"
import { toast } from "sonner"
import { api } from "@/lib/api"
import { useAuthStore, type User } from "@/store/useAuthStore"

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
})

export type LoginFormValues = z.infer<typeof loginSchema>

export const forgotPasswordSchema = z.object({
  email: z.string().min(1, "Email is required").email("Invalid email address"),
})

export const resetPasswordSchema = z
  .object({
    email: z
      .string()
      .min(1, "Email is required")
      .email("Invalid email address"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .max(255, "Password must not exceed 255 characters"),
    password_confirmation: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.password_confirmation, {
    message: "Passwords do not match",
    path: ["password_confirmation"],
  })

export type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>
export type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>
export type ResetPasswordRequest = ResetPasswordFormValues & { token: string }

interface AuthMessageResponse {
  message: string
}

interface LoginResponse {
  message: string
  token: string
  user: User
}

export const getApiErrorMessage = (error: unknown): string => {
  if (isAxiosError(error)) {
    return (
      error.response?.data?.message ||
      "An unexpected error occurred. Please try again."
    )
  }
  if (error instanceof Error) return error.message
  return "An unexpected error occurred."
}

export const useLoginMutation = (slug: string) => {
  const login = useAuthStore((state) => state.login)

  return useMutation({
    mutationFn: async (credentials: LoginFormValues) => {
      const { data } = await api.post<LoginResponse>(
        `/${slug}/auth/login`,
        credentials
      )
      return data
    },
    onSuccess: (data) => {
      login(data.token, data.user)
    },
  })
}
export const useMeQuery = (slug: string) => {
  const { setUser, isAuthenticated } = useAuthStore()

  return useQuery({
    queryKey: ["user-me", slug],
    queryFn: async () => {
      const { data } = await api.get<{ message: string; data: User }>(
        `/${slug}/user/me`
      )
      setUser(data.data)
      return data.data
    },
    enabled: !!slug && isAuthenticated,
    staleTime: 1000 * 60 * 5,
  })
}

export const useForgotPasswordMutation = (slug: string) => {
  return useMutation({
    mutationFn: async (data: ForgotPasswordFormValues) => {
      const response = await api.post<AuthMessageResponse>(
        `/${slug}/auth/forgot-password`,
        data
      )
      return response.data
    },
  })
}

export const useResetPasswordMutation = (slug: string) => {
  const logout = useAuthStore((state) => state.logout)

  return useMutation({
    mutationFn: async (data: ResetPasswordRequest) => {
      const response = await api.post<AuthMessageResponse>(
        `/${slug}/auth/reset-password`,
        data
      )
      return response.data
    },
    onSuccess: () => {
      // The backend also revokes every Sanctum token for this user.
      logout()
    },
  })
}

export const useLogoutMutation = (slug: string) => {
  const logout = useAuthStore((state) => state.logout)

  return useMutation({
    mutationFn: async () => {
      await api.post(`/${slug}/auth/logout`)
    },
    onSettled: () => {
      logout()
      toast.success("Session terminated securely.")
    },
  })
}
