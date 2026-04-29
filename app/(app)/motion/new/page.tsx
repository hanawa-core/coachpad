'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Upload, Video } from 'lucide-react'
import { useAuth } from '@/components/providers/AuthProvider'
import { TopBar } from '@/components/layout/TopBar'
import { uploadVideo, getVideoDuration } from '@/lib/firebase/video-upload'
import { createMotionAnalysis } from '@/lib/firebase/firestore'

const MOTION_TYPES = [
  'ランニングフォーム（前から）',
  'ランニングフォーム（横から）',
  'ランニングフォーム（後ろから）',
  'スクワット',
  'シングルレッグスクワット',
  'デッドリフト',
  'ヒップヒンジ',
  'プランク',
  'ランジ',
  'カーフレイズ',
  'その他',
]

export default function NewMotionAnalysisPage() {
  const router = useRouter()
  const { user, profile } = useAuth()

  const [file, setFile] = useState<File | null>(null)
  const [motionType, setMotionType] = useState(MOTION_TYPES[0])
  const [caption, setCaption] = useState('')
  const [progress, setProgress] = useState(0)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  if (profile?.role !== 'athlete') {
    return (
      <>
        <TopBar title="動画アップロード" />
        <div className="p-6">
          <p className="text-sm text-slate-400">この機能は選手のみ利用できます</p>
        </div>
      </>
    )
  }

  const handleUpload = async () => {
    if (!user || !file) return
    if (!profile?.coachId) {
      setError('コーチが設定されていません')
      return
    }
    if (!process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET) {
      setError('Firebase Storage が設定されていません。Vercel 環境変数 NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET を確認してください。')
      return
    }
    setError('')
    setUploading(true)
    try {
      const duration = await getVideoDuration(file)
      const result = await uploadVideo(user.uid, file, (p) => setProgress(p.percent))
      await createMotionAnalysis({
        athleteId: user.uid,
        coachId: profile.coachId,
        videoUrl: result.url,
        fileName: file.name,
        fileSize: file.size,
        durationSec: duration,
        caption,
        motionType,
      })
      router.replace('/motion')
    } catch (e: any) {
      setError(e.message ?? 'アップロード失敗')
    } finally {
      setUploading(false)
    }
  }

  return (
    <>
      <TopBar title="動画をアップロード" />
      <div className="p-6 max-w-2xl">
        <Link
          href="/motion"
          className="inline-flex items-center gap-1 mb-4 text-sm text-slate-400 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          戻る
        </Link>

        <div className="space-y-4">
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-6 space-y-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-300">
                動作の種類
              </label>
              <select
                value={motionType}
                onChange={(e) => setMotionType(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
              >
                {MOTION_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-slate-300">
                コメント・相談内容
              </label>
              <textarea
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                rows={3}
                placeholder="例: 最近右膝に違和感があります。フォームを見て欲しいです。"
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white placeholder-slate-500"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-slate-300">動画ファイル</label>
              <div className="rounded-lg border-2 border-dashed border-slate-700 bg-slate-950/50 p-6 text-center">
                <input
                  type="file"
                  accept="video/*"
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                  className="block w-full text-xs text-slate-300 file:mr-3 file:rounded file:border-0 file:bg-slate-800 file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-white file:hover:bg-slate-700"
                />
                {file && (
                  <p className="mt-3 text-xs text-slate-400">
                    <Video className="inline h-3 w-3 mr-1" />
                    {file.name} ({(file.size / 1024 / 1024).toFixed(1)} MB)
                  </p>
                )}
                <p className="mt-2 text-[10px] text-slate-600">
                  推奨: 30秒以内、100MB以下、横向き or 縦向き
                </p>
              </div>
            </div>

            {uploading && (
              <div className="space-y-1">
                <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800">
                  <div
                    className="h-full bg-emerald-500 transition-all"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <p className="text-xs text-slate-400">アップロード中... {progress}%</p>
              </div>
            )}

            {error && (
              <div className="rounded-lg bg-red-900/40 border border-red-800 px-3 py-2 text-sm text-red-400 whitespace-pre-line">
                {error}
              </div>
            )}

            <button
              onClick={handleUpload}
              disabled={!file || uploading}
              className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-60"
            >
              <Upload className="h-4 w-4" />
              {uploading ? 'アップロード中...' : 'アップロード'}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
