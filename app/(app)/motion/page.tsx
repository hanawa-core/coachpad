'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Plus, Video, Clock, CheckCircle, AlertCircle } from 'lucide-react'
import { useAuth } from '@/components/providers/AuthProvider'
import { TopBar } from '@/components/layout/TopBar'
import {
  getMotionAnalyses,
  getMotionAnalysesForCoach,
} from '@/lib/firebase/firestore'
import type { MotionAnalysis } from '@/types'

export default function MotionAnalysesPage() {
  const { user, profile } = useAuth()
  const [items, setItems] = useState<MotionAnalysis[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user || !profile) return
    const load =
      profile.role === 'coach'
        ? getMotionAnalysesForCoach(user.uid)
        : getMotionAnalyses(user.uid)
    load.then((data) => {
      setItems(data)
      setLoading(false)
    })
  }, [user, profile])

  return (
    <>
      <TopBar title="動作分析" />
      <div className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-400">
            {profile?.role === 'coach'
              ? `担当選手の動画 (${items.length}件)`
              : `アップロード済 (${items.length}件)`}
          </p>
          {profile?.role === 'athlete' && (
            <Link
              href="/motion/new"
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500"
            >
              <Plus className="h-4 w-4" />
              動画をアップロード
            </Link>
          )}
        </div>

        {loading ? (
          <div className="flex h-32 items-center justify-center">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-xl border border-slate-800 bg-slate-900 px-6 py-12 text-center">
            <Video className="mx-auto h-8 w-8 text-slate-600 mb-2" />
            <p className="text-sm text-slate-500">
              {profile?.role === 'coach' ? '動画はまだありません' : 'まだ動画がありません'}
            </p>
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {items.map((m) => (
              <Link
                key={m.id}
                href={`/motion/${m.id}`}
                className="rounded-xl border border-slate-800 bg-slate-900 overflow-hidden hover:border-slate-700"
              >
                {/* 動画サムネ */}
                <div className="aspect-video bg-black flex items-center justify-center">
                  <video
                    src={m.videoUrl}
                    className="h-full w-full object-contain"
                    preload="metadata"
                  />
                </div>
                <div className="p-4">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="text-sm font-semibold text-white">{m.motionType}</h3>
                    {m.status === 'reviewed' ? (
                      <span className="flex items-center gap-1 text-xs text-emerald-400">
                        <CheckCircle className="h-3 w-3" />
                        フィードバック済
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-xs text-amber-400">
                        <Clock className="h-3 w-3" />
                        確認待ち
                      </span>
                    )}
                  </div>
                  {m.caption && (
                    <p className="mt-1 text-xs text-slate-400 line-clamp-2">{m.caption}</p>
                  )}
                  <p className="mt-2 text-[10px] text-slate-600">
                    {(m.uploadedAt as any)?.toDate?.().toLocaleDateString('ja-JP') ?? ''}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </>
  )
}
