import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { adminAuth, adminDb } from '@/lib/firebase/admin'
import { getAnthropicClient, AI_MODEL } from '@/lib/ai/client'
import { RunningPlanGenerationSchema } from '@/lib/ai/schemas'
import {
  buildSystemPromptWithCoach,
  fetchCoachDocumentIds,
} from '@/lib/ai/coach-profile'
import { checkAndIncrementRateLimit, RATE_LIMIT_ERROR_MESSAGE } from '@/lib/ai/rate-limit'

const RequestBody = z.object({
  athleteName: z.string(),
  athleteId: z.string().optional(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  weeks: z.number().int().min(1).max(8).default(2),
  raceDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable(),
  raceDistance: z.string().nullable(),
  currentFitness: z.string(),
  notes: z.string().optional(),
})

const SYSTEM_PROMPT = `あなたはトレイルランニング・耐久系競技の専門コーチです。
選手の現状とレース目標を踏まえ、週ごとに最適化された日毎のメニューを作成してください。
ランニング練習だけでなく、必要に応じて筋力トレーニング日・休養日も含めてください。

原則:
- ハード/イージーの原則: 強度の高い練習の翌日はリカバリー
- 週間TSS（負荷）の上昇は10%以下を目安
- 期間内に長距離走（ロング走）を週1回必ず含める
- 完全休養日を週1〜2日設定
- ペースは選手の現状（Easy/Threshold/VO2max）に合わせて指定
- 種目ライブラリが提供されている場合、筋力トレーニング日は必ずその種目から選択すること

⚠️ ピーキング理論（必ず守ってください）:
- レース日から逆算してフェーズを判定
- 【ボリューム期】レース42日以上前 or レース未設定: 有酸素ベース構築・走行量を確保
- 【ビルド期】レース14〜42日前: レース特異的強度を上げる、ロング走最大化
- 【ピーク】レース8〜14日前: 質を維持しつつ量を10〜20%減らす
- 【テーパー】レース1〜7日前: 量を50%まで減量、強度は1〜2回維持
- 【レースウィーク】レース当日 ±3日: 軽いジョグ・休養中心
- 【リカバリー】レース後14日以内: 完全休養 or 軽いジョグのみ。強度練習は禁止

出力は構造化JSONで返してください。各日のworkoutTypeは以下から選択:
- easy_run: イージーラン
- tempo: テンポ走（閾値走）
- interval: インターバル
- long_run: ロング走
- race: レース
- cross_training: 筋力トレーニング（strengthExercisesに種目を設定）
- rest: 休養
- other: その他`

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
    return NextResponse.json({ error: 'invalid request', details: e.message }, { status: 400 })
  }

  const rl = await checkAndIncrementRateLimit(userId, 2)
  if (!rl.ok) {
    return NextResponse.json({ error: RATE_LIMIT_ERROR_MESSAGE }, { status: 429 })
  }

  // ── 選手プロフィール（LTHR・CTL等）自動取得 ──
  let athleteProfileSummary = ''
  if (body.athleteId) {
    try {
      const [userSnap, athleteSnap] = await Promise.all([
        adminDb().collection('users').doc(body.athleteId).get(),
        adminDb().collection('athletes').doc(body.athleteId).get(),
      ])
      const lines: string[] = ['\n選手の詳細データ（自動取得）:']
      if (userSnap.exists) {
        const ud = userSnap.data()!
        if (ud.thresholdHr) lines.push(`- 閾値心拍 (LTHR): ${ud.thresholdHr} bpm`)
        if (ud.maxHr) lines.push(`- 最大心拍: ${ud.maxHr} bpm`)
        if (ud.restingHr) lines.push(`- 安静時心拍: ${ud.restingHr} bpm`)
        if (ud.thresholdPace) lines.push(`- 閾値ペース: ${ud.thresholdPace}/km`)
        if (ud.ftp) lines.push(`- FTP: ${ud.ftp} W`)
      }
      if (athleteSnap.exists) {
        const ad = athleteSnap.data()!
        if (ad.latestMetrics) {
          lines.push(
            `- CTL (慢性負荷/フィットネス): ${ad.latestMetrics.ctl.toFixed(0)}`,
            `- ATL (急性負荷/疲労): ${ad.latestMetrics.atl.toFixed(0)}`,
            `- TSB (フォーム/調子): ${ad.latestMetrics.tsb.toFixed(0)}`
          )
        }
      }
      if (lines.length > 1) athleteProfileSummary = lines.join('\n')
    } catch (e) {
      console.error('Athlete profile fetch error:', e)
    }
  }

  // ── 種目ライブラリ取得（筋トレ日に使用） ──
  let exerciseLibrarySummary = ''
  const exerciseLibraryMap: Record<string, { name: string; category: string; targetMuscles: string[]; instructions: string }> = {}
  try {
    const exSnap = await adminDb()
      .collection('exerciseLibrary')
      .where('coachId', '==', userId)
      .get()
    if (!exSnap.empty) {
      const byCategory: Record<string, string[]> = {}
      for (const d of exSnap.docs) {
        const ex = d.data() as any
        exerciseLibraryMap[d.id] = {
          name: ex.name,
          category: ex.category ?? 'other',
          targetMuscles: ex.targetMuscles ?? [],
          instructions: ex.instructions ?? '',
        }
        const cat = ex.category ?? 'other'
        if (!byCategory[cat]) byCategory[cat] = []
        byCategory[cat].push(`"${ex.name}" (id: ${d.id}${ex.targetMuscles?.length ? `, 部位: ${ex.targetMuscles.join('・')}` : ''})`)
      }
      const lines = ['\nコーチの種目ライブラリ（cross_trainingの日は必ずここから選ぶこと）:']
      for (const [cat, names] of Object.entries(byCategory)) {
        lines.push(`[${cat}] ${names.join(' / ')}`)
      }
      lines.push('\n→ strengthExercises の libraryExerciseId には上記の id をそのまま使用してください。')
      exerciseLibrarySummary = lines.join('\n')
    }
  } catch (e) {
    console.error('Exercise library fetch error:', e)
  }

  // ── ターゲットレース取得 ──
  let racesSummary = ''
  if (body.athleteId) {
    try {
      const userSnap = await adminDb().collection('users').doc(body.athleteId).get()
      if (userSnap.exists) {
        const races = (userSnap.data()?.targetRaces ?? []) as any[]
        if (races.length > 0) {
          const lines: string[] = ['\n選手のターゲットレース:']
          for (const r of races) {
            const raceDate = r.raceDate?.toDate ? r.raceDate.toDate() : new Date(r.raceDate)
            const dateStr = raceDate.toISOString().split('T')[0]
            const diffDays = Math.round(
              (raceDate.getTime() - new Date(body.startDate).getTime()) / (1000 * 60 * 60 * 24)
            )
            lines.push(
              `- ${r.raceName} (${dateStr}${r.distanceKm ? `, ${r.distanceKm}km` : ''}): 開始日から${diffDays}日後`
            )
          }
          racesSummary = lines.join('\n')
        }
      }
    } catch (e) {
      console.error('Race fetch error:', e)
    }
  }

  // ── 直近 Wellness データ取得 ──
  let wellnessSummary = ''
  if (body.athleteId) {
    try {
      const sevenDaysAgo = new Date()
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
      const startStr = sevenDaysAgo.toISOString().split('T')[0]
      const wellnessSnap = await adminDb()
        .collection('wellnessEntries')
        .where('athleteId', '==', body.athleteId)
        .get()
      const recent = wellnessSnap.docs
        .map((d) => d.data() as any)
        .filter((e) => e.date >= startStr)
        .sort((a, b) => a.date.localeCompare(b.date))

      if (recent.length > 0) {
        const avg = (key: string) => {
          const vals = recent.map((e) => e[key]).filter((v) => v != null)
          return vals.length === 0 ? null : vals.reduce((s: number, v: number) => s + v, 0) / vals.length
        }
        const lines = [
          `\n直近7日のWellnessデータ:`,
          `- 疲労感（1=爽快, 5=極度疲労）平均: ${avg('fatigue')?.toFixed(1) ?? '不明'}`,
          `- 筋肉痛（1=なし, 5=ひどい）平均: ${avg('soreness')?.toFixed(1) ?? '不明'}`,
          `- 睡眠の質（1=最悪, 5=最高）平均: ${avg('sleepQuality')?.toFixed(1) ?? '不明'}`,
          `- ストレス（1=なし, 5=極度）平均: ${avg('stress')?.toFixed(1) ?? '不明'}`,
        ]
        const recentNotes = recent
          .filter((e) => e.notes?.trim())
          .slice(-3)
          .map((e) => `  ${e.date}: ${e.notes}`)
        if (recentNotes.length > 0) {
          lines.push(`\n最近のメモ:`, ...recentNotes)
        }
        lines.push(`\n→ 疲労が高い・痛みがある場合は強度を下げ、リカバリー日を増やすこと。`)
        wellnessSummary = lines.join('\n')
      }
    } catch (e) {
      console.error('Wellness fetch error:', e)
    }
  }

  const userPrompt = `
選手情報:
- 名前: ${body.athleteName}
- 開始日: ${body.startDate}
- 期間: ${body.weeks}週間（${body.weeks * 7}日分）
${body.raceDate ? `- 目標レース日: ${body.raceDate}` : '- 目標レース: 未設定'}
${body.raceDistance ? `- レース距離: ${body.raceDistance}` : ''}
- 現在のフィットネス・走力: ${body.currentFitness}
${body.notes ? `\n追加要望:\n${body.notes}` : ''}
${athleteProfileSummary}
${racesSummary}
${wellnessSummary}
${exerciseLibrarySummary}

開始日 ${body.startDate} から ${body.weeks * 7} 日分のメニューを作成してください。
各日付は YYYY-MM-DD 形式で出力してください。
筋力トレーニング日は workoutType を cross_training にして strengthExercises に種目を設定してください。`

  try {
    const client = getAnthropicClient()
    const systemBlocks = await buildSystemPromptWithCoach(userId, SYSTEM_PROMPT)
    const documents = await fetchCoachDocumentIds(userId)

    const userContent: any[] = []
    if (documents.length > 0) {
      userContent.push({
        type: 'text',
        text: `参考資料として以下のドキュメントを添付しています:\n${documents
          .map((d, i) => `${i + 1}. ${d.filename}${d.description ? ` - ${d.description}` : ''}`)
          .join('\n')}\n\nこれらの資料の内容を踏まえて回答してください。`,
      })
      for (const d of documents) {
        userContent.push({
          type: 'document',
          source: { type: 'file', file_id: d.fileId },
        })
      }
    }
    userContent.push({ type: 'text', text: userPrompt })

    const response = await client.beta.messages.create(
      {
        model: AI_MODEL,
        max_tokens: 8000,
        system: systemBlocks,
        betas: ['files-api-2025-04-14'],
        messages: [{ role: 'user', content: userContent }],
        output_config: {
          format: {
            type: 'json_schema',
            schema: {
              type: 'object',
              properties: {
                rationale: { type: 'string' },
                workouts: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      date: { type: 'string' },
                      title: { type: 'string' },
                      workoutType: {
                        type: 'string',
                        enum: ['easy_run', 'tempo', 'interval', 'long_run', 'race', 'cross_training', 'rest', 'other'],
                      },
                      targetDistanceKm: { type: ['number', 'null'] },
                      targetDurationMin: { type: ['integer', 'null'] },
                      targetPaceMinPerKm: { type: ['string', 'null'] },
                      description: { type: 'string' },
                      strengthExercises: {
                        type: ['array', 'null'],
                        items: {
                          type: 'object',
                          properties: {
                            libraryExerciseId: { type: ['string', 'null'] },
                            name: { type: 'string' },
                            sets: { type: 'integer' },
                            reps: { type: ['integer', 'null'] },
                            durationSec: { type: ['integer', 'null'] },
                            restSec: { type: 'integer' },
                          },
                          required: ['libraryExerciseId', 'name', 'sets', 'reps', 'durationSec', 'restSec'],
                          additionalProperties: false,
                        },
                      },
                    },
                    required: ['date', 'title', 'workoutType', 'targetDistanceKm', 'targetDurationMin', 'targetPaceMinPerKm', 'description', 'strengthExercises'],
                    additionalProperties: false,
                  },
                },
              },
              required: ['rationale', 'workouts'],
              additionalProperties: false,
            },
          },
        },
      } as any
    )

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
      parsed = RunningPlanGenerationSchema.parse(JSON.parse(rawText))
    } catch (parseErr: any) {
      console.error('Parse error:', parseErr.message, 'raw:', rawText.slice(0, 300))
      return NextResponse.json({ error: 'AI応答の解析に失敗しました。もう一度試してください。' }, { status: 500 })
    }

    return NextResponse.json({ ok: true, plan: parsed, usage: response.usage, exerciseLibraryMap })
  } catch (e: any) {
    console.error('AI generation error:', e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
