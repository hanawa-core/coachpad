import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { adminDb, adminMessaging } from '@/lib/firebase/admin'

const Body = z.object({
  recipientId: z.string(),
  title: z.string(),
  body: z.string(),
})

export async function POST(req: NextRequest) {
  let body
  try {
    body = Body.parse(await req.json())
  } catch {
    return NextResponse.json({ error: 'bad request' }, { status: 400 })
  }

  const db = adminDb()
  const userSnap = await db.collection('users').doc(body.recipientId).get()
  const fcmToken = userSnap.data()?.fcmToken as string | undefined
  if (!fcmToken) {
    return NextResponse.json({ ok: true, sent: false })
  }

  try {
    await adminMessaging().send({
      token: fcmToken,
      notification: { title: body.title, body: body.body },
      webpush: {
        notification: { icon: '/icon-192.png', badge: '/icon-192.png' },
      },
    })
    return NextResponse.json({ ok: true, sent: true })
  } catch (e: any) {
    if (e.code === 'messaging/registration-token-not-registered') {
      await db.collection('users').doc(body.recipientId).update({ fcmToken: null })
    }
    return NextResponse.json({ ok: true, sent: false })
  }
}
