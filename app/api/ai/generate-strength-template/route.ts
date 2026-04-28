import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { adminAuth } from '@/lib/firebase/admin'
import { getAnthropicClient, MODEL_STANDARD } from '@/lib/ai/client'
import { StrengthTemplateGenerationSchema } from '@/lib/ai/schemas'
import { buildSystemPromptWithCoach } from '@/lib/ai/coach-profile'

const RequestBody = z.object({
  prompt: z.string().min(3).max(500),
})

const SYSTEM_PROMPT = `あなたはトレイルランニング・耐久系競技の専門コーチです。
ユーザーの要望に基づいて、走力向上に最適な筋トレメニュー（複数種目セット）を1つ作成してください。

要件:
- 1メニューあたり 4〜8 種目で構成
- ランナーの怪我予防と推進力向上を意識した種目選定
- ウォーミングアップから本セットへの順序（負荷の軽い種目から重い種目へ）
- 種目数・量は推定実施時間（30〜60分）に収まるように調整
- 全て日本語。種目名はカタカナで記載

出力は構造化JSONで返してください。`

export async function POST(req: NextRequest) {
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

  let body
  try {
    body = RequestBody.parse(await req.json())
  } catch (e: any) {
    return NextResponse.json({ error: 'invalid request' }, { status: 400 })
  }

  try {
    const client = getAnthropicClient()
    const systemBlocks = await buildSystemPromptWithCoach(userId, SYSTEM_PROMPT)
    const response = await client.messages.create({
      model: MODEL_STANDARD,
      max_tokens: 4000,
      system: systemBlocks,
      messages: [{ role: 'user', content: body.prompt }],
      output_config: {
        format: {
          type: 'json_schema',
          schema: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              description: { type: 'string' },
              category: {
                type: 'string',
                enum: ['lower_body', 'upper_body', 'core', 'full_body', 'mobility', 'other'],
              },
              estimatedDurationMin: { type: 'integer' },
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
            required: ['name', 'description', 'category', 'estimatedDurationMin', 'exercises'],
            additionalProperties: false,
          },
        },
      },
    })

    const textBlock = response.content.find((b) => b.type === 'text')
    if (!textBlock || textBlock.type !== 'text') {
      return NextResponse.json({ error: 'AI応答が取得できませんでした。もう一度試してください。' }, { status: 500 })
    }
    const rawText = textBlock.text.trim()
    if (!rawText.startsWith('{') && !rawText.startsWith('[')) {
      console.error('Unexpected non-JSON from Anthropic:', rawText.slice(0, 200))
      return NextResponse.json({ error: 'AI応答が無効でした。もう一度試してください。' }, { status: 500 })
    }
    let parsed
    try {
      parsed = StrengthTemplateGenerationSchema.parse(JSON.parse(rawText))
    } catch (parseErr: any) {
      console.error('Parse error:', parseErr.message, 'raw:', rawText.slice(0, 300))
      return NextResponse.json({ error: 'AI応答の解析に失敗しました。もう一度試してください。' }, { status: 500 })
    }

    return NextResponse.json({ ok: true, template: parsed, usage: response.usage })
  } catch (e: any) {
    console.error('AI generation error:', e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
