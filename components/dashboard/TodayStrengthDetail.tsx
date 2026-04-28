'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Dumbbell, ChevronRight, CheckCircle, Circle, Play } from 'lucide-react'
import { getStrengthAssignmentsByMonth } from '@/lib/firebase/firestore'
import { YouTubeEmbed } from '@/components/strength/YouTubeEmbed'
import type { StrengthAssignment } from '@/types'
import { EXERCISE_CATEGORY_LABELS } from '@/types'

interface Props {
  athleteId: string
}

export function TodayStrengthDetail({ athleteId }: Props) {
  const [assignments, setAssignments] = useState<StrengthAssignment[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedVideo, setExpandedVideo] = useState<string | null>(null)

  useEffect(() => {
    const today = new Date()
    const todayStr = today.toISOString().split('T')[0]
    getStrengthAssignmentsByMonth(athleteId, today.getFullYear(), today.getMonth() + 1).then(
      (data) => {
        setAssignments(data.filter((a) => a.date === todayStr))
        setLoading(false)
      }
    )
  }, [athleteId])

  if (loading || assignments.length === 0) return null

  return (
    <div className="space-y-3">
      {assignments.map((a) => (
        <div key={a.id} className="rounded-xl border border-slate-800 bg-slate-900 overflow-hidden">
          {/* ヘッダー */}
          <div className="flex items-center justify-between border-b border-slate-800 bg-purple-950/20 px-5 py-4">
            <div className="flex items-center gap-3">
              <span className="rounded-lg bg-purple-500/20 p-2 text-purple-400">
                <Dumbbell className="h-5 w-5" />
              </span>
              <div>
                <h2 className="text-base font-semibold text-white">
                  💪 本日の筋力トレーニング: {a.templateSnapshot.name}
                </h2>
                <p className="text-xs text-slate-400">
                  {a.templateSnapshot.exercises.length}種目
                </p>
              </div>
            </div>
            <div>
              {a.status === 'completed' ? (
                <span className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-400">
                  実施済
                </span>
              ) : (
                <Link
                  href={`/strength/${a.id}/report`}
                  className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-500"
                >
                  実施報告する
                </Link>
              )}
            </div>
          </div>

          {/* 種目一覧 */}
          <ol className="divide-y divide-slate-800">
            {a.templateSnapshot.exercises.map((ex, idx) => {
              const result = a.completionReport?.exerciseResults.find(
                (r) => r.exerciseId === ex.exerciseId
              )
              const completed = result?.completed ?? false
              const videoOpen = expandedVideo === ex.exerciseId

              return (
                <li key={ex.exerciseId} className="px-5 py-3">
                  <div className="flex items-start gap-3">
                    {completed ? (
                      <CheckCircle className="h-4 w-4 text-emerald-400 mt-0.5 shrink-0" />
                    ) : (
                      <Circle className="h-4 w-4 text-slate-600 mt-0.5 shrink-0" />
                    )}
                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-medium text-white">
                          {idx + 1}. {ex.name}
                        </p>
                        {ex.videoUrl && (
                          <button
                            onClick={() =>
                              setExpandedVideo(videoOpen ? null : ex.exerciseId)
                            }
                            className="flex items-center gap-1 rounded bg-red-500/10 px-2 py-0.5 text-[10px] font-medium text-red-400 hover:bg-red-500/20"
                          >
                            <Play className="h-2.5 w-2.5" />
                            動画
                          </button>
                        )}
                      </div>
                      <p className="mt-0.5 text-xs text-slate-500">
                        {EXERCISE_CATEGORY_LABELS[ex.category]}
                        ・<span className="text-slate-300">{ex.sets}セット</span>
                        {ex.reps && <span className="text-slate-300"> × {ex.reps}回</span>}
                        {ex.durationSec && (
                          <span className="text-slate-300"> × {ex.durationSec}秒</span>
                        )}
                        {ex.targetWeight != null && (
                          <span className="text-slate-300"> @ {ex.targetWeight}kg</span>
                        )}
                        ・休息{ex.restSec}秒
                      </p>
                      {ex.instructions && (
                        <p className="mt-1.5 text-xs text-slate-300 whitespace-pre-wrap line-clamp-3">
                          {ex.instructions}
                        </p>
                      )}
                      {videoOpen && ex.videoUrl && <YouTubeEmbed url={ex.videoUrl} />}
                    </div>
                  </div>
                </li>
              )
            })}
          </ol>

          {/* 詳細リンク */}
          <Link
            href={`/strength/${a.id}`}
            className="flex items-center justify-center gap-1 border-t border-slate-800 px-5 py-2.5 text-xs text-slate-400 hover:bg-slate-800/50"
          >
            詳細を見る
            <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
      ))}
    </div>
  )
}
