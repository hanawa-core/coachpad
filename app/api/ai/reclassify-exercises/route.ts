import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { adminAuth, adminDb } from '@/lib/firebase/admin'
import { getAnthropicClient, MODEL_STANDARD } from '@/lib/ai/client'
import { checkAndIncrementRateLimit, RATE_LIMIT_ERROR_MESSAGE } from '@/lib/ai/rate-limit'

const RequestBody = z.object({
  coachId: z.string(),
})

/** 旧カテゴリ値 */
const LEGACY_CATEGORIES = ['lower_body', 'upper_body', 'core', 'mobility']

/** 新カテゴリ一覧（AIに渡す） */
const NEW_CATEGORIES = [
  'hip_joint=股関節', 'glutes=臀部', 'thigh=大腿部', 'knee=膝関節',
  'lower_leg=下腿部', 'ankle=足首', 'plantar=足底・足趾',
  'abs=腹筋', 'lumbar=腰椎', 'thoracic=胸椎', 'cervical=頸部',
  'chest=胸部', 'back=背部', 'scapula=肩甲骨', 'shoulder=肩',
  'wall_drill=ウォールドリル', 'agility=アジリティー', 'full_body=全身', 'other=その他',
]

const VALID_CATEGORIES = new Set(NEW_CATEGORIES.map((c) => c.split('=')[0]))

/** JSON 抽出ヘルパー */
function extractJSON(text: string): string | null {
  const t = text.trim()
  const codeBlock = t.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (codeBlock) return codeBlock[1].trim()
  const arr = t.indexOf('[')
  const obj = t.indexOf('{')
  if (arr === -1 && obj === -1) return null
  const start = arr === -1 ? obj : obj === -1 ? arr : Math.min(arr, obj)
  return t.slice(start)
}

export async function POST(req: NextRequest) {
  // 認証
  const auth = req.headers.get('authorization')
  if (!auth?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }
  let requesterId: string
  try {
    const decoded = await adminAuth().verifyIdToken(auth.substring('Bearer '.length))
    requesterId = decoded.uid
  } catch {
    return NextResponse.json({ error: 'invalid token' }, { status: 401 })
  }

  let body: z.infer<typeof RequestBody>
  try {
    body = RequestBody.parse(await req.json())
  } catch (e: any) {
    return NextResponse.json({ error: 'invalid request' }, { status: 400 })
  }
  if (requesterId !== body.coachId) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  }

  // 一括処理は重い（複数バッチでAPI呼び出し）ので weight=3
  const rl = await checkAndIncrementRateLimit(requesterId, 3)
  if (!rl.ok) {
    return NextResponse.json({ error: RATE_LIMIT_ERROR_MESSAGE }, { status: 429 })
  }

  // 旧カテゴリの種目を取得
  const snap = await adminDb()
    .collection('exerciseLibrary')
    .where('coachId', '==', body.coachId)
    .get()

  const legacy = snap.docs
    .filter((d) => LEGACY_CATEGORIES.includes(d.data().category))
    .map((d) => ({
      id: d.id,
      name: d.data().name as string,
      targetMuscles: (d.data().targetMuscles as string[]) ?? [],
      instructions: (d.data().instructions as string) ?? '',
      oldCategory: d.data().category as string,
    }))

  if (legacy.length === 0) {
    return NextResponse.json({ ok: true, updated: 0 })
  }

  const client = getAnthropicClient()
  const BATCH_SIZE = 25
  let updated = 0

  // バッチ処理（25件ずつ）
  for (let i = 0; i < legacy.length; i += BATCH_SIZE) {
    const batch = legacy.slice(i, i + BATCH_SIZE)

    const exerciseList = batch
      .map((ex, idx) =>
        `${idx + 1}. 種目名: ${ex.name}\n   対象筋肉: ${ex.targetMuscles.join('・')}\n   説明: ${ex.instructions.slice(0, 100)}`
      )
      .join('\n\n')

    const prompt = `以下の種目それぞれに最適なカテゴリを割り当ててください。

カテゴリ一覧:
${NEW_CATEGORIES.join(', ')}

種目リスト:
${exerciseList}

必ず以下のJSON配列のみで返答してください（説明不要）:
[{"index":1,"category":"hip_joint"},{"index":2,"category":"thigh"},...]`

    const response = await client.messages.create({
      model: MODEL_STANDARD,
      max_tokens: 1500,
      system: '種目名・対象筋肉・説明からカテゴリを判定し、JSONのみを返すアシスタントです。',
      messages: [{ role: 'user', content: prompt }],
    })

    const textBlock = response.content.find((b) => b.type === 'text')
    if (!textBlock || textBlock.type !== 'text') continue

    const jsonText = extractJSON(textBlock.text)
    if (!jsonText) continue

    let results: { index: number; category: string }[]
    try {
      results = JSON.parse(jsonText)
    } catch {
      continue
    }

    // Firestore 更新
    const dbBatch = adminDb().batch()
    for (const result of results) {
      const ex = batch[result.index - 1]
      if (!ex) continue
      const newCat = result.category
      if (!VALID_CATEGORIES.has(newCat)) continue
      dbBatch.update(adminDb().collection('exerciseLibrary').doc(ex.id), {
        category: newCat,
        updatedAt: new Date(),
      })
      updated++
    }
    await dbBatch.commit()
  }

  return NextResponse.json({ ok: true, updated, total: legacy.length })
}
