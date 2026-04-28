import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { adminAuth } from '@/lib/firebase/admin'
import { getAnthropicClient, MODEL_STANDARD } from '@/lib/ai/client'
import { ExerciseLibraryGenerationSchema } from '@/lib/ai/schemas'

const RequestBody = z.object({
  prompt: z.string().min(3).max(500),
  count: z.number().int().min(1).max(20).default(10),
})

const SYSTEM_PROMPT = `あなたはトレイルランニング・耐久系競技の専門コーチです。
ユーザーの要望に基づいて、ランナー向けの筋トレ種目を厳選して提案してください。

要件:
- ランナーの実走力向上に直結する種目を優先（下半身・体幹・走動作の安定性）
- 自体重・ダンベル・バンド・ジムマシン等、実施場所に応じて適切なカテゴリを選ぶ
- フォームのポイントを明確に。怪我リスクのある種目では特に注意点を含める
- 全て日本語。種目名はカタカナで記載
- セット数・回数は典型的なランナー向けの設定（例: 3セット×10-15回）

出力は構造化JSONで返してください。`

export async function POST(req: NextRequest) {
  // 認証
  const auth = req.headers.get('authorization')
  if (!auth?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }
  let userId: string
  try {
    const decoded = await adminAuth().verifyIdToken(auth.substring('Bearer '.length))
    userId = decoded.uid
  } catch {
    return NextResponse.json({ error: 'invalid token' }, { status: 401 })
  }

  // バリデーション
  let body
  try {
    body = RequestBody.parse(await req.json())
  } catch (e: any) {
    return NextResponse.json({ error: 'invalid request', details: e.message }, { status: 400 })
  }

  // 種目ライブラリ生成は「分身AI」を使わない（一般的な種目を効率的に提案）
  try {
    const client = getAnthropicClient()
    const response = await client.messages.create({
      model: MODEL_STANDARD,
      max_tokens: 16000,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: `以下の要望に合わせて種目を ${body.count} 個提案してください:\n\n${body.prompt}`,
        },
      ],
      output_config: {
        format: {
          type: 'json_schema',
          schema: {
            type: 'object',
            properties: {
              exercises: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    name: { type: 'string' },
                    category: {
                      type: 'string',
                      enum: ['bodyweight', 'dumbbell', 'barbell', 'resistance_band', 'machine', 'other'],
                    },
                    targetMuscles: { type: 'array', items: { type: 'string' } },
                    defaultSets: { type: 'integer' },
                    defaultReps: { type: ['integer', 'null'] },
                    defaultDurationSec: { type: ['integer', 'null'] },
                    defaultRestSec: { type: 'integer' },
                    defaultWeight: { type: ['number', 'null'] },
                    instructions: { type: 'string' },
                  },
                  required: [
                    'name',
                    'category',
                    'targetMuscles',
                    'defaultSets',
                    'defaultReps',
                    'defaultDurationSec',
                    'defaultRestSec',
                    'defaultWeight',
                    'instructions',
                  ],
                  additionalProperties: false,
                },
              },
            },
            required: ['exercises'],
            additionalProperties: false,
          },
        },
      },
    })

    // テキストブロックから JSON を取り出してパース
    const textBlock = response.content.find((b) => b.type === 'text')
    if (!textBlock || textBlock.type !== 'text') {
      return NextResponse.json({ error: 'No text response' }, { status: 500 })
    }
    const parsed = ExerciseLibraryGenerationSchema.parse(JSON.parse(textBlock.text))

    return NextResponse.json({
      ok: true,
      exercises: parsed.exercises,
      usage: response.usage,
    })
  } catch (e: any) {
    console.error('AI generation error:', e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
