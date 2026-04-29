'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Sparkles, ChevronDown, ChevronUp } from 'lucide-react'
import { v4 as uuidv4 } from 'uuid'
import { useAuth } from '@/components/providers/AuthProvider'
import { TopBar } from '@/components/layout/TopBar'
import { createStrengthTemplate } from '@/lib/firebase/firestore'
import { STRENGTH_CATEGORY_LABELS } from '@/types'
import type { StrengthCategory } from '@/types'

interface GeneratedExercise {
  name: string
  category: StrengthCategory
  targetMuscles: string[]
  defaultSets: number
  defaultReps: number | null
  defaultDurationSec: number | null
  defaultRestSec: number
  defaultWeight: number | null
  instructions: string
}

interface GeneratedTemplate {
  name: string
  description: string
  category: StrengthCategory
  estimatedDurationMin: number
  exercises: GeneratedExercise[]
}

const PRESETS = [
  '100kmレース向け下半身強化（自体重・40分）',
  'ヒップ強化と腸腰筋アクティベーション',
  '体幹・コア強化（ランナー向け・30分）',
  '足首・下腿の安定性と怪我予防',
  '上半身・肩甲骨周りの補強',
  '大会前週の軽めコンディショニング',
]

export default function AITemplateGeneratorPage() {
  const router = useRouter()
  const { user, profile } = useAuth()

  const [prompt, setPrompt] = useState('')
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState<GeneratedTemplate | null>(null)
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  if (profile?.role !== 'coach') {
    return (
      <>
        <TopBar title="AIでプロトコル生成" />
        <div className="p-4 sm:p-6">
          <p className="text-sm text-slate-400">この機能はコーチのみ利用できます</p>
        </div>
      </>
    )
  }

  const handleGenerate = async () => {
    if (!user || prompt.length < 3) return
    setError('')
    setResult(null)
    setSaved(false)
    setGenerating(true)
    try {
      const idToken = await user.getIdToken()
      const res = await fetch('/api/ai/generate-strength-template', {
        method: 'POST',
        headers: { Authorization: `Bearer ${idToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      })
      let data: any
      try { data = await res.json() } catch { throw new Error('サーバーエラーが発生しました') }
      if (!res.ok) throw new Error(data?.error || 'エラーが発生しました')
      setResult(data.template)
      setExpandedIdx(null)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setGenerating(false)
    }
  }

  const handleSave = async () => {
    if (!user || !result) return
    setSaving(true)
    try {
      await createStrengthTemplate({
        coachId: user.uid,
        name: result.name,
        description: result.description,
        category: result.category,
        targetMuscles: [],
        estimatedDurationMin: result.estimatedDurationMin,
        isPublic: false,
        exercises: result.exercises.map((ex, i) => ({
          exerciseId: uuidv4(),
          order: i,
          name: ex.name,
          category: ex.category as any,
          sets: ex.defaultSets,
          reps: ex.defaultReps,
          durationSec: ex.defaultDurationSec,
          restSec: ex.defaultRestSec,
          targetWeight: ex.defaultWeight,
          instructions: ex.instructions,
          videoUrl: null,
          imageUrl: null,
        })),
      })
      setSaved(true)
      setTimeout(() => router.replace('/strength/templates'), 1500)
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <TopBar title="AIでプロトコル生成" />
      <div className="p-4 sm:p-6 max-w-3xl space-y-4">
        <Link
          href="/strength/templates"
          className="inline-flex items-center gap-1 text-sm text-slate-400 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          一覧に戻る
        </Link>

        {/* 入力パネル */}
        <div className="rounded-xl border border-purple-700/50 bg-purple-950/20 p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-400" />
            <h2 className="text-base font-semibold text-white">AIでプロトコルを生成</h2>
          </div>
          <p className="text-sm text-slate-400">
            欲しいメニューの特徴を文章で指示するとAIが種目・セット数・回数まで作成します。
          </p>

          {/* プリセット */}
          <div>
            <p className="text-xs text-slate-500 mb-2">よくあるリクエスト:</p>
            <div className="flex flex-wrap gap-2">
              {PRESETS.map((p) => (
                <button
                  key={p}
                  onClick={() => setPrompt(p)}
                  className="rounded-full border border-slate-700 bg-slate-900 px-3 py-1 text-xs text-slate-300 hover:border-purple-600 hover:text-white transition-colors"
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="例: 100マイルレース向け、膝の安定性重視、ジムで45分、ダンベルあり"
            rows={3}
            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white placeholder-slate-500"
          />

          <button
            onClick={handleGenerate}
            disabled={generating || prompt.length < 3}
            className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-purple-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-purple-500 disabled:opacity-60"
          >
            <Sparkles className={`h-4 w-4 ${generating ? 'animate-spin' : ''}`} />
            {generating ? 'AI生成中...' : 'プロトコルを生成する'}
          </button>

          {error && (
            <p className="rounded-lg bg-red-900/40 border border-red-800 px-3 py-2 text-sm text-red-400">
              エラー: {error}
            </p>
          )}
        </div>

        {/* 生成結果プレビュー */}
        {result && (
          <div className="space-y-4">
            {/* テンプレート概要 */}
            <div className="rounded-xl border border-emerald-700/40 bg-emerald-950/10 p-5 space-y-1">
              <h3 className="text-base font-bold text-white">{result.name}</h3>
              <p className="text-xs text-slate-400">{result.description}</p>
              <div className="flex gap-3 pt-1 text-xs text-slate-500">
                <span>{STRENGTH_CATEGORY_LABELS[result.category] ?? result.category}</span>
                <span>·</span>
                <span>{result.exercises.length} 種目</span>
                <span>·</span>
                <span>約 {result.estimatedDurationMin} 分</span>
              </div>
            </div>

            {/* 種目リスト（アコーディオン） */}
            <div className="space-y-2">
              {result.exercises.map((ex, idx) => (
                <div
                  key={idx}
                  className="rounded-xl border border-slate-800 bg-slate-900 overflow-hidden"
                >
                  <button
                    onClick={() => setExpandedIdx(expandedIdx === idx ? null : idx)}
                    className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-slate-800/50 transition-colors"
                  >
                    <div>
                      <span className="text-xs text-slate-500 mr-2">{idx + 1}.</span>
                      <span className="text-sm font-medium text-white">{ex.name}</span>
                      <span className="ml-2 text-xs text-slate-500">
                        {ex.defaultSets}セット ×{' '}
                        {ex.defaultReps ? `${ex.defaultReps}回` : `${ex.defaultDurationSec}秒`}
                        {ex.defaultWeight ? ` / ${ex.defaultWeight}kg` : ''}
                      </span>
                    </div>
                    {expandedIdx === idx
                      ? <ChevronUp className="h-4 w-4 text-slate-500 shrink-0" />
                      : <ChevronDown className="h-4 w-4 text-slate-500 shrink-0" />
                    }
                  </button>
                  {expandedIdx === idx && (
                    <div className="px-4 pb-3 border-t border-slate-800 pt-3 space-y-1">
                      <p className="text-xs text-slate-500">
                        {STRENGTH_CATEGORY_LABELS[ex.category] ?? ex.category}
                        {ex.targetMuscles.length > 0 && ` · ${ex.targetMuscles.join('・')}`}
                        {` · 休息 ${ex.defaultRestSec}秒`}
                      </p>
                      <p className="text-xs text-slate-300 whitespace-pre-wrap">{ex.instructions}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* 保存ボタン */}
            {saved ? (
              <p className="text-center text-sm text-emerald-400">保存しました！一覧に戻ります...</p>
            ) : (
              <button
                onClick={handleSave}
                disabled={saving}
                className="w-full rounded-lg bg-emerald-600 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-60"
              >
                {saving ? '保存中...' : 'このプロトコルを保存する'}
              </button>
            )}
          </div>
        )}
      </div>
    </>
  )
}
