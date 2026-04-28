'use client'

import { useAuth } from '@/components/providers/AuthProvider'
import { CoachDashboard } from '@/components/dashboard/CoachDashboard'
import { AthleteDashboard } from '@/components/dashboard/AthleteDashboard'
import { TopBar } from '@/components/layout/TopBar'

export default function DashboardPage() {
  const { profile, loading } = useAuth()

  if (loading || !profile) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
      </div>
    )
  }

  return (
    <>
      <TopBar title="ダッシュボード" />
      <div className="p-6">
        {profile.role === 'coach' ? <CoachDashboard /> : <AthleteDashboard />}
      </div>
    </>
  )
}
