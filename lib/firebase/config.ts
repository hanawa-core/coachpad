import { initializeApp, getApps, getApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

// 環境変数が未設定の場合はブラウザコンソールに警告
if (typeof window !== 'undefined' && !firebaseConfig.apiKey) {
  console.error('[Firebase] NEXT_PUBLIC_FIREBASE_API_KEY が設定されていません。Vercel の環境変数を確認してください。')
}

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp()

// SSR（ビルド時）に apiKey なしで getAuth 等を呼ぶとクラッシュするため try-catch でガード
// ブラウザ実行時は必ず Vercel 環境変数が有効なので問題なし
// eslint-disable-next-line prefer-const
let auth!: ReturnType<typeof getAuth>
// eslint-disable-next-line prefer-const
let db!: ReturnType<typeof getFirestore>
// eslint-disable-next-line prefer-const
let storage!: ReturnType<typeof getStorage>

try {
  auth = getAuth(app)
  db = getFirestore(app)
  storage = getStorage(app)
} catch {
  // SSR build without env vars — services initialized on client side
}

export { auth, db, storage }
export default app
