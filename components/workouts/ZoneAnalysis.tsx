'use client'

import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
} from 'recharts'
import type { Workout, UserProfile } from '@/types'

interface Props {
  workout: Workout
  profile?: UserProfile | null
}

/**
 * 平均心拍と LTHR からゾーン推定（簡易版）
 * 実装注: Strava は時系列ストリームが必要だが Detail API でしか取れないため、
 *        ここでは平均HRから「主要ゾーン」を推定する簡易版を実装
 */
export function ZoneAnalysis({ workout, profile }: Props) {
  if (!workout.completed?.avgHeartRate) {
    return null
  }
  const avgHr = workout.completed.avgHeartRate
  const lthr = profile?.thresholdHr

  if (!lthr) {
    return (
      <div className="rounded-lg bg-slate-950 p-3 text-xs text-slate-500">
        ゾーン分析にはプロフィールで「閾値心拍 (LTHR)」を設定してください
      </div>
    )
  }

  const zone = computeZone(avgHr, lthr)
  const data = [
    { name: zone.label, value: 1, color: zone.color },
  ]

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
      <h3 className="text-sm font-semibold text-white mb-3">ゾーン分析（平均HR基準）</h3>
      <div className="flex items-center gap-4">
        <div className="h-32 w-32">
          <ResponsiveContainer>
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                cx="50%"
                cy="50%"
                outerRadius={50}
              >
                {data.map((d, i) => (
                  <Cell key={i} fill={d.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="flex-1 space-y-1.5 text-sm">
          <p className="text-slate-300">
            主要ゾーン: <span className="font-bold text-white">{zone.label}</span>
          </p>
          <p className="text-xs text-slate-500">
            平均HR {avgHr} bpm / LTHR {lthr} bpm = {Math.round((avgHr / lthr) * 100)}%
          </p>
          <p className="text-xs text-slate-400 mt-2">{zone.description}</p>
        </div>
      </div>
    </div>
  )
}

function computeZone(avgHr: number, lthr: number) {
  const pct = (avgHr / lthr) * 100
  if (pct < 85) {
    return {
      label: 'Z1 Recovery',
      color: '#3b82f6',
      description: 'リカバリーゾーン。会話できる強度、有酸素能力の土台作り。',
    }
  }
  if (pct < 90) {
    return {
      label: 'Z2 Aerobic',
      color: '#10b981',
      description: '有酸素ゾーン。脂肪燃焼、ベース構築に最適。',
    }
  }
  if (pct < 95) {
    return {
      label: 'Z3 Tempo',
      color: '#eab308',
      description: 'テンポゾーン。マラソンペース付近、持久力向上。',
    }
  }
  if (pct < 100) {
    return {
      label: 'Z4 Threshold',
      color: '#f97316',
      description: '閾値ゾーン。約1時間維持できる強度、LT向上。',
    }
  }
  return {
    label: 'Z5 VO2max',
    color: '#ef4444',
    description: 'VO2maxゾーン。短時間高強度、最大酸素摂取量向上。',
  }
}
