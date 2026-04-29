'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Users, Edit2, Copy } from 'lucide-react'
import { TopBar } from '@/components/layout/TopBar'
import { getStrengthTemplate, duplicateStrengthTemplate } from '@/lib/firebase/firestore'
import { YouTubeEmbed } from '@/components/strength/YouTubeEmbed'
import type { StrengthTemplate } from '@/types'
import { STRENGTH_CATEGORY_LABELS, EXERCISE_CATEGORY_LABELS } from '@/types'

export default function TemplateDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.templateId as string
  const [template, setTemplate] = useState<StrengthTemplate | null>(null)
  const [copying, setCopying] = useState(false)

  useEffect(() => {
    getStrengthTemplate(id).then(setTemplate)
  }, [id])

  const handleCopy = async () => {
    setCopying(true)
    try {
      const newId = await duplicateStrengthTemplate(id)
      if (newId) router.push(`/strength/templates/${newId}/edit`)
    } finally {
      setCopying(false)
    }
  }

  if (!template) {
    return (
      <>
        <TopBar title="テンプレート" />
        <div className="flex h-32 items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
        </div>
      </>
    )
  }

  return (
    <>
      <TopBar title={template.name} />
      <div className="p-4 sm:p-6 max-w-3xl space-y-4">
        <Link
          href="/strength/templates"
          className="inline-flex items-center gap-1 text-sm text-slate-400 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          一覧に戻る
        </Link>

        <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
          <h1 className="text-xl font-bold text-white">{template.name}</h1>
          <p className="mt-1 text-sm text-slate-400">
            {STRENGTH_CATEGORY_LABELS[template.category]} · 約{template.estimatedDurationMin}分
          </p>
          {template.description && (
            <p className="mt-3 text-sm text-slate-300">{template.description}</p>
          )}

          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              href={`/strength/templates/${id}/assign`}
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500"
            >
              <Users className="h-4 w-4" />
              選手に割り当て
            </Link>
            <Link
              href={`/strength/templates/${id}/edit`}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
            >
              <Edit2 className="h-4 w-4" />
              編集
            </Link>
            <button
              onClick={handleCopy}
              disabled={copying}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-60"
            >
              <Copy className="h-4 w-4" />
              {copying ? 'コピー中...' : 'コピーして新規作成'}
            </button>
          </div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
          <h2 className="text-base font-semibold text-white mb-3">種目 ({template.exercises.length})</h2>
          <ol className="space-y-2">
            {template.exercises.map((ex, idx) => (
              <li
                key={ex.exerciseId}
                className="flex items-start gap-3 rounded-lg border border-slate-800 bg-slate-950 p-3"
              >
                <span className="text-xs font-bold text-slate-500 mt-0.5">{idx + 1}.</span>
                <div className="flex-1">
                  <p className="text-sm font-medium text-white">{ex.name}</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {EXERCISE_CATEGORY_LABELS[ex.category]} · {ex.sets}セット × {ex.reps ?? ex.durationSec + '秒'} ・休息{ex.restSec}秒
                  </p>
                  {ex.instructions && (
                    <p className="mt-1 text-xs text-slate-400">{ex.instructions}</p>
                  )}
                  {ex.videoUrl && <YouTubeEmbed url={ex.videoUrl} />}
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </>
  )
}
