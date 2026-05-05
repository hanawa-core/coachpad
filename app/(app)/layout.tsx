import { AuthGuard } from '@/components/layout/AuthGuard'
import { AppShell } from '@/components/layout/AppShell'
import { PushNotificationProvider } from '@/components/providers/PushNotificationProvider'

export const dynamic = 'force-dynamic'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <PushNotificationProvider>
        <AppShell>{children}</AppShell>
      </PushNotificationProvider>
    </AuthGuard>
  )
}
