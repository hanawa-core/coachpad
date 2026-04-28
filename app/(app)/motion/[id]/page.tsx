'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, MessageSquare, CheckCircle, Clock, Trash2 } from 'lucide-react'
import { useAuth } from '@/components/providers/AuthProvider'
import { TopBar } from '@/components/layout/TopBar'
import {
  getMotionAnalysis,
  saveMotionAnalysisFeedback,
  deleteMotionAnalysis,
} from '@/lib/firebase/firestore'
import type { MotionAnalysis } from '@/types'

export default function MotionAnalysisDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string
  const { profile } = useAuth()

  const [item, setItem] = useState<MotionAnalysis | null>(null)
  const [loading, setLoading] = useState(true)
  const [feedback, setFeedback] = useState('')
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    getMotionAnalysis(id).then((data) => {
      setItem(data)
      setFeedback(data?.coachFeedback ?? '')
      setLoading(false)
    })
  }, [id])

  const handleSave = async () => {
    setSaving(true)
    try {
      await saveMotionAnalysisFeedback(id, feedback)
      const updated = await getMotionAnalysis(id)
      setItem(updated)
      setEditing(false)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('この動画を削除しますか？')) return
    await deleteMotionAnalysis(id)
    router.replace('/motion')
  }

  if (loading || !item) {
    return (
      <>
        <TopBar title="動作分析" />
        <div className="flex h-32 items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
        </div>
      </>
    )
  }

  const isCoach = profile?.role === 'coach'
  const isOwnerAthlete = profile?.role === 'athlete' && item.athleteId === profile.uid

  return (
    <>
      <TopBar title="動作分析" />
      <div className="p-6 max-w-3xl space-y-4">
        <Link
          href="/motion"
          className="inline-flex items-center gap-1 text-sm text-slate-400 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          一覧に戻る
        </Link>

        {/* 動画プレイヤー */}
        <div className="rounded-xl border border-slate-800 bg-slate-900 overflow-hidden">
          <video
            src={item.videoUrl}
            controls
            playsInline
            className="w-full max-h-[70vh] bg-black"
          />
        </div>

        {/* メタ情報 */}
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h1 className="text-lg font-bold text-white">{item.motionType}</h1>
              <p className="mt-0.5 text-xs text-slate-500">
                {(item.uploadedAt as any)?.toDate?.().toLocaleString('ja-JP') ?? ''}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {item.status === 'reviewed' ? (
                <span className="flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-400">
                  <CheckCircle className="h-3 w-3" />
                  確認済
                </span>
              ) : (
                <span className="flex items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-1 text-xs font-medium text-amber-400">
                  <Clock className="h-3 w-3" />
                  確認待ち
                </span>
              )}
              {isOwnerAthlete && (
                <button
                  onClick={handleDelete}
                  className="rounded p-1.5 text-slate-500 hover:bg-red-900/30 hover:text-red-400"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          {item.caption && (
            <div className="rounded-lg bg-slate-950 p-3">
              <p className="text-xs font-medium text-slate-500 mb-1">選手のコメント</p>
              <p className="text-sm text-slate-200 whitespace-pre-wrap">{item.caption}</p>
            </div>
          )}
        </div>

        {/* 赤ペン先生フィードバック */}
        <div className="rounded-xl border border-red-700/50 bg-red-950/10 p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-red-300">
              <MessageSquare className="h-4 w-4" />
              コーチのフィードバック（赤ペン先生）
            </h2>
            {isCoach && !editing && (
              <button
                onClick={() => setEditing(true)}
                className="text-xs text-slate-400 hover:text-white"
              >
                {item.coachFeedback ? '編集' : '記入する'}
              </button>
            )}
          </div>

          {editing ? (
            <div className="space-y-2">
              <textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                rows={6}
                placeholder="フォームの分析、改善ポイント、推奨ドリル等を記入..."
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="rounded-lg bg-red-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-red-500 disabled:opacity-60"
                >
                  {saving ? '保存中...' : '保存'}
                </button>
                <button
                  onClick={() => {
                    setEditing(false)
                    setFeedback(item.coachFeedback ?? '')
                  }}
                  className="rounded-lg border border-slate-700 px-4 py-1.5 text-sm font-medium text-slate-300 hover:bg-slate-800"
                >
                  キャンセル
                </button>
              </div>
            </div>
          ) : item.coachFeedback ? (
            <div className="text-sm text-red-100 whitespace-pre-wrap">{item.coachFeedback}</div>
          ) : (
            <p className="text-sm text-slate-500">
              {isCoach ? 'まだフィードバックを書いていません' : 'コーチからのフィードバックをお待ちください'}
            </p>
          )}
        </div>
      </div>
    </>
  )
}
