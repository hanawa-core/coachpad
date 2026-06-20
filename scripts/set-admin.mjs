/**
 * 指定メールアドレスのユーザーに管理者権限(isAdmin)を付与/解除する
 * 使い方:
 *   node scripts/set-admin.mjs <email>            … 付与
 *   node scripts/set-admin.mjs <email> false      … 解除
 */

import { initializeApp, cert } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import { config } from 'dotenv'

config({ path: '.env.local' })

const base64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64
if (!base64) {
  console.error('FIREBASE_SERVICE_ACCOUNT_BASE64 not set in .env.local')
  process.exit(1)
}

const serviceAccount = JSON.parse(Buffer.from(base64, 'base64').toString('utf-8'))
initializeApp({ credential: cert(serviceAccount) })

const db = getFirestore()

const [, , email, flag] = process.argv
if (!email) {
  console.error('Usage: node scripts/set-admin.mjs <email> [true|false]')
  process.exit(1)
}
const isAdmin = flag !== 'false'

const snap = await db.collection('users').where('email', '==', email).get()
if (snap.empty) {
  console.error(`❌ ユーザーが見つかりません: ${email}`)
  process.exit(1)
}

for (const doc of snap.docs) {
  await doc.ref.update({ isAdmin })
  console.log(`✅ isAdmin=${isAdmin} を設定: ${doc.data().displayName ?? ''} (${email}) / uid=${doc.id}`)
}

process.exit(0)
