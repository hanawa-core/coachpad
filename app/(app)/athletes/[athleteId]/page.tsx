'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Calendar, MessageCircle } from 'lucide-react'
import { useAuth } from '@/components/providers/AuthProvider'
import { getAuth } from 'firebase/auth'
import { TopBar } from '@/components/layout/TopBar'
import { getAthleteCache, setAthletePlan, getUserProfile } from '@/lib/firebase/firestore'
import { CalendarMonthView } from '@/components/calendar/CalendarMonthView'
import { FitnessChart } from '@/components/dashboard/FitnessChart'
import { WeightTrendCard } from '@/components/dashboard/WeightTrendCard'
import { WellnessChart } from '@/components/wellness/WellnessChart'
import { PlanBadge } from '@/components/ui/PlanBadge'
import { RunningSettingsPanel } from '@/components/athletes/RunningSettingsPanel'
import { PLAN_CONFIG, type AthleteCache, type AthletePlan, type UserProfile } from '@/types'
import { presetOptions, getPreset, type ActivityPreset } from '@/lib/presets'
import { groupedCatalog, getTestDef } from '@/lib/tests/catalog'
import { TestTrendChart } from '@/components/tests/TestTrendChart'
import { AdherenceCard } from '@/components/dashboard/AdherenceCard'

export default function AthleteDetailPage() {
  const params = useParams()
  const id = params.athleteId as string
  const { profile } = useAuth()
  const [athlete, setAthlete] = useState<AthleteCache | null>(null)
  const [planSaving, setPlanSaving] = useState(false)
  const [presetSaving, setPresetSaving] = useState(false)
  const [assignedTests, setAssignedTests] = useState<string[]>([])
  const [testsSaving, setTestsSaving] = useState(false)
  const [testsSaved, setTestsSaved] = useState(false)
  const [athleteProfile, setAthleteProfile] = useState<UserProfile | null>(null)

  useEffect(() => {
    getAthleteCache(id).then((a) => {
      setAthlete(a)
      setAssignedTests(a?.assignedTests ?? [])
    })
    getUserProfile(id).then(setAthleteProfile)
  }, [id])

  function toggleTest(key: string) {
    setTestsSaved(false)
    setAssignedTests((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    )
  }

  async function handleSaveTests() {
    setTestsSaving(true)
    try {
      const idToken = await getAuth().currentUser?.getIdToken()
      if (idToken) {
        await fetch('/api/athletes/set-tests', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
          body: JSON.stringify({ athleteId: id, assignedTests }),
        })
      }
      setAthlete((prev) => (prev ? { ...prev, assignedTests } : prev))
      setTestsSaved(true)
    } finally {
      setTestsSaving(false)
    }
  }

  async function handlePresetChange(activityPreset: ActivityPreset) {
    if (!athlete) return
    setPresetSaving(true)
    try {
      const idToken = await getAuth().currentUser?.getIdToken()
      if (idToken) {
        await fetch('/api/athletes/set-preset', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
          body: JSON.stringify({ athleteId: id, activityPreset }),
        })
      }
      setAthlete((prev) => (prev ? { ...prev, activityPreset } : prev))
    } finally {
      setPresetSaving(false)
    }
  }

  async function handlePlanChange(plan: AthletePlan | null) {
    if (!athlete) return
    setPlanSaving(true)
    try {
      await setAthletePlan(id, plan)
      // users ドキュメントも admin SDK 経由で更新
      const idToken = await getAuth().currentUser?.getIdToken()
      if (idToken) {
        await fetch('/api/athletes/set-plan', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
          body: JSON.stringify({ athleteId: id, plan }),
        })
      }
      setAthlete((prev) => prev ? { ...prev, plan: plan ?? undefined } : prev)
    } finally {
      setPlanSaving(false)
    }
  }

  if (profile?.role !== 'coach') {
    return (
      <>
        <TopBar title="選手詳細" />
        <div className="p-4 sm:p-6"><p className="text-sm text-slate-400">権限がありません</p></div>
      </>
    )
  }

  return (
    <>
      <TopBar title={athlete?.displayName ?? '選手詳細'} />
      <div className="p-4 sm:p-6 space-y-4">
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

            {/* アクティビティタイプセレクター */}
            <div className="mt-4">
              <p className="mb-2 text-xs font-medium text-slate-400">アクティビティタイプ</p>
              <select
                value={(athlete.activityPreset as ActivityPreset) ?? 'running'}
                onChange={(e) => handlePresetChange(e.target.value as ActivityPreset)}
                disabled={presetSaving}
                className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs text-white disabled:opacity-50"
              >
                {presetOptions().map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
              <p className="mt-2 text-xs text-slate-500">
                {getPreset(athlete.activityPreset as ActivityPreset).description}
              </p>
            </div>

            {getPreset(athlete.activityPreset as ActivityPreset).showTss && (
              <div className="mt-4 grid grid-cols-3 gap-4 text-center">
                <Stat label="CTL" value={athlete.latestMetrics?.ctl?.toFixed(0) ?? '-'} />
                <Stat label="ATL" value={athlete.latestMetrics?.atl?.toFixed(0) ?? '-'} />
                <Stat label="TSB" value={athlete.latestMetrics?.tsb?.toFixed(0) ?? '-'} />
              </div>
            )}

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

        {/* フィジカルテスト割り当て */}
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-base font-semibold text-white">フィジカルテスト設定</h3>
            <button
              onClick={handleSaveTests}
              disabled={testsSaving}
              className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-500 disabled:opacity-60"
            >
              {testsSaving ? '保存中...' : testsSaved ? '保存済' : '保存'}
            </button>
          </div>
          <p className="mt-1 mb-3 text-xs text-slate-400">
            この選手の競技に必要なテストを選択してください。選手の「初期テスト」画面に表示され、結果を記録できます。
          </p>
          <div className="space-y-3">
            {groupedCatalog().map((group) => (
              <div key={group.category}>
                <p className="mb-1.5 text-xs font-medium text-slate-500">{group.label}</p>
                <div className="flex flex-wrap gap-2">
                  {group.tests.map((t) => {
                    const on = assignedTests.includes(t.key)
                    return (
                      <button
                        key={t.key}
                        onClick={() => toggleTest(t.key)}
                        title={t.howTo}
                        className={`rounded-lg border px-2.5 py-1 text-xs transition-colors ${
                          on
                            ? 'border-emerald-500 bg-emerald-600/20 text-emerald-300'
                            : 'border-slate-700 bg-slate-800 text-slate-400 hover:border-slate-600'
                        }`}
                      >
                        {t.name}
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 実施率（アドヒアランス） */}
        <AdherenceCard athleteId={id} coachId={profile?.uid} />

        {/* テスト結果の推移 */}
        {athleteProfile && assignedTests.some((k) => athleteProfile.testResults?.[k]) && (
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-5 space-y-3">
            <h3 className="text-base font-semibold text-white">テスト結果の推移</h3>
            {assignedTests.map((k) => {
              const def = getTestDef(k)
              const latest = athleteProfile.testResults?.[k]
              const history = athleteProfile.testHistory?.[k] ?? []
              if (!def || !latest) return null
              return (
                <div key={k} className="rounded-lg border border-slate-800 bg-slate-950 p-4">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="text-sm font-semibold text-white">{def.name}</h4>
                    <span className="text-sm text-slate-300">最新 {latest.value} {def.unit}</span>
                  </div>
                  <TestTrendChart history={history} unit={def.unit} betterWhenLower={def.betterWhenLower} />
                  {history.length < 2 && (
                    <p className="mt-1 text-xs text-slate-500">記録が2回以上で推移グラフが表示されます</p>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {athlete && getPreset(athlete.activityPreset as ActivityPreset).showRunningMetrics && (
          <RunningSettingsPanel athleteId={id} />
        )}

        {athlete && getPreset(athlete.activityPreset as ActivityPreset).showTss && (
          <FitnessChart athleteId={id} />
        )}

        {athlete && getPreset(athlete.activityPreset as ActivityPreset).primaryChart === 'weight' && (
          <WeightTrendCard athleteId={id} coachId={profile?.uid} />
        )}

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
