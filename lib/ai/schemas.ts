import { z } from 'zod'

// ============================================================
// 種目ライブラリ生成
// ============================================================

export const ExerciseSchema = z.object({
  name: z.string().describe('種目名（日本語・カタカナ）'),
  category: z
    .enum(['thigh', 'glutes', 'lower_leg', 'ankle', 'hip_joint', 'abs', 'lumbar', 'thoracic', 'back', 'scapula', 'shoulder', 'wall_drill', 'agility', 'full_body', 'other'])
    .describe('関節・部位カテゴリ'),
  targetMuscles: z
    .array(z.string())
    .describe('対象筋肉（例: 大腿四頭筋、臀筋）'),
  instructions: z.string().describe('フォームのポイントと指示（簡潔に・150字以内）'),
})

export const ExerciseLibraryGenerationSchema = z.object({
  exercises: z.array(ExerciseSchema).describe('生成された種目リスト'),
})

// テンプレート内の種目（sets/reps含む詳細版）
export const TemplateExerciseSchema = z.object({
  name: z.string().describe('種目名（日本語・カタカナ）'),
  category: z
    .enum(['thigh', 'glutes', 'lower_leg', 'ankle', 'hip_joint', 'abs', 'lumbar', 'thoracic', 'back', 'scapula', 'shoulder', 'wall_drill', 'agility', 'full_body', 'other'])
    .describe('関節・部位カテゴリ'),
  targetMuscles: z.array(z.string()).describe('対象筋肉'),
  defaultSets: z.number().int().min(1).max(10).describe('推奨セット数'),
  defaultReps: z.number().int().nullable().describe('推奨回数（時間制は null）'),
  defaultDurationSec: z.number().int().nullable().describe('推奨秒数（プランクなど）'),
  defaultRestSec: z.number().int().min(15).max(300).describe('セット間休息秒数'),
  defaultWeight: z.number().nullable().describe('推奨重量(kg)、自体重なら null'),
  instructions: z.string().describe('フォームのポイントと指示'),
})

// ============================================================
// 筋トレテンプレート生成
// ============================================================

export const StrengthTemplateGenerationSchema = z.object({
  name: z.string().describe('テンプレート名（例: 大腿部強化A）'),
  description: z.string().describe('テンプレートの目的・概要'),
  category: z
    .enum(['thigh', 'glutes', 'lower_leg', 'ankle', 'hip_joint', 'abs', 'lumbar', 'thoracic', 'back', 'scapula', 'shoulder', 'wall_drill', 'agility', 'full_body', 'other'])
    .describe('関節・部位カテゴリ'),
  estimatedDurationMin: z.number().int().describe('推定実施時間（分）'),
  exercises: z.array(TemplateExerciseSchema).describe('種目リスト'),
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
