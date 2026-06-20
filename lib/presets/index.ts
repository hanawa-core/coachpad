import type { WorkoutType } from '@/types'
import { WORKOUT_TYPE_LABELS } from '@/types'
import type { ActivityPreset, PresetConfig } from './types'
import { DEFAULT_PRESET } from './types'
import { runningPreset } from './running'
import { juniorPreset } from './junior'
import { athletePreset } from './athlete'
import { enthusiastPreset } from './enthusiast'
import { dietPreset } from './diet'

export * from './types'

export const PRESETS: Record<ActivityPreset, PresetConfig> = {
  running: runningPreset,
  junior: juniorPreset,
  athlete: athletePreset,
  enthusiast: enthusiastPreset,
  diet: dietPreset,
}

/** プリセットを取得。null/undefined/未知の値は running にフォールバック。 */
export function getPreset(p: ActivityPreset | null | undefined): PresetConfig {
  if (p && PRESETS[p]) return PRESETS[p]
  return PRESETS[DEFAULT_PRESET]
}

/**
 * プリセットを考慮したセッション種別ラベル。
 * WORKOUT_TYPE_LABELS の上位互換。プリセットが該当種別を定義していなければ
 * 既存の WORKOUT_TYPE_LABELS にフォールバックするので、既存呼び出しは不変。
 */
export function sessionLabel(p: ActivityPreset | null | undefined, t: WorkoutType): string {
  const preset = getPreset(p)
  const found = preset.sessionTypes.find((s) => s.key === t)
  return found?.label ?? WORKOUT_TYPE_LABELS[t]
}

/** 実効プリセットの解決: 選手個人 → コーチ既定 → running */
export function resolveActivityPreset(
  athletePreset: ActivityPreset | null | undefined,
  coachDefault: ActivityPreset | null | undefined
): ActivityPreset {
  return athletePreset ?? coachDefault ?? DEFAULT_PRESET
}

/** UIのドロップダウン用 {value,label} 一覧 */
export function presetOptions(): { value: ActivityPreset; label: string }[] {
  return (Object.keys(PRESETS) as ActivityPreset[]).map((k) => ({
    value: k,
    label: PRESETS[k].label,
  }))
}
