import type { WorkoutType, CompletedWorkout } from '@/types'

// ============================================================
// アクティビティプリセット
// ランニング専用設計を「目的別プリセット層」で一般化する。
// running を正体(identity)とし、未設定は常に running にフォールバック。
// ============================================================

export type ActivityPreset = 'running' | 'junior' | 'athlete' | 'enthusiast' | 'diet'

export const DEFAULT_PRESET: ActivityPreset = 'running'

export const ACTIVITY_PRESETS: ActivityPreset[] = [
  'running',
  'junior',
  'athlete',
  'enthusiast',
  'diet',
]

/**
 * 記録フォーム・チャートが汎用的に描画できる指標定義。
 * field が CompletedWorkout の既存 typed フィールドなら直接そこへ、
 * `metrics.xxx` なら generic マップ(CompletedWorkout.metrics)へ読み書きする。
 */
export interface MetricDef {
  /** 安定ストレージキー（例: 'distanceKm' | 'weightKg' | 'bodyFatPct' | 'calories'） */
  key: string
  /** 日本語ラベル（例: '距離' '体重'） */
  label: string
  /** 単位（'km' 'kg' '%' 'kcal' など。なければ null） */
  unit: string | null
  /** 入力UIの種別 */
  inputType: 'number' | 'pace' | 'text'
  /** number input の step */
  step?: string
  /** 主指標(目立つ位置) / それ以外(詳細セクション) */
  primary: boolean
  /** 書き込み先。既存 typed field か generic map(`metrics.xxx`)か */
  field: keyof CompletedWorkout | `metrics.${string}`
}

/** セッション種別（WorkoutType を再利用。別 enum は作らない） */
export interface SessionTypeDef {
  key: WorkoutType
  label: string
}

/** 期分けモデル */
export type PhaseModelKind = 'race' | 'season' | 'block' | 'none' | 'weight'

/** ダッシュボードの主チャート */
export type PrimaryChart = 'fitness' | 'weight' | 'none'

/** プロフィール設定で表示するランニング系フィールド */
export type ProfileField = 'thresholdHr' | 'maxHr' | 'restingHr' | 'thresholdPace' | 'ftp'

export interface PresetConfig {
  id: ActivityPreset
  /** UI表示名（例: '競技アスリート（S&C）'） */
  label: string
  description: string

  // ===== 語彙 =====
  sessionTypes: SessionTypeDef[]
  defaultSessionType: WorkoutType

  // ===== 指標（記録フォーム + チャート駆動） =====
  metrics: MetricDef[]

  // ===== ケイパビリティフラグ（ランニング専用機能のゲート） =====
  /** 距離/ペース/標高ブロック */
  showRunningMetrics: boolean
  /** LTHR由来の心拍ゾーン */
  showHrZones: boolean
  /** TSS/CTL/ATL + FitnessChart */
  showTss: boolean
  /** PhaseTimelineCard + race-phase ロジック */
  showRacePhasing: boolean
  /** テスト計算機 */
  showTestCalculator: boolean
  /** 目標ラベル（'ターゲットレース' / '目標' / '目標体重'） */
  goalLabel: string

  /** プロフィール設定で表示するフィールド */
  profileFields: ProfileField[]

  // ===== ダッシュボード =====
  primaryChart: PrimaryChart

  // ===== 期分け =====
  phaseModel: PhaseModelKind

  // ===== AI =====
  /** 現 SYSTEM_PROMPT を置換するシステムプロンプト */
  aiSystemPrompt: string
  /** プロンプト補間用の目標名詞（例: 'レース' '大会' '目標体重'） */
  aiGoalNoun: string
}
