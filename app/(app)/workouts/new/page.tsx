'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Timestamp } from 'firebase/firestore'
import { useAuth } from '@/components/providers/AuthProvider'
import { TopBar } from '@/components/layout/TopBar'
import { createCompletedWorkout } from '@/lib/firebase/firestore'
import { WORKOUT_TYPE_LABELS, type WorkoutType } from '@/types'

export default function NewWorkoutPage() {
  const router = useRouter()
  const { user, profile } = useAuth()

  const today = new Date().toISOString().split('T')[0]
  const [date, setDate] = useState(today)
  const [title, setTitle] = useState('')
  const [workoutType, setWorkoutType] = useState<WorkoutType>('easy_run')
  const [distance, setDistance] = useState('')
  const [duration, setDuration] = useState('')
  const [pace, setPace] = useState('')
  const [avgHr, setAvgHr] = useState('')
  const [maxHr, setMaxHr] = useState('')
  const [elevation, setElevation] = useState('')
  const [tss, setTss] = useState('')
  const [ctl, setCtl] = useState('')
  const [atl, setAtl] = useState('')
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !profile) return
    setSubmitting(true)
    try {
      await createCompletedWorkout({
        athleteId: user.uid,
        coachId: profile.coachId ?? '',
        date,
        type: 'completed',
        planned: null,
        completed: {
          title: title || WORKOUT_TYPE_LABELS[workoutType],
          workoutType,
          distanceKm: distance ? parseFloat(distance) : null,
          durationMin: duration ? parseInt(duration) : null,
          avgPaceMinPerKm: pace || null,
          avgHeartRate: avgHr ? parseInt(avgHr) : null,
          maxHeartRate: maxHr ? parseInt(maxHr) : null,
          elevationGainM: elevation ? parseInt(elevation) : null,
          calories: null,
          tss: tss ? parseFloat(tss) : null,
          ctl: ctl ? parseFloat(ctl) : null,
          atl: atl ? parseFloat(atl) : null,
          notes,
          loggedAt: Timestamp.now(),
          attachedImages: [],
        },
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
              {Object.entries(WORKOUT_TYPE_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </Field>

          <div className="grid grid-cols-3 gap-3">
            <Field label="距離(km)">
              <Input value={distance} onChange={setDistance} type="number" step="0.01" />
            </Field>
            <Field label="時間(分)">
              <Input value={duration} onChange={setDuration} type="number" />
            </Field>
            <Field label="ペース(分:秒/km)">
              <Input value={pace} onChange={setPace} placeholder="5:30" />
            </Field>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <Field label="平均HR">
              <Input value={avgHr} onChange={setAvgHr} type="number" />
            </Field>
            <Field label="最大HR">
              <Input value={maxHr} onChange={setMaxHr} type="number" />
            </Field>
            <Field label="獲得標高(m)">
              <Input value={elevation} onChange={setElevation} type="number" />
            </Field>
          </div>

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
