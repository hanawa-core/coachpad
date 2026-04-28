import Anthropic from '@anthropic-ai/sdk'

let _client: Anthropic | null = null

/**
 * サーバーサイド専用 Anthropicクライアント
 * APIキーはクライアントには絶対に露出させない
 */
export function getAnthropicClient(): Anthropic {
  if (_client) return _client
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY is not set in environment')
  }
  _client = new Anthropic({ apiKey })
  return _client
}

/**
 * AI モデル選択
 *
 * - HIGH: 重要・高品質が必要な場面（ランニングプラン生成）
 * - STANDARD: 一般的な場面（筋トレテンプレ、種目ライブラリ）
 *
 * 環境変数 AI_TIER で切り替え可能:
 * - "economy" : すべて Sonnet（最安、コスト 1/5）
 * - "balanced": Sonnet + Opus 混合（デフォルト）
 * - "premium" : すべて Opus（最高品質）
 *
 * 同じコーチプロフィールを参照するため、モデルが変わっても「指導理念」は維持される
 */
type Tier = 'economy' | 'balanced' | 'premium'

function getTier(): Tier {
  const v = process.env.AI_TIER as Tier | undefined
  if (v === 'economy' || v === 'balanced' || v === 'premium') return v
  return 'balanced'
}

export const MODEL_HIGH =
  getTier() === 'economy' ? 'claude-sonnet-4-6' : 'claude-opus-4-7'
export const MODEL_STANDARD =
  getTier() === 'premium' ? 'claude-opus-4-7' : 'claude-sonnet-4-6'

// 後方互換
export const AI_MODEL = MODEL_HIGH
