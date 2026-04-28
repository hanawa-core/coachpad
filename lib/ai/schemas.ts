import { z } from 'zod'

// ============================================================
// 種目ライブラリ生成
// ============================================================

export const ExerciseSchema = z.object({
  name: z.string().describe('種目名（日本語）'),
  category: z
    .enum(['bodyweight', 'dumbbell', 'barbell', 'resistance_band', 'machine', 'other'])
    .describe('種目カテゴリ'),
  targetMuscles: z
    .array(z.string())
    .describe('対象筋肉（例: 大腿四頭筋、臀筋）'),
  defaultSets: z.number().int().min(1).max(10).describe('推奨セット数'),
  defaultReps: z
    .number()
    .int()
    .nullable()
    .describe('推奨回数（時間制種目の場合は null）'),
  defaultDurationSec: z
    .number()
    .int()
    .nullable()
    .describe('推奨秒数（プランクなど時間制の場合）'),
  defaultRestSec: z.number().int().min(15).max(300).describe('セット間休息秒数'),
  defaultWeight: z
    .number()
    .nullable()
    .describe('推奨重量(kg)、自体重なら null'),
  instructions: z.string().describe('フォームのポイントと指示（簡潔に・100字以内）'),
})

export const ExerciseLibraryGenerationSchema = z.object({
  exercises: z.array(ExerciseSchema).describe('生成された種目リスト'),
})

// ============================================================
// 筋トレテンプレート生成
// ============================================================

export const StrengthTemplateGenerationSchema = z.object({
  name: z.string().describe('テンプレート名（例: 下半身強化A）'),
  description: z.string().describe('テンプレートの目的・概要'),
  category: z
    .enum(['lower_body', 'upper_body', 'core', 'full_body', 'mobility', 'other'])
    .describe('カテゴリ'),
  estimatedDurationMin: z.number().int().describe('推定実施時間（分）'),
  exercises: z.array(ExerciseSchema).describe('種目リスト'),
})

// ============================================================
// ランニングプラン生成
// ============================================================

export const PlannedWorkoutSchema = z.object({
  date: z.string().describe('実施日 YYYY-MM-DD形式'),
  title: z.string().describe('ワークアウト名（例: イージーラン60分、テンポ走15km）'),
  workoutType: z.enum([
    'easy_run',
    'tempo',
    'interval',
    'long_run',
    'race',
    'cross_training',
    'rest',
    'other',
  ]).describe('種別'),
  targetDistanceKm: z.number().nullable().describe('目標距離(km)、なければ null'),
  targetDurationMin: z.number().int().nullable().describe('目標時間(分)、なければ null'),
  targetPaceMinPerKm: z.string().nullable().describe('目標ペース「分:秒」形式、なければ null'),
  description: z.string().describe('指示・狙い・補足（200字以内）'),
})

export const RunningPlanGenerationSchema = z.object({
  rationale: z.string().describe('プラン全体の方針・狙いを簡潔に説明（300字以内）'),
  workouts: z.array(PlannedWorkoutSchema).describe('日毎のワークアウト'),
})
