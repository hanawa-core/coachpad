/**
 * 全ワークアウトを確認するスクリプト
 */

import { initializeApp, cert } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import { config } from 'dotenv'

config({ path: '.env.local' })

const base64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64
const serviceAccount = JSON.parse(Buffer.from(base64, 'base64').toString('utf-8'))
initializeApp({ credential: cert(serviceAccount) })

const db = getFirestore()

const snap = await db.collection('workouts').get()
console.log(`Found ${snap.size} workouts`)

snap.docs.forEach((doc) => {
  const w = doc.data()
  console.log(`\n--- Workout ${doc.id} ---`)
  console.log(`  date: ${w.date}`)
  console.log(`  athleteId: ${w.athleteId}`)
  console.log(`  type: ${w.type}`)
  console.log(`  planned title: ${w.planned?.title ?? '(none)'}`)
  console.log(`  completed title: ${w.completed?.title ?? '(none)'}`)
  if (w.completed) {
    console.log(`  distance: ${w.completed.distanceKm}km`)
    console.log(`  duration: ${w.completed.durationMin}min`)
  }
  console.log(`  stravaActivityId: ${w.stravaActivityId ?? '(none)'}`)
})

process.exit(0)
