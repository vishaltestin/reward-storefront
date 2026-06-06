import { useMutation, useQuery } from "@tanstack/react-query"
import { AxiosError } from "axios"
import { toast } from "sonner"
import { api } from "@/lib/api"
import { useAuthStore } from "@/store/useAuthStore"
import type { ProfileValues, PasswordValues } from "@/lib/validations/profile"

const handleApiError = (error: unknown, fallbackMessage: string) => {
    if (error instanceof AxiosError && error.response?.data?.message) {
        toast.error(error.response.data.message)
    } else {
        toast.error(fallbackMessage)
    }
}

export const useUpdateProfile = (slug: string) => {
    const setUser = useAuthStore((state) => state.setUser)

    return useMutation({
        mutationFn: async (data: ProfileValues) => {
            const response = await api.put(`/${slug}/user/profile`, data)
            return response.data
        },
        onSuccess: (data) => {
            if (data.data) setUser(data.data)
            toast.success(data.message || "Profile updated successfully.")
        },
        onError: (error) => handleApiError(error, "Failed to update profile."),
    })
}

export const useChangePassword = (slug: string) => {
    return useMutation({
        mutationFn: async (data: PasswordValues) => {
            const response = await api.post(`/${slug}/user/change-password`, data)
            return response.data
        },
        onSuccess: (data) => toast.success(data.message || "Password updated successfully."),
        onError: (error) => handleApiError(error, "Failed to update password."),
    })
}

export const useUserWallet = (slug: string) => {
    return useQuery({
        queryKey: ["wallet", slug],
        queryFn: async () => {
            const { data } = await api.get(`/${slug}/user/wallet`)
            return Number(data.balance)
        },
        enabled: !!slug,
    })
}