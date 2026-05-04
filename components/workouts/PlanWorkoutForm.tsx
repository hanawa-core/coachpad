'use client'

import { useState, useEffect } from 'react'
import { Timestamp } from 'firebase/firestore'
import { Activity, Dumbbell, ChevronRight, Plus, X, Search } from 'lucide-react'
import {
  createPlannedWorkout,
  createStrengthAssignment,
  getStrengthTemplates,
  getExerciseLibrary,
} from '@/lib/firebase/firestore'
import {
  WORKOUT_TYPE_LABELS,
  STRENGTH_CATEGORY_LABELS,
  type WorkoutType,
  type StrengthTemplate,
  type ExerciseLibraryItem,
} from '@/types'
import { clsx } from 'clsx'

interface Props {
  athleteId: string
  coachId: string
  date: string
  onDone: () => void
}

type Mode = 'run' | 'custom_strength' | 'strength'

export function PlanWorkoutForm({ athleteId, coachId, date, onDone }: Props) {
  const [mode, setMode] = useState<Mode>('run')

  return (
    <div>
      {/* タブ */}
      <div className="mb-4 flex gap-2 border-b border-slate-700 pb-2">
        <TabButton active={mode === 'run'} onClick={() => setMode('run')} icon={Activity}>
          ランニング
        </TabButton>
        <TabButton active={mode === 'custom_strength'} onClick={() => setMode('custom_strength')} icon={Dumbbell}>
          筋トレ
        </TabButton>
        <TabButton active={mode === 'strength'} onClick={() => setMode('strength')} icon={ChevronRight}>
          プロトコル
        </TabButton>
      </div>

      {mode === 'run' && (
        <RunForm athleteId={athleteId} coachId={coachId} date={date} onDone={onDone} />
      )}
      {mode === 'custom_strength' && (
        <CustomStrengthForm athleteId={athleteId} coachId={coachId} date={date} onDone={onDone} />
      )}
      {mode === 'strength' && (
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
// ランニングプラン（既存）
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
// 筋トレ（種目ライブラリから選択・新規）
// ============================================================

interface SelectedExercise {
  libraryItem: ExerciseLibraryItem
  sets: number
  reps: number | null
  durationSec: number | null
  restSec: number
  useTime: boolean
}

function CustomStrengthForm({ athleteId, coachId, date, onDone }: Props) {
  const [library, setLibrary] = useState<ExerciseLibraryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedCat, setSelectedCat] = useState<string>('all')
  const [selected, setSelected] = useState<SelectedExercise[]>([])
  const [sessionName, setSessionName] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)

  useEffect(() => {
    getExerciseLibrary(coachId).then((items) => {
      setLibrary(items)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [coachId])

  // 種目を追加
  const addExercise = (item: ExerciseLibraryItem) => {
    if (selected.some((s) => s.libraryItem.id === item.id)) return
    setSelected((prev) => [
      ...prev,
      {
        libraryItem: item,
        sets: item.defaultSets ?? 3,
        reps: item.defaultReps ?? 10,
        durationSec: item.defaultDurationSec ?? null,
        restSec: item.defaultRestSec ?? 60,
        useTime: !item.defaultReps && !!item.defaultDurationSec,
      },
    ])
  }

  const removeExercise = (id: string) => {
    setSelected((prev) => prev.filter((s) => s.libraryItem.id !== id))
  }

  const updateExercise = (id: string, patch: Partial<SelectedExercise>) => {
    setSelected((prev) =>
      prev.map((s) => (s.libraryItem.id === id ? { ...s, ...patch } : s))
    )
  }

  const handleSave = async () => {
    if (selected.length === 0) return
    setSubmitting(true)
    try {
      const name = sessionName.trim() || `筋トレ（${selected.map((s) => s.libraryItem.name).slice(0, 3).join('・')}${selected.length > 3 ? '…' : ''}）`
      const exercises = selected.map((s, i) => ({
        exerciseId: `lib_${s.libraryItem.id}`,
        order: i,
        name: s.libraryItem.name,
        category: 'bodyweight' as const,
        sets: s.sets,
        reps: s.useTime ? null : s.reps,
        durationSec: s.useTime ? s.durationSec : null,
        restSec: s.restSec,
        targetWeight: null,
        instructions: s.libraryItem.instructions,
        videoUrl: s.libraryItem.videoUrl,
        imageUrl: s.libraryItem.imageUrl,
        libraryExerciseId: s.libraryItem.id,
      }))
      await createStrengthAssignment({
        templateId: `custom_${date}_${coachId}`,
        coachId,
        athleteId,
        date,
        templateSnapshot: { name, exercises },
        status: 'assigned',
        completionReport: null,
        coachFeedback: null,
      })
      setDone(true)
      setTimeout(onDone, 800)
    } finally {
      setSubmitting(false)
    }
  }

  if (done) {
    return (
      <p className="rounded-lg bg-emerald-950/30 border border-emerald-800 px-3 py-2 text-sm text-emerald-300">
        ✅ 筋トレメニューを割り当てました
      </p>
    )
  }

  // カテゴリ一覧（ライブラリにある分だけ）
  const categories = Array.from(new Set(library.map((l) => l.category)))

  // フィルター後の種目
  const filtered = library.filter((item) => {
    const matchCat = selectedCat === 'all' || item.category === selectedCat
    const matchSearch =
      !search || item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.targetMuscles.some((m) => m.includes(search))
    return matchCat && matchSearch
  })

  if (loading) {
    return (
      <div className="flex h-20 items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
      </div>
    )
  }

  if (library.length === 0) {
    return (
      <div className="rounded-lg border border-slate-700 bg-slate-950 p-4 text-center">
        <Dumbbell className="mx-auto h-6 w-6 text-slate-600 mb-2" />
        <p className="text-sm text-slate-400">種目ライブラリに種目がありません</p>
        <a href="/strength/exercises/new" className="mt-2 inline-block text-sm text-emerald-400 hover:text-emerald-300">
          → 種目を追加
        </a>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* セッション名 */}
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-300">セッション名（省略可）</label>
        <input
          type="text"
          value={sessionName}
          onChange={(e) => setSessionName(e.target.value)}
          placeholder="例: 下半身強化・体幹トレーニング"
          className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white placeholder-slate-500"
        />
      </div>

      {/* 種目ライブラリ */}
      <div className="rounded-xl border border-slate-700 bg-slate-950 p-3 space-y-2">
        <p className="text-xs font-medium text-slate-400">種目ライブラリから選択</p>

        {/* 検索 */}
        <div className="relative">
          <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="種目名・筋肉名で検索"
            className="w-full rounded-lg border border-slate-700 bg-slate-900 pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500"
          />
        </div>

        {/* カテゴリフィルター */}
        <div className="flex flex-wrap gap-1">
          <button
            onClick={() => setSelectedCat('all')}
            className={clsx(
              'rounded px-2 py-0.5 text-[10px] font-medium transition-colors',
              selectedCat === 'all' ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
            )}
          >
            すべて
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCat(cat)}
              className={clsx(
                'rounded px-2 py-0.5 text-[10px] font-medium transition-colors',
                selectedCat === cat ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
              )}
            >
              {STRENGTH_CATEGORY_LABELS[cat as keyof typeof STRENGTH_CATEGORY_LABELS] ?? cat}
            </button>
          ))}
        </div>

        {/* 種目リスト */}
        <div className="max-h-44 overflow-y-auto space-y-1 pr-1">
          {filtered.length === 0 ? (
            <p className="py-3 text-center text-xs text-slate-500">該当する種目がありません</p>
          ) : (
            filtered.map((item) => {
              const isAdded = selected.some((s) => s.libraryItem.id === item.id)
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => addExercise(item)}
                  disabled={isAdded}
                  className={clsx(
                    'flex w-full items-center justify-between rounded-lg px-3 py-2 text-left transition-colors',
                    isAdded
                      ? 'border border-emerald-700/50 bg-emerald-950/20 opacity-50 cursor-default'
                      : 'border border-slate-700 bg-slate-900 hover:border-emerald-600 hover:bg-emerald-950/10'
                  )}
                >
                  <div>
                    <p className="text-xs font-medium text-white">{item.name}</p>
                    {item.targetMuscles.length > 0 && (
                      <p className="text-[10px] text-slate-500">{item.targetMuscles.join('・')}</p>
                    )}
                  </div>
                  {isAdded ? (
                    <span className="text-[10px] text-emerald-400">追加済</span>
                  ) : (
                    <Plus className="h-3.5 w-3.5 text-slate-400" />
                  )}
                </button>
              )
            })
          )}
        </div>
      </div>

      {/* 選択中の種目（セット設定） */}
      {selected.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-slate-300">
            選択中の種目 ({selected.length}種目) — セット・回数を設定
          </p>
          {selected.map((s, idx) => (
            <div
              key={s.libraryItem.id}
              className="rounded-xl border border-green-700/40 bg-green-950/10 p-3"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-green-400">{idx + 1}</span>
                  <p className="text-sm font-medium text-white">{s.libraryItem.name}</p>
                </div>
                <button
                  onClick={() => removeExercise(s.libraryItem.id)}
                  className="rounded p-0.5 text-slate-500 hover:text-red-400"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>

              {/* 回数/時間トグル */}
              <div className="mb-2 flex gap-1">
                <button
                  type="button"
                  onClick={() => updateExercise(s.libraryItem.id, { useTime: false })}
                  className={clsx(
                    'rounded px-2 py-0.5 text-[10px] font-medium',
                    !s.useTime ? 'bg-green-600 text-white' : 'bg-slate-800 text-slate-400'
                  )}
                >
                  回数
                </button>
                <button
                  type="button"
                  onClick={() => updateExercise(s.libraryItem.id, { useTime: true })}
                  className={clsx(
                    'rounded px-2 py-0.5 text-[10px] font-medium',
                    s.useTime ? 'bg-green-600 text-white' : 'bg-slate-800 text-slate-400'
                  )}
                >
                  時間
                </button>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="mb-0.5 block text-[10px] text-slate-400">セット数</label>
                  <input
                    type="number"
                    min={1}
                    max={20}
                    value={s.sets}
                    onChange={(e) => updateExercise(s.libraryItem.id, { sets: parseInt(e.target.value) || 1 })}
                    className="w-full rounded border border-slate-700 bg-slate-950 px-2 py-1 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="mb-0.5 block text-[10px] text-slate-400">
                    {s.useTime ? '秒数' : '回数'}
                  </label>
                  {s.useTime ? (
                    <input
                      type="number"
                      min={1}
                      value={s.durationSec ?? ''}
                      onChange={(e) => updateExercise(s.libraryItem.id, { durationSec: parseInt(e.target.value) || null })}
                      className="w-full rounded border border-slate-700 bg-slate-950 px-2 py-1 text-xs text-white"
                    />
                  ) : (
                    <input
                      type="number"
                      min={1}
                      value={s.reps ?? ''}
                      onChange={(e) => updateExercise(s.libraryItem.id, { reps: parseInt(e.target.value) || null })}
                      className="w-full rounded border border-slate-700 bg-slate-950 px-2 py-1 text-xs text-white"
                    />
                  )}
                </div>
                <div>
                  <label className="mb-0.5 block text-[10px] text-slate-400">休息(秒)</label>
                  <input
                    type="number"
                    min={0}
                    step={10}
                    value={s.restSec}
                    onChange={(e) => updateExercise(s.libraryItem.id, { restSec: parseInt(e.target.value) || 0 })}
                    className="w-full rounded border border-slate-700 bg-slate-950 px-2 py-1 text-xs text-white"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleSave}
          disabled={submitting || selected.length === 0}
          className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-500 disabled:opacity-60"
        >
          {submitting ? '保存中...' : `${selected.length}種目を割り当て`}
        </button>
        <button
          type="button"
          onClick={onDone}
          className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-medium text-slate-300 hover:bg-slate-800"
        >
          キャンセル
        </button>
      </div>
    </div>
  )
}

// ============================================================
// 筋トレプロトコル割り当て（既存）
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
