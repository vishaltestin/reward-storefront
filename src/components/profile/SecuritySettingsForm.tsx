import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2 } from "lucide-react"
import { useChangePassword } from "@/hooks/useProfileMutations"
import { passwordSchema, type PasswordValues } from "@/lib/validations/profile"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export function SecuritySettingsForm({ slug }: { slug: string }) {
    const changePassword = useChangePassword(slug)

    const form = useForm<PasswordValues>({
        resolver: zodResolver(passwordSchema),
        defaultValues: {
            current_password: "",
            new_password: "",
            new_password_confirmation: "",
        },
    })

    return (
        <form onSubmit={form.handleSubmit((data) => changePassword.mutate(data, { onSuccess: () => form.reset() }))} className="space-y-6 animate-in fade-in duration-300">
            <div className="space-y-1.5">
                <label className="text-[10px] font-semibold tracking-wider text-slate-500 uppercase ml-1">Current Access Key</label>
                <Input type="password" {...form.register("current_password")} className="h-11 rounded-xl border-slate-200 bg-slate-50/50 text-sm focus:bg-white focus:border-slate-300 shadow-none" />
                {form.formState.errors.current_password && <p className="text-[11px] font-medium text-rose-500 mt-1 ml-1">{form.formState.errors.current_password.message}</p>}
            </div>
            <div className="space-y-1.5">
                <label className="text-[10px] font-semibold tracking-wider text-slate-500 uppercase ml-1">New Access Key</label>
                <Input type="password" {...form.register("new_password")} className="h-11 rounded-xl border-slate-200 bg-slate-50/50 text-sm focus:bg-white focus:border-slate-300 shadow-none" />
                {form.formState.errors.new_password && <p className="text-[11px] font-medium text-rose-500 mt-1 ml-1">{form.formState.errors.new_password.message}</p>}
            </div>
            <div className="space-y-1.5">
                <label className="text-[10px] font-semibold tracking-wider text-slate-500 uppercase ml-1">Confirm New Key</label>
                <Input type="password" {...form.register("new_password_confirmation")} className="h-11 rounded-xl border-slate-200 bg-slate-50/50 text-sm focus:bg-white focus:border-slate-300 shadow-none" />
                {form.formState.errors.new_password_confirmation && <p className="text-[11px] font-medium text-rose-500 mt-1 ml-1">{form.formState.errors.new_password_confirmation.message}</p>}
            </div>

            <div className="pt-2">
                <Button type="submit" disabled={changePassword.isPending} className="h-12 rounded-full bg-slate-900 px-8 text-sm font-semibold text-white hover:bg-slate-800 transition-all shadow-md">
                    {changePassword.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Verifying...</> : "Enforce New Password"}
                </Button>
            </div>
        </form>
    )
}