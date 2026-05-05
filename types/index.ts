import { Timestamp } from 'firebase/firestore'

// ============================================================
// ユーザー・ロール
// ============================================================

export type Role = 'coach' | 'athlete'

// ============================================================
// コーチングプラン
// ============================================================

export type AthletePlan = 'support' | 'lite' | 'standard' | 'premium'

export interface PlanConfig {
  label: string
  price: string          // 表示用
  color: string          // Tailwind text color
  bg: string             // Tailwind bg color
  border: string         // Tailwind border color
  chatReply: string      // チャット返信目安
  planNote: string       // プランの一言説明
}

export const PLAN_CONFIG: Record<AthletePlan, PlanConfig> = {
  support: {
    label: 'サポート',
    price: '無料',
    color: 'text-sky-400',
    bg: 'bg-sky-500/20',
    border: 'border-sky-500/30',
    chatReply: '随時',
    planNote: 'サポートアスリート',
  },
  lite: {
    label: 'ライト',
    price: '¥9,800/月',
    color: 'text-slate-300',
    bg: 'bg-slate-500/20',
    border: 'border-slate-500/30',
    chatReply: '48時間以内',
    planNote: '月1回プラン作成',
  },
  standard: {
    label: 'スタンダード',
    price: '¥19,800/月',
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/20',
    border: 'border-emerald-500/30',
    chatReply: '24時間以内',
    planNote: '週次プラン作成',
  },
  premium: {
    label: 'プレミアム',
    price: '¥38,000/月',
    color: 'text-amber-400',
    bg: 'bg-amber-500/20',
    border: 'border-amber-500/30',
    chatReply: '最優先対応',
    planNote: 'フルオーダーメイド',
  },
}

export interface UserProfile {
  uid: string
  email: string
  displayName: string
  role: Role
  avatarUrl: string | null
  coachId: string | null // 選手のみ
  timezone: string
  targetRaces: TargetRace[]
  createdAt: Timestamp
  /** コーチングプラン（選手のみ。コーチが設定） */
  plan?: AthletePlan | null

  // ===== 拡張フィールド =====
  /** 性別 */
  sex?: 'male' | 'female' | 'other' | null
  /** 生年月日 YYYY-MM-DD */
  birthDate?: string | null
  /** 身長(cm) */
  heightCm?: number | null
  /** 体重(kg) */
  weightKg?: number | null
  /** 居住地 */
  city?: string | null
  /** 国 */
  country?: string | null
  /** 自己紹介・備考 */
  bio?: string | null
  /** FCMプッシュ通知トークン */
  fcmToken?: string | null

  // ===== ランニング設定（選手主に活用） =====
  /** 閾値心拍 (LTHR) */
  thresholdHr?: number | null
  /** 最大心拍 */
  maxHr?: number | null
  /** 安静時心拍 */
  restingHr?: number | null
  /** 乳酸閾値ペース「分:秒/km」 */
  thresholdPace?: string | null
  /** FTP（パワー利用時のみ） */
  ftp?: number | null
}

export interface TargetRace {
  raceName: string
  raceDate: Timestamp
  distanceKm: number
}

// ============================================================
// 選手集計キャッシュ（コーチダッシュボード用）
// ============================================================

export interface AthleteCache {
  id: string // Firestore document ID
  userId: string
  coachId: string
  displayName: string
  email: string
  avatarUrl: string | null
  joinedAt: Timestamp
  isActive: boolean
  latestMetrics: LatestMetrics | null
  lastWorkoutLoggedAt: Timestamp | null
  lastStrengthLoggedAt: Timestamp | null
  weeklyStats: WeeklyStats | null
  /** コーチングプラン */
  plan?: AthletePlan | null
}

export interface LatestMetrics {
  ctl: number
  atl: number
  tsb: number
  updatedAt: Timestamp
}

export interface WeeklyStats {
  weekStart: Timestamp
  totalDistanceKm: number
  totalDurationMin: number
  workoutsCompleted: number
  workoutsPlanned: number
  strengthSessionsCompleted: number
  strengthSessionsPlanned: number
}

// ============================================================
// ワークアウト
// ============================================================

export type WorkoutType =
  | 'easy_run'
  | 'tempo'
  | 'interval'
  | 'long_run'
  | 'race'
  | 'cross_training'
  | 'rest'
  | 'other'

export const WORKOUT_TYPE_LABELS: Record<WorkoutType, string> = {
  easy_run: 'イージーラン',
  tempo: 'テンポラン',
  interval: 'インターバル',
  long_run: 'ロング走',
  race: 'レース',
  cross_training: 'クロストレーニング',
  rest: '休養',
  other: 'その他',
}

export interface AttachedImage {
  imageId: string
  storageUrl: string
  fileName: string
  uploadedAt: Timestamp
}

export interface PlannedWorkout {
  title: string
  description: string
  workoutType: WorkoutType
  targetDistanceKm: number | null
  targetDurationMin: number | null
  targetPaceMinPerKm: string | null
  targetHeartRateZone: 1 | 2 | 3 | 4 | 5 | null
  notes: string
  createdAt: Timestamp
  createdBy: string
}

export interface CompletedWorkout {
  title: string
  workoutType: WorkoutType
  distanceKm: number | null
  durationMin: number | null
  avgPaceMinPerKm: string | null
  avgHeartRate: number | null
  maxHeartRate: number | null
  elevationGainM: number | null
  calories: number | null
  tss: number | null
  ctl: number | null
  atl: number | null
  notes: string
  loggedAt: Timestamp
  attachedImages: AttachedImage[]
  /** Strava 圧縮ポリライン（地図描画用） */
  polyline?: string | null
  startLatLng?: [number, number] | null
  endLatLng?: [number, number] | null
}

export interface CoachFeedback {
  textComment: string
  updatedAt: Timestamp
  updatedBy: string
  hasAnnotatedImages: boolean
}

export interface Workout {
  id: string
  athleteId: string
  coachId: string
  date: string // "YYYY-MM-DD"
  type: 'planned' | 'completed' | 'both'
  planned: PlannedWorkout | null
  completed: CompletedWorkout | null
  coachFeedback: CoachFeedback | null
  createdAt: Timestamp
  updatedAt: Timestamp
}

// ============================================================
// 赤ペン先生（アノテーション）
// ============================================================

export type AnnotationTool = 'pen' | 'arrow' | 'rectangle' | 'text' | 'eraser'

export interface AnnotationStroke {
  tool: AnnotationTool
  color: string
  lineWidth: number
  points: { x: number; y: number }[]
  startX?: number
  startY?: number
  endX?: number
  endY?: number
  text?: string
  fontSize?: number
}

export interface CanvasData {
  width: number
  height: number
  strokes: AnnotationStroke[]
}

export interface Annotation {
  id: string
  workoutId: string
  imageId: string
  coachId: string
  athleteId: string
  originalImageUrl: string
  canvasData: CanvasData
  annotatedImageUrl: string | null
  createdAt: Timestamp
  updatedAt: Timestamp
}

// ============================================================
// 筋トレ
// ============================================================

export type StrengthCategory =
  // ── 下肢 ─────────────────────────────
  | 'hip_joint'   // 股関節
  | 'glutes'      // 臀部
  | 'thigh'       // 大腿部
  | 'knee'        // 膝関節
  | 'lower_leg'   // 下腿部
  | 'ankle'       // 足首
  | 'plantar'     // 足底・足趾
  // ── 体幹・脊柱 ───────────────────────
  | 'abs'         // 腹筋
  | 'lumbar'      // 腰椎
  | 'thoracic'    // 胸椎
  | 'cervical'    // 頸部
  // ── 上肢・体幹上部 ────────────────────
  | 'chest'       // 胸部
  | 'back'        // 背部
  | 'scapula'     // 肩甲骨
  | 'shoulder'    // 肩
  // ── 動作パターン ──────────────────────
  | 'wall_drill'  // ウォールドリル
  | 'agility'     // アジリティー
  | 'full_body'   // 全身
  | 'other'       // その他
  // 旧カテゴリ（後方互換）
  | 'lower_body'
  | 'upper_body'
  | 'core'
  | 'mobility'

export const STRENGTH_CATEGORY_LABELS: Record<StrengthCategory, string> = {
  // 下肢
  hip_joint:  '股関節',
  glutes:     '臀部',
  thigh:      '大腿部',
  knee:       '膝関節',
  lower_leg:  '下腿部',
  ankle:      '足首',
  plantar:    '足底・足趾',
  // 体幹・脊柱
  abs:        '腹筋',
  lumbar:     '腰椎',
  thoracic:   '胸椎',
  cervical:   '頸部',
  // 上肢・体幹上部
  chest:      '胸部',
  back:       '背部',
  scapula:    '肩甲骨',
  shoulder:   '肩',
  // 動作パターン
  wall_drill: 'ウォールドリル',
  agility:    'アジリティー',
  full_body:  '全身',
  other:      'その他',
  // 旧カテゴリ（表示名だけ維持）
  lower_body: '下半身（旧）',
  upper_body: '上半身（旧）',
  core:       'コア（旧）',
  mobility:   'モビリティ（旧）',
}

/** UI フィルター・フォームで使うグループ定義（旧カテゴリ除外） */
export const STRENGTH_CATEGORY_GROUPS: { label: string; categories: StrengthCategory[] }[] = [
  {
    label: '下肢',
    categories: ['hip_joint', 'glutes', 'thigh', 'knee', 'lower_leg', 'ankle', 'plantar'],
  },
  {
    label: '体幹・脊柱',
    categories: ['abs', 'lumbar', 'thoracic', 'cervical'],
  },
  {
    label: '上肢・体幹上部',
    categories: ['chest', 'back', 'scapula', 'shoulder'],
  },
  {
    label: '動作パターン',
    categories: ['wall_drill', 'agility', 'full_body', 'other'],
  },
]

export type ExerciseCategory =
  | 'bodyweight'
  | 'dumbbell'
  | 'barbell'
  | 'resistance_band'
  | 'machine'
  | 'other'

export const EXERCISE_CATEGORY_LABELS: Record<ExerciseCategory, string> = {
  bodyweight: '自体重',
  dumbbell: 'ダンベル',
  barbell: 'バーベル',
  resistance_band: 'バンド',
  machine: 'マシン',
  other: 'その他',
}

export interface Exercise {
  exerciseId: string
  order: number
  name: string
  category: ExerciseCategory
  sets: number
  reps: number | null
  durationSec: number | null
  restSec: number
  targetWeight: number | null
  instructions: string
  videoUrl: string | null
  imageUrl: string | null
  /** 種目ライブラリ参照ID（任意） */
  libraryExerciseId?: string | null
}

/**
 * コーチAIプロフィール
 * AIが生成するメニュー・プランに、このコーチの指導理念・メソッドを反映させる
 */
export interface CoachAiProfile {
  philosophy: string // 基本理念・コーチング哲学
  methodology: string // 指導メソッド・トレーニング理論
  preferences: string // 好む種目・避ける種目・補強の考え方
  nutrition: string // 栄養・補給の方針
  injuryPrevention: string // 怪我予防の考え方
  references: string // 参考にする理論・文献・自身のブログ等
  customInstructions: string // AIへの追加指示（文体、敬語/タメ語、注意事項等）
  /** Anthropic Files API にアップロードしたメソッド資料 */
  documents: CoachAiDocument[]
  updatedAt: Timestamp
}

export interface CoachAiDocument {
  fileId: string // Anthropic file_id
  filename: string
  sizeBytes: number
  uploadedAt: Timestamp
  description: string // この資料が何についてのものか
}

/**
 * 種目ライブラリ（コーチが登録する単独種目のストック）
 * セット数・回数・重量・休息はメニュー作成時に設定するためライブラリには不要
 */
export interface ExerciseLibraryItem {
  id: string
  coachId: string
  name: string
  /** 部位別カテゴリ */
  category: StrengthCategory
  /** 部位タグ（複数可） */
  targetMuscles: string[]
  instructions: string
  videoUrl: string | null
  imageUrl: string | null
  createdAt: Timestamp
  updatedAt: Timestamp
  // 後方互換のため optional で残す（既存データが壊れないよう）
  defaultSets?: number
  defaultReps?: number | null
  defaultDurationSec?: number | null
  defaultRestSec?: number
  defaultWeight?: number | null
}

export interface StrengthTemplate {
  id: string
  coachId: string
  name: string
  description: string
  category: StrengthCategory
  targetMuscles: string[]
  estimatedDurationMin: number
  isPublic: boolean
  exercises: Exercise[]
  createdAt: Timestamp
  updatedAt: Timestamp
}

export interface ExerciseResult {
  exerciseId: string
  actualSets: number
  actualReps: number | null
  actualDurationSec: number | null
  actualWeightKg: number | null
  completed: boolean
  notes: string
}

export interface CompletionReport {
  completedAt: Timestamp
  overallDifficulty: 1 | 2 | 3 | 4 | 5
  notes: string
  exerciseResults: ExerciseResult[]
  /** 痛みがあったか */
  hadPain: boolean
  /** 痛みがあった部位（複数可） */
  painLocations: string[]
  /** 痛みの詳細 */
  painNotes: string
  /** コーチへのメッセージ */
  messageToCoach: string
}

export interface StrengthAssignment {
  id: string
  templateId: string
  coachId: string
  athleteId: string
  date: string // "YYYY-MM-DD"
  templateSnapshot: {
    name: string
    exercises: Exercise[]
  }
  status: 'assigned' | 'completed' | 'skipped'
  completionReport: CompletionReport | null
  coachFeedback: {
    textComment: string
    updatedAt: Timestamp
  } | null
  createdAt: Timestamp
  updatedAt: Timestamp
}

// ============================================================
// Wellness（日々の体調記録）
// ============================================================

export type WellnessScore = 1 | 2 | 3 | 4 | 5

