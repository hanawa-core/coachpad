'use client'

import { Video } from 'lucide-react'

interface Props {
  url: string | null | undefined
}

/**
 * YouTube URL を埋め込みプレイヤーに変換
 * 対応形式:
 * - https://www.youtube.com/watch?v=XXXX
 * - https://youtu.be/XXXX
 * - https://www.youtube.com/embed/XXXX
 * - https://www.youtube.com/shorts/XXXX
 */
function getEmbedUrl(url: string): string | null {
  try {
    const u = new URL(url)
    let videoId: string | null = null

    if (u.hostname.includes('youtu.be')) {
      videoId = u.pathname.slice(1).split('/')[0]
    } else if (u.hostname.includes('youtube.com')) {
      if (u.pathname === '/watch') {
        videoId = u.searchParams.get('v')
      } else if (u.pathname.startsWith('/embed/')) {
        videoId = u.pathname.replace('/embed/', '').split('/')[0]
      } else if (u.pathname.startsWith('/shorts/')) {
        videoId = u.pathname.replace('/shorts/', '').split('/')[0]
      }
    }

    if (!videoId) return null
    return `https://www.youtube.com/embed/${videoId}`
  } catch {
    return null
  }
}

export function YouTubeEmbed({ url }: Props) {
  if (!url) return null
  const embed = getEmbedUrl(url)

  if (!embed) {
    // 不正な形式の場合は外部リンクとして表示
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

  return (
    <div className="mt-2 aspect-video w-full max-w-md overflow-hidden rounded-lg bg-black">
      <iframe
        src={embed}
        title="YouTube video"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        className="h-full w-full"
      />
    </div>
  )
}
