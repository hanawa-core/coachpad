import { NextRequest, NextResponse } from 'next/server'
import { adminAuth, adminDb } from '@/lib/firebase/admin'
import { FieldValue } from 'firebase-admin/firestore'
import { getAnthropicClient } from '@/lib/ai/client'

/**
 * POST /api/ai/upload-document
 * multipart/form-data: file, description
 *
 * PDFファイルをAnthropic Files APIにアップロードし、
 * file_idをコーチAIプロフィールに保存
 */
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

  // ファイル取得
  const formData = await req.formData()
  const file = formData.get('file') as File | null
  const description = (formData.get('description') as string) || ''

  if (!file) {
    return NextResponse.json({ error: 'file is required' }, { status: 400 })
  }

  // サイズ制限（32MB）
  if (file.size > 32 * 1024 * 1024) {
    return NextResponse.json(
      { error: 'ファイルサイズが大きすぎます（32MBまで）' },
      { status: 400 }
    )
  }

  // PDF/テキスト系のみ許可
  const allowedTypes = [
    'application/pdf',
    'text/plain',
    'text/markdown',
    'application/json',
  ]
  if (!allowedTypes.includes(file.type)) {
    return NextResponse.json(
      { error: 'PDFまたはテキストファイルのみ対応しています' },
      { status: 400 }
    )
  }

  try {
    const client = getAnthropicClient()

    // Anthropic Files APIにアップロード
    const uploaded = await client.beta.files.upload({
      file,
      betas: ['files-api-2025-04-14'],
    })

    // Firestoreにメタデータを保存
    const profileRef = adminDb()
      .collection('users')
      .doc(userId)
      .collection('aiProfile')
      .doc('main')

    const newDoc = {
      fileId: uploaded.id,
      filename: file.name,
      sizeBytes: file.size,
      description,
      uploadedAt: new Date(),
    }

    await profileRef.set(
      {
        documents: FieldValue.arrayUnion(newDoc),
      },
      { merge: true }
    )

    return NextResponse.json({
      ok: true,
      document: newDoc,
    })
  } catch (e: any) {
    console.error('Upload error:', e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
