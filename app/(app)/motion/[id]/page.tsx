'use client'

import { useEffect, useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, MessageSquare, CheckCircle, Clock, Trash2, Pen, Image as ImageIcon } from 'lucide-react'
import { useAuth } from '@/components/providers/AuthProvider'
import { TopBar } from '@/components/layout/TopBar'
import {
  getMotionAnalysis,
  saveMotionAnalysisFeedback,
  deleteMotionAnalysis,
  createMotionAnnotation,
  listMotionAnnotations,
  deleteMotionAnnotation,
} from '@/lib/firebase/firestore'
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage'
import { storage } from '@/lib/firebase/config'
import { v4 as uuidv4 } from 'uuid'
import { VideoAnnotator } from '@/components/motion/VideoAnnotator'
import type { MotionAnalysis, MotionAnnotation, CanvasData } from '@/types'

export default function MotionAnalysisDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string
  const { profile, user } = useAuth()
  const videoRef = useRef<HTMLVideoElement | null>(null)

  const [item, setItem] = useState<MotionAnalysis | null>(null)
  const [annotations, setAnnotations] = useState<MotionAnnotation[]>([])
  const [loading, setLoading] = useState(true)
  const [feedback, setFeedback] = useState('')
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)

  // アノテーター用 state
  const [annotator, setAnnotator] = useState<null | {
    baseImageDataUrl: string
    width: number
    height: number
    timestampSec: number
  }>(null)

  // 拡大表示する注釈
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  const reload = async () => {
    const [data, anns] = await Promise.all([
      getMotionAnalysis(id),
      listMotionAnnotations(id),
    ])
    setItem(data)
    setAnnotations(anns as MotionAnnotation[])
    setFeedback(data?.coachFeedback ?? '')
    setLoading(false)
  }

  useEffect(() => {
    reload()
  // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const handleOpenAnnotator = () => {
    const video = videoRef.current
    if (!video) return
    if (!video.videoWidth || !video.videoHeight) {
      alert('動画の読み込みが完了していません。少し待ってから再試行してください。')
      return
    }
    // 一時停止して現在フレームをキャンバスに描画
    video.pause()
    const canvas = document.createElement('canvas')
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    try {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
      const dataUrl = canvas.toDataURL('image/png')
      setAnnotator({
        baseImageDataUrl: dataUrl,
        width: canvas.width,
        height: canvas.height,
        timestampSec: video.currentTime,
      })
    } catch (e: any) {
      // CORS で drawImage が失敗するケース
      alert('動画フレームの取得に失敗しました（CORS）。動画を再アップロードすると解決する場合があります。')
      console.error(e)
    }
  }

  const handleAnnotationSave = async (
    blob: Blob,
    canvasData: CanvasData,
    note: string
  ) => {
    if (!annotator || !item || !user) return
    // Storage にアップロード
    const annId = uuidv4()
    const path = `motionAnalyses/${item.athleteId}/annotations/${id}_${annId}.png`
    const ref = storageRef(storage, path)
    await uploadBytes(ref, blob, { contentType: 'image/png' })
    const url = await getDownloadURL(ref)

    // Firestore に保存
    await createMotionAnnotation(id, {
      coachId: user.uid,
      timestampSec: annotator.timestampSec,
      annotatedImageUrl: url,
      canvasData,
      note,
    })

    setAnnotator(null)
    await reload()
  }

  const handleAnnotationDelete = async (annId: string) => {
    if (!confirm('この書き込みを削除しますか？')) return
    await deleteMotionAnnotation(id, annId)
    await reload()
  }

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60)
    const s = Math.floor(sec % 60)
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  const seekVideo = (sec: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = sec
      videoRef.current.pause()
    }
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
      <div className="p-4 sm:p-6 max-w-3xl space-y-4">
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
            ref={videoRef}
            src={item.videoUrl}
            controls
            playsInline
            crossOrigin="anonymous"
            className="w-full max-h-[70vh] bg-black"
          />
        </div>

        {/* コーチ専用：書き込みボタン */}
        {isCoach && (
          <button
            onClick={handleOpenAnnotator}
            className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-500"
          >
            <Pen className="h-4 w-4" />
            この瞬間に書き込む（一時停止して赤ペン）
          </button>
        )}

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

        {/* 赤ペン書き込み一覧 */}
        {annotations.length > 0 && (
          <div className="rounded-xl border border-red-700/50 bg-red-950/10 p-5">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-red-300 mb-3">
              <ImageIcon className="h-4 w-4" />
              コーチの書き込み（{annotations.length}件）
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {annotations.map((ann) => (
                <div key={ann.id} className="group relative rounded-lg border border-slate-800 bg-slate-900 overflow-hidden">
                  <button
                    onClick={() => setPreviewUrl(ann.annotatedImageUrl)}
                    className="block w-full"
                  >
                    <img
                      src={ann.annotatedImageUrl}
                      alt={`書き込み ${formatTime(ann.timestampSec)}`}
                      className="w-full aspect-video object-cover"
                    />
                  </button>
                  <div className="p-2 space-y-1">
                    <button
                      onClick={() => seekVideo(ann.timestampSec)}
                      className="text-xs text-slate-400 hover:text-white"
                    >
                      ▶ {formatTime(ann.timestampSec)}
                    </button>
                    {ann.note && (
                      <p className="text-xs text-slate-300 line-clamp-2">{ann.note}</p>
                    )}
                  </div>
                  {isCoach && (
                    <button
                      onClick={() => handleAnnotationDelete(ann.id)}
                      className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 rounded bg-red-600/80 p-1 text-white hover:bg-red-500"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* テキストフィードバック */}
        <div className="rounded-xl border border-red-700/50 bg-red-950/10 p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-red-300">
              <MessageSquare className="h-4 w-4" />
              コーチのテキストフィードバック
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

      {/* アノテーター（モーダル） */}
      {annotator && (
        <VideoAnnotator
          baseImageDataUrl={annotator.baseImageDataUrl}
          width={annotator.width}
          height={annotator.height}
          timestampSec={annotator.timestampSec}
          onCancel={() => setAnnotator(null)}
          onSave={handleAnnotationSave}
        />
      )}

      {/* 拡大プレビュー */}
      {previewUrl && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center bg-black/90 p-4"
          onClick={() => setPreviewUrl(null)}
        >
          <img
            src={previewUrl}
            alt="拡大表示"
            className="max-h-full max-w-full rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  )
}
