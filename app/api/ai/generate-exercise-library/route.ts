import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { adminAuth } from '@/lib/firebase/admin'
import { getAnthropicClient, MODEL_STANDARD } from '@/lib/ai/client'
import { ExerciseLibraryGenerationSchema } from '@/lib/ai/schemas'

/** モデルの応答テキストから JSON 部分だけを抽出する */
function extractJSON(text: string): string | null {
  const t = text.trim()
  // ```json ... ``` または ``` ... ``` のコードブロックを除去
  const codeBlock = t.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (codeBlock) return codeBlock[1].trim()
  // { または [ で始まる部分を探す
  const obj = t.indexOf('{')
  const arr = t.indexOf('[')
  if (obj === -1 && arr === -1) return null
  const start = obj === -1 ? arr : arr === -1 ? obj : Math.min(obj, arr)
  return t.slice(start)
}

const RequestBody = z.object({
  prompt: z.string().min(3).max(500),
  count: z.number().int().min(1).max(20).default(10),
})

const SYSTEM_PROMPT = `あなたはトレイルランニング・耐久系競技の専門コーチです。
ユーザーの要望に基づいて、ランナー向けの筋トレ種目を厳選して提案してください。

要件:
- ランナーの実走力向上に直結する種目を優先（下半身・体幹・走動作の安定性）
- カテゴリは関節・部位基準で以下から選択: thigh=大腿部, glutes=臀部, lower_leg=下腿部, ankle=足首, hip_joint=股関節, abs=腹筋, lumbar=腰椎, thoracic=胸椎, back=背部, scapula=肩甲骨, shoulder=肩, wall_drill=ウォールドリル, agility=アジリティー, full_body=全身, other=その他
- フォームのポイントを明確に。怪我リスクのある種目では特に注意点を含める
- 全て日本語。種目名はカタカナで記載

必ず以下のJSON形式のみで応答してください。前後に説明文や\`\`\`は不要です:
{"exercises":[{"name":"種目名","category":"thigh","targetMuscles":["筋肉名"],"instructions":"フォームのポイント"}]}`

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
      max_tokens: 6000,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: `以下の要望に合わせて種目を ${body.count} 個提案してください:\n\n${body.prompt}`,
        },
      ],
    })

    // テキストブロックから JSON を取り出してパース
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
      parsed = ExerciseLibraryGenerationSchema.parse(JSON.parse(jsonText))
    } catch (parseErr: any) {
      console.error('Parse error:', parseErr.message, 'raw:', jsonText.slice(0, 300))
      return NextResponse.json({ error: 'AI応答の解析に失敗しました。もう一度試してください。' }, { status: 500 })
    }

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
