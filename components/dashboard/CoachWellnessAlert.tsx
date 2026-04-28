'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { AlertTriangle, Heart } from 'lucide-react'
import { useAuth } from '@/components/providers/AuthProvider'
import {
  subscribeAthletes,
  getRecentWellnessEntries,
} from '@/lib/firebase/firestore'
import type { AthleteCache, WellnessEntry } from '@/types'

interface AthleteWellness {
  athlete: AthleteCache
  latest: WellnessEntry | null
  alertReason: string | null
}

export function CoachWellnessAlert() {
  const { user } = useAuth()
  const [items, setItems] = useState<AthleteWellness[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    const unsub = subscribeAthletes(user.uid, async (athletes) => {
      const results = await Promise.all(
        athletes.map(async (a) => {
          const entries = await getRecentWellnessEntries(a.userId, 3)
          const latest = entries.length > 0 ? entries[entries.length - 1] : null
          const alertReason = computeAlert(latest)
          return { athlete: a, latest, alertReason }
        })
      )
      setItems(results)
      setLoading(false)
    })
    return unsub
  }, [user])

  if (loading) return null

  const alerts = items.filter((i) => i.alertReason !== null)
  if (alerts.length === 0) return null

  return (
    <div className="rounded-xl border border-amber-700/50 bg-amber-950/10 p-5">
      <h2 className="flex items-center gap-2 text-base font-semibold text-amber-300 mb-3">
        <AlertTriangle className="h-5 w-5" />
        体調アラート ({alerts.length})
      </h2>
      <ul className="space-y-2">
        {alerts.map((a) => (
          <li key={a.athlete.id}>
            <Link
              href={`/athletes/${a.athlete.userId}`}
              className="flex items-center justify-between rounded-lg border border-amber-800/50 bg-slate-950 px-3 py-2 hover:bg-slate-900"
            >
              <div className="flex items-center gap-2">
                <Heart className="h-4 w-4 text-pink-400" />
                <span className="text-sm font-medium text-white">{a.athlete.displayName}</span>
              </div>
              <span className="text-xs text-amber-300">{a.alertReason}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}

/**
 * アラート判定ロジック
 * - 疲労 4 or 5: 高疲労
 * - 痛み 4 or 5: 強い違和感
 * - 睡眠の質 1 or 2: 睡眠不足
 * - ストレス 4 or 5: 高ストレス
 */
function computeAlert(entry: WellnessEntry | null): string | null {
  if (!entry) return null
  const issues: string[] = []
  if (entry.fatigue && entry.fatigue >= 4) issues.push(`疲労${entry.fatigue}`)
  if (entry.soreness && entry.soreness >= 4) issues.push(`筋肉痛${entry.soreness}`)
  if (entry.sleepQuality && entry.sleepQuality <= 2) issues.push(`睡眠${entry.sleepQuality}`)
  if (entry.stress && entry.stress >= 4) issues.push(`ストレス${entry.stress}`)
  return issues.length > 0 ? `⚠ ${issues.join('・')}` : null
}
