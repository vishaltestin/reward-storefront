import * as z from "zod"

export const profileSchema = z.object({
    first_name: z.string().min(1, "First name is required"),
    last_name: z.string().min(1, "Last name is required"),
    email: z.string().email("Invalid email"),
    mobile: z.string().optional(),
    gender: z.string().min(1, "Gender is required"),
    dob: z.string().min(1, "Date of birth is required"),

    address_line_1: z.string().min(1, "Address is required"),
    address_line_2: z.string().optional(),
    city: z.string().min(1, "City is required"),
    state: z.string().min(1, "State is required"),
    pincode: z.string().min(1, "Pincode is required"),
    country: z.string().min(1, "Country is required"),

    shipping_address_line_1: z.string().optional(),
    shipping_address_line_2: z.string().optional(),
    shipping_city: z.string().optional(),
    shipping_state: z.string().optional(),
    shipping_pincode: z.string().optional(),
    shipping_country: z.string().optional(),
})

export type ProfileValues = z.infer<typeof profileSchema>

export const passwordSchema = z.object({
    current_password: z.string().min(1, "Current password is required"),
    new_password: z.string().min(8, "Password must be at least 8 characters"),
    new_password_confirmation: z.string().min(1, "Please confirm your new password"),
}).refine((data) => data.new_password === data.new_password_confirmation, {
    message: "Passwords do not match",
    path: ["new_password_confirmation"],
})

export type PasswordValues = z.infer<typeof passwordSchema>