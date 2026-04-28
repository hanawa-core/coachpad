'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Sparkles, Check } from 'lucide-react'
import { Timestamp } from 'firebase/firestore'
import { useAuth } from '@/components/providers/AuthProvider'
import { TopBar } from '@/components/layout/TopBar'
import { getAthleteCache, createPlannedWorkout } from '@/lib/firebase/firestore'
import { WORKOUT_TYPE_LABELS, type AthleteCache, type WorkoutType } from '@/types'

interface PlannedWorkout {
  date: string
  title: string
  workoutType: WorkoutType
  targetDistanceKm: number | null
  targetDurationMin: number | null
  targetPaceMinPerKm: string | null
  description: string
}

export default function AIPlanPage() {
  const params = useParams()
  const router = useRouter()
  const athleteId = params.athleteId as string
  const { user, profile } = useAuth()

  const [athlete, setAthlete] = useState<AthleteCache | null>(null)
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0])
  const [weeks, setWeeks] = useState(2)
  const [raceDate, setRaceDate] = useState('')
  const [raceDistance, setRaceDistance] = useState('')
  const [currentFitness, setCurrentFitness] = useState('')
  const [notes, setNotes] = useState('')

  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState('')
  const [rationale, setRationale] = useState('')
  const [plan, setPlan] = useState<PlannedWorkout[]>([])
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    getAthleteCache(athleteId).then((a) => {
      setAthlete(a)
      if (a?.latestMetrics) {
        setCurrentFitness(`CTL ${a.latestMetrics.ctl.toFixed(0)} / ATL ${a.latestMetrics.atl.toFixed(0)} / TSB ${a.latestMetrics.tsb.toFixed(0)}`)
      }
    })
  }, [athleteId])

  if (profile?.role !== 'coach') {
    return (
      <>
        <TopBar title="AI プラン作成" />
        <div className="p-6">
          <p className="text-sm text-slate-400">権限がありません</p>
        </div>
      </>
    )
  }

  const handleGenerate = async () => {
    if (!user || !athlete) return
    setError('')
    setPlan([])
    setRationale('')
    setSelected(new Set())
    setGenerating(true)
    try {
      const idToken = await user.getIdToken()
      const res = await fetch('/api/ai/generate-running-plan', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${idToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          athleteName: athlete.displayName,
          athleteId,
          startDate,
          weeks,
          raceDate: raceDate || null,
          raceDistance: raceDistance || null,
          currentFitness,
          notes,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'エラー')
      setRationale(data.plan.rationale)
      setPlan(data.plan.workouts)
      setSelected(new Set(data.plan.workouts.map((_: any, i: number) => i)))
    } catch (e: any) {
      setError(e.message)
    } finally {
      setGenerating(false)
    }
  }

  const toggle = (idx: number) => {
    const next = new Set(selected)
    if (next.has(idx)) next.delete(idx)
    else next.add(idx)
    setSelected(next)
  }

  const handleSave = async () => {
    if (!user || !athlete) return
    setSaving(true)
    try {
      for (const idx of selected) {
        const w = plan[idx]
        await createPlannedWorkout({
          athleteId,
          coachId: user.uid,
          date: w.date,
          type: 'planned',
          planned: {
            title: w.title,
            description: w.description,
            workoutType: w.workoutType,
            targetDistanceKm: w.targetDistanceKm,
            targetDurationMin: w.targetDurationMin,
            targetPaceMinPerKm: w.targetPaceMinPerKm,
            targetHeartRateZone: null,
            notes: '',
            createdAt: Timestamp.now(),
            createdBy: user.uid,
          },
          completed: null,
          coachFeedback: null,
        })
      }
      router.replace(`/calendar/${athleteId}`)
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <TopBar title={athlete ? `${athlete.displayName} の AI プラン` : 'AI プラン'} />
      <div className="p-6 max-w-3xl space-y-4">
        <Link
          href={`/calendar/${athleteId}`}
          className="inline-flex items-center gap-1 text-sm text-slate-400 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          カレンダーに戻る
        </Link>

        <div className="rounded-xl border border-purple-700/50 bg-purple-950/20 p-6">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="h-5 w-5 text-purple-400" />
            <h2 className="text-base font-semibold text-white">AIでランニングプラン作成</h2>
          </div>
          <p className="text-sm text-slate-400 mb-4">
            選手の状態とレース目標を入力するとAIが日毎のメニューを生成します
          </p>

          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-300">開始日</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-300">期間（週）</label>
                <input
                  type="number"
                  min={1}
                  max={8}
                  value={weeks}
                  onChange={(e) => setWeeks(parseInt(e.target.value) || 1)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-300">目標レース日（任意）</label>
                <input
                  type="date"
                  value={raceDate}
                  onChange={(e) => setRaceDate(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-300">レース距離（任意）</label>
                <input
                  type="text"
                  value={raceDistance}
                  onChange={(e) => setRaceDistance(e.target.value)}
                  placeholder="例: 100km トレイル"
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-slate-300">現在のフィットネス・走力</label>
              <textarea
                value={currentFitness}
                onChange={(e) => setCurrentFitness(e.target.value)}
                rows={2}
                placeholder="例: CTL 60、フルマラソン3:30、週60km走れる"
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-slate-300">追加要望（任意）</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                placeholder="例: 平日は60分以内、週末は時間あり"
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
              />
            </div>

            <button
              onClick={handleGenerate}
              disabled={generating || !currentFitness}
              className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-purple-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-purple-500 disabled:opacity-60"
            >
              <Sparkles className={`h-4 w-4 ${generating ? 'animate-spin' : ''}`} />
              {generating ? `AI生成中（${weeks}週間分）...` : 'プランを生成'}
            </button>

            {error && (
              <p className="rounded-lg bg-red-900/40 border border-red-800 px-3 py-2 text-sm text-red-400">
                エラー: {error}
              </p>
            )}
          </div>
        </div>

        {plan.length > 0 && (
          <>
            {rationale && (
              <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
                <h3 className="mb-2 text-sm font-semibold text-white">プラン方針</h3>
                <p className="text-sm text-slate-300 whitespace-pre-wrap">{rationale}</p>
              </div>
            )}

            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white">
                生成結果 ({selected.size} / {plan.length} 日選択中)
              </h3>
              <div className="flex gap-2">
                <button
                  onClick={() => setSelected(new Set(plan.map((_, i) => i)))}
                  className="text-xs text-slate-400 hover:text-white"
                >
                  全選択
                </button>
                <button
                  onClick={() => setSelected(new Set())}
                  className="text-xs text-slate-400 hover:text-white"
                >
                  全解除
                </button>
              </div>
            </div>

            <ul className="space-y-2">
              {plan.map((w, idx) => (
                <li key={idx}>
                  <button
                    onClick={() => toggle(idx)}
                    className={`w-full rounded-xl border p-4 text-left transition-colors ${
                      selected.has(idx)
                        ? 'border-purple-600 bg-purple-950/20'
                        : 'border-slate-800 bg-slate-900 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <span
                        className={`mt-0.5 flex h-5 w-5 items-center justify-center rounded border ${
                          selected.has(idx)
                            ? 'border-purple-500 bg-purple-600 text-white'
                            : 'border-slate-600 bg-slate-950'
                        }`}
                      >
                        {selected.has(idx) && <Check className="h-3 w-3" />}
                      </span>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-semibold text-white">
                            {w.date} ・ {w.title}
                          </h4>
                          <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[10px] text-slate-300">
                            {WORKOUT_TYPE_LABELS[w.workoutType]}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-slate-400">
                          {w.targetDistanceKm && `距離: ${w.targetDistanceKm}km `}
                          {w.targetDurationMin && `時間: ${w.targetDurationMin}分 `}
                          {w.targetPaceMinPerKm && `ペース: ${w.targetPaceMinPerKm}/km`}
                        </p>
                        {w.description && (
                          <p className="mt-2 text-xs text-slate-300 whitespace-pre-wrap">
                            {w.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </button>
                </li>
              ))}
            </ul>

            <button
              onClick={handleSave}
              disabled={saving || selected.size === 0}
              className="w-full rounded-lg bg-emerald-600 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-60"
            >
              {saving ? '保存中...' : `選択中の ${selected.size} 日をカレンダーに追加`}
            </button>
          </>
        )}
      </div>
    </>
  )
}
