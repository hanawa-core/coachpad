'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { Map, Mountain, Download, Loader2 } from 'lucide-react'
import { useAuth } from '@/components/providers/AuthProvider'
import { ElevationProfile } from './ElevationProfile'
import type { Workout } from '@/types'

// SSR を無効化して Leaflet を読み込む
const RouteMap = dynamic(() => import('./map/RouteMap').then((m) => m.RouteMap), {
  ssr: false,
  loading: () => (
    <div className="flex h-72 items-center justify-center rounded-lg bg-slate-950">
      <Loader2 className="h-5 w-5 animate-spin text-slate-500" />
    </div>
  ),
})

interface Props {
  workout: Workout
}

interface Streams {
  latlng?: { data: [number, number][] }
  altitude?: { data: number[] }
  heartrate?: { data: number[] }
  distance?: { data: number[] }
  time?: { data: number[] }
  velocity_smooth?: { data: number[] }
  grade_smooth?: { data: number[] }
}

export function WorkoutMapSection({ workout }: Props) {
  const { user } = useAuth()
  const [streams, setStreams] = useState<Streams | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const polyline = workout.completed?.polyline
  const stravaLinked = !!(workout as any).stravaActivityId

  // 詳細データのオンデマンド取得
  const loadStreams = async () => {
    if (!user || !stravaLinked) return
    setLoading(true)
    setError('')
    try {
      const idToken = await user.getIdToken()
      const res = await fetch(`/api/strava/streams?workoutId=${workout.id}`, {
        headers: { Authorization: `Bearer ${idToken}` },
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setStreams(data.streams)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  // GPX エクスポート
  const exportGPX = () => {
    if (!streams?.latlng?.data) return
    const latlngs = streams.latlng.data
    const altitudes = streams.altitude?.data ?? []
    const times = streams.time?.data ?? []
    const startTime = workout.completed?.loggedAt
      ? (workout.completed.loggedAt as any).toDate()
      : new Date()

    let gpx = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="CoachPad" xmlns="http://www.topografix.com/GPX/1/1">
  <trk>
    <name>${escapeXml(workout.completed?.title ?? 'Workout')}</name>
    <trkseg>
`
    latlngs.forEach((p, i) => {
      const t = times[i] ?? i
      const time = new Date(startTime.getTime() + t * 1000).toISOString()
      const ele = altitudes[i]
      gpx += `      <trkpt lat="${p[0]}" lon="${p[1]}">
${ele != null ? `        <ele>${ele}</ele>\n` : ''}        <time>${time}</time>
      </trkpt>\n`
    })
    gpx += `    </trkseg>
  </trk>
</gpx>`

    const blob = new Blob([gpx], { type: 'application/gpx+xml' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${(workout.completed?.title ?? 'workout').replace(/[^\w]/g, '_')}.gpx`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (!polyline && !stravaLinked) return null

  const latlngs = streams?.latlng?.data ?? null

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900 p-5 space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-white">
          <Map className="h-4 w-4 text-cyan-400" />
          走行ルート
        </h2>
        <div className="flex gap-2">
          {stravaLinked && !streams && (
            <button
              onClick={loadStreams}
              disabled={loading}
              className="inline-flex items-center gap-1 rounded-lg bg-slate-800 px-3 py-1 text-xs text-white hover:bg-slate-700 disabled:opacity-60"
            >
              <Mountain className="h-3 w-3" />
              {loading ? '読込中...' : '詳細データ取得'}
            </button>
          )}
          {streams?.latlng && (
            <button
              onClick={exportGPX}
              className="inline-flex items-center gap-1 rounded-lg bg-slate-800 px-3 py-1 text-xs text-white hover:bg-slate-700"
            >
              <Download className="h-3 w-3" />
              GPX
            </button>
          )}
        </div>
      </div>

      {error && (
        <p className="rounded-lg bg-red-900/40 border border-red-800 px-3 py-2 text-xs text-red-400">
          {error}
        </p>
      )}

      <RouteMap polylineStr={polyline} latlngs={latlngs} height="320px" />

      {streams?.altitude && streams.distance && (
        <ElevationProfile
          distance={streams.distance.data}
          altitude={streams.altitude.data}
          heartrate={streams.heartrate?.data}
          velocity={streams.velocity_smooth?.data}
        />
      )}

      {!streams && stravaLinked && (
        <p className="text-xs text-slate-500">
          💡 「詳細データ取得」を押すと標高プロファイル・心拍グラフ・GPX エクスポートが利用できます
        </p>
      )}
    </div>
  )
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}
