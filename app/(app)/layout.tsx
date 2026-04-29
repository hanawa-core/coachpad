import { AuthGuard } from '@/components/layout/AuthGuard'
import { AppShell } from '@/components/layout/AppShell'

export const dynamic = 'force-dynamic'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <AppShell>{children}</AppShell>
    </AuthGuard>
  )
}
