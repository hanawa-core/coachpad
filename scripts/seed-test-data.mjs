/**
 * テストデータ投入スクリプト
 *
 * 使い方: node scripts/seed-test-data.mjs
 *
 * 既存のコーチとテストタロウに、過去30日分のリッチなデータを投入する
 */

import { initializeApp, cert } from 'firebase-admin/app'
import { getFirestore, FieldValue, Timestamp } from 'firebase-admin/firestore'
import { config } from 'dotenv'
import { v4 as uuidv4 } from 'uuid'

config({ path: '.env.local' })

const COACH_ID = 'NKNfmWs3SEMDXqQqhvly4K3ggmt1'
const ATHLETE_ID = 'beV4muvXDqSSXAusOq1GpTIBqnj2'
const COACH_NAME = '花輪'
const ATHLETE_NAME = 'テストタロウ'

const sa = JSON.parse(Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_BASE64, 'base64').toString('utf-8'))
initializeApp({ credential: cert(sa) })
const db = getFirestore()

// ============================================================
// ヘルパー
// ============================================================

function dateString(daysAgo) {
  const d = new Date()
  d.setDate(d.getDate() - daysAgo)
  return d.toISOString().split('T')[0]
}

function dateAfter(days) {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return d
}

function rand(min, max) {
  return Math.random() * (max - min) + min
}

function randInt(min, max) {
  return Math.floor(rand(min, max + 1))
}

function pace(paceStr) {
  return paceStr // "5:30" 形式
}

// ============================================================
// 1. 選手プロフィール拡張（HRゾーン等）
// ============================================================

async function updateAthleteProfile() {
  await db.collection('users').doc(ATHLETE_ID).set(
    {
      sex: 'male',
      birthDate: '1988-09-22',
      heightCm: 172,
      weightKg: 63,
      city: 'Tokyo',
      country: 'Japan',
      bio: 'トレイルランナー。ULTRAレース志向',
      thresholdHr: 163,
      maxHr: 182,
      restingHr: 50,
      thresholdPace: '4:15',
      ftp: null,
      targetRaces: [
        {
          raceName: 'UTMF 2026',
          raceDate: Timestamp.fromDate(dateAfter(45)),
          distanceKm: 165,
        },
        {
          raceName: '富士山マラソン',
          raceDate: Timestamp.fromDate(dateAfter(120)),
          distanceKm: 42.195,
        },
      ],
    },
    { merge: true }
  )
  console.log('✅ 選手プロフィール更新（HRゾーン・ターゲットレース2件）')
}

// ============================================================
// 2. ランニングワークアウト 30日分
// ============================================================

const RUN_PATTERNS = [
  { type: 'easy_run', title: 'イージーラン', distance: [8, 12], pace: '5:45' },
  { type: 'easy_run', title: 'リカバリージョグ', distance: [5, 8], pace: '6:00' },
  { type: 'tempo', title: 'テンポ走 8km', distance: [10, 12], pace: '4:30' },
  { type: 'interval', title: 'インターバル 1km×5', distance: [10, 12], pace: '4:00' },
  { type: 'long_run', title: 'ロング走', distance: [20, 28], pace: '5:30' },
  { type: 'rest', title: '休養日', distance: null, pace: null },
  { type: 'cross_training', title: 'クロストレ（バイク）', distance: null, pace: null },
]

