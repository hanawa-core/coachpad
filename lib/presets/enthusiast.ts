import type { PresetConfig } from './types'

// 運動愛好家・健康維持。レース志向ではなく運動習慣の定着・体組成の維持改善。

const ENTHUSIAST_SYSTEM_PROMPT = `あなたは運動愛好家・健康志向の方を支える専門コーチです。
無理なく続けられ、健康維持と体組成の改善につながるメニューを作成してください。

原則:
- 継続性最優先: 運動習慣の定着を妨げない現実的な頻度・強度に設定
- 有酸素運動・筋力トレーニング・柔軟性をバランスよく配分
- 体重・体組成の緩やかな改善を意識（急激な負荷増は避ける）
- 生活リズムや疲労に応じて柔軟に休養を取り入れる
- 達成しやすい小さな目標を積み重ねてモチベーションを維持する
- 種目ライブラリが提供されている場合、筋力日は必ずその種目から選択すること

出力は構造化JSONで返してください。各日のworkoutTypeは以下から選択:
- easy_run: 有酸素運動（ウォーク・ジョグ等）
- cross_training: 筋力トレーニング（strengthExercisesに種目を設定）
- rest: 休養
- other: その他（ストレッチ・ヨガ等）`

export const enthusiastPreset: PresetConfig = {
  id: 'enthusiast',
  label: '運動愛好家',
  description: '健康維持・運動習慣の定着（非レース）',

  sessionTypes: [
    { key: 'easy_run', label: '有酸素運動' },
    { key: 'cross_training', label: '筋力トレーニング' },
    { key: 'other', label: 'ストレッチ・ヨガ等' },
    { key: 'rest', label: '休養' },
  ],
  defaultSessionType: 'easy_run',

  metrics: [
    { key: 'durationMin', label: '時間', unit: '分', inputType: 'number', step: '1', primary: true, field: 'durationMin' },
    { key: 'weightKg', label: '体重', unit: 'kg', inputType: 'number', step: '0.1', primary: true, field: 'metrics.weightKg' },
    { key: 'bodyFatPct', label: '体脂肪率', unit: '%', inputType: 'number', step: '0.1', primary: true, field: 'metrics.bodyFatPct' },
    { key: 'calories', label: '消費カロリー', unit: 'kcal', inputType: 'number', step: '1', primary: false, field: 'calories' },
    { key: 'distanceKm', label: '距離', unit: 'km', inputType: 'number', step: '0.1', primary: false, field: 'distanceKm' },
  ],

  showRunningMetrics: false,
  showHrZones: false,
  showTss: false,
  showRacePhasing: false,
  showTestCalculator: false,
  goalLabel: '目標',

  profileFields: ['restingHr'],

  primaryChart: 'weight',
  phaseModel: 'none',

  aiSystemPrompt: ENTHUSIAST_SYSTEM_PROMPT,
  aiGoalNoun: '目標',
}
