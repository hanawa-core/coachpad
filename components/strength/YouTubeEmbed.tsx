'use client'

import { useState } from 'react'
import { Video, Play } from 'lucide-react'

interface Props {
  url: string | null | undefined
}

/**
 * YouTube URL → videoId 抽出
 * 対応形式:
 * - https://www.youtube.com/watch?v=XXXX
 * - https://youtu.be/XXXX
 * - https://www.youtube.com/embed/XXXX
 * - https://www.youtube.com/shorts/XXXX
 */
function extractVideoId(url: string): string | null {
  try {
    const u = new URL(url)
    if (u.hostname.includes('youtu.be')) {
      return u.pathname.slice(1).split('/')[0] || null
    }
    if (u.hostname.includes('youtube.com')) {
      if (u.pathname === '/watch') return u.searchParams.get('v')
      if (u.pathname.startsWith('/embed/')) return u.pathname.replace('/embed/', '').split('/')[0]
      if (u.pathname.startsWith('/shorts/')) return u.pathname.replace('/shorts/', '').split('/')[0]
    }
    return null
  } catch {
    return null
  }
}

/**
 * 軽量YouTube埋め込み（クリック→ロード方式）
 *
 * 通常の <iframe src="youtube.com/embed/..."> は1個あたり ~500KB-1MB のJSを読み込むため、
 * 種目ライブラリのように何十件も並ぶページでは数十MBの初期ロードが発生する。
 *
 * このコンポーネントは
 *   ・初期表示は YouTube サムネイル画像（< 50KB）のみ
 *   ・ユーザーが再生ボタンをクリックした時に初めて iframe を生成
 *
 * これにより 100種目ページでも数百KB程度のオーバーヘッドに抑えられる。
 */
export function YouTubeEmbed({ url }: Props) {
  const [playing, setPlaying] = useState(false)

  if (!url) return null
  const videoId = extractVideoId(url)

  if (!videoId) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 rounded-md bg-red-500/10 px-2 py-1 text-xs text-red-400 hover:bg-red-500/20"
      >
        <Video className="h-3 w-3" />
        動画を見る
      </a>
    )
  }

  if (playing) {
    return (
      <div className="mt-2 aspect-video w-full max-w-md overflow-hidden rounded-lg bg-black">
        <iframe
          src={`https://www.youtube.com/embed/${videoId}?autoplay=1`}
          title="YouTube video"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="h-full w-full"
        />
      </div>
    )
  }

  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault()
        e.stopPropagation()
        setPlaying(true)
      }}
      className="group mt-2 relative aspect-video w-full max-w-md overflow-hidden rounded-lg bg-black"
      aria-label="動画を再生"
    >
      {/* YouTubeサムネイル（軽量） */}
      <img
        src={`https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`}
        alt=""
        loading="lazy"
        className="h-full w-full object-cover transition-opacity group-hover:opacity-80"
      />
      {/* 再生ボタンオーバーレイ */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-600 shadow-lg transition-transform group-hover:scale-110">
          <Play className="h-5 w-5 fill-white text-white ml-0.5" />
        </div>
      </div>
    </button>
  )
}
