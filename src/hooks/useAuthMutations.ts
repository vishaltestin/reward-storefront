import { useMutation } from "@tanstack/react-query"
import { isAxiosError } from "axios"
import { z } from "zod"
import { api } from "@/lib/api"
import { useAuthStore } from "@/store/useAuthStore"

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
})

export type LoginFormValues = z.infer<typeof loginSchema>

interface LoginResponse {
  message: string
  token: string
  user: {
    id: number
    first_name: string
    last_name: string
    email: string
  }
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
