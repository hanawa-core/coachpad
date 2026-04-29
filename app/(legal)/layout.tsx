export const dynamic = 'force-dynamic'

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-200">
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-16">
        {children}
      </div>
    </div>
  )
}
