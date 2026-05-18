'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Plus, Trash2 } from 'lucide-react'
import { v4 as uuidv4 } from 'uuid'
import { TopBar } from '@/components/layout/TopBar'
import { YouTubeEmbed } from '@/components/strength/YouTubeEmbed'
import {
  getStrengthTemplate,
  updateStrengthTemplate,
  deleteStrengthTemplate,
} from '@/lib/firebase/firestore'
import {
  STRENGTH_CATEGORY_LABELS,
  STRENGTH_CATEGORY_GROUPS,
  EXERCISE_CATEGORY_LABELS,
  type StrengthCategory,
  type ExerciseCategory,
  type Exercise,
} from '@/types'

export default function EditTemplatePage() {
  const params = useParams()
  const router = useRouter()
  const id = params.templateId as string

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState<StrengthCategory>('lower_body')
  const [duration, setDuration] = useState('30')
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    getStrengthTemplate(id).then((t) => {
      if (t) {
        setName(t.name)
        setDescription(t.description ?? '')
        setCategory(t.category)
        setDuration(String(t.estimatedDurationMin))
        setExercises(t.exercises)
      }
      setLoading(false)
    })
  }, [id])

  const addExercise = () => {
    setExercises([
      ...exercises,
      {
        exerciseId: uuidv4(),
        order: exercises.length,
        name: '',
        category: 'bodyweight',
        sets: 3,
        reps: 10,
        durationSec: null,
        restSec: 60,
        targetWeight: null,
        instructions: '',
        videoUrl: null,
        imageUrl: null,
      },
    ])
  }

  const removeExercise = (idx: number) => {
    setExercises(exercises.filter((_, i) => i !== idx))
  }

  const updateExercise = (idx: number, patch: Partial<Exercise>) => {
    setExercises(exercises.map((e, i) => (i === idx ? { ...e, ...patch } : e)))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      await updateStrengthTemplate(id, {
        name,
        description,
        category,
        estimatedDurationMin: parseInt(duration) || 30,
        exercises,
      })
      router.replace(`/strength/templates/${id}`)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('このプロトコルを削除しますか？')) return
    await deleteStrengthTemplate(id)
    router.replace('/strength/templates')
  }

  if (loading) {
    return (
      <>
        <TopBar title="プロトコル編集" />
        <div className="flex h-32 items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
        </div>
      </>
    )
  }

  return (
    <>
      <TopBar title="プロトコル編集" />
      <div className="p-4 sm:p-6 max-w-3xl">
        <Link
          href={`/strength/templates/${id}`}
          className="inline-flex items-center gap-1 mb-4 text-sm text-slate-400 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          詳細に戻る
        </Link>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-6 space-y-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-300">プロトコル名</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-300">カテゴリ</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as StrengthCategory)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
                >
                  {STRENGTH_CATEGORY_GROUPS.map((group) => (
                    <optgroup key={group.label} label={group.label}>
                      {group.categories.map((cat) => (
                        <option key={cat} value={cat}>{STRENGTH_CATEGORY_LABELS[cat]}</option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-300">推定時間(分)</label>
                <input
                  type="number"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
                />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-300">説明</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
              />
            </div>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-semibold text-white">種目 ({exercises.length})</h2>
              <button
                type="button"
                onClick={addExercise}
                className="flex items-center gap-1 rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-700"
              >
                <Plus className="h-3 w-3" />
                追加
              </button>
            </div>

            <div className="space-y-3">
              {exercises.map((ex, idx) => (
                <div
                  key={ex.exerciseId}
                  className="rounded-lg border border-slate-700 bg-slate-950 p-4"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-bold text-slate-500">#{idx + 1}</span>
                    <input
                      type="text"
                      required
                      placeholder="種目名"
                      value={ex.name}
                      onChange={(e) => updateExercise(idx, { name: e.target.value })}
                      className="flex-1 rounded border border-slate-700 bg-slate-900 px-2 py-1.5 text-sm text-white"
                    />
                    <button
                      type="button"
                      onClick={() => removeExercise(idx)}
                      className="rounded p-1.5 text-slate-500 hover:bg-red-900/30 hover:text-red-400"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  <div className="grid grid-cols-4 gap-2">
                    <Field label="種別">
                      <select
                        value={ex.category}
                        onChange={(e) =>
                          updateExercise(idx, { category: e.target.value as ExerciseCategory })
                        }
                        className="w-full rounded border border-slate-700 bg-slate-900 px-2 py-1 text-xs text-white"
                      >
                        {Object.entries(EXERCISE_CATEGORY_LABELS).map(([k, v]) => (
                          <option key={k} value={k}>
                            {v}
                          </option>
                        ))}
                      </select>
                    </Field>
                    <Field label="セット">
                      <input
                        type="number"
                        value={ex.sets}
                        onChange={(e) =>
                          updateExercise(idx, { sets: parseInt(e.target.value) || 0 })
                        }
                        className="w-full rounded border border-slate-700 bg-slate-900 px-2 py-1 text-xs text-white"
                      />
                    </Field>
                    <Field label="回数">
                      <input
                        type="number"
                        value={ex.reps ?? ''}
                        onChange={(e) =>
                          updateExercise(idx, {
                            reps: e.target.value ? parseInt(e.target.value) : null,
                          })
                        }
                        className="w-full rounded border border-slate-700 bg-slate-900 px-2 py-1 text-xs text-white"
                      />
                    </Field>
                    <Field label="休息(秒)">
                      <input
                        type="number"
                        value={ex.restSec}
                        onChange={(e) =>
                          updateExercise(idx, { restSec: parseInt(e.target.value) || 0 })
                        }
                        className="w-full rounded border border-slate-700 bg-slate-900 px-2 py-1 text-xs text-white"
                      />
                    </Field>
                  </div>

                  <textarea
                    value={ex.instructions}
                    onChange={(e) => updateExercise(idx, { instructions: e.target.value })}
                    placeholder="指示"
                    rows={2}
                    className="mt-2 w-full rounded border border-slate-700 bg-slate-900 px-2 py-1.5 text-xs text-white"
                  />
                  <input
                    type="url"
                    value={ex.videoUrl ?? ''}
                    onChange={(e) =>
                      updateExercise(idx, { videoUrl: e.target.value || null })
                    }
                    placeholder="YouTube動画URL"
                    className="mt-2 w-full rounded border border-slate-700 bg-slate-900 px-2 py-1.5 text-xs text-white"
                  />
                  {ex.videoUrl && <YouTubeEmbed url={ex.videoUrl} />}
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-60"
            >
              {submitting ? '保存中...' : '保存'}
            </button>
            <button
              type="button"
              onClick={handleDelete}
              className="rounded-lg border border-red-700 bg-red-950/30 px-4 py-2.5 text-sm font-semibold text-red-400 hover:bg-red-900/30"
            >
              削除
            </button>
          </div>
        </form>
      </div>
    </>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-0.5 text-[10px] text-slate-500">{label}</p>
      {children}
    </div>
  )
}
