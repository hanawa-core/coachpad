import { initializeApp, getApps, cert, App } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import { getAuth } from 'firebase-admin/auth'
import { getMessaging } from 'firebase-admin/messaging'

let adminApp: App | null = null

function getAdminApp(): App {
  if (adminApp) return adminApp
  if (getApps().length > 0) {
    adminApp = getApps()[0]
    return adminApp
  }

  const base64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64
  if (!base64) {
    throw new Error('FIREBASE_SERVICE_ACCOUNT_BASE64 not set')
  }
  const serviceAccount = JSON.parse(Buffer.from(base64, 'base64').toString('utf-8'))

  adminApp = initializeApp({
    credential: cert(serviceAccount),
  })
  return adminApp
}

export const adminDb = () => getFirestore(getAdminApp())
export const adminAuth = () => getAuth(getAdminApp())
export const adminMessaging = () => getMessaging(getAdminApp())
