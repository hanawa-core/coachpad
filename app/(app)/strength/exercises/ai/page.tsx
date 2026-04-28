'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Sparkles, Check } from 'lucide-react'
import { useAuth } from '@/components/providers/AuthProvider'
import { TopBar } from '@/components/layout/TopBar'
import { createExerciseLibraryItem } from '@/lib/firebase/firestore'
import { EXERCISE_CATEGORY_LABELS, type ExerciseCategory } from '@/types'

interface GeneratedExercise {
  name: string
  category: ExerciseCategory
  targetMuscles: string[]
  defaultSets: number
  defaultReps: number | null
  defaultDurationSec: number | null
  defaultRestSec: number
  defaultWeight: number | null
  instructions: string
}

const PRESETS = [
  'トレイルランナー向けの基本下半身強化メニュー',
  '体幹・コア強化（ランナー向け）',
  'ヒップ強化と腸腰筋アクティベーション',
  '怪我予防のためのモビリティ・補強種目',
  '短時間で済む自体重メニュー',
]

export default function AIExerciseGeneratorPage() {
  const router = useRouter()
  const { user, profile } = useAuth()

  const [prompt, setPrompt] = useState('')
  const [count, setCount] = useState(8)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState('')
  const [exercises, setExercises] = useState<GeneratedExercise[]>([])
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [saving, setSaving] = useState(false)

  if (profile?.role !== 'coach') {
    return (
      <>
        <TopBar title="AI 種目生成" />
        <div className="p-6">
          <p className="text-sm text-slate-400">この機能はコーチのみ利用できます</p>
        </div>
      </>
    )
  }

  const handleGenerate = async () => {
    if (!user) return
    setError('')
    setExercises([])
    setSelected(new Set())
    setGenerating(true)
    try {
      const idToken = await user.getIdToken()
      const res = await fetch('/api/ai/generate-exercise-library', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${idToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt, count }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'エラーが発生しました')
      setExercises(data.exercises)
      // デフォルトで全選択
      setSelected(new Set(data.exercises.map((_: any, i: number) => i)))
    } catch (e: any) {
      setError(e.message)
    } finally {
      setGenerating(false)
    }
  }

  const toggle = (idx: number) => {
    const next = new Set(selected)
    if (next.has(idx)) next.delete(idx)
    else next.add(idx)
    setSelected(next)
  }

  const handleSaveAll = async () => {
    if (!user) return
    setSaving(true)
    try {
      const items = Array.from(selected).map((idx) => exercises[idx])
      for (const ex of items) {
        await createExerciseLibraryItem({
          coachId: user.uid,
          name: ex.name,
          category: ex.category,
          targetMuscles: ex.targetMuscles,
          defaultSets: ex.defaultSets,
          defaultReps: ex.defaultReps,
          defaultDurationSec: ex.defaultDurationSec,
          defaultRestSec: ex.defaultRestSec,
          defaultWeight: ex.defaultWeight,
          instructions: ex.instructions,
          videoUrl: null,
          imageUrl: null,
        })
      }
      router.replace('/strength/exercises')
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <TopBar title="AI 種目生成" />
      <div className="p-6 max-w-3xl space-y-4">
        <Link
          href="/strength/exercises"
          className="inline-flex items-center gap-1 text-sm text-slate-400 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          種目ライブラリ
        </Link>

        <div className="rounded-xl border border-purple-700/50 bg-purple-950/20 p-6">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="h-5 w-5 text-purple-400" />
            <h2 className="text-base font-semibold text-white">AIで種目を一括生成</h2>
          </div>
          <p className="text-sm text-slate-400 mb-4">
            欲しい種目の特徴を文章で指示するとAIが提案します。生成後、保存する種目を選んでください。
          </p>

          {/* プリセット */}
          <div className="mb-3">
            <p className="text-xs text-slate-500 mb-2">よくあるリクエスト:</p>
            <div className="flex flex-wrap gap-2">
              {PRESETS.map((p) => (
                <button
                  key={p}
                  onClick={() => setPrompt(p)}
                  className="rounded-full border border-slate-700 bg-slate-900 px-3 py-1 text-xs text-slate-300 hover:border-purple-600 hover:text-white"
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="例: 100マイルレース向けの脚作り。膝の安定性を重視。自体重とダンベルで。"
              rows={3}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white placeholder-slate-500"
            />

            <div className="flex items-center gap-3">
              <label className="text-xs text-slate-400">生成数:</label>
              <input
                type="number"
                value={count}
                onChange={(e) => setCount(parseInt(e.target.value) || 1)}
                min={1}
                max={20}
                className="w-20 rounded border border-slate-700 bg-slate-950 px-2 py-1 text-sm text-white"
              />
              <button
                onClick={handleGenerate}
                disabled={generating || prompt.length < 3}
                className="ml-auto inline-flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-sm font-semibold text-white hover:bg-purple-500 disabled:opacity-60"
              >
                <Sparkles className={`h-4 w-4 ${generating ? 'animate-spin' : ''}`} />
                {generating ? 'AI生成中...' : '生成する'}
              </button>
            </div>

            {error && (
              <p className="rounded-lg bg-red-900/40 border border-red-800 px-3 py-2 text-sm text-red-400">
                エラー: {error}
              </p>
            )}
          </div>
        </div>

        {/* 生成結果 */}
        {exercises.length > 0 && (
          <>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white">
                提案結果 ({selected.size} / {exercises.length} 件選択中)
              </h3>
              <div className="flex gap-2">
                <button
                  onClick={() => setSelected(new Set(exercises.map((_, i) => i)))}
                  className="text-xs text-slate-400 hover:text-white"
                >
                  全選択
                </button>
                <button
                  onClick={() => setSelected(new Set())}
                  className="text-xs text-slate-400 hover:text-white"
                >
                  全解除
                </button>
              </div>
            </div>

            <ul className="space-y-2">
              {exercises.map((ex, idx) => (
                <li key={idx}>
                  <button
                    onClick={() => toggle(idx)}
                    className={`w-full rounded-xl border p-4 text-left transition-colors ${
                      selected.has(idx)
                        ? 'border-purple-600 bg-purple-950/20'
                        : 'border-slate-800 bg-slate-900 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <span
                        className={`mt-0.5 flex h-5 w-5 items-center justify-center rounded border ${
                          selected.has(idx)
                            ? 'border-purple-500 bg-purple-600 text-white'
                            : 'border-slate-600 bg-slate-950'
                        }`}
                      >
                        {selected.has(idx) && <Check className="h-3 w-3" />}
                      </span>
                      <div className="flex-1">
                        <h4 className="text-sm font-semibold text-white">{ex.name}</h4>
                        <p className="mt-0.5 text-xs text-slate-500">
                          {EXERCISE_CATEGORY_LABELS[ex.category]}
                          {ex.targetMuscles.length > 0 && (
                            <span> · {ex.targetMuscles.join('・')}</span>
                          )}
                        </p>
                        <p className="mt-1 text-xs text-slate-400">
                          {ex.defaultSets}セット
                          {ex.defaultReps && ` × ${ex.defaultReps}回`}
                          {ex.defaultDurationSec && ` × ${ex.defaultDurationSec}秒`}
                          ・休息 {ex.defaultRestSec}秒
                          {ex.defaultWeight != null && ` ・推奨 ${ex.defaultWeight}kg`}
                        </p>
                        <p className="mt-2 text-xs text-slate-300 whitespace-pre-wrap">
                          {ex.instructions}
                        </p>
                      </div>
                    </div>
                  </button>
                </li>
              ))}
            </ul>

            <button
              onClick={handleSaveAll}
              disabled={saving || selected.size === 0}
              className="w-full rounded-lg bg-emerald-600 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-60"
            >
              {saving ? '保存中...' : `選択中の ${selected.size} 件をライブラリに追加`}
            </button>
          </>
        )}
      </div>
    </>
  )
}
