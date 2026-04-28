import type { TargetRace } from '@/types'

export type TrainingPhase =
  | 'recovery' // レース後リカバリー（0〜14日）
  | 'peak' // テーパー・ピーク（レース前7〜14日）
  | 'taper' // テーパー（レース前1〜7日）
  | 'race_week' // レース週
  | 'build' // ビルド（レース前14〜42日）
  | 'volume' // ボリュームゾーン（基礎構築・レース前42日以上、または通常）
  | 'rest' // 完全休養

export interface PhaseInfo {
  phase: TrainingPhase
  label: string
  description: string
  color: string // Tailwind text color class
  bgColor: string // Tailwind bg class for calendar
  borderColor: string
  daysToRace: number | null
  raceName: string | null
}

const PHASE_DEFS: Record<TrainingPhase, Omit<PhaseInfo, 'daysToRace' | 'raceName'>> = {
  race_week: {
    phase: 'race_week',
    label: 'レースウィーク',
    description: 'レース当日。ピークパフォーマンスへ',
    color: 'text-red-400',
    bgColor: 'bg-red-500/15',
    borderColor: 'border-red-500',
  },
  taper: {
    phase: 'taper',
    label: 'テーパー',
    description: '量を抑え、強度は維持。疲労を抜く',
    color: 'text-orange-400',
    bgColor: 'bg-orange-500/10',
    borderColor: 'border-orange-500/40',
  },
  peak: {
    phase: 'peak',
    label: 'ピーク',
    description: '最終調整期間。質の高い練習に絞る',
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/10',
    borderColor: 'border-amber-500/40',
  },
  build: {
    phase: 'build',
    label: 'ビルド',
    description: 'レース特異的な強度を上げる',
    color: 'text-cyan-400',
    bgColor: 'bg-cyan-500/10',
    borderColor: 'border-cyan-500/40',
  },
  volume: {
    phase: 'volume',
    label: 'ボリューム',
    description: 'ベース構築・有酸素ベースを底上げ',
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/5',
    borderColor: 'border-emerald-500/30',
  },
  recovery: {
    phase: 'recovery',
    label: 'リカバリー',
    description: 'レース後回復期。負荷を抑え再生',
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/40',
  },
  rest: {
    phase: 'rest',
    label: '休養',
    description: '完全休養日',
    color: 'text-slate-400',
    bgColor: 'bg-slate-500/10',
    borderColor: 'border-slate-500/30',
  },
}

/**
 * 指定日の training phase を計算
 * - レース後 0〜14日: recovery
 * - レース当日: race_week
 * - レース前 1〜7日: taper
 * - レース前 8〜14日: peak
 * - レース前 15〜42日: build
 * - レース前 42日以上 または レース未設定: volume
 */
export function getPhaseForDate(date: string, races: TargetRace[]): PhaseInfo {
  if (races.length === 0) {
    return phaseInfo('volume', null, null)
  }

  const target = new Date(date)
  target.setHours(0, 0, 0, 0)

  // 該当する/最も影響大きいレースを探す
  for (const race of races) {
    const raceDate = (race.raceDate as any).toDate
      ? (race.raceDate as any).toDate()
      : new Date(race.raceDate as any)
    raceDate.setHours(0, 0, 0, 0)
    const diff = Math.round((raceDate.getTime() - target.getTime()) / (1000 * 60 * 60 * 24))

    // レース後14日以内
    if (diff <= 0 && diff >= -14) {
      if (diff === 0) return phaseInfo('race_week', diff, race.raceName)
      return phaseInfo('recovery', diff, race.raceName)
    }
    // レース前
    if (diff > 0) {
      if (diff <= 7) return phaseInfo('taper', diff, race.raceName)
      if (diff <= 14) return phaseInfo('peak', diff, race.raceName)
      if (diff <= 42) return phaseInfo('build', diff, race.raceName)
      // 42日以上 → 直近のレースが他にないかチェック
      continue
    }
  }

  return phaseInfo('volume', null, null)
}

function phaseInfo(
  phase: TrainingPhase,
  daysToRace: number | null,
  raceName: string | null
): PhaseInfo {
  return {
    ...PHASE_DEFS[phase],
    daysToRace,
    raceName,
  }
}

/**
 * 期間内の各日のフェーズを返す（カレンダー描画用）
 */
export function getPhasesForDateRange(
  startDate: string,
  endDate: string,
  races: TargetRace[]
): Map<string, PhaseInfo> {
  const result = new Map<string, PhaseInfo>()
  const start = new Date(startDate)
  const end = new Date(endDate)
  const dayMs = 24 * 60 * 60 * 1000
  for (let d = new Date(start); d <= end; d = new Date(d.getTime() + dayMs)) {
    const dateStr = d.toISOString().split('T')[0]
    result.set(dateStr, getPhaseForDate(dateStr, races))
  }
  return result
}
