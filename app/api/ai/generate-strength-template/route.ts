import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { adminAuth } from '@/lib/firebase/admin'
import { getAnthropicClient, MODEL_STANDARD } from '@/lib/ai/client'
import { StrengthTemplateGenerationSchema } from '@/lib/ai/schemas'
import { buildSystemPromptWithCoach } from '@/lib/ai/coach-profile'

function extractJSON(text: string): string | null {
  const t = text.trim()
  const codeBlock = t.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (codeBlock) return codeBlock[1].trim()
  const obj = t.indexOf('{')
  const arr = t.indexOf('[')
  if (obj === -1 && arr === -1) return null
  const start = obj === -1 ? arr : arr === -1 ? obj : Math.min(obj, arr)
  return t.slice(start)
}

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
- category は関節・部位基準: thigh=大腿部, glutes=臀部, lower_leg=下腿部, ankle=足首, hip_joint=股関節, abs=腹筋, lumbar=腰椎, thoracic=胸椎, back=背部, scapula=肩甲骨, shoulder=肩, wall_drill=ウォールドリル, agility=アジリティー, full_body=全身, other=その他

必ず以下のJSON形式のみで応答してください。前後に説明文や\`\`\`は不要です:
{"name":"テンプレート名","description":"概要","category":"lower_body","estimatedDurationMin":40,"exercises":[{"name":"種目名","category":"lower_body","targetMuscles":["筋肉"],"defaultSets":3,"defaultReps":10,"defaultDurationSec":null,"defaultRestSec":60,"defaultWeight":null,"instructions":"フォームのポイント"}]}`

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
    })

    const textBlock = response.content.find((b) => b.type === 'text')
    if (!textBlock || textBlock.type !== 'text') {
      return NextResponse.json({ error: 'AI応答が取得できませんでした。もう一度試してください。' }, { status: 500 })
    }
    const jsonText = extractJSON(textBlock.text)
    if (!jsonText) {
      console.error('No JSON found in response:', textBlock.text.slice(0, 200))
      return NextResponse.json({ error: 'AI応答からJSONを取得できませんでした。もう一度試してください。' }, { status: 500 })
    }
    let parsed
    try {
      parsed = StrengthTemplateGenerationSchema.parse(JSON.parse(jsonText))
    } catch (parseErr: any) {
      console.error('Parse error:', parseErr.message, 'raw:', jsonText.slice(0, 300))
      return NextResponse.json({ error: 'AI応答の解析に失敗しました。もう一度試してください。' }, { status: 500 })
    }

    return NextResponse.json({ ok: true, template: parsed, usage: response.usage })
  } catch (e: any) {
    console.error('AI generation error:', e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
