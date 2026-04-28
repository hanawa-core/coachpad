'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Plus, Dumbbell, Copy, Pencil, Trash2, Sparkles } from 'lucide-react'
import { useAuth } from '@/components/providers/AuthProvider'
import { TopBar } from '@/components/layout/TopBar'
import { getStrengthTemplates, duplicateStrengthTemplate, deleteStrengthTemplate } from '@/lib/firebase/firestore'
import type { StrengthTemplate } from '@/types'
import { STRENGTH_CATEGORY_LABELS } from '@/types'

export default function StrengthTemplatesPage() {
  const { user, profile } = useAuth()
  const router = useRouter()
  const [templates, setTemplates] = useState<StrengthTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [copying, setCopying] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return
    getStrengthTemplates(user.uid).then((t) => {
      setTemplates(t)
      setLoading(false)
    })
  }, [user])

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.preventDefault()
    e.stopPropagation()
    if (!confirm('このプロトコルを削除しますか？')) return
    setDeleting(id)
    try {
      await deleteStrengthTemplate(id)
      setTemplates((prev) => prev.filter((t) => t.id !== id))
    } finally {
      setDeleting(null)
    }
  }

  const handleCopy = async (e: React.MouseEvent, id: string) => {
    e.preventDefault()
    e.stopPropagation()
    setCopying(id)
    try {
      const newId = await duplicateStrengthTemplate(id)
      if (newId) {
        router.push(`/strength/templates/${newId}/edit`)
      }
    } finally {
      setCopying(null)
    }
  }

  if (profile?.role !== 'coach') {
    return (
      <>
        <TopBar title="プロトコル" />
        <div className="p-6">
          <p className="text-sm text-slate-400">この機能はコーチのみ利用できます</p>
        </div>
      </>
    )
  }

  return (
    <>
      <TopBar title="筋トレメニュー" />
      <div className="p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-end gap-2">
          <Link
            href="/strength/templates/ai"
            className="inline-flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-500"
          >
            <Sparkles className="h-4 w-4" />
            AIで生成
          </Link>
          <Link
            href="/strength/templates/new"
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500"
          >
            <Plus className="h-4 w-4" />
            新規作成
          </Link>
        </div>

        {loading ? (
          <div className="flex h-32 items-center justify-center">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
          </div>
        ) : templates.length === 0 ? (
          <div className="rounded-xl border border-slate-800 bg-slate-900 px-6 py-12 text-center">
            <Dumbbell className="mx-auto h-8 w-8 text-slate-600 mb-2" />
            <p className="text-sm text-slate-500">テンプレートがまだありません</p>
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {templates.map((t) => (
              <div
                key={t.id}
                className="rounded-xl border border-slate-800 bg-slate-900 p-5 hover:bg-slate-900/80 transition-colors relative"
              >
                <Link href={`/strength/templates/${t.id}`} className="block">
                  <h3 className="text-base font-semibold text-white pr-10">{t.name}</h3>
                  <p className="mt-1 text-xs text-slate-500">
                    {STRENGTH_CATEGORY_LABELS[t.category]} · {t.exercises.length}種目 · 約{t.estimatedDurationMin}分
                  </p>
                  {t.description && (
                    <p className="mt-2 text-sm text-slate-400 line-clamp-2">{t.description}</p>
                  )}
                </Link>
                <div className="absolute top-3 right-3 flex items-center gap-1">
                  <button
                    onClick={(e) => handleCopy(e, t.id)}
                    disabled={copying === t.id}
                    className="rounded p-1.5 text-slate-500 hover:bg-slate-700 hover:text-white disabled:opacity-50"
                    title="コピーして編集"
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); router.push(`/strength/templates/${t.id}/edit`) }}
                    className="rounded p-1.5 text-slate-500 hover:bg-slate-700 hover:text-white"
                    title="編集"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={(e) => handleDelete(e, t.id)}
                    disabled={deleting === t.id}
                    className="rounded p-1.5 text-slate-500 hover:bg-red-900/30 hover:text-red-400 disabled:opacity-50"
                    title="削除"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  )
}