async function seedWorkouts() {
  let count = 0
  for (let daysAgo = 30; daysAgo >= 0; daysAgo--) {
    const date = dateString(daysAgo)
    const day = new Date()
    day.setDate(day.getDate() - daysAgo)
    const weekday = day.getDay() // 0=日

    // パターン選択（曜日依存）
    let pattern
    if (weekday === 0) pattern = RUN_PATTERNS[4] // 日曜ロング
    else if (weekday === 6) pattern = RUN_PATTERNS[2] // 土曜テンポ
    else if (weekday === 3) pattern = RUN_PATTERNS[3] // 水曜インターバル
    else if (weekday === 1) pattern = RUN_PATTERNS[5] // 月曜休養
    else pattern = RUN_PATTERNS[Math.random() < 0.5 ? 0 : 1] // それ以外イージー

    if (pattern.type === 'rest') continue

    const distance = pattern.distance
      ? Math.round(rand(pattern.distance[0], pattern.distance[1]) * 10) / 10
      : null
    const duration = distance && pattern.pace
      ? Math.round(distance * paceToMinutes(pattern.pace))
      : pattern.type === 'cross_training'
        ? 60
        : 30

    const tssEstimate = Math.round((duration * 0.85) + (distance ?? 0) * 1.5)

    const ref = db.collection('workouts').doc()
    await ref.set({
      athleteId: ATHLETE_ID,
      coachId: COACH_ID,
      date,
      type: daysAgo > 0 ? 'completed' : 'both', // 過去は実績、今日は計画+実績
      planned:
        daysAgo === 0
          ? {
              title: pattern.title,
              description: '',
              workoutType: pattern.type,
              targetDistanceKm: distance,
              targetDurationMin: duration,
              targetPaceMinPerKm: pattern.pace,
              targetHeartRateZone: null,
              notes: '',
              createdAt: Timestamp.now(),
              createdBy: COACH_ID,
            }
          : null,
      completed: {
        title: pattern.title,
        workoutType: pattern.type,
        distanceKm: distance,
        durationMin: duration,
        avgPaceMinPerKm: pattern.pace,
        avgHeartRate: pattern.type === 'rest' ? null : randInt(135, 165),
        maxHeartRate: pattern.type === 'rest' ? null : randInt(165, 185),
        elevationGainM: pattern.type === 'long_run' ? randInt(200, 800) : randInt(20, 150),
        calories: distance ? Math.round(distance * 70) : 300,
        tss: tssEstimate,
        ctl: null,
        atl: null,
        notes: '',
        loggedAt: Timestamp.fromDate(day),
        attachedImages: [],
        polyline: null,
        startLatLng: null,
        endLatLng: null,
      },
      coachFeedback: null,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    })
    count++
  }
  console.log(`✅ ランニングワークアウト ${count}件 投入`)
}

function paceToMinutes(paceStr) {
  const [m, s] = paceStr.split(':').map(Number)
  return m + s / 60
}

// ============================================================
// 3. プロトコル（筋トレテンプレート）
// ============================================================

const TEMPLATES = [
  {
    name: '下半身強化A（基礎）',
    description: 'トレイルランナー向け基礎下半身強化',
    category: 'lower_body',
    estimatedDurationMin: 45,
    exercises: [
      { name: 'ヒップリフト', sets: 3, reps: 15, restSec: 45 },
      { name: 'ブルガリアンスクワット', sets: 3, reps: 12, restSec: 60 },
      { name: 'シングルレッグデッドリフト', sets: 3, reps: 10, restSec: 60 },
      { name: 'カーフレイズ', sets: 3, reps: 20, restSec: 30 },
      { name: 'プランク', sets: 3, durationSec: 45, restSec: 30 },
    ],
  },
  {
    name: 'コア・体幹',
    description: '走動作の安定性向上',
    category: 'core',
    estimatedDurationMin: 30,
    exercises: [
      { name: 'プランク', sets: 3, durationSec: 60, restSec: 30 },
      { name: 'サイドプランク', sets: 3, durationSec: 30, restSec: 30 },
      { name: 'デッドバグ', sets: 3, reps: 12, restSec: 30 },
      { name: 'バードドッグ', sets: 3, reps: 12, restSec: 30 },
    ],
  },
  {
    name: '登り耐性メニュー',
    description: 'トレイルの登り強化',
    category: 'lower_body',
    estimatedDurationMin: 50,
    exercises: [
      { name: 'ステップアップ（ボックス）', sets: 4, reps: 12, restSec: 60 },
      { name: 'ランジ', sets: 3, reps: 20, restSec: 60 },
      { name: 'ヒップアブダクション（バンド）', sets: 3, reps: 15, restSec: 45 },
      { name: 'カーフレイズ片足', sets: 3, reps: 15, restSec: 45 },
    ],
  },
]

async function seedTemplates() {
  const templateIds = []
  for (const t of TEMPLATES) {
    const ref = db.collection('strengthTemplates').doc()
    await ref.set({
      coachId: COACH_ID,
      name: t.name,
      description: t.description,
      category: t.category,
      targetMuscles: [],
      estimatedDurationMin: t.estimatedDurationMin,
      isPublic: false,
      exercises: t.exercises.map((ex, i) => ({
        exerciseId: uuidv4(),
        order: i,
        name: ex.name,
        category: 'bodyweight',
        sets: ex.sets,
        reps: ex.reps ?? null,
        durationSec: ex.durationSec ?? null,
        restSec: ex.restSec,
        targetWeight: null,
        instructions: '',
        videoUrl: null,
        imageUrl: null,
      })),
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    })
    templateIds.push({ id: ref.id, name: t.name, exercises: t.exercises })
  }
  console.log(`✅ プロトコル ${templateIds.length}件 投入`)
  return templateIds
}

