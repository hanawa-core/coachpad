'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Calendar, MessageCircle } from 'lucide-react'
import { useAuth } from '@/components/providers/AuthProvider'
import { TopBar } from '@/components/layout/TopBar'
import { getAthleteCache, setAthletePlan } from '@/lib/firebase/firestore'
import { CalendarMonthView } from '@/components/calendar/CalendarMonthView'
import { FitnessChart } from '@/components/dashboard/FitnessChart'
import { WellnessChart } from '@/components/wellness/WellnessChart'
import { PlanBadge } from '@/components/ui/PlanBadge'
import { PLAN_CONFIG, type AthleteCache, type AthletePlan } from '@/types'

export default function AthleteDetailPage() {
  const params = useParams()
  const id = params.athleteId as string
  const { profile } = useAuth()
  const [athlete, setAthlete] = useState<AthleteCache | null>(null)
  const [planSaving, setPlanSaving] = useState(false)

  useEffect(() => {
    getAthleteCache(id).then(setAthlete)
  }, [id])

  async function handlePlanChange(plan: AthletePlan | null) {
    if (!athlete) return
    setPlanSaving(true)
    try {
      await setAthletePlan(id, plan)
      setAthlete((prev) => prev ? { ...prev, plan: plan ?? undefined } : prev)
    } finally {
      setPlanSaving(false)
    }
  }

  if (profile?.role !== 'coach') {
    return (
      <>
        <TopBar title="選手詳細" />
        <div className="p-6"><p className="text-sm text-slate-400">権限がありません</p></div>
      </>
    )
  }

  return (
    <>
      <TopBar title={athlete?.displayName ?? '選手詳細'} />
      <div className="p-6 space-y-4">
        <Link href="/athletes" className="inline-flex items-center gap-1 text-sm text-slate-400 hover:text-white">
          <ArrowLeft className="h-4 w-4" />
          選手一覧
        </Link>

        {athlete && (
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-white">{athlete.displayName}</h2>
                  <PlanBadge plan={athlete.plan} />
                </div>
                <p className="text-sm text-slate-500">{athlete.email}</p>
              </div>
            </div>

            {/* プランセレクター */}
            <div className="mt-4">
              <p className="mb-2 text-xs font-medium text-slate-400">コーチングプラン</p>
              <div className="flex flex-wrap gap-2">
                {(Object.keys(PLAN_CONFIG) as AthletePlan[]).map((p) => {
                  const cfg = PLAN_CONFIG[p]
                  const isSelected = athlete.plan === p
                  return (
                    <button
                      key={p}
                      onClick={() => handlePlanChange(isSelected ? null : p)}
                      disabled={planSaving}
                      className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-all disabled:opacity-50 ${
                        isSelected
                          ? `${cfg.bg} ${cfg.border} ${cfg.color}`
                          : 'border-slate-700 bg-slate-800 text-slate-400 hover:border-slate-600 hover:text-slate-300'
                      }`}
                    >
                      {cfg.label}
                      <span className="ml-1.5 opacity-60">{cfg.price}</span>
                    </button>
                  )
                })}
              </div>
              {athlete.plan && (
                <p className="mt-2 text-xs text-slate-500">
                  チャット返信：{PLAN_CONFIG[athlete.plan].chatReply}　／　{PLAN_CONFIG[athlete.plan].planNote}
                </p>
              )}
            </div>

            <div className="mt-4 grid grid-cols-3 gap-4 text-center">
              <Stat label="CTL" value={athlete.latestMetrics?.ctl?.toFixed(0) ?? '-'} />
              <Stat label="ATL" value={athlete.latestMetrics?.atl?.toFixed(0) ?? '-'} />
              <Stat label="TSB" value={athlete.latestMetrics?.tsb?.toFixed(0) ?? '-'} />
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <Link
                href={`/calendar/${id}`}
                className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500"
              >
                <Calendar className="h-4 w-4" />
                カレンダーを開く
              </Link>
              <Link
                href={`/chat/${id}`}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
              >
                <MessageCircle className="h-4 w-4" />
                チャット
              </Link>
            </div>
          </div>
        )}

        <FitnessChart athleteId={id} />

        <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
          <h3 className="mb-3 text-base font-semibold text-white">体調推移（30日）</h3>
          <WellnessChart athleteId={id} days={30} />
        </div>

        <CalendarMonthView athleteId={id} isCoachView />
      </div>
    </>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-slate-950 p-3">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="text-2xl font-bold text-white mt-1">{value}</p>
    </div>
  )
}
