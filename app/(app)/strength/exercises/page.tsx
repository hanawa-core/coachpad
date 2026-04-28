'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Plus, Library, Sparkles, Trash2, Pencil } from 'lucide-react'
import { useAuth } from '@/components/providers/AuthProvider'
import { TopBar } from '@/components/layout/TopBar'
import { useRouter } from 'next/navigation'
import {
  getExerciseLibrary,
  deleteExerciseLibraryItem,
} from '@/lib/firebase/firestore'
import { YouTubeEmbed } from '@/components/strength/YouTubeEmbed'
import type { ExerciseLibraryItem } from '@/types'
import { STRENGTH_CATEGORY_LABELS } from '@/types'

export default function ExerciseLibraryPage() {
  const { user, profile } = useAuth()
  const router = useRouter()
  const [items, setItems] = useState<ExerciseLibraryItem[]>([])
  const [loading, setLoading] = useState(true)

  const reload = async () => {
    if (!user) return
    setLoading(true)
    const data = await getExerciseLibrary(user.uid)
    setItems(data)
    setLoading(false)
  }

  useEffect(() => {
    reload()
  }, [user])

  if (profile?.role !== 'coach') {
    return (
      <>
        <TopBar title="種目ライブラリ" />
        <div className="p-6">
          <p className="text-sm text-slate-400">この機能はコーチのみ利用できます</p>
        </div>
      </>
    )
  }

  const handleDelete = async (id: string) => {
    if (!confirm('この種目を削除しますか？')) return
    await deleteExerciseLibraryItem(id)
    reload()
  }

  return (
    <>
      <TopBar title="種目ライブラリ" />
      <div className="p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm text-slate-400">
            登録済み種目: <span className="font-semibold text-white">{items.length}</span> 件
          </p>
          <div className="flex gap-2">
            <Link
              href="/strength/exercises/ai"
              className="inline-flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-500"
            >
              <Sparkles className="h-4 w-4" />
              AIで一括追加
            </Link>
            <Link
              href="/strength/exercises/new"
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500"
            >
              <Plus className="h-4 w-4" />
              手動で追加
            </Link>
          </div>
        </div>

        {loading ? (
          <div className="flex h-32 items-center justify-center">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-xl border border-slate-800 bg-slate-900 px-6 py-12 text-center">
            <Library className="mx-auto h-8 w-8 text-slate-600 mb-2" />
            <p className="text-sm text-slate-500">種目がまだ登録されていません</p>
            <p className="mt-1 text-xs text-slate-600">「AIで一括追加」で素早く始められます</p>
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {items.map((ex) => (
              <div
                key={ex.id}
                className="rounded-xl border border-slate-800 bg-slate-900 p-4"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <h3 className="text-base font-semibold text-white">{ex.name}</h3>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {STRENGTH_CATEGORY_LABELS[ex.category] ?? ex.category}
                      {ex.targetMuscles.length > 0 && (
                        <span className="text-slate-400"> · {ex.targetMuscles.join('・')}</span>
                      )}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => router.push(`/strength/exercises/${ex.id}/edit`)}
                      className="rounded p-1 text-slate-500 hover:bg-slate-700 hover:text-white"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(ex.id)}
                      className="rounded p-1 text-slate-500 hover:bg-red-900/30 hover:text-red-400"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
                {ex.instructions && (
                  <p className="mt-2 text-xs text-slate-300 line-clamp-3 whitespace-pre-wrap">
                    {ex.instructions}
                  </p>
                )}
                {ex.videoUrl && <YouTubeEmbed url={ex.videoUrl} />}
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  )
}
