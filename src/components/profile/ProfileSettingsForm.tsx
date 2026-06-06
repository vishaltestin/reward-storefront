import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2, UserCog, MapPin, Package } from "lucide-react"

import { useAuthStore } from "@/store/useAuthStore"
import { useUpdateProfile } from "@/hooks/useProfileMutations"
import { profileSchema, type ProfileValues } from "@/lib/validations/profile"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export function ProfileSettingsForm({ slug }: { slug: string }) {
    const user = useAuthStore((state) => state.user)
    const updateProfile = useUpdateProfile(slug)

    const form = useForm<ProfileValues>({
        resolver: zodResolver(profileSchema),
        defaultValues: {
            first_name: user?.first_name || "",
            last_name: user?.last_name || "",
            email: user?.email || "",
            mobile: user?.mobile || "",
            gender: user?.gender || "",
            dob: user?.dob ? user.dob.split("T")[0] : "",
            address_line_1: user?.address_line_1 || "",
            address_line_2: user?.address_line_2 || "",
            city: user?.city || "",
            state: user?.state || "",
            pincode: user?.pincode || "",
            country: user?.country || "India",
            shipping_address_line_1: user?.shipping_address_line_1 || "",
            shipping_address_line_2: user?.shipping_address_line_2 || "",
            shipping_city: user?.shipping_city || "",
            shipping_state: user?.shipping_state || "",
            shipping_pincode: user?.shipping_pincode || "",
            shipping_country: user?.shipping_country || "India",
        },
    })

    return (
        <form onSubmit={form.handleSubmit((data) => updateProfile.mutate(data))} className="space-y-8 animate-in fade-in duration-300">
            <div className="space-y-5">
                <h3 className="flex items-center gap-2 text-sm font-heading font-semibold text-slate-900 border-b border-slate-100 pb-3">
                    <UserCog className="h-4 w-4 text-slate-400" /> Personal Details
                </h3>
                <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-semibold tracking-wider text-slate-500 uppercase ml-1">First Name</label>
                        <Input {...form.register("first_name")} className="h-11 rounded-xl border-slate-200 bg-slate-50/50 text-sm focus:bg-white focus:border-slate-300 shadow-none" />
                        {form.formState.errors.first_name && <p className="text-[11px] font-medium text-rose-500 mt-1 ml-1">{form.formState.errors.first_name.message}</p>}
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-semibold tracking-wider text-slate-500 uppercase ml-1">Last Name</label>
                        <Input {...form.register("last_name")} className="h-11 rounded-xl border-slate-200 bg-slate-50/50 text-sm focus:bg-white focus:border-slate-300 shadow-none" />
                        {form.formState.errors.last_name && <p className="text-[11px] font-medium text-rose-500 mt-1 ml-1">{form.formState.errors.last_name.message}</p>}
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-semibold tracking-wider text-slate-500 uppercase ml-1">Email Address</label>
                        <Input type="email" {...form.register("email")} className="h-11 rounded-xl border-slate-200 bg-slate-50/50 text-sm focus:bg-white focus:border-slate-300 shadow-none" />
                        {form.formState.errors.email && <p className="text-[11px] font-medium text-rose-500 mt-1 ml-1">{form.formState.errors.email.message}</p>}
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-semibold tracking-wider text-slate-500 uppercase ml-1">Mobile Number</label>
                        <Input {...form.register("mobile")} className="h-11 rounded-xl border-slate-200 bg-slate-50/50 text-sm focus:bg-white focus:border-slate-300 shadow-none" />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-semibold tracking-wider text-slate-500 uppercase ml-1">Gender</label>
                        <Controller
                            control={form.control}
                            name="gender"
                            render={({ field }) => (
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <SelectTrigger className="w-full min-h-11 rounded-xl border-slate-200 bg-slate-50/50 text-sm focus:bg-white focus:border-slate-300 shadow-none">
                                        <SelectValue placeholder="Select Gender" />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-xl border-slate-100 shadow-xl">
                                        <SelectItem value="Male">Male</SelectItem>
                                        <SelectItem value="Female">Female</SelectItem>
                                        <SelectItem value="Other">Other</SelectItem>
                                    </SelectContent>
                                </Select>
                            )}
                        />
                        {form.formState.errors.gender && <p className="text-[11px] font-medium text-rose-500 mt-1 ml-1">{form.formState.errors.gender.message}</p>}
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-semibold tracking-wider text-slate-500 uppercase ml-1">Date of Birth</label>
                        <Input type="date" {...form.register("dob")} className="h-11 rounded-xl border-slate-200 bg-slate-50/50 text-sm focus:bg-white focus:border-slate-300 shadow-none" />
                        {form.formState.errors.dob && <p className="text-[11px] font-medium text-rose-500 mt-1 ml-1">{form.formState.errors.dob.message}</p>}
                    </div>
                </div>
            </div>

            <div className="space-y-5">
                <h3 className="flex items-center gap-2 text-sm font-heading font-semibold text-slate-900 border-b border-slate-100 pb-3">
                    <MapPin className="h-4 w-4 text-slate-400" /> Primary Address
                </h3>
                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-semibold tracking-wider text-slate-500 uppercase ml-1">Address Line 1</label>
                        <Input {...form.register("address_line_1")} className="h-11 rounded-xl border-slate-200 bg-slate-50/50 text-sm focus:bg-white focus:border-slate-300 shadow-none" />
                        {form.formState.errors.address_line_1 && <p className="text-[11px] font-medium text-rose-500 mt-1 ml-1">{form.formState.errors.address_line_1.message}</p>}
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-semibold tracking-wider text-slate-500 uppercase ml-1">Address Line 2 (Optional)</label>
                        <Input {...form.register("address_line_2")} className="h-11 rounded-xl border-slate-200 bg-slate-50/50 text-sm focus:bg-white focus:border-slate-300 shadow-none" />
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-5 lg:grid-cols-4">
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-semibold tracking-wider text-slate-500 uppercase ml-1">City</label>
                        <Input {...form.register("city")} className="h-11 rounded-xl border-slate-200 bg-slate-50/50 shadow-none" />
                        {form.formState.errors.city && <p className="text-[11px] font-medium text-rose-500 mt-1 ml-1">{form.formState.errors.city.message}</p>}
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-semibold tracking-wider text-slate-500 uppercase ml-1">State</label>
                        <Input {...form.register("state")} className="h-11 rounded-xl border-slate-200 bg-slate-50/50 shadow-none" />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-semibold tracking-wider text-slate-500 uppercase ml-1">Pincode</label>
                        <Input {...form.register("pincode")} className="h-11 rounded-xl border-slate-200 bg-slate-50/50 shadow-none" />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-semibold tracking-wider text-slate-500 uppercase ml-1">Country</label>
                        <Input {...form.register("country")} className="h-11 rounded-xl border-slate-200 bg-slate-50/50 shadow-none" />
                    </div>
                </div>
            </div>

            <div className="space-y-5">
                <h3 className="flex items-center gap-2 text-sm font-heading font-semibold text-slate-900 border-b border-slate-100 pb-3">
                    <Package className="h-4 w-4 text-slate-400" /> Fulfillment Address
                </h3>
                <p className="text-xs text-slate-500">Leave blank if identical to your primary address above.</p>
                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-semibold tracking-wider text-slate-500 uppercase ml-1">Address Line 1</label>
                        <Input {...form.register("shipping_address_line_1")} className="h-11 rounded-xl border-slate-200 bg-slate-50/50 text-sm focus:bg-white focus:border-slate-300 shadow-none" />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-semibold tracking-wider text-slate-500 uppercase ml-1">Address Line 2 (Optional)</label>
                        <Input {...form.register("shipping_address_line_2")} className="h-11 rounded-xl border-slate-200 bg-slate-50/50 text-sm focus:bg-white focus:border-slate-300 shadow-none" />
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-5 lg:grid-cols-4">
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-semibold tracking-wider text-slate-500 uppercase ml-1">City</label>
                        <Input {...form.register("shipping_city")} className="h-11 rounded-xl border-slate-200 bg-slate-50/50 shadow-none" />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-semibold tracking-wider text-slate-500 uppercase ml-1">State</label>
                        <Input {...form.register("shipping_state")} className="h-11 rounded-xl border-slate-200 bg-slate-50/50 shadow-none" />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-semibold tracking-wider text-slate-500 uppercase ml-1">Pincode</label>
                        <Input {...form.register("shipping_pincode")} className="h-11 rounded-xl border-slate-200 bg-slate-50/50 shadow-none" />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-semibold tracking-wider text-slate-500 uppercase ml-1">Country</label>
                        <Input {...form.register("shipping_country")} className="h-11 rounded-xl border-slate-200 bg-slate-50/50 shadow-none" />
                    </div>
                </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end">
                <Button type="submit" disabled={updateProfile.isPending} className="h-12 rounded-full bg-slate-900 px-8 text-sm font-semibold text-white hover:bg-slate-800 transition-all shadow-md">
                    {updateProfile.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</> : "Update Profile Details"}
                </Button>
            </div>
        </form>
    )
}