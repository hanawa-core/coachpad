import type { PresetConfig } from './types'

// ダイエット・減量。体重/体脂肪/カロリーを主指標に、体組成改善を期分けで運用。

const DIET_SYSTEM_PROMPT = `あなたは減量・ボディメイクを支える専門コーチです。
無理のない持続可能なペースで、体重・体脂肪を減らしながら除脂肪量を維持するメニューを作成してください。

原則:
- 安全な減量ペース: 週あたり体重の0.5〜1%程度を目安に、急激な減量を避ける
- カロリー収支: 適度なカロリー不足を作りつつ、筋量維持のため過度な制限は避ける
- 筋力トレーニングを必ず含め、除脂肪量（筋肉）の減少を防ぐ
- 有酸素運動でエネルギー消費を高めるが、回復を妨げない頻度に調整する
- 体重・体脂肪の推移をモニタリングし、停滞期には変化を加える
- 種目ライブラリが提供されている場合、筋力日は必ずその種目から選択すること

出力は構造化JSONで返してください。各日のworkoutTypeは以下から選択:
- cross_training: 筋力トレーニング（strengthExercisesに種目を設定）
- easy_run: 有酸素運動（ウォーク・ジョグ等）
- rest: 休養
- other: その他（ストレッチ・アクティブレスト等）`

export const dietPreset: PresetConfig = {
  id: 'diet',
  label: 'ダイエット',
  description: '減量・体組成改善（体重/体脂肪/カロリー主体）',

  sessionTypes: [
    { key: 'cross_training', label: '筋力トレーニング' },
    { key: 'easy_run', label: '有酸素運動' },
    { key: 'other', label: 'アクティブレスト等' },
    { key: 'rest', label: '休養' },
  ],
  defaultSessionType: 'cross_training',

  metrics: [
    { key: 'weightKg', label: '体重', unit: 'kg', inputType: 'number', step: '0.1', primary: true, field: 'metrics.weightKg' },
    { key: 'bodyFatPct', label: '体脂肪率', unit: '%', inputType: 'number', step: '0.1', primary: true, field: 'metrics.bodyFatPct' },
    { key: 'calories', label: '消費カロリー', unit: 'kcal', inputType: 'number', step: '1', primary: true, field: 'calories' },
    { key: 'durationMin', label: '運動時間', unit: '分', inputType: 'number', step: '1', primary: false, field: 'durationMin' },
    { key: 'distanceKm', label: '距離', unit: 'km', inputType: 'number', step: '0.1', primary: false, field: 'distanceKm' },
  ],

  loadModel: 'srpe',

  showRunningMetrics: false,
  showHrZones: false,
  showTss: false,
  showRacePhasing: false,
  showTestCalculator: false,
  goalLabel: '目標体重',

  profileFields: ['restingHr'],

  primaryChart: 'weight',
  phaseModel: 'weight',

  aiSystemPrompt: DIET_SYSTEM_PROMPT,
  aiGoalNoun: '目標体重',
}
