import { adminDb } from '@/lib/firebase/admin'

/**
 * AI 利用回数のレート制限
 *
 * ユーザーごと・日ごとに利用回数を記録し、上限を超えたら拒否する。
 * 高コストな処理（チーム分析、ドキュメントアップロード）と低コストな処理を
 * weight で区別できる。
 */

// 1日あたりの最大重みポイント（1呼び出し = 1pt が基本）
const DAILY_LIMIT = 30

export interface RateLimitResult {
  ok: boolean
  remaining: number
  resetAt: string  // YYYY-MM-DD（次回リセット日）
}

/**
 * レート制限チェック + カウンタインクリメント（トランザクション）
 *
 * @param userId 利用者UID
 * @param weight この呼び出しの消費ポイント（既定 1）
 */
export async function checkAndIncrementRateLimit(
  userId: string,
  weight: number = 1
): Promise<RateLimitResult> {
  const today = new Date().toISOString().slice(0, 10) // YYYY-MM-DD (UTC)
  const ref = adminDb().collection('aiUsage').doc(userId)

  return adminDb().runTransaction(async (tx) => {
    const snap = await tx.get(ref)
    const data = snap.data() as { date?: string; count?: number } | undefined

    const currentCount = data?.date === today ? (data.count ?? 0) : 0
    const newCount = currentCount + weight

    if (newCount > DAILY_LIMIT) {
      return {
        ok: false,
        remaining: Math.max(0, DAILY_LIMIT - currentCount),
        resetAt: today,
      }
    }

    tx.set(
      ref,
      {
        date: today,
        count: newCount,
        lastUsedAt: new Date(),
      },
      { merge: true }
    )

    return {
      ok: true,
      remaining: DAILY_LIMIT - newCount,
      resetAt: today,
    }
  })
}

export const RATE_LIMIT_ERROR_MESSAGE =
  `AI 利用回数の1日あたり上限（${DAILY_LIMIT}回）に達しました。明日リセットされます。`
