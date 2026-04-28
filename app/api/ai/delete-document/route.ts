import { NextRequest, NextResponse } from 'next/server'
import { adminAuth, adminDb } from '@/lib/firebase/admin'
import { getAnthropicClient } from '@/lib/ai/client'

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

  const { fileId } = await req.json()
  if (!fileId) {
    return NextResponse.json({ error: 'fileId required' }, { status: 400 })
  }

  try {
    const client = getAnthropicClient()
    // Anthropic Files API から削除
    await client.beta.files.delete(fileId, { betas: ['files-api-2025-04-14'] } as any)

    // Firestoreから削除
    const profileRef = adminDb()
      .collection('users')
      .doc(userId)
      .collection('aiProfile')
      .doc('main')
    const snap = await profileRef.get()
    if (snap.exists) {
      const docs = (snap.data()?.documents ?? []) as any[]
      const filtered = docs.filter((d) => d.fileId !== fileId)
      await profileRef.update({ documents: filtered })
    }

    return NextResponse.json({ ok: true })
  } catch (e: any) {
    console.error('Delete error:', e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
