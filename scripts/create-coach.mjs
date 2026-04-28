/**
 * 最初のコーチアカウントを Firestore に作成
 * 使い方: node scripts/create-coach.mjs <UID> <displayName> <email>
 */

import { initializeApp, cert } from 'firebase-admin/app'
import { getFirestore, FieldValue } from 'firebase-admin/firestore'
import { readFileSync } from 'fs'
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

const [, , uid, displayName, email] = process.argv

if (!uid || !displayName || !email) {
  console.error('Usage: node scripts/create-coach.mjs <UID> <displayName> <email>')
  process.exit(1)
}

await db.collection('users').doc(uid).set({
  uid,
  email,
  displayName,
  role: 'coach',
  avatarUrl: null,
  coachId: null,
  timezone: 'Asia/Tokyo',
  targetRaces: [],
  createdAt: FieldValue.serverTimestamp(),
})

console.log(`✅ Coach created: ${displayName} (${email})`)
console.log(`   UID: ${uid}`)
process.exit(0)