// ============================================================
// 4. 筋トレ割り当て（過去14日 + 今日）
// ============================================================

async function seedStrengthAssignments(templates) {
  let count = 0
  for (let daysAgo = 14; daysAgo >= 0; daysAgo--) {
    const day = new Date()
    day.setDate(day.getDate() - daysAgo)
    const weekday = day.getDay()
    // 火・木・土に筋トレ
    if (![2, 4, 6].includes(weekday)) continue

    const t = templates[daysAgo % templates.length]
    const date = dateString(daysAgo)
    const ref = db.collection('strengthAssignments').doc()

    const completed = daysAgo > 0 // 過去のみ実施報告

    await ref.set({
      templateId: t.id,
      coachId: COACH_ID,
      athleteId: ATHLETE_ID,
      date,
      templateSnapshot: {
        name: t.name,
        exercises: t.exercises.map((ex, i) => ({
          exerciseId: uuidv4(),
          order: i,
          name: ex.name,
          category: 'bodyweight',
          sets: ex.sets,
          reps: ex.reps ?? null,
          durationSec: ex.durationSec ?? null,
          restSec: ex.restSec,
          targetWeight: null,
          instructions: '',
          videoUrl: null,
          imageUrl: null,
        })),
      },
      status: completed ? 'completed' : 'assigned',
      completionReport: completed
        ? {
            completedAt: Timestamp.fromDate(day),
            overallDifficulty: randInt(2, 4),
            notes: '',
            exerciseResults: t.exercises.map((ex) => ({
              exerciseId: uuidv4(),
              actualSets: ex.sets,
              actualReps: ex.reps ?? null,
              actualDurationSec: ex.durationSec ?? null,
              actualWeightKg: null,
              completed: true,
              notes: '',
            })),
            hadPain: daysAgo === 4, // 4日前に膝痛あり
            painLocations: daysAgo === 4 ? ['膝'] : [],
            painNotes: daysAgo === 4 ? '右膝外側に違和感、3セット目から痛みが強くなった' : '',
            messageToCoach: daysAgo === 4 ? '膝の調子が気になります。次回相談したいです。' : '',
          }
        : null,
      coachFeedback: null,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    })
    count++
  }
  console.log(`✅ 筋トレ割り当て ${count}件 投入`)
}

// ============================================================
// 5. Wellness 過去14日
// ============================================================

async function seedWellness() {
  let count = 0
  for (let daysAgo = 14; daysAgo >= 0; daysAgo--) {
    const date = dateString(daysAgo)
    const day = new Date()
    day.setDate(day.getDate() - daysAgo)

    // 4日前に疲労ピーク（膝痛と連動）
    const isFatigueDay = daysAgo === 4 || daysAgo === 5

    await db
      .collection('wellnessEntries')
      .doc(`${ATHLETE_ID}_${date}`)
      .set({
        athleteId: ATHLETE_ID,
        date,
        sleepHours: rand(6, 8.5).toFixed(1) * 1,
        sleepQuality: randInt(3, 5),
        soreness: isFatigueDay ? 4 : randInt(1, 3),
        fatigue: isFatigueDay ? 4 : randInt(2, 3),
        mood: randInt(3, 5),
        stress: randInt(2, 4),
        restingHr: randInt(48, 56),
        weight: 63 + Math.random() * 0.6 - 0.3,
        notes: isFatigueDay ? '右膝の違和感あり、走るのを抑えた' : '',
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      })
    count++
  }
  console.log(`✅ Wellness ${count}件 投入`)
}

// ============================================================
// 6. チャットメッセージ
// ============================================================

