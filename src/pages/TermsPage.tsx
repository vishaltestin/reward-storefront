import { useTenantStore } from "@/store/useTenantStore"

export default function TermsPage() {
    const { config } = useTenantStore()

    return (
        <div className="mx-auto max-w-4xl py-12 px-4 sm:px-6 lg:px-8">
            <h1 className="mb-8 text-3xl font-bold text-slate-900">Terms & Conditions</h1>
            <div className="rounded-2xl border border-slate-100 bg-white p-8 shadow-sm">
                {config?.terms_text ? (
                    <p className="whitespace-pre-wrap leading-relaxed text-slate-600">
                        {config.terms_text}
                    </p>
                ) : (
                    <p className="text-slate-500 italic">No terms and conditions have been provided.</p>
                )}
            </div>
        </div>
    )
}