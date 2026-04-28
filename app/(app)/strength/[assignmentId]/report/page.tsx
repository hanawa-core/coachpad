'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, AlertTriangle, MessageSquare } from 'lucide-react'
import { Timestamp } from 'firebase/firestore'
import { TopBar } from '@/components/layout/TopBar'
import { getStrengthAssignment, submitStrengthReport } from '@/lib/firebase/firestore'
import type { StrengthAssignment, ExerciseResult } from '@/types'

export default function ReportPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.assignmentId as string

  const [assignment, setAssignment] = useState<StrengthAssignment | null>(null)
  const [results, setResults] = useState<ExerciseResult[]>([])
  const [difficulty, setDifficulty] = useState<1 | 2 | 3 | 4 | 5>(3)
  const [notes, setNotes] = useState('')
  const [hadPain, setHadPain] = useState(false)
  const [painLocations, setPainLocations] = useState<string[]>([])
  const [painNotes, setPainNotes] = useState('')
  const [messageToCoach, setMessageToCoach] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const togglePainLocation = (loc: string) => {
    setPainLocations((prev) =>
      prev.includes(loc) ? prev.filter((x) => x !== loc) : [...prev, loc]
    )
  }

  useEffect(() => {
    getStrengthAssignment(id).then((a) => {
      if (a) {
        setAssignment(a)
        setResults(
          a.templateSnapshot.exercises.map((ex) => ({
            exerciseId: ex.exerciseId,
            actualSets: ex.sets,
            actualReps: ex.reps,
            actualDurationSec: ex.durationSec,
            actualWeightKg: ex.targetWeight,
            completed: false,
            notes: '',
          }))
        )
      }
    })
  }, [id])

  const updateResult = (idx: number, patch: Partial<ExerciseResult>) => {
    setResults(results.map((r, i) => (i === idx ? { ...r, ...patch } : r)))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      await submitStrengthReport(id, {
        completedAt: Timestamp.now(),
        overallDifficulty: difficulty,
        notes,
        exerciseResults: results,
        hadPain,
        painLocations,
        painNotes,
        messageToCoach,
      })
      router.replace(`/strength/${id}`)
    } finally {
      setSubmitting(false)
    }
  }

  if (!assignment) return null

  return (
    <>
      <TopBar title="実施報告" />
      <div className="p-6 max-w-2xl">
        <Link
          href={`/strength/${id}`}
          className="inline-flex items-center gap-1 mb-4 text-sm text-slate-400 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          戻る
        </Link>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
            <h2 className="text-base font-semibold text-white mb-3">{assignment.templateSnapshot.name}</h2>
            <p className="text-sm text-slate-400 mb-4">{assignment.date}</p>

            <div className="space-y-3">
              {assignment.templateSnapshot.exercises.map((ex, idx) => (
                <div key={ex.exerciseId} className="rounded-lg border border-slate-700 bg-slate-950 p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <input
                      type="checkbox"
                      checked={results[idx]?.completed ?? false}
                      onChange={(e) => updateResult(idx, { completed: e.target.checked })}
                      className="h-4 w-4 rounded accent-emerald-500"
                    />
                    <p className="text-sm font-medium text-white flex-1">
                      {idx + 1}. {ex.name}
                    </p>
                    <span className="text-xs text-slate-500">
                      目標: {ex.sets}×{ex.reps ?? `${ex.durationSec}秒`}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <input
                      type="number"
                      placeholder="実セット数"
                      value={results[idx]?.actualSets ?? ''}
                      onChange={(e) => updateResult(idx, { actualSets: parseInt(e.target.value) || 0 })}
                      className="rounded border border-slate-700 bg-slate-900 px-2 py-1 text-xs text-white"
                    />
                    <input
                      type="number"
                      placeholder="実回数"
                      value={results[idx]?.actualReps ?? ''}
                      onChange={(e) => updateResult(idx, { actualReps: e.target.value ? parseInt(e.target.value) : null })}
                      className="rounded border border-slate-700 bg-slate-900 px-2 py-1 text-xs text-white"
                    />
                    <input
                      type="number"
                      step="0.5"
                      placeholder="重量(kg)"
                      value={results[idx]?.actualWeightKg ?? ''}
                      onChange={(e) => updateResult(idx, { actualWeightKg: e.target.value ? parseFloat(e.target.value) : null })}
                      className="rounded border border-slate-700 bg-slate-900 px-2 py-1 text-xs text-white"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900 p-6 space-y-3">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300">きつさ (RPE 1-5)</label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    type="button"
                    key={n}
                    onClick={() => setDifficulty(n as 1 | 2 | 3 | 4 | 5)}
                    className={`flex-1 rounded-lg border py-2 text-sm font-medium transition-colors ${
                      difficulty === n
                        ? 'border-emerald-500 bg-emerald-500/20 text-emerald-300'
                        : 'border-slate-700 text-slate-400 hover:border-slate-600'
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-300">メモ</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
              />
            </div>
          </div>

          {/* 痛みのチェック */}
          <div className="rounded-xl border border-amber-700/50 bg-amber-950/10 p-6 space-y-3">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-amber-300">
              <AlertTriangle className="h-4 w-4" />
              痛み・違和感のチェック
            </h3>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={hadPain}
                onChange={(e) => setHadPain(e.target.checked)}
                className="h-4 w-4 rounded border-slate-700 accent-amber-500"
              />
              <span className="text-sm text-white">実施中・実施後に痛みや違和感があった</span>
            </label>

            {hadPain && (
              <div className="space-y-3 pl-7">
                <div>
                  <p className="mb-2 text-xs font-medium text-slate-300">痛みの部位（複数選択可）</p>
                  <div className="flex flex-wrap gap-2">
                    {[
                      '腰',
                      '膝',
                      '股関節',
                      'ハム',
                      'ふくらはぎ',
                      'アキレス腱',
                      '足首',
                      '足底',
                      '肩',
                      '首',
                      'その他',
                    ].map((loc) => (
                      <button
                        type="button"
                        key={loc}
                        onClick={() => togglePainLocation(loc)}
                        className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                          painLocations.includes(loc)
                            ? 'border-amber-500 bg-amber-500/20 text-amber-300'
                            : 'border-slate-700 text-slate-400 hover:border-slate-600'
                        }`}
                      >
                        {loc}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-300">
                    痛みの詳細（いつ・どんな痛み・強度など）
                  </label>
                  <textarea
                    value={painNotes}
                    onChange={(e) => setPainNotes(e.target.value)}
                    rows={3}
                    placeholder="例: 3セット目から右膝の外側に違和感、ピリッとする痛み（10段階で4）"
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
                  />
                </div>
              </div>
            )}
          </div>

          {/* コーチへのメッセージ */}
          <div className="rounded-xl border border-emerald-700/50 bg-emerald-950/10 p-6">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-emerald-300">
              <MessageSquare className="h-4 w-4" />
              コーチへのメッセージ
            </h3>
            <textarea
              value={messageToCoach}
              onChange={(e) => setMessageToCoach(e.target.value)}
              rows={4}
              placeholder="練習の感想、相談したいこと、調子の報告など自由に"
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-60"
          >
            {submitting ? '送信中...' : '報告を送信'}
          </button>
        </form>
      </div>
    </>
  )
}
