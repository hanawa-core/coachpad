import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { adminAuth, adminDb } from '@/lib/firebase/admin'
import { getAnthropicClient, MODEL_STANDARD } from '@/lib/ai/client'
import { buildSystemPromptWithCoach } from '@/lib/ai/coach-profile'
import { checkAndIncrementRateLimit, RATE_LIMIT_ERROR_MESSAGE } from '@/lib/ai/rate-limit'

const RequestBody = z.object({
  coachId: z.string(),
})

const SYSTEM_PROMPT = `あなたはコーチのAIアシスタントです。担当選手全員の直近データを分析し、コーチが今日何をすべきかを具体的に提示してください。

alertLevel の判定基準（客観的指標に基づく）:
- danger: TSB < -15、または疲労スコア4-5が3日以上連続、または痛み報告あり
- warning: TSB < -5、または疲労スコア3以上が続いている、または睡眠スコア2以下が続いている
- good: 上記以外

出力の原則:
- summary は1〜2文、日本語、コーチ向けに端的に（選手の現状を一言で）
- actions は具体的なアクション（「今日のロング走を10kmから8kmに短縮」「チャットで体調確認」等）、1〜3項目
- 医療診断は行わない
- データが少ない選手は「データ不足」として good にする`

export async function POST(req: NextRequest) {
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
    return NextResponse.json({ error: 'invalid request', details: e.message }, { status: 400 })
  }

  // コーチ本人のみ実行可能
  if (requesterId !== body.coachId) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  }

  // レート制限（チーム分析は重い処理なので weight=2）
  const rl = await checkAndIncrementRateLimit(requesterId, 2)
  if (!rl.ok) {
    return NextResponse.json({ error: RATE_LIMIT_ERROR_MESSAGE }, { status: 429 })
  }

  // 選手一覧取得
  const athletesSnap = await adminDb()
    .collection('users')
    .where('coachId', '==', body.coachId)
    .where('role', '==', 'athlete')
    .get()

  if (athletesSnap.empty) {
    return NextResponse.json({ error: 'no athletes' }, { status: 400 })
  }

  const athletes = athletesSnap.docs.map((d) => ({
    uid: d.id,
    displayName: (d.data().displayName as string) ?? '不明',
  }))

  // 7日前の日付文字列
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
  const startStr = sevenDaysAgo.toISOString().split('T')[0]

  // 全選手の直近データを並列取得
  const athleteData = await Promise.all(
    athletes.map(async (athlete) => {
      const [workoutsSnap, wellnessSnap, athleteCacheSnap] = await Promise.all([
        adminDb()
          .collection('workouts')
          .where('athleteId', '==', athlete.uid)
          .get(),
        adminDb()
          .collection('wellnessEntries')
          .where('athleteId', '==', athlete.uid)
          .get(),
        adminDb()
          .collection('athletes')
          .where('userId', '==', athlete.uid)
          .limit(1)
          .get(),
      ])

      // 直近7日のワークアウト
      const recentWorkouts = workoutsSnap.docs
        .map((d) => d.data() as any)
        .filter((w) => w.date >= startStr && w.completed != null)
        .sort((a, b) => a.date.localeCompare(b.date))
        .slice(-7)

      // 直近7日のWellness
      const recentWellness = wellnessSnap.docs
        .map((d) => d.data() as any)
        .filter((e) => e.date >= startStr)
        .sort((a, b) => a.date.localeCompare(b.date))
        .slice(-7)

      // 筋トレ痛み報告（直近7日）
      const strengthSnap = await adminDb()
        .collection('strengthAssignments')
        .where('athleteId', '==', athlete.uid)
        .get()
      const recentPain = strengthSnap.docs
        .map((d) => d.data() as any)
        .filter(
          (s) =>
            s.date >= startStr &&
            s.completionReport?.hadPain === true
        )

      // CTL/ATL/TSB
      const metrics = athleteCacheSnap.docs[0]?.data()?.latestMetrics ?? null

      return { athlete, recentWorkouts, recentWellness, recentPain, metrics }
    })
  )

  // コンテキストブロック生成
  function buildContextBlock(): string {
    const lines: string[] = ['## 担当選手の直近データ（7日間）\n']

    for (const { athlete, recentWorkouts, recentWellness, recentPain, metrics } of athleteData) {
      lines.push(`### ${athlete.displayName}`)

      // フィットネス指標
      if (metrics) {
        lines.push(
          `フィットネス指標: CTL=${metrics.ctl?.toFixed(1) ?? '?'} / ATL=${metrics.atl?.toFixed(1) ?? '?'} / TSB=${metrics.tsb?.toFixed(1) ?? '?'}`
        )
      } else {
        lines.push('フィットネス指標: データなし')
      }

      // ワークアウト
      if (recentWorkouts.length === 0) {
        lines.push('ワークアウト: 直近7日間の記録なし')
      } else {
        lines.push('ワークアウト（直近7日）:')
        for (const w of recentWorkouts) {
          const c = w.completed
          const dist = c?.distanceKm ? `${c.distanceKm}km` : ''
          const dur = c?.durationMin ? `${c.durationMin}分` : ''
          lines.push(`  ${w.date}: ${c?.title ?? w.planned?.title ?? '記録あり'} ${[dist, dur].filter(Boolean).join('/')}`)
        }
      }

      // Wellness
      if (recentWellness.length === 0) {
        lines.push('Wellness: 直近7日間の記録なし')
      } else {
        lines.push('Wellness（直近7日）:')
        for (const e of recentWellness) {
          const parts = []
          if (e.fatigue != null) parts.push(`疲労${e.fatigue}`)
          if (e.soreness != null) parts.push(`筋肉痛${e.soreness}`)
          if (e.sleepQuality != null) parts.push(`睡眠質${e.sleepQuality}`)
          if (e.sleepHours != null) parts.push(`睡眠${e.sleepHours}h`)
          if (e.mood != null) parts.push(`気分${e.mood}`)
          lines.push(`  ${e.date}: ${parts.join(' / ')}`)
        }
      }

      // 痛み報告
      if (recentPain.length > 0) {
        lines.push('⚠️ 痛み報告あり:')
        for (const s of recentPain) {
          const locs = (s.completionReport?.painLocations ?? []).join('・')
          lines.push(`  ${s.date}: ${locs || '部位不明'} — ${s.completionReport?.painNotes || ''}`)
        }
      }

      lines.push('')
    }

    return lines.join('\n')
  }

  try {
    const client = getAnthropicClient()
    const systemBlocks = await buildSystemPromptWithCoach(body.coachId, SYSTEM_PROMPT)
    const contextBlock = buildContextBlock()

    const response = await client.messages.create({
      model: MODEL_STANDARD,
      max_tokens: 4096,
      system: systemBlocks,
      messages: [
        {
          role: 'user',
          content: `${contextBlock}\n\n上記の選手全員を分析し、コーチへの提言をJSON形式で返してください。athleteId は以下の通りです:\n${athletes.map((a) => `- ${a.displayName}: "${a.uid}"`).join('\n')}`,
        },
      ],
      output_config: {
        format: {
          type: 'json_schema',
          schema: {
            type: 'object',
            properties: {
              athletes: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    athleteId: { type: 'string' },
                    name: { type: 'string' },
                    alertLevel: {
                      type: 'string',
                      enum: ['danger', 'warning', 'good'],
                    },
                    summary: { type: 'string' },
                    actions: {
                      type: 'array',
                      items: { type: 'string' },
                    },
                  },
                  required: ['athleteId', 'name', 'alertLevel', 'summary', 'actions'],
                  additionalProperties: false,
                },
              },
            },
            required: ['athletes'],
            additionalProperties: false,
          },
        },
      },
    } as any)

    const textBlock = response.content.find((b) => b.type === 'text')
    if (!textBlock || textBlock.type !== 'text') {
      return NextResponse.json({ error: 'No text response' }, { status: 500 })
    }

    const parsed = JSON.parse(textBlock.text) as { athletes: any[] }

    // Firestoreにキャッシュ保存
    const admin = await import('firebase-admin')
    await adminDb()
      .collection('aiTeamAnalysis')
      .doc(body.coachId)
      .set({
        coachId: body.coachId,
        athletes: parsed.athletes,
        generatedAt: admin.firestore.FieldValue.serverTimestamp(),
      })

    return NextResponse.json({ ok: true, analysis: parsed, usage: response.usage })
  } catch (e: any) {
    console.error('AI team analysis error:', e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
