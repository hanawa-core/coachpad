'use client'

import { useState } from 'react'
import { X, Copy, ArrowRight } from 'lucide-react'
import { copyWeekPlan } from '@/lib/firebase/firestore'

interface Props {
  athleteId: string
  coachId: string
  isOpen: boolean
  onClose: () => void
  onDone: () => void
}

/**
 * 週コピー: 「元の週の月曜」→「貼り付け先の月曜」を選んで7日間まとめて移動
 */
export function WeekCopyModal({ athleteId, coachId, isOpen, onClose, onDone }: Props) {
  const today = new Date()
  const thisMonday = getMonday(today)
  const lastMonday = new Date(thisMonday)
  lastMonday.setDate(thisMonday.getDate() - 7)
  const nextMonday = new Date(thisMonday)
  nextMonday.setDate(thisMonday.getDate() + 7)

  const [sourceMonday, setSourceMonday] = useState(formatDate(lastMonday))
  const [targetMonday, setTargetMonday] = useState(formatDate(nextMonday))
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<string>('')

  if (!isOpen) return null

  const handleCopy = async () => {
    setSubmitting(true)
    setResult('')
    try {
      // 月曜+6 = 日曜まで
      const sourceEnd = shiftDate(sourceMonday, 6)
      const r = await copyWeekPlan(athleteId, coachId, sourceMonday, sourceEnd, targetMonday)
      setResult(
        `✅ ${r.workouts}件のランニングメニューと${r.strengthAssignments}件のプロトコルをコピーしました`
      )
      setTimeout(() => {
        onDone()
        onClose()
      }, 1500)
    } catch (e: any) {
      setResult('エラー: ' + e.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-xl border border-slate-700 bg-slate-900 p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="flex items-center gap-2 text-base font-semibold text-white">
            <Copy className="h-5 w-5 text-emerald-400" />
            週間メニューをコピー
          </h2>
          <button
            onClick={onClose}
            className="rounded p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <p className="mb-4 text-xs text-slate-400">
          指定した週（月曜〜日曜）の planned メニューと プロトコルを、別の週にまとめてコピーします
        </p>

        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-300">
              元の週の月曜日
            </label>
            <input
              type="date"
              value={sourceMonday}
              onChange={(e) => setSourceMonday(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
            />
            <p className="mt-1 text-[10px] text-slate-500">
              {sourceMonday} 〜 {shiftDate(sourceMonday, 6)} (7日間)
            </p>
          </div>

          <div className="flex items-center justify-center text-slate-500">
            <ArrowRight className="h-4 w-4" />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-300">
              貼り付け先の月曜日
            </label>
            <input
              type="date"
              value={targetMonday}
              onChange={(e) => setTargetMonday(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
            />
            <p className="mt-1 text-[10px] text-slate-500">
              {targetMonday} 〜 {shiftDate(targetMonday, 6)} に貼り付け
            </p>
          </div>
        </div>

        {result && (
          <p className="mt-3 rounded-lg bg-emerald-950/30 border border-emerald-800 px-3 py-2 text-sm text-emerald-300">
            {result}
          </p>
        )}

        <div className="mt-5 flex gap-2">
          <button
            onClick={handleCopy}
            disabled={submitting}
            className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-60"
          >
            <Copy className="h-4 w-4" />
            {submitting ? 'コピー中...' : 'コピー実行'}
          </button>
          <button
            onClick={onClose}
            disabled={submitting}
            className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800"
          >
            キャンセル
          </button>
        </div>
      </div>
    </div>
  )
}

function getMonday(d: Date): Date {
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day
  const m = new Date(d)
  m.setDate(d.getDate() + diff)
  m.setHours(0, 0, 0, 0)
  return m
}

function formatDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function shiftDate(dateStr: string, days: number): string {
  const d = new Date(dateStr)
  d.setDate(d.getDate() + days)
  return formatDate(d)
}
