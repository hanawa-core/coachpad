'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Timestamp } from 'firebase/firestore'
import { useAuth } from '@/components/providers/AuthProvider'
import { TopBar } from '@/components/layout/TopBar'
import { createCompletedWorkout } from '@/lib/firebase/firestore'
import type { CompletedWorkout, WorkoutType } from '@/types'
import { getPreset, sessionLabel } from '@/lib/presets'
import type { MetricDef } from '@/lib/presets'

export default function NewWorkoutPage() {
  const router = useRouter()
  const { user, profile } = useAuth()

  const preset = useMemo(() => getPreset(profile?.activityPreset), [profile?.activityPreset])

  const today = new Date().toISOString().split('T')[0]
  const [date, setDate] = useState(today)
  const [title, setTitle] = useState('')
  const [workoutType, setWorkoutType] = useState<WorkoutType>(preset.defaultSessionType)
  // プリセット指標の入力値（MetricDef.key ごと）
  const [values, setValues] = useState<Record<string, string>>({})
  // トレーニングロード（showTss プリセットのみ）
  const [tss, setTss] = useState('')
  const [ctl, setCtl] = useState('')
  const [atl, setAtl] = useState('')
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // プリセット確定（プロフィール読込後）に既定セッション種別へ同期。
  // 現在の選択がプリセットに存在しない場合のみ既定へ戻す（入力中の手動選択を保持）。
  useEffect(() => {
    setWorkoutType((cur) =>
      preset.sessionTypes.some((s) => s.key === cur) ? cur : preset.defaultSessionType
    )
  }, [preset])

  const setMetric = (key: string, v: string) =>
    setValues((prev) => ({ ...prev, [key]: v }))

  const primaryMetrics = preset.metrics.filter((m) => m.primary)
  const secondaryMetrics = preset.metrics.filter((m) => !m.primary)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !profile) return
    setSubmitting(true)
    try {
      // ベースとなる typed フィールド（全て null）
      const completed: CompletedWorkout = {
        title: title || sessionLabel(preset.id, workoutType),
        workoutType,
        distanceKm: null,
        durationMin: null,
        avgPaceMinPerKm: null,
        avgHeartRate: null,
        maxHeartRate: null,
        elevationGainM: null,
        calories: null,
        tss: null,
        ctl: null,
        atl: null,
        notes,
        loggedAt: Timestamp.now(),
        attachedImages: [],
        activityPreset: preset.id,
      }
      const extraMetrics: Record<string, number | string | null> = {}

      for (const m of preset.metrics) {
        const raw = values[m.key]?.trim()
        if (!raw) continue
        const val: number | string = m.inputType === 'number' ? parseFloat(raw) : raw
        if (typeof val === 'number' && Number.isNaN(val)) continue
        if (m.field.startsWith('metrics.')) {
          extraMetrics[m.field.slice('metrics.'.length)] = val
        } else {
          // 既存 typed フィールドへ
          ;(completed as unknown as Record<string, unknown>)[m.field] = val
        }
      }

      if (Object.keys(extraMetrics).length > 0) completed.metrics = extraMetrics

      // トレーニングロード（プリセットが許可する場合のみ）
      if (preset.showTss) {
        completed.tss = tss ? parseFloat(tss) : null
        completed.ctl = ctl ? parseFloat(ctl) : null
        completed.atl = atl ? parseFloat(atl) : null
      }

      await createCompletedWorkout({
        athleteId: user.uid,
        coachId: profile.coachId ?? '',
        date,
        type: 'completed',
        planned: null,
        completed,
        coachFeedback: null,
      })
      router.replace('/calendar')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <TopBar title="ワークアウト記録" />
      <div className="p-4 sm:p-6 max-w-2xl">
        <Link
          href="/calendar"
          className="inline-flex items-center gap-1 mb-4 text-sm text-slate-400 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          カレンダーに戻る
        </Link>

        <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-slate-800 bg-slate-900 p-6">
          <Field label="日付">
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
            />
          </Field>

          <Field label="タイトル">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="例: 朝練・10km"
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white placeholder-slate-500"
            />
          </Field>

          <Field label="種別">
            <select
              value={workoutType}
              onChange={(e) => setWorkoutType(e.target.value as WorkoutType)}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
            >
              {preset.sessionTypes.map((s) => (
                <option key={s.key} value={s.key}>{s.label}</option>
              ))}
            </select>
          </Field>

          {/* 主指標 */}
          {primaryMetrics.length > 0 && (
            <div className="grid grid-cols-3 gap-3">
              {primaryMetrics.map((m) => (
                <MetricField key={m.key} metric={m} value={values[m.key] ?? ''} onChange={setMetric} />
              ))}
            </div>
          )}

          {/* 詳細指標 */}
          {secondaryMetrics.length > 0 && (
            <div className="border-t border-slate-800 pt-4">
              <p className="mb-3 text-xs font-medium text-slate-400">詳細</p>
              <div className="grid grid-cols-3 gap-3">
                {secondaryMetrics.map((m) => (
                  <MetricField key={m.key} metric={m} value={values[m.key] ?? ''} onChange={setMetric} />
                ))}
              </div>
            </div>
          )}

          {/* トレーニングロード（プリセット対応） */}
          {preset.showTss && (
            <div className="border-t border-slate-800 pt-4">
              <p className="mb-3 text-xs font-medium text-slate-400">
                トレーニングロード（Garmin Connectなどから）
              </p>
              <div className="grid grid-cols-3 gap-3">
                <Field label="TSS">
                  <Input value={tss} onChange={setTss} type="number" step="0.1" />
                </Field>
                <Field label="CTL">
                  <Input value={ctl} onChange={setCtl} type="number" step="0.1" />
                </Field>
                <Field label="ATL">
                  <Input value={atl} onChange={setAtl} type="number" step="0.1" />
                </Field>
              </div>
            </div>
          )}

          <Field label="メモ">
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
            />
          </Field>

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-60"
          >
            {submitting ? '保存中...' : '記録'}
          </button>
        </form>
      </div>
    </>
  )
}

function MetricField({
  metric,
  value,
  onChange,
}: {
  metric: MetricDef
  value: string
  onChange: (key: string, v: string) => void
}) {
  const label = metric.unit ? `${metric.label}(${metric.unit})` : metric.label
  return (
    <Field label={label}>
      {metric.inputType === 'pace' ? (
        <Input value={value} onChange={(v) => onChange(metric.key, v)} placeholder="5:30" />
      ) : metric.inputType === 'number' ? (
        <Input value={value} onChange={(v) => onChange(metric.key, v)} type="number" step={metric.step} />
      ) : (
        <Input value={value} onChange={(v) => onChange(metric.key, v)} />
      )}
    </Field>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-slate-300">{label}</label>
      {children}
    </div>
  )
}

function Input({
  value,
  onChange,
  ...props
}: {
  value: string
  onChange: (v: string) => void
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'>) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white placeholder-slate-500"
      {...props}
    />
  )
}
