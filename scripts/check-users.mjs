import { initializeApp, cert } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import { config } from 'dotenv'

config({ path: '.env.local' })

const sa = JSON.parse(Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_BASE64, 'base64').toString('utf-8'))
initializeApp({ credential: cert(sa) })

const db = getFirestore()

console.log('=== USERS ===')
const users = await db.collection('users').get()
users.docs.forEach((d) => {
  const u = d.data()
  console.log(`UID: ${d.id}`)
  console.log(`  name: ${u.displayName}, role: ${u.role}, email: ${u.email}`)
})

console.log('\n=== STRAVA INTEGRATIONS ===')
for (const userDoc of users.docs) {
  const integ = await db.collection('users').doc(userDoc.id).collection('integrations').doc('strava').get()
  if (integ.exists) {
    const d = integ.data()
    console.log(`User ${userDoc.data().displayName} (${userDoc.id}) has Strava: ${d.athleteName}`)
  }
}

process.exit(0)