async function seedChat() {
  const threadId = `${COACH_ID}_${ATHLETE_ID}`

  // スレッド作成
  await db.collection('chats').doc(threadId).set({
    participants: [COACH_ID, ATHLETE_ID],
    coachId: COACH_ID,
    athleteId: ATHLETE_ID,
    coachName: COACH_NAME,
    athleteName: ATHLETE_NAME,
    lastMessage: null,
    lastReadBy: {},
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  })

  const conversation = [
    { sender: COACH_ID, daysAgo: 6, text: '今週もお疲れ様です。先週の調子はどうでしたか？' },
    { sender: ATHLETE_ID, daysAgo: 6, text: 'ありがとうございます。週末のロング走、最後まで余裕がありました！' },
    { sender: COACH_ID, daysAgo: 6, text: '素晴らしい！ペースも安定していて良い感じです。今週はインターバルでもう少し追い込みましょう。' },
    { sender: ATHLETE_ID, daysAgo: 4, text: '今日の筋トレで右膝に違和感が出ました。明日の練習どうしましょう？' },
    { sender: COACH_ID, daysAgo: 4, text: '無理せず、明日はリカバリージョグに切り替えましょう。痛みが続くようなら整形外科の受診を検討してください。' },
    { sender: ATHLETE_ID, daysAgo: 3, text: 'おかげで今日は痛みが落ち着きました。リカバリーありがとうございます。' },
    { sender: COACH_ID, daysAgo: 1, text: 'UTMF まで45日となりました。来週からビルド期に入ります。心の準備しておいてください！' },
    { sender: ATHLETE_ID, daysAgo: 0, text: 'はい、楽しみです！今日のロング走頑張ります。' },
  ]

  let lastMsg = null
  for (const m of conversation) {
    const day = new Date()
    day.setDate(day.getDate() - m.daysAgo)
    const sentAt = Timestamp.fromDate(day)
    await db.collection('chats').doc(threadId).collection('messages').add({
      threadId,
      senderId: m.sender,
      type: 'text',
      text: m.text,
      imageUrl: null,
      imageWidth: null,
      imageHeight: null,
      sentAt,
    })
    lastMsg = { text: m.text, senderId: m.sender, sentAt, type: 'text' }
  }

  await db.collection('chats').doc(threadId).update({
    lastMessage: lastMsg,
    updatedAt: lastMsg.sentAt,
  })

  console.log(`✅ チャット ${conversation.length}件 投入`)
}

// ============================================================
// 7. コーチAIプロフィール（サンプル）
// ============================================================

async function seedCoachAiProfile() {
  await db
    .collection('users')
    .doc(COACH_ID)
    .collection('aiProfile')
    .doc('main')
    .set({
      philosophy: `「すべてのランナーに科学を」を理念に、解剖学とデータに基づいた指導を行います。
無理な根性論ではなく、再現性のある方法で長く走り続けられる身体作りを優先します。
個別性（年齢・職業・家族構成）を尊重し、現実的に続けられるメニューを提案します。`,
      methodology: `- ベースは Lydiard 式の有酸素ベース構築（CTL を段階的に上げる）
- 週1回のロング走、週1回の閾値走、それ以外はイージーラン中心
- 心拍ベース（ゾーン2を80%）でゆっくり走る量を確保
- トレイル選手は登坂×登り耐性のための補強を重視
- ピーキングは Daniels の 4-3-2-1 タペーリング`,
      preferences: `- 好む種目: シングルレッグスクワット、ヒップヒンジ、カーフレイズ、プランクバリエーション
- 避けたい種目: マシン主体のレッグエクステンション、過度なジャンプ系
- 自体重・ダンベル中心。ジムなしでも完結するメニューを基本`,
      nutrition: `- レース中は 1kg あたり 0.5-0.8g/h の糖質を目標
- 日常は炭水化物を抜かない（ローカーボはトレイル選手に不向き）
- ナトリウムは発汗量に応じて 300-700mg/L 補給`,
      injuryPrevention: `- 走り込み量は週10%以上増やさない（10%ルール）
- 痛みが出たら即休む。3日以上続く違和感はメディカルチェック
- 補強種目は怪我予防が第一目的、パフォーマンス向上は二次的`,
      references: `- Daniels' Running Formula
- Hanson's Marathon Method
- スポーツ科学誌の最新研究`,
      customInstructions: `- 文体は「です・ます」で丁寧に
- 専門用語は最初に簡単な説明を添える
- 選手の現在のCTL/TSB/Wellnessに必ず言及してから提案する`,
      documents: [],
      updatedAt: FieldValue.serverTimestamp(),
    })

  console.log('✅ コーチAIプロフィール 投入')
}

// ============================================================
// 実行
// ============================================================

async function main() {
  console.log('🌱 テストデータ投入開始...\n')

  await updateAthleteProfile()
  await seedCoachAiProfile()
  await seedWorkouts()
  const templates = await seedTemplates()
  await seedStrengthAssignments(templates)
  await seedWellness()
  await seedChat()

  console.log('\n🎉 完了！')
  process.exit(0)
}

main().catch((e) => {
  console.error('エラー:', e)
  process.exit(1)
})
