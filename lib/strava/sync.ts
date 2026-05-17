/**
 * Strava activity → Workout マッピング・保存
 */

import { adminDb } from '@/lib/firebase/admin'
import { Timestamp as AdminTimestamp, FieldValue } from 'firebase-admin/firestore'
import { getActivity, StravaActivity } from './api'
import { refreshAccessToken } from './oauth'
import type { WorkoutType } from '@/types'

/**
 * Strava の activity type を 内部 WorkoutType に変換
 */
function mapWorkoutType(stravaType: string, sportType?: string): WorkoutType {
  const t = (sportType ?? stravaType).toLowerCase()
  if (t.includes('trailrun')) return 'long_run'
  if (t.includes('run')) return 'easy_run'
  if (t.includes('ride') || t.includes('bike')) return 'cross_training'
  if (t.includes('swim')) return 'cross_training'
  if (t.includes('walk') || t.includes('hike')) return 'cross_training'
  return 'other'
}

/**
 * メートル毎秒のスピードを「分:秒/km」のペース文字列に変換
 */
function speedToPace(metersPerSecond: number): string | null {
  if (metersPerSecond <= 0) return null
  const secPerKm = 1000 / metersPerSecond
  const minutes = Math.floor(secPerKm / 60)
  const seconds = Math.round(secPerKm % 60)
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}

/**
 * StravaActivity → completed workout payload (Admin SDK Timestamp)
 */
export function activityToCompletedWorkout(activity: StravaActivity) {
  return {
    title: activity.name,
    workoutType: mapWorkoutType(activity.type, activity.sport_type),
    distanceKm: Number((activity.distance / 1000).toFixed(2)),
    durationMin: Math.round(activity.moving_time / 60),
    avgPaceMinPerKm: speedToPace(activity.average_speed),
    avgHeartRate: activity.average_heartrate ? Math.round(activity.average_heartrate) : null,
    maxHeartRate: activity.max_heartrate ? Math.round(activity.max_heartrate) : null,
    elevationGainM: Math.round(activity.total_elevation_gain),
    calories: activity.calories ? Math.round(activity.calories) : null,
    tss: null,
    ctl: null,
    atl: null,
    notes: activity.description ?? '',
    loggedAt: AdminTimestamp.now(),
    attachedImages: [],
    // GPS 情報
    polyline: activity.map?.summary_polyline ?? null,
    startLatLng: activity.start_latlng ?? null,
    endLatLng: activity.end_latlng ?? null,
  }
}

/**
 * 1アクティビティを取得してWorkoutとして保存
 * 既存のplannedワークアウトと同じ日付ならマージ
 */
export async function syncActivity(userId: string, stravaActivityId: number): Promise<void> {
  const db = adminDb()

  // ユーザーのStravaトークンを取得
  const integrationRef = db.collection('users').doc(userId).collection('integrations').doc('strava')
  const integrationSnap = await integrationRef.get()
  if (!integrationSnap.exists) {
    throw new Error(`User ${userId} has no Strava integration`)
  }
  const integration = integrationSnap.data()!

  // トークン期限チェック・必要ならリフレッシュ
  const now = Math.floor(Date.now() / 1000)
  let accessToken = integration.accessToken as string
  if ((integration.expiresAt as number) < now + 60) {
    const refreshed = await refreshAccessToken(integration.refreshToken)
    accessToken = refreshed.access_token
    await integrationRef.update({
      accessToken: refreshed.access_token,
      refreshToken: refreshed.refresh_token,
      expiresAt: refreshed.expires_at,
    })
  }

  // アクティビティ詳細取得
  const activity = await getActivity(stravaActivityId, accessToken)

  // Workout 化
  const completed = activityToCompletedWorkout(activity)
  const date = activity.start_date_local.split('T')[0] // "YYYY-MM-DD"

  // 同日のplanned workoutがあればマージ、なければ新規作成
  const userSnap = await db.collection('users').doc(userId).get()
  const userData = userSnap.data()
  const coachId = userData?.coachId ?? ''

  // 1) 既に同じ Strava activity が同期済みなら、そのドキュメントを更新
  const sameActivityQuery = await db
    .collection('workouts')
    .where('athleteId', '==', userId)
    .where('stravaActivityId', '==', stravaActivityId)
    .limit(1)
    .get()

  if (!sameActivityQuery.empty) {
    const doc = sameActivityQuery.docs[0]
    await doc.ref.update({
      completed,
      updatedAt: FieldValue.serverTimestamp(),
    })
  } else {
    // 2) 同日の planned ワークアウト（まだ完了していない・Strava未紐付け）があれば、それにマージ
    //    複数 Strava activity が同日にある場合の上書きを防ぐため、stravaActivityIdを持たないものだけマージ対象
    const sameDateQuery = await db
      .collection('workouts')
      .where('athleteId', '==', userId)
      .where('date', '==', date)
      .get()

    const mergeable = sameDateQuery.docs.find((d) => {
      const data = d.data()
      // Strava 未紐付け かつ completed が未設定（planned のみ）
      return !data.stravaActivityId && !data.completed
    })

    if (mergeable) {
      await mergeable.ref.update({
        completed,
        type: 'both',
        updatedAt: FieldValue.serverTimestamp(),
        stravaActivityId,
      })
    } else {
      // 3) 新規ワークアウトとして追加（朝晩2回ラン等、同日に複数 activity がある場合もここで別ドキュメント化）
      await db.collection('workouts').add({
        athleteId: userId,
        coachId,
        date,
        type: 'completed',
        planned: null,
        completed,
        coachFeedback: null,
        stravaActivityId,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      })
    }
  }

  // athletes キャッシュ更新（CTL/ATL/TSB も格納）
  const allWorkoutsSnap = await db
    .collection('workouts')
    .where('athleteId', '==', userId)
    .get()
  const allWorkouts = allWorkoutsSnap.docs.map((d) => d.data())
  const { ctl, atl } = computeCTLATL(allWorkouts)
  const tsb = ctl - atl

  await db.collection('athletes').doc(userId).set(
    {
      lastWorkoutLoggedAt: FieldValue.serverTimestamp(),
      latestMetrics: {
        ctl,
        atl,
        tsb,
        updatedAt: AdminTimestamp.now(),
      },
    },
    { merge: true }
  )

  // 最終同期日時更新
  await integrationRef.update({
    lastSyncAt: FieldValue.serverTimestamp(),
  })
}

/**
 * CTL/ATL 簡易計算（指数移動平均）
 */
function computeCTLATL(workouts: any[]): { ctl: number; atl: number } {
  const tssByDate = new Map<string, number>()
  workouts.forEach((w: any) => {
    if (!w.completed) return
    let tss = w.completed.tss
    if (tss == null) {
      const dur = w.completed.durationMin ?? 0
      const dist = w.completed.distanceKm ?? 0
      tss = dur * 0.85 + dist * 1.5
    }
    tssByDate.set(w.date, (tssByDate.get(w.date) ?? 0) + tss)
  })

  const dayMs = 24 * 60 * 60 * 1000
  const today = new Date()
  let ctl = 0
  let atl = 0
  const ctlAlpha = 1 - Math.exp(-1 / 42)
  const atlAlpha = 1 - Math.exp(-1 / 7)

  for (let i = 41; i >= 0; i--) {
    const d = new Date(today.getTime() - i * dayMs)
    const dateStr = d.toISOString().split('T')[0]
    const tss = tssByDate.get(dateStr) ?? 0
    ctl = ctl + ctlAlpha * (tss - ctl)
    atl = atl + atlAlpha * (tss - atl)
  }

  return { ctl, atl }
}