export interface WellnessEntry {
  id: string
  athleteId: string
  /** 記録日 YYYY-MM-DD */
  date: string
  /** 睡眠時間（時間） */
  sleepHours: number | null
  /** 睡眠の質 1=最悪, 5=最高 */
  sleepQuality: WellnessScore | null
  /** 筋肉痛 1=なし, 5=ひどい */
  soreness: WellnessScore | null
  /** 疲労感 1=爽快, 5=極度の疲労 */
  fatigue: WellnessScore | null
  /** 気分 1=最悪, 5=最高 */
  mood: WellnessScore | null
  /** ストレス 1=なし, 5=極度 */
  stress: WellnessScore | null
  /** 安静時心拍 */
  restingHr: number | null
  /** 体重(kg) */
  weight: number | null
  /** 備考 */
  notes: string
  createdAt: Timestamp
  updatedAt: Timestamp
}

// ============================================================
// 動作分析（動画フィードバック）
// ============================================================

export type MotionAnalysisStatus = 'pending' | 'reviewed'

export interface MotionAnalysis {
  id: string
  athleteId: string
  coachId: string
  /** Storage URL */
  videoUrl: string
  /** ファイル名 */
  fileName: string
  /** ファイルサイズ(bytes) */
  fileSize: number
  /** 動画の長さ(秒) */
  durationSec: number | null
  /** 選手のキャプション・相談内容 */
  caption: string
  /** どんな動作か（例: スクワット、ランニングフォーム） */
  motionType: string
  /** コーチのテキストフィードバック */
  coachFeedback: string | null
  /** コーチが見たかどうか */
  status: MotionAnalysisStatus
  uploadedAt: Timestamp
  reviewedAt: Timestamp | null
}

/**
 * 動画分析へのコーチ書き込み（フレーム赤ペン）
 * Firestore: motionAnalyses/{motionId}/annotations/{annotationId}
 */
export interface MotionAnnotation {
  id: string
  motionId: string
  coachId: string
  /** 動画上で書き込んだ時間（秒） */
  timestampSec: number
  /** 注釈付き画像の Storage URL */
  annotatedImageUrl: string
  /** 描画データ（編集再現用） */
  canvasData: CanvasData
  /** コメント（任意） */
  note: string
  createdAt: Timestamp
}

// ============================================================
// チャット
// ============================================================

/** スレッドID = `${coachId}_${athleteId}` */
export interface ChatThread {
  id: string
  participants: string[] // [coachId, athleteId]
  coachId: string
  athleteId: string
  coachName: string
  athleteName: string
  lastMessage: {
    text: string
    senderId: string
    sentAt: Timestamp
    type: 'text' | 'image'
  } | null
  /** 各ユーザーが最後に既読した時刻 */
  lastReadBy: Record<string, Timestamp>
  updatedAt: Timestamp
  createdAt: Timestamp
}

export interface ChatMessage {
  id: string
  threadId: string
  senderId: string
  type: 'text' | 'image'
  /** text または image のキャプション */
  text: string
  imageUrl?: string | null
  /** 画像サイズ */
  imageWidth?: number | null
  imageHeight?: number | null
  sentAt: Timestamp
}

// ============================================================
// 招待
// ============================================================

export interface Invite {
  id: string
  coachId: string
  email: string | null
  token: string
  status: 'pending' | 'accepted' | 'expired'
  expiresAt: Timestamp
  acceptedByUserId: string | null
  createdAt: Timestamp
}

// ============================================================
// 通知
// ============================================================

export type NotificationType =
  | 'coach_feedback'
  | 'annotation_added'
  | 'workout_assigned'
  | 'strength_assigned'
  | 'workout_logged'
  | 'chat_message'
  | 'wellness_logged'

export interface Notification {
  id: string
  recipientId: string
  senderId: string
  type: NotificationType
  relatedEntityType: 'workout' | 'strengthAssignment' | 'annotation' | 'chat' | 'wellness'
  relatedEntityId: string
  title: string
  body: string
  isRead: boolean
  createdAt: Timestamp
}

// ============================================================
// AI チーム分析
// ============================================================

export interface AthleteAiAnalysis {
  athleteId: string
  name: string
  alertLevel: 'danger' | 'warning' | 'good'
  summary: string          // 1〜2文の状態サマリー（コーチ向け）
  actions: string[]        // コーチへの推奨アクション（1〜3項目）
}

export interface TeamAiAnalysis {
  coachId: string
  athletes: AthleteAiAnalysis[]
  generatedAt: Timestamp
}

// ============================================================
// カレンダー用集計
// ============================================================

export interface CalendarDayData {
  date: string
  workouts: Workout[]
  strengthAssignments: StrengthAssignment[]
}
