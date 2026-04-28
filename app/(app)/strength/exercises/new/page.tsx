'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { useAuth } from '@/components/providers/AuthProvider'
import { TopBar } from '@/components/layout/TopBar'
import { createExerciseLibraryItem } from '@/lib/firebase/firestore'
import { EXERCISE_CATEGORY_LABELS, type ExerciseCategory } from '@/types'

export default function NewExercisePage() {
  const router = useRouter()
  const { user } = useAuth()

  const [name, setName] = useState('')
  const [category, setCategory] = useState<ExerciseCategory>('bodyweight')
  const [targetMuscles, setTargetMuscles] = useState('')
  const [sets, setSets] = useState('3')
  const [reps, setReps] = useState('10')
  const [restSec, setRestSec] = useState('60')
  const [weight, setWeight] = useState('')
  const [duration, setDuration] = useState('')
  const [instructions, setInstructions] = useState('')
  const [videoUrl, setVideoUrl] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    setSubmitting(true)
    try {
      await createExerciseLibraryItem({
        coachId: user.uid,
        name,
        category,
        targetMuscles: targetMuscles
          .split(/[,、，]/)
          .map((s) => s.trim())
          .filter(Boolean),
        defaultSets: parseInt(sets) || 3,
        defaultReps: reps ? parseInt(reps) : null,
        defaultDurationSec: duration ? parseInt(duration) : null,
        defaultRestSec: parseInt(restSec) || 60,
        defaultWeight: weight ? parseFloat(weight) : null,
        instructions,
        videoUrl: videoUrl || null,
        imageUrl: null,
      })
      router.replace('/strength/exercises')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <TopBar title="種目を追加" />
      <div className="p-6 max-w-2xl">
        <Link
          href="/strength/exercises"
          className="inline-flex items-center gap-1 mb-4 text-sm text-slate-400 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          一覧に戻る
        </Link>

        <form
          onSubmit={handleSubmit}
          className="space-y-4 rounded-xl border border-slate-800 bg-slate-900 p-6"
        >
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-300">種目名</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="例: シングルレッグスクワット"
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-300">カテゴリ</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as ExerciseCategory)}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
              >
                {Object.entries(EXERCISE_CATEGORY_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-300">対象部位（カンマ区切り）</label>
              <input
                type="text"
                value={targetMuscles}
                onChange={(e) => setTargetMuscles(e.target.value)}
                placeholder="例: 大腿四頭筋、臀筋"
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-300">セット数</label>
              <input
                type="number"
                value={sets}
                onChange={(e) => setSets(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-300">回数</label>
              <input
                type="number"
                value={reps}
                onChange={(e) => setReps(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-300">休息(秒)</label>
              <input
                type="number"
                value={restSec}
                onChange={(e) => setRestSec(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-300">時間(秒・任意)</label>
              <input
                type="number"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                placeholder="プランクなど時間制の場合"
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-300">推奨重量(kg・任意)</label>
              <input
                type="number"
                step="0.5"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-300">指示・フォームのポイント</label>
            <textarea
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              rows={4}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-300">YouTube動画URL（任意）</label>
            <input
              type="url"
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              placeholder="https://youtu.be/xxx"
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-60"
          >
            {submitting ? '保存中...' : '保存'}
          </button>
        </form>
      </div>
    </>
  )
}
