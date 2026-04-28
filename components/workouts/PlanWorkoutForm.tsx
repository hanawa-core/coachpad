'use client'

import { useState, useEffect } from 'react'
import { Timestamp } from 'firebase/firestore'
import { Activity, Dumbbell, ChevronRight } from 'lucide-react'
import {
  createPlannedWorkout,
  createStrengthAssignment,
  getStrengthTemplates,
} from '@/lib/firebase/firestore'
import { WORKOUT_TYPE_LABELS, type WorkoutType, type StrengthTemplate, STRENGTH_CATEGORY_LABELS } from '@/types'
import { clsx } from 'clsx'

interface Props {
  athleteId: string
  coachId: string
  date: string
  onDone: () => void
}

type Mode = 'run' | 'strength'

export function PlanWorkoutForm({ athleteId, coachId, date, onDone }: Props) {
  const [mode, setMode] = useState<Mode>('run')

  return (
    <div>
      {/* タブ */}
      <div className="mb-4 flex gap-2 border-b border-slate-700 pb-2">
        <TabButton active={mode === 'run'} onClick={() => setMode('run')} icon={Activity}>
          ランニング
        </TabButton>
        <TabButton active={mode === 'strength'} onClick={() => setMode('strength')} icon={Dumbbell}>
          プロトコル
        </TabButton>
      </div>

      {mode === 'run' ? (
        <RunForm athleteId={athleteId} coachId={coachId} date={date} onDone={onDone} />
      ) : (
        <StrengthAssignSection athleteId={athleteId} coachId={coachId} date={date} onDone={onDone} />
      )}
    </div>
  )
}

function TabButton({
  active,
  onClick,
  icon: Icon,
  children,
}: {
  active: boolean
  onClick: () => void
  icon: React.ComponentType<{ className?: string }>
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={clsx(
        'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
        active
          ? 'bg-emerald-600 text-white'
          : 'text-slate-400 hover:bg-slate-800 hover:text-white'
      )}
    >
      <Icon className="h-4 w-4" />
      {children}
    </button>
  )
}

// ============================================================
// ランニングプラン
// ============================================================

function RunForm({ athleteId, coachId, date, onDone }: Props) {
  const [title, setTitle] = useState('')
  const [workoutType, setWorkoutType] = useState<WorkoutType>('easy_run')
  const [distance, setDistance] = useState('')
  const [duration, setDuration] = useState('')
  const [pace, setPace] = useState('')
  const [description, setDescription] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      await createPlannedWorkout({
        athleteId,
        coachId,
        date,
        type: 'planned',
        planned: {
          title: title || WORKOUT_TYPE_LABELS[workoutType],
          description,
          workoutType,
          targetDistanceKm: distance ? parseFloat(distance) : null,
          targetDurationMin: duration ? parseInt(duration) : null,
          targetPaceMinPerKm: pace || null,
          targetHeartRateZone: null,
          notes: '',
          createdAt: Timestamp.now(),
          createdBy: coachId,
        },
        completed: null,
        coachFeedback: null,
      })
      onDone()
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-300">タイトル</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="例: 朝練・テンポ走"
          className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
        />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-300">種別</label>
        <select
          value={workoutType}
          onChange={(e) => setWorkoutType(e.target.value as WorkoutType)}
          className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none"
        >
          {Object.entries(WORKOUT_TYPE_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
      </div>
      <div className="grid grid-cols-3 gap-2">
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-300">距離(km)</label>
          <input
            type="number"
            step="0.1"
            value={distance}
            onChange={(e) => setDistance(e.target.value)}
            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-300">時間(分)</label>
          <input
            type="number"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-300">ペース(分:秒)</label>
          <input
            type="text"
            placeholder="5:30"
            value={pace}
            onChange={(e) => setPace(e.target.value)}
            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white placeholder-slate-500"
          />
        </div>
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-300">指示・メモ</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          placeholder="例: 前半はイージーで、後半5kmからペースアップ"
          className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white placeholder-slate-500"
        />
      </div>
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={submitting}
          className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-60"
        >
          {submitting ? '保存中...' : '保存'}
        </button>
        <button
          type="button"
          onClick={onDone}
          className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-medium text-slate-300 hover:bg-slate-800"
        >
          キャンセル
        </button>
      </div>
    </form>
  )
}

// ============================================================
// 筋トレ割り当て
// ============================================================

function StrengthAssignSection({ athleteId, coachId, date, onDone }: Props) {
  const [templates, setTemplates] = useState<StrengthTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [assigning, setAssigning] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  useEffect(() => {
    getStrengthTemplates(coachId).then((t) => {
      setTemplates(t)
      setLoading(false)
    })
  }, [coachId])

  const handleAssign = async (template: StrengthTemplate) => {
    setAssigning(template.id)
    try {
      await createStrengthAssignment({
        templateId: template.id,
        coachId,
        athleteId,
        date,
        templateSnapshot: {
          name: template.name,
          exercises: template.exercises,
        },
        status: 'assigned',
        completionReport: null,
        coachFeedback: null,
      })
      setDone(true)
      setTimeout(onDone, 800)
    } finally {
      setAssigning(null)
    }
  }

  if (loading) {
    return (
      <div className="flex h-20 items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
      </div>
    )
  }

  if (done) {
    return (
      <p className="rounded-lg bg-emerald-950/30 border border-emerald-800 px-3 py-2 text-sm text-emerald-300">
        ✅ プロトコルを割り当てました
      </p>
    )
  }

  if (templates.length === 0) {
    return (
      <div className="rounded-lg border border-slate-700 bg-slate-950 p-4 text-center">
        <Dumbbell className="mx-auto h-6 w-6 text-slate-600 mb-2" />
        <p className="text-sm text-slate-400">プロトコルがまだありません</p>
        <a
          href="/strength/templates/new"
          className="mt-2 inline-block text-sm text-emerald-400 hover:text-emerald-300"
        >
          → テンプレート作成
        </a>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <p className="text-xs text-slate-400">
        登録済みのテンプレートから選んで {date} に割り当て
      </p>
      <ul className="space-y-1.5">
        {templates.map((t) => (
          <li key={t.id}>
            <button
              type="button"
              onClick={() => handleAssign(t)}
              disabled={assigning !== null}
              className="flex w-full items-center justify-between rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-left hover:border-emerald-600 hover:bg-emerald-950/20 disabled:opacity-60 transition-colors"
            >
              <div>
                <p className="text-sm font-medium text-white">{t.name}</p>
                <p className="mt-0.5 text-xs text-slate-500">
                  {STRENGTH_CATEGORY_LABELS[t.category]} · {t.exercises.length}種目 · 約{t.estimatedDurationMin}分
                </p>
              </div>
              {assigning === t.id ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
              ) : (
                <ChevronRight className="h-4 w-4 text-slate-500" />
              )}
            </button>
          </li>
        ))}
      </ul>
      <button
        type="button"
        onClick={onDone}
        className="mt-2 rounded-lg border border-slate-700 px-4 py-2 text-sm font-medium text-slate-300 hover:bg-slate-800"
      >
        キャンセル
      </button>
    </div>
  )
}
