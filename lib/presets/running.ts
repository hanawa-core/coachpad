import type { PresetConfig } from './types'

// running は正体(identity)プリセット。現挙動を逐語再現する。
// aiSystemPrompt は generate-running-plan/route.ts の SYSTEM_PROMPT を逐語移設。

const RUNNING_SYSTEM_PROMPT = `あなたはトレイルランニング・耐久系競技の専門コーチです。
選手の現状とレース目標を踏まえ、週ごとに最適化された日毎のメニューを作成してください。
ランニング練習だけでなく、必要に応じて筋力トレーニング日・休養日も含めてください。

原則:
- ハード/イージーの原則: 強度の高い練習の翌日はリカバリー
- 週間TSS（負荷）の上昇は10%以下を目安
- 期間内に長距離走（ロング走）を週1回必ず含める
- 完全休養日を週1〜2日設定
- ペースは選手の現状（Easy/Threshold/VO2max）に合わせて指定
- 種目ライブラリが提供されている場合、筋力トレーニング日は必ずその種目から選択すること

⚠️ ピーキング理論（必ず守ってください）:
- レース日から逆算してフェーズを判定
- 【ボリューム期】レース42日以上前 or レース未設定: 有酸素ベース構築・走行量を確保
- 【ビルド期】レース14〜42日前: レース特異的強度を上げる、ロング走最大化
- 【ピーク】レース8〜14日前: 質を維持しつつ量を10〜20%減らす
- 【テーパー】レース1〜7日前: 量を50%まで減量、強度は1〜2回維持
- 【レースウィーク】レース当日 ±3日: 軽いジョグ・休養中心
- 【リカバリー】レース後14日以内: 完全休養 or 軽いジョグのみ。強度練習は禁止

出力は構造化JSONで返してください。各日のworkoutTypeは以下から選択:
- easy_run: イージーラン
- tempo: テンポ走（閾値走）
- interval: インターバル
- long_run: ロング走
- race: レース
- cross_training: 筋力トレーニング（strengthExercisesに種目を設定）
- rest: 休養
- other: その他`

export const runningPreset: PresetConfig = {
  id: 'running',
  label: 'ランニング',
  description: 'ランニング・耐久系競技（レース志向）',

  sessionTypes: [
    { key: 'easy_run', label: 'イージーラン' },
    { key: 'tempo', label: 'テンポラン' },
    { key: 'interval', label: 'インターバル' },
    { key: 'long_run', label: 'ロング走' },
    { key: 'race', label: 'レース' },
    { key: 'cross_training', label: 'クロストレーニング' },
    { key: 'rest', label: '休養' },
    { key: 'other', label: 'その他' },
  ],
  defaultSessionType: 'easy_run',

  metrics: [
    { key: 'distanceKm', label: '距離', unit: 'km', inputType: 'number', step: '0.1', primary: true, field: 'distanceKm' },
    { key: 'durationMin', label: '時間', unit: '分', inputType: 'number', step: '1', primary: true, field: 'durationMin' },
    { key: 'avgPaceMinPerKm', label: '平均ペース', unit: '/km', inputType: 'pace', primary: true, field: 'avgPaceMinPerKm' },
    { key: 'avgHeartRate', label: '平均心拍', unit: 'bpm', inputType: 'number', step: '1', primary: false, field: 'avgHeartRate' },
    { key: 'maxHeartRate', label: '最大心拍', unit: 'bpm', inputType: 'number', step: '1', primary: false, field: 'maxHeartRate' },
    { key: 'elevationGainM', label: '獲得標高', unit: 'm', inputType: 'number', step: '1', primary: false, field: 'elevationGainM' },
  ],

  showRunningMetrics: true,
  showHrZones: true,
  showTss: true,
  showRacePhasing: true,
  showTestCalculator: true,
  goalLabel: 'ターゲットレース',

  profileFields: ['thresholdHr', 'maxHr', 'restingHr', 'thresholdPace', 'ftp'],

  primaryChart: 'fitness',
  phaseModel: 'race',

  aiSystemPrompt: RUNNING_SYSTEM_PROMPT,
  aiGoalNoun: 'レース',
}
