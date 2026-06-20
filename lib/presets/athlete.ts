import type { PresetConfig } from './types'

// 競技アスリートの強化（ストレングス&コンディショニング）。
// 負荷管理(TSS)を活用、ブロックピリオダイゼーションで運用。競技は問わない。

const ATHLETE_SYSTEM_PROMPT = `あなたは競技アスリートの強化を担うストレングス&コンディショニング（S&C）専門コーチです。
競技種目を問わず、パフォーマンス向上と怪我予防を両立するメニューを作成してください。

原則:
- 競技特異性: その競技で必要な動作・エネルギー系・筋群を優先的に強化する
- ブロックピリオダイゼーション: 蓄積期→変換期→実現期の流れで負荷と質を調整
- 負荷管理: RPE（主観的運動強度）と週間負荷の急激な増加を避ける（ACWRを意識）
- ハード/イージーの原則: 高強度日の翌日はリカバリーまたは技術練習
- 筋力・パワー・スピード・持久力をピリオドに応じて配分
- 種目ライブラリが提供されている場合、補強・筋力日は必ずその種目から選択すること

出力は構造化JSONで返してください。各日のworkoutTypeは以下から選択:
- easy_run: 有酸素・リカバリー
- tempo: テンポ・閾値系コンディショニング
- interval: 高強度インターバル・スピード
- long_run: 持久系ロングセッション
- race: 試合・大会
- cross_training: 筋力・パワートレーニング（strengthExercisesに種目を設定）
- rest: 休養
- other: 競技練習・技術練習`

export const athletePreset: PresetConfig = {
  id: 'athlete',
  label: '競技アスリート（S&C）',
  description: '競技選手の強化（ストレングス&コンディショニング）',

  sessionTypes: [
    { key: 'cross_training', label: '筋力・パワー' },
    { key: 'interval', label: '高強度・スピード' },
    { key: 'tempo', label: 'コンディショニング' },
    { key: 'easy_run', label: '有酸素・リカバリー' },
    { key: 'long_run', label: '持久系ロング' },
    { key: 'race', label: '試合・大会' },
    { key: 'other', label: '競技・技術練習' },
    { key: 'rest', label: '休養' },
  ],
  defaultSessionType: 'cross_training',

  metrics: [
    { key: 'durationMin', label: '時間', unit: '分', inputType: 'number', step: '1', primary: true, field: 'durationMin' },
    { key: 'rpe', label: 'RPE（主観強度）', unit: '/10', inputType: 'number', step: '1', primary: true, field: 'metrics.rpe' },
    { key: 'distanceKm', label: '距離', unit: 'km', inputType: 'number', step: '0.1', primary: false, field: 'distanceKm' },
    { key: 'avgHeartRate', label: '平均心拍', unit: 'bpm', inputType: 'number', step: '1', primary: false, field: 'avgHeartRate' },
    { key: 'maxHeartRate', label: '最大心拍', unit: 'bpm', inputType: 'number', step: '1', primary: false, field: 'maxHeartRate' },
  ],

  showRunningMetrics: false,
  showHrZones: true,
  showTss: true,
  showRacePhasing: true,
  showTestCalculator: false,
  goalLabel: '目標の試合',

  profileFields: ['thresholdHr', 'maxHr', 'restingHr'],

  primaryChart: 'fitness',
  phaseModel: 'block',

  aiSystemPrompt: ATHLETE_SYSTEM_PROMPT,
  aiGoalNoun: '試合',
}
