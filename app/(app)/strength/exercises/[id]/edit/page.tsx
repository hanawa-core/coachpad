'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { useAuth } from '@/components/providers/AuthProvider'
import { TopBar } from '@/components/layout/TopBar'
import { getExerciseLibraryItem, updateExerciseLibraryItem } from '@/lib/firebase/firestore'
import { STRENGTH_CATEGORY_LABELS, STRENGTH_CATEGORY_GROUPS, type StrengthCategory } from '@/types'

export default function EditExercisePage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string
  const { user } = useAuth()

  const [loading, setLoading] = useState(true)
  const [name, setName] = useState('')
  const [category, setCategory] = useState<StrengthCategory>('thigh')
  const [targetMuscles, setTargetMuscles] = useState('')
  const [instructions, setInstructions] = useState('')
  const [videoUrl, setVideoUrl] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    getExerciseLibraryItem(id).then((item) => {
      if (!item) return
      setName(item.name)
      // Handle legacy ExerciseCategory values gracefully
      const cat = item.category as string
      const validCats = Object.keys(STRENGTH_CATEGORY_LABELS)
      setCategory(validCats.includes(cat) ? (cat as StrengthCategory) : 'thigh')
      setTargetMuscles(item.targetMuscles.join('、'))
      setInstructions(item.instructions)
      setVideoUrl(item.videoUrl ?? '')
      setLoading(false)
    })
  }, [id])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    setSubmitting(true)
    try {
      await updateExerciseLibraryItem(id, {
        name,
        category,
        targetMuscles: targetMuscles
          .split(/[,、，]/)
          .map((s) => s.trim())
          .filter(Boolean),
        instructions,
        videoUrl: videoUrl || null,
      })
      router.replace('/strength/exercises')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <>
        <TopBar title="種目を編集" />
        <div className="flex h-32 items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
        </div>
      </>
    )
  }

  return (
    <>
      <TopBar title="種目を編集" />
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
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-300">カテゴリ（部位）</label>
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
