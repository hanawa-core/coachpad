'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Plus, Library, Sparkles, Trash2, Pencil, RefreshCw } from 'lucide-react'
import { useAuth } from '@/components/providers/AuthProvider'
import { TopBar } from '@/components/layout/TopBar'
import { useRouter } from 'next/navigation'
import {
  getExerciseLibrary,
  deleteExerciseLibraryItem,
} from '@/lib/firebase/firestore'
import { YouTubeEmbed } from '@/components/strength/YouTubeEmbed'
import type { ExerciseLibraryItem, StrengthCategory } from '@/types'
import { STRENGTH_CATEGORY_LABELS, STRENGTH_CATEGORY_GROUPS } from '@/types'

const ALL = 'all'
type Filter = typeof ALL | StrengthCategory

export default function ExerciseLibraryPage() {
  const { user, profile } = useAuth()
  const router = useRouter()
  const [items, setItems] = useState<ExerciseLibraryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [activeFilter, setActiveFilter] = useState<Filter>(ALL)
  const [reclassifying, setReclassifying] = useState(false)

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

  // 旧カテゴリ件数
  const LEGACY = ['lower_body', 'upper_body', 'core', 'mobility']
  const legacyCount = items.filter((i) => LEGACY.includes(i.category)).length

  // AI再分類
  const handleReclassify = async () => {
    if (!user) return
    if (!confirm(`${legacyCount}件の種目をAIで自動分類します。よろしいですか？`)) return
    setReclassifying(true)
    try {
      const token = await user.getIdToken()
      const res = await fetch('/api/ai/reclassify-exercises', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ coachId: user.uid }),
      })
      const data = await res.json()
      if (data.ok) {
        alert(`${data.updated}件を新カテゴリに分類しました`)
        reload()
      } else {
        alert('エラーが発生しました: ' + data.error)
      }
    } finally {
      setReclassifying(false)
    }
  }

  // カテゴリ別カウント
  const countByCategory = (cat: StrengthCategory) =>
    items.filter((i) => i.category === cat).length

  // フィルター済みリスト
  const filtered = activeFilter === ALL
    ? items
    : items.filter((i) => i.category === activeFilter)

  return (
    <>
      <TopBar title="種目ライブラリ" />
      <div className="p-6 space-y-4">
        {/* ヘッダー */}
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

        {/* 旧カテゴリ再分類バナー */}
        {!loading && legacyCount > 0 && (
          <div className="flex items-center justify-between rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3">
            <div>
              <p className="text-sm font-medium text-amber-300">
                旧カテゴリの種目が {legacyCount} 件あります
              </p>
              <p className="text-xs text-amber-400/70 mt-0.5">
                AIが種目名・対象筋肉・説明から新カテゴリに自動分類します
              </p>
            </div>
            <button
              onClick={handleReclassify}
              disabled={reclassifying}
              className="inline-flex items-center gap-2 rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-white hover:bg-amber-400 disabled:opacity-60 shrink-0 ml-4"
            >
              <RefreshCw className={`h-4 w-4 ${reclassifying ? 'animate-spin' : ''}`} />
              {reclassifying ? '分類中...' : 'AIで再分類'}
            </button>
          </div>
        )}

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
          <>
            {/* カテゴリフィルタータブ（グループ表示） */}
            <div className="space-y-2">
              {/* すべて */}
              <button
                onClick={() => setActiveFilter(ALL)}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                  activeFilter === ALL
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'
                }`}
              >
                すべて
                <span className={`ml-1.5 ${activeFilter === ALL ? 'text-emerald-200' : 'text-slate-500'}`}>
                  {items.length}
                </span>
              </button>

              {/* グループ別タブ */}
              {STRENGTH_CATEGORY_GROUPS.map((group) => {
                const groupCats = group.categories.filter((c) => countByCategory(c) > 0)
                // 旧カテゴリデータがある場合も表示
                const legacyCats: StrengthCategory[] = ['lower_body', 'upper_body', 'core', 'mobility']
                const extraLegacy = group.label === '動作パターン'
                  ? legacyCats.filter((c) => countByCategory(c) > 0)
                  : []
                const allCats = [...groupCats, ...extraLegacy]
                if (allCats.length === 0) return null
                return (
                  <div key={group.label} className="flex flex-wrap items-center gap-1.5">
                    <span className="text-xs text-slate-600 font-medium w-16 shrink-0">{group.label}</span>
                    {allCats.map((cat) => {
                      const count = countByCategory(cat)
                      return (
                        <button
                          key={cat}
                          onClick={() => setActiveFilter(cat)}
                          className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                            activeFilter === cat
                              ? 'bg-emerald-600 text-white'
                              : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'
                          }`}
                        >
                          {STRENGTH_CATEGORY_LABELS[cat]}
                          <span className={`ml-1.5 ${activeFilter === cat ? 'text-emerald-200' : 'text-slate-500'}`}>
                            {count}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                )
              })}
            </div>

            {/* 種目一覧 */}
            {filtered.length === 0 ? (
              <p className="text-sm text-slate-500 py-4">このカテゴリの種目はまだありません</p>
            ) : (
              <div className="grid gap-3 md:grid-cols-2">
                {filtered.map((ex) => (
                  <div
                    key={ex.id}
                    className="rounded-xl border border-slate-800 bg-slate-900 p-4"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-base font-semibold text-white truncate">{ex.name}</h3>
                        <p className="mt-0.5 text-xs text-slate-500">
                          {STRENGTH_CATEGORY_LABELS[ex.category] ?? ex.category}
                          {ex.targetMuscles.length > 0 && (
                            <span className="text-slate-400"> · {ex.targetMuscles.join('・')}</span>
                          )}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
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
          </>
        )}
      </div>
    </>
  )
}
