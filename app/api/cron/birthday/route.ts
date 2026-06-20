import { NextRequest, NextResponse } from 'next/server'
import { FieldValue } from 'firebase-admin/firestore'
import { adminDb, adminMessaging } from '@/lib/firebase/admin'

/**
 * 誕生日おめでとう通知（毎日 1 回・Vercel Cron 想定）。
 * - 認可: Vercel Cron の x-vercel-cron ヘッダ、または Authorization: Bearer <CRON_SECRET>
 * - 当日（JST）が誕生日のユーザーへ通知 + プッシュ。選手の場合は担当コーチにも通知。
 * - 二重送信防止: users/{uid}.lastBirthdayGreetingYear に送信年を記録。
 */
async function sendNotification(opts: {
  recipientId: string
  title: string
  body: string
  relatedEntityId: string
}) {
  const db = adminDb()
  await db.collection('notifications').add({
    recipientId: opts.recipientId,
    senderId: 'system',
    type: 'birthday',
    relatedEntityType: 'system',
    relatedEntityId: opts.relatedEntityId,
    title: opts.title,
    body: opts.body,
    isRead: false,
    createdAt: FieldValue.serverTimestamp(),
  })
  // プッシュ送信（ベストエフォート）
  const snap = await db.collection('users').doc(opts.recipientId).get()
  const fcmToken = snap.data()?.fcmToken as string | undefined
  if (!fcmToken) return
  try {
    await adminMessaging().send({
      token: fcmToken,
      notification: { title: opts.title, body: opts.body },
      webpush: { notification: { icon: '/icon-192.png', badge: '/icon-192.png' } },
    })
  } catch (e: any) {
    if (e.code === 'messaging/registration-token-not-registered') {
      await db.collection('users').doc(opts.recipientId).update({ fcmToken: null })
    }
  }
}

function authorized(req: NextRequest): boolean {
  if (req.headers.get('x-vercel-cron')) return true
  const secret = process.env.CRON_SECRET
  if (secret && req.headers.get('authorization') === `Bearer ${secret}`) return true
  return false
}

export async function GET(req: NextRequest) {
  if (!authorized(req)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  // JST の今日（MM-DD と 年）
  const now = new Date()
  const jst = new Date(now.getTime() + 9 * 60 * 60 * 1000)
  const mm = String(jst.getUTCMonth() + 1).padStart(2, '0')
  const dd = String(jst.getUTCDate()).padStart(2, '0')
  const todayMmDd = `${mm}-${dd}`
  const year = jst.getUTCFullYear()

  const db = adminDb()
  const usersSnap = await db.collection('users').get()

  let greeted = 0
  let coachNotified = 0

  for (const docSnap of usersSnap.docs) {
    const u = docSnap.data()
    const birthDate = u.birthDate as string | undefined
    if (!birthDate || birthDate.length < 10) continue
    if (birthDate.slice(5) !== todayMmDd) continue
    // 同年内の二重送信防止
    if (u.lastBirthdayGreetingYear === year) continue

    const name = (u.displayName as string) ?? ''
    await sendNotification({
      recipientId: docSnap.id,
      relatedEntityId: docSnap.id,
      title: '🎉 お誕生日おめでとうございます！',
      body: `${name ? `${name}さん、` : ''}素敵な一年になりますように！`,
    })
    greeted++

    // 選手なら担当コーチにも通知
    if (u.role === 'athlete' && u.coachId) {
      await sendNotification({
        recipientId: u.coachId as string,
        relatedEntityId: docSnap.id,
        title: '🎂 担当選手のお誕生日です',
        body: `${name || '選手'}さんが本日お誕生日です。お祝いのメッセージを送りましょう。`,
      })
      coachNotified++
    }

    await db.collection('users').doc(docSnap.id).update({ lastBirthdayGreetingYear: year })
  }

  return NextResponse.json({ ok: true, date: todayMmDd, greeted, coachNotified })
}
