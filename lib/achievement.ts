import type { Workout } from '@/types'

export interface AchievementResult {
  /** 達成率(%) - 100が完璧、120は超過、40は半分以下 */
  percent: number
  /** 主要指標 */
  metric: 'distance' | 'duration' | 'none'
  /** 計画値 */
  planned: number | null
  /** 実績値 */
  actual: number | null
  /** ラベル: 単位 */
  unit: string
  /** ステータス */
  status: 'over' | 'complete' | 'mostly' | 'partial' | 'minimal' | 'unknown'
  /** ラベル */
  label: string
  /** 色クラス */
  colorClass: string
}

/**
 * 計画と実績から達成率を計算
 * - 距離が計画されていればそれを優先
 * - なければ時間で計算
 * - どちらも無ければ unknown
 */
export function calculateAchievement(workout: Workout): AchievementResult | null {
  if (!workout.planned || !workout.completed) return null

  let metric: 'distance' | 'duration' | 'none' = 'none'
  let planned: number | null = null
  let actual: number | null = null
  let unit = ''

  // 距離ベース
  if (workout.planned.targetDistanceKm && workout.completed.distanceKm != null) {
    metric = 'distance'
    planned = workout.planned.targetDistanceKm
    actual = workout.completed.distanceKm
    unit = 'km'
  }
  // 時間ベース
  else if (workout.planned.targetDurationMin && workout.completed.durationMin != null) {
    metric = 'duration'
    planned = workout.planned.targetDurationMin
    actual = workout.completed.durationMin
    unit = '分'
  }

  if (metric === 'none' || planned == null || actual == null || planned === 0) {
    return null
  }

  const percent = Math.round((actual / planned) * 100)
  const { status, label, colorClass } = classifyAchievement(percent)

  return {
    percent,
    metric,
    planned,
    actual,
    unit,
    status,
    label,
    colorClass,
  }
}

function classifyAchievement(percent: number): {
  status: AchievementResult['status']
  label: string
  colorClass: string
} {
  if (percent >= 120) {
    return {
      status: 'over',
      label: '計画超過',
      colorClass: 'text-purple-400 bg-purple-500/10 border-purple-700',
    }
  }
  if (percent >= 95) {
    return {
      status: 'complete',
      label: '達成',
      colorClass: 'text-emerald-400 bg-emerald-500/10 border-emerald-700',
    }
  }
  if (percent >= 70) {
    return {
      status: 'mostly',
      label: 'ほぼ達成',
      colorClass: 'text-cyan-400 bg-cyan-500/10 border-cyan-700',
    }
  }
  if (percent >= 40) {
    return {
      status: 'partial',
      label: '部分実施',
      colorClass: 'text-amber-400 bg-amber-500/10 border-amber-700',
    }
  }
  return {
    status: 'minimal',
    label: '未達',
    colorClass: 'text-red-400 bg-red-500/10 border-red-700',
  }
}
