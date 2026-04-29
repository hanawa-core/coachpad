'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Plus, Trash2, Sparkles } from 'lucide-react'
import { v4 as uuidv4 } from 'uuid'
import { useAuth } from '@/components/providers/AuthProvider'
import { TopBar } from '@/components/layout/TopBar'
import { createStrengthTemplate } from '@/lib/firebase/firestore'
import {
  STRENGTH_CATEGORY_LABELS,
  STRENGTH_CATEGORY_GROUPS,
  EXERCISE_CATEGORY_LABELS,
  type StrengthCategory,
  type ExerciseCategory,
  type Exercise,
} from '@/types'

export default function NewTemplatePage() {
  const router = useRouter()
  const { user, profile } = useAuth()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState<StrengthCategory>('lower_body')
  const [duration, setDuration] = useState('30')
  const [exercises, setExercises] = useState<Exercise[]>([
    {
      exerciseId: uuidv4(),
      order: 0,
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
  const [submitting, setSubmitting] = useState(false)

  // AI生成用
  const [aiPrompt, setAiPrompt] = useState('')
  const [aiGenerating, setAiGenerating] = useState(false)
  const [aiError, setAiError] = useState('')

  const handleAIGenerate = async () => {
    if (!user) return
    setAiError('')
    setAiGenerating(true)
    try {
      const idToken = await user.getIdToken()
      const res = await fetch('/api/ai/generate-strength-template', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${idToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt: aiPrompt }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'エラー')
      // フォームに反映
      const t = data.template
      setName(t.name)
      setDescription(t.description)
      setCategory(t.category)
      setDuration(String(t.estimatedDurationMin))
      setExercises(
        t.exercises.map((ex: any, i: number) => ({
          exerciseId: uuidv4(),
          order: i,
          name: ex.name,
          category: ex.category,
          sets: ex.defaultSets,
          reps: ex.defaultReps,
          durationSec: ex.defaultDurationSec,
          restSec: ex.defaultRestSec,
          targetWeight: ex.defaultWeight,
          instructions: ex.instructions,
          videoUrl: null,
          imageUrl: null,
        }))
      )
    } catch (e: any) {
      setAiError(e.message)
    } finally {
      setAiGenerating(false)
    }
  }

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
    if (!user) return
    setSubmitting(true)
    try {
      await createStrengthTemplate({
        coachId: user.uid,
        name,
        description,
        category,
        targetMuscles: [],
        estimatedDurationMin: parseInt(duration),
        isPublic: false,
        exercises,
      })
      router.replace('/strength/templates')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <TopBar title="プロトコル作成" />
      <div className="p-4 sm:p-6 max-w-3xl">
        <Link
          href="/strength/templates"
          className="inline-flex items-center gap-1 mb-4 text-sm text-slate-400 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          一覧に戻る
        </Link>

        {/* AIで作成 */}
        <div className="mb-4 rounded-xl border border-purple-700/50 bg-purple-950/20 p-5">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="h-4 w-4 text-purple-400" />
            <h2 className="text-sm font-semibold text-white">AIでメニュー作成</h2>
          </div>
          <p className="text-xs text-slate-400 mb-3">
            欲しいメニューの特徴を文章で指示するとAIがフォームを自動入力します
          </p>
          <div className="flex gap-2">
            <input
              type="text"
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              placeholder="例: 100kmレース向け、下半身強化、ジムで45分"
              className="flex-1 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white placeholder-slate-500"
            />
            <button
              type="button"
              onClick={handleAIGenerate}
              disabled={aiGenerating || aiPrompt.length < 3}
              className="inline-flex items-center gap-1 rounded-lg bg-purple-600 px-4 py-2 text-sm font-semibold text-white hover:bg-purple-500 disabled:opacity-60"
            >
              <Sparkles className={`h-4 w-4 ${aiGenerating ? 'animate-spin' : ''}`} />
              {aiGenerating ? '生成中...' : 'AI生成'}
            </button>
          </div>
          {aiError && (
            <p className="mt-2 text-xs text-red-400">エラー: {aiError}</p>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 基本情報 */}
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-6 space-y-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-300">テンプレート名</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="例: 下半身強化A"
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

          {/* エクササイズ一覧 */}
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-semibold text-white">種目</h2>
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
                <div key={ex.exerciseId} className="rounded-lg border border-slate-700 bg-slate-950 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-bold text-slate-500">#{idx + 1}</span>
                    <input
                      type="text"
                      required
                      placeholder="種目名（例: シングルレッグスクワット）"
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
                    <SmallField label="種別">
                      <select
                        value={ex.category}
                        onChange={(e) => updateExercise(idx, { category: e.target.value as ExerciseCategory })}
                        className="w-full rounded border border-slate-700 bg-slate-900 px-2 py-1 text-xs text-white"
                      >
                        {Object.entries(EXERCISE_CATEGORY_LABELS).map(([k, v]) => (
                          <option key={k} value={k}>{v}</option>
                        ))}
                      </select>
                    </SmallField>
                    <SmallField label="セット">
                      <input
                        type="number"
                        value={ex.sets}
                        onChange={(e) => updateExercise(idx, { sets: parseInt(e.target.value) || 0 })}
                        className="w-full rounded border border-slate-700 bg-slate-900 px-2 py-1 text-xs text-white"
                      />
                    </SmallField>
                    <SmallField label="回数">
                      <input
                        type="number"
                        value={ex.reps ?? ''}
                        onChange={(e) => updateExercise(idx, { reps: e.target.value ? parseInt(e.target.value) : null })}
                        className="w-full rounded border border-slate-700 bg-slate-900 px-2 py-1 text-xs text-white"
                      />
                    </SmallField>
                    <SmallField label="休息(秒)">
                      <input
                        type="number"
                        value={ex.restSec}
                        onChange={(e) => updateExercise(idx, { restSec: parseInt(e.target.value) || 0 })}
                        className="w-full rounded border border-slate-700 bg-slate-900 px-2 py-1 text-xs text-white"
                      />
                    </SmallField>
                  </div>

                  <textarea
                    value={ex.instructions}
                    onChange={(e) => updateExercise(idx, { instructions: e.target.value })}
                    placeholder="指示・フォームのポイント"
                    rows={2}
                    className="mt-2 w-full rounded border border-slate-700 bg-slate-900 px-2 py-1.5 text-xs text-white"
                  />
                  <input
                    type="url"
                    value={ex.videoUrl ?? ''}
                    onChange={(e) => updateExercise(idx, { videoUrl: e.target.value || null })}
                    placeholder="YouTube動画URL（例: https://youtu.be/xxx）"
                    className="mt-2 w-full rounded border border-slate-700 bg-slate-900 px-2 py-1.5 text-xs text-white placeholder-slate-500"
                  />
                </div>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-60"
          >
            {submitting ? '保存中...' : 'テンプレートを保存'}
          </button>
        </form>
      </div>
    </>
  )
}

function SmallField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-0.5 text-[10px] text-slate-500">{label}</p>
      {children}
    </div>
  )
}
