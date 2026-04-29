'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, CheckCircle, Circle, AlertTriangle, MessageSquare } from 'lucide-react'
import { useAuth } from '@/components/providers/AuthProvider'
import { TopBar } from '@/components/layout/TopBar'
import { getStrengthAssignment } from '@/lib/firebase/firestore'
import { YouTubeEmbed } from '@/components/strength/YouTubeEmbed'
import type { StrengthAssignment } from '@/types'
import { EXERCISE_CATEGORY_LABELS } from '@/types'

export default function AssignmentDetailPage() {
  const params = useParams()
  const id = params.assignmentId as string
  const { profile } = useAuth()
  const [assignment, setAssignment] = useState<StrengthAssignment | null>(null)

  useEffect(() => {
    getStrengthAssignment(id).then(setAssignment)
  }, [id])

  if (!assignment) {
    return (
      <>
        <TopBar title="筋力トレーニング" />
        <div className="flex h-32 items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
        </div>
      </>
    )
  }

  const isAthlete = profile?.role === 'athlete'

  return (
    <>
      <TopBar title="筋力トレーニング" />
      <div className="p-4 sm:p-6 max-w-3xl space-y-4">
        <Link href="/calendar" className="inline-flex items-center gap-1 text-sm text-slate-400 hover:text-white">
          <ArrowLeft className="h-4 w-4" />
          カレンダーに戻る
        </Link>

        <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-xl font-bold text-white">{assignment.templateSnapshot.name}</h1>
              <p className="mt-1 text-sm text-slate-400">{assignment.date}</p>
            </div>
            {assignment.status === 'completed' ? (
              <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-400">
                実施済
              </span>
            ) : (
              <span className="rounded-full bg-amber-500/10 px-2.5 py-0.5 text-xs font-medium text-amber-400">
                未実施
              </span>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
          <h2 className="text-base font-semibold text-white mb-3">種目</h2>
          <ol className="space-y-2">
            {assignment.templateSnapshot.exercises.map((ex, idx) => {
              const result = assignment.completionReport?.exerciseResults.find(
                (r) => r.exerciseId === ex.exerciseId
              )
              return (
                <li
                  key={ex.exerciseId}
                  className="flex items-start gap-3 rounded-lg border border-slate-800 bg-slate-950 p-3"
                >
                  {result?.completed ? (
                    <CheckCircle className="h-4 w-4 text-emerald-400 mt-0.5 shrink-0" />
                  ) : (
                    <Circle className="h-4 w-4 text-slate-600 mt-0.5 shrink-0" />
                  )}
                  <div className="flex-1">
                    <p className="text-sm font-medium text-white">
                      {idx + 1}. {ex.name}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {EXERCISE_CATEGORY_LABELS[ex.category]} · 目標: {ex.sets}×{ex.reps ?? `${ex.durationSec}秒`}
                    </p>
                    {ex.instructions && (
                      <p className="mt-1 text-xs text-slate-400">{ex.instructions}</p>
                    )}
                    {ex.videoUrl && <YouTubeEmbed url={ex.videoUrl} />}
                  </div>
                </li>
              )
            })}
          </ol>
        </div>

        {isAthlete && assignment.status !== 'completed' && (
          <Link
            href={`/strength/${id}/report`}
            className="block w-full rounded-lg bg-emerald-600 px-4 py-2.5 text-center text-sm font-semibold text-white hover:bg-emerald-500"
          >
            実施を報告する
          </Link>
        )}

        {/* 痛み報告 */}
        {assignment.completionReport?.hadPain && (
          <div className="rounded-xl border border-amber-700/50 bg-amber-950/10 p-5">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-amber-300 mb-2">
              <AlertTriangle className="h-4 w-4" />
              痛み・違和感の報告
            </h3>
            {assignment.completionReport.painLocations.length > 0 && (
              <div className="mb-2 flex flex-wrap gap-1.5">
                {assignment.completionReport.painLocations.map((loc) => (
                  <span
                    key={loc}
                    className="rounded-full bg-amber-500/20 px-2.5 py-0.5 text-xs font-medium text-amber-300"
                  >
                    {loc}
                  </span>
                ))}
              </div>
            )}
            {assignment.completionReport.painNotes && (
              <p className="text-sm text-amber-100 whitespace-pre-wrap">
                {assignment.completionReport.painNotes}
              </p>
            )}
          </div>
        )}

        {/* 選手からコーチへのメッセージ */}
        {assignment.completionReport?.messageToCoach && (
          <div className="rounded-xl border border-emerald-700/50 bg-emerald-950/10 p-5">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-emerald-300 mb-2">
              <MessageSquare className="h-4 w-4" />
              選手からのメッセージ
            </h3>
            <p className="text-sm text-emerald-100 whitespace-pre-wrap">
              {assignment.completionReport.messageToCoach}
            </p>
          </div>
        )}

        {assignment.coachFeedback?.textComment && (
          <div className="rounded-xl border border-red-700/50 bg-red-950/10 p-5">
            <h3 className="text-sm font-semibold text-red-300 mb-2">コーチからのフィードバック</h3>
            <p className="text-sm text-red-100 whitespace-pre-wrap">{assignment.coachFeedback.textComment}</p>
          </div>
        )}
      </div>
    </>
  )
}
