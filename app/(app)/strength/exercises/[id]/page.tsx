'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Pencil, Copy, Trash2 } from 'lucide-react'
import { useAuth } from '@/components/providers/AuthProvider'
import { TopBar } from '@/components/layout/TopBar'
import {
  getExerciseLibraryItem,
  deleteExerciseLibraryItem,
  duplicateExerciseLibraryItem,
} from '@/lib/firebase/firestore'
import { YouTubeEmbed } from '@/components/strength/YouTubeEmbed'
import { STRENGTH_CATEGORY_LABELS } from '@/types'
import type { ExerciseLibraryItem } from '@/types'

export default function ExerciseDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string
  const { profile } = useAuth()
  const [item, setItem] = useState<ExerciseLibraryItem | null>(null)
  const [loading, setLoading] = useState(true)
  const [duplicating, setDuplicating] = useState(false)

  useEffect(() => {
    getExerciseLibraryItem(id).then((data) => {
      setItem(data)
      setLoading(false)
    })
  }, [id])

  const handleDelete = async () => {
    if (!confirm('この種目を削除しますか？')) return
    await deleteExerciseLibraryItem(id)
    router.replace('/strength/exercises')
  }

  const handleDuplicate = async () => {
    setDuplicating(true)
    try {
      const newId = await duplicateExerciseLibraryItem(id)
      if (newId) router.push(`/strength/exercises/${newId}/edit`)
    } finally {
      setDuplicating(false)
    }
  }

  if (loading) {
    return (
      <>
        <TopBar title="種目詳細" />
        <div className="flex h-32 items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
        </div>
      </>
    )
  }

  if (!item) {
    return (
      <>
        <TopBar title="種目詳細" />
        <div className="p-4 sm:p-6">
          <Link href="/strength/exercises" className="inline-flex items-center gap-1 text-sm text-slate-400 hover:text-white mb-4">
            <ArrowLeft className="h-4 w-4" />
            種目ライブラリ
          </Link>
          <p className="text-sm text-slate-400">種目が見つかりません</p>
        </div>
      </>
    )
  }

  const isCoach = profile?.role === 'coach'
  const isOwner = isCoach && profile?.uid === item.coachId

  return (
    <>
      <TopBar title="種目詳細" />
      <div className="p-4 sm:p-6 max-w-3xl space-y-4">
        <Link
          href="/strength/exercises"
          className="inline-flex items-center gap-1 text-sm text-slate-400 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          種目ライブラリに戻る
        </Link>

        {/* タイトル */}
        <div className="space-y-3">
          <h1 className="text-2xl sm:text-3xl font-bold text-white break-words leading-tight">
            {item.name}
          </h1>
          <div className="flex flex-wrap gap-1.5">
            <span className="inline-flex rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-semibold text-emerald-300">
              {STRENGTH_CATEGORY_LABELS[item.category] ?? item.category}
            </span>
            {item.targetMuscles.map((m) => (
              <span
                key={m}
                className="inline-flex rounded-full bg-slate-800 px-3 py-1 text-xs font-medium text-slate-300"
              >
                {m}
              </span>
            ))}
          </div>
          {isOwner && (
            <div className="flex flex-wrap gap-2">
              <button
                onClick={handleDuplicate}
                disabled={duplicating}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-700 disabled:opacity-50"
              >
                <Copy className="h-3.5 w-3.5" />
                複製
              </button>
              <Link
                href={`/strength/exercises/${id}/edit`}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-700"
              >
                <Pencil className="h-3.5 w-3.5" />
                編集
              </Link>
              <button
                onClick={handleDelete}
                className="inline-flex items-center gap-1.5 rounded-lg border border-red-900/40 bg-red-950/30 px-3 py-1.5 text-xs font-medium text-red-300 hover:bg-red-900/40"
              >
                <Trash2 className="h-3.5 w-3.5" />
                削除
              </button>
            </div>
          )}
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900 p-5 sm:p-6 space-y-4">

          {/* 動画 */}
          {item.videoUrl && (
            <div>
              <h2 className="mb-2 text-xs font-semibold text-slate-400 uppercase tracking-wide">解説動画</h2>
              <YouTubeEmbed url={item.videoUrl} />
            </div>
          )}

          {/* 説明 */}
          {item.instructions && (
            <div>
              <h2 className="mb-2 text-xs font-semibold text-slate-400 uppercase tracking-wide">説明・実施方法</h2>
              <p className="whitespace-pre-wrap break-words text-sm text-slate-200 leading-relaxed">
                {item.instructions}
              </p>
            </div>
          )}

          {/* デフォルト設定（後方互換フィールド）*/}
          {(item.defaultSets != null ||
            item.defaultReps != null ||
            item.defaultDurationSec != null ||
            item.defaultRestSec != null ||
            item.defaultWeight != null) && (
            <div>
              <h2 className="mb-2 text-xs font-semibold text-slate-400 uppercase tracking-wide">デフォルト設定</h2>
              <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4 text-sm">
                {item.defaultSets != null && (
                  <DataCell label="セット数" value={`${item.defaultSets}`} />
                )}
                {item.defaultReps != null && (
                  <DataCell label="レップ数" value={`${item.defaultReps}`} />
                )}
                {item.defaultDurationSec != null && (
                  <DataCell label="実施時間" value={`${item.defaultDurationSec}秒`} />
                )}
                {item.defaultRestSec != null && (
                  <DataCell label="休息" value={`${item.defaultRestSec}秒`} />
                )}
                {item.defaultWeight != null && (
                  <DataCell label="重量" value={`${item.defaultWeight}kg`} />
                )}
              </dl>
            </div>
          )}

          {!item.videoUrl && !item.instructions && (
            <p className="text-sm text-slate-500 py-4 text-center">
              この種目には説明や動画がまだ登録されていません
            </p>
          )}
        </div>
      </div>
    </>
  )
}

function DataCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-slate-950 px-3 py-2">
      <dt className="text-[10px] text-slate-500">{label}</dt>
      <dd className="mt-0.5 text-sm font-semibold text-white">{value}</dd>
    </div>
  )
}
