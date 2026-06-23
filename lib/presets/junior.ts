import type { PresetConfig } from './types'

// ジュニアスポーツ。発育発達・多様な動作・楽しさを重視。
// 高強度の負荷管理(TSS)やレーステーパーは前面に出さず、シーズン期分けで運用。

const JUNIOR_SYSTEM_PROMPT = `あなたはジュニア年代（小中学生〜高校生）のスポーツ指導専門コーチです。
選手の発育発達段階を最優先に、楽しさと多様な動作経験を重視したメニューを作成してください。

原則:
- 発育発達の原則: 早期専門化を避け、多様な動作・遊び要素を取り入れる
- 1つの競技動作に偏らず、走る・跳ぶ・投げる・バランスなど基礎的運動能力を養う
- 過度な高強度・高頻度を避け、成長期の怪我（オスグッド・疲労骨折等）を予防する
- 楽しさとモチベーション維持を最優先。達成感のある課題設定
- 大会シーズンに向けて段階的に競技特異的練習を増やす（テーパーは軽め）
- 種目ライブラリが提供されている場合、補強日は必ずその種目から選択すること

出力は構造化JSONで返してください。各日のworkoutTypeは以下から選択:
- easy_run: 基礎運動・有酸素（ジョグ・遊び）
- tempo: 持久走
- interval: スプリント・俊敏性
- long_run: 長めの運動・遠征
- race: 大会・試合
- cross_training: 補強・体づくり（strengthExercisesに種目を設定）
- rest: 休養
- other: その他`

export const juniorPreset: PresetConfig = {
  id: 'junior',
  label: 'ジュニアスポーツ',
  description: '成長期のジュニア選手（発育発達・多様な動作重視）',

  sessionTypes: [
    { key: 'easy_run', label: '基礎運動' },
    { key: 'tempo', label: '持久走' },
    { key: 'interval', label: 'スプリント' },
    { key: 'long_run', label: '長めの運動' },
    { key: 'race', label: '大会・試合' },
    { key: 'cross_training', label: '補強・体づくり' },
    { key: 'rest', label: '休養' },
    { key: 'other', label: 'その他' },
  ],
  defaultSessionType: 'easy_run',

  metrics: [
    { key: 'durationMin', label: '時間', unit: '分', inputType: 'number', step: '1', primary: true, field: 'durationMin' },
    { key: 'distanceKm', label: '距離', unit: 'km', inputType: 'number', step: '0.1', primary: false, field: 'distanceKm' },
    { key: 'avgHeartRate', label: '平均心拍', unit: 'bpm', inputType: 'number', step: '1', primary: false, field: 'avgHeartRate' },
  ],

  loadModel: 'srpe',

  showRunningMetrics: false,
  showHrZones: false,
  showTss: false,
  showRacePhasing: true,
  showTestCalculator: false,
  goalLabel: '目標の大会',

  profileFields: ['maxHr', 'restingHr'],

  primaryChart: 'none',
  phaseModel: 'season',

  aiSystemPrompt: JUNIOR_SYSTEM_PROMPT,
  aiGoalNoun: '大会',
}
