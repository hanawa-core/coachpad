import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  Unsubscribe,
  addDoc,
} from 'firebase/firestore'
import { db } from './config'
import type {
  UserProfile,
  AthleteCache,
  AthletePlan,
  Workout,
  StrengthTemplate,
  StrengthAssignment,
  ExerciseLibraryItem,
  CoachAiProfile,
  MotionAnalysis,
  WellnessEntry,
  ChatThread,
  ChatMessage,
  Invite,
  Notification,
} from '@/types'
import { v4 as uuidv4 } from 'uuid'

// ============================================================
// ユーザー
// ============================================================

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const snap = await getDoc(doc(db, 'users', uid))
  if (!snap.exists()) return null
  return { ...(snap.data() as UserProfile), uid: snap.id }
}

export async function updateUserProfile(uid: string, data: Partial<UserProfile>) {
  await updateDoc(doc(db, 'users', uid), { ...data })
  // 選手キャッシュ（コーチ向け）に displayName を同期
  if (data.displayName) {
    const athleteRef = doc(db, 'athletes', uid)
    const athleteSnap = await getDoc(athleteRef)
    if (athleteSnap.exists()) {
      await updateDoc(athleteRef, { displayName: data.displayName })
    }
  }
}

// ============================================================
// 選手一覧（コーチ向け）
// ============================================================

export function subscribeAthletes(
  coachId: string,
  callback: (athletes: AthleteCache[]) => void
): Unsubscribe {
  const q = query(
    collection(db, 'athletes'),
    where('coachId', '==', coachId),
    where('isActive', '==', true)
  )
  return onSnapshot(q, (snap) => {
    const athletes = snap.docs.map((d) => ({ ...(d.data() as AthleteCache), id: d.id }))
    callback(athletes)
  })
}

export async function getAthleteCache(athleteId: string): Promise<AthleteCache | null> {
  // doc ID == userId なので直接取得（クエリだとセキュリティルールで拒否される場合がある）
  const direct = await getDoc(doc(db, 'athletes', athleteId))
  if (direct.exists()) {
    return { ...(direct.data() as AthleteCache), id: direct.id }
  }
  // 旧データ（自動IDで作成）にフォールバック
  const q = query(collection(db, 'athletes'), where('userId', '==', athleteId))
  const snap = await getDocs(q)
  if (snap.empty) return null
  const d = snap.docs[0]
  return { ...(d.data() as AthleteCache), id: d.id }
}

/**
 * 選手のプランを設定（athletes キャッシュ更新）
 * users ドキュメントはルール上コーチが直接書けないため API ルート /api/athletes/set-plan で更新する
 */
export async function setAthletePlan(
  athleteId: string,
  plan: AthletePlan | null
): Promise<void> {
  const directRef = doc(db, 'athletes', athleteId)
  const directSnap = await getDoc(directRef)
  if (directSnap.exists()) {
    await updateDoc(directRef, { plan })
  } else {
    const q = query(collection(db, 'athletes'), where('userId', '==', athleteId))
    const snap = await getDocs(q)
    if (!snap.empty) await updateDoc(snap.docs[0].ref, { plan })
  }
}

// ============================================================
// ワークアウト
// ============================================================

export async function getWorkoutsByMonth(
  athleteId: string,
  year: number,
  month: number, // 1-12
  coachId?: string
): Promise<Workout[]> {
  const prefix = `${year}-${String(month).padStart(2, '0')}-`
  // コーチ閲覧時は coachId フィルタを追加しないとFirestoreルールでクエリが拒否される
  const constraints =
    coachId && coachId !== athleteId
      ? [where('athleteId', '==', athleteId), where('coachId', '==', coachId)]
      : [where('athleteId', '==', athleteId)]
  const q = query(collection(db, 'workouts'), ...constraints)
  const snap = await getDocs(q)
  return snap.docs
    .map((d) => ({ ...(d.data() as Workout), id: d.id }))
    .filter((w) => w.date.startsWith(prefix))
    .sort((a, b) => a.date.localeCompare(b.date))
}

export async function getWorkout(workoutId: string): Promise<Workout | null> {
  const snap = await getDoc(doc(db, 'workouts', workoutId))
  if (!snap.exists()) return null
  return { ...(snap.data() as Workout), id: snap.id }
}

export async function createPlannedWorkout(data: Omit<Workout, 'id' | 'createdAt' | 'updatedAt'>) {
  const ref = doc(collection(db, 'workouts'))
  await setDoc(ref, {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  // 選手に通知
  if (data.athleteId !== data.coachId) {
    await createNotification({
      recipientId: data.athleteId,
      senderId: data.coachId,
      type: 'workout_assigned',
      relatedEntityType: 'workout',
      relatedEntityId: ref.id,
      title: '🏃 新しいランニングメニューが追加されました',
      body: `${data.date}: ${data.planned?.title ?? ''}`,
    })
  }
  return ref.id
}

export async function logCompletedWorkout(
  workoutId: string,
  completed: Workout['completed']
) {
  await updateDoc(doc(db, 'workouts', workoutId), {
    completed,
    type: 'both',
    updatedAt: serverTimestamp(),
  })
  // コーチに通知（自分が選手兼コーチの場合は通知しない）
  const snap = await getDoc(doc(db, 'workouts', workoutId))
  if (snap.exists()) {
    const w = snap.data() as Workout
    if (w.coachId && w.coachId !== w.athleteId) {
      await createNotification({
        recipientId: w.coachId,
        senderId: w.athleteId,
        type: 'workout_logged',
        relatedEntityType: 'workout',
        relatedEntityId: workoutId,
        title: '🏃 選手がランニングを完了しました',
        body: `${w.date}: ${completed?.title ?? w.planned?.title ?? ''}`,
      })
    }
  }
}

export async function createCompletedWorkout(data: Omit<Workout, 'id' | 'createdAt' | 'updatedAt'>) {
  const ref = doc(collection(db, 'workouts'))
  await setDoc(ref, {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  // コーチに通知
  if (data.coachId && data.coachId !== data.athleteId) {
    await createNotification({
      recipientId: data.coachId,
      senderId: data.athleteId,
      type: 'workout_logged',
      relatedEntityType: 'workout',
      relatedEntityId: ref.id,
      title: '🏃 選手がランニングを記録しました',
      body: `${data.date}: ${data.completed?.title ?? ''}`,
    })
  }
  return ref.id
}

/**
 * 期間内の planned ワークアウトを別期間にコピー
 * @param athleteId 選手ID
 * @param coachId コーチID
 * @param sourceStart 元の開始日 YYYY-MM-DD
 * @param sourceEnd 元の終了日 YYYY-MM-DD
 * @param targetStart 貼り付け先の開始日 YYYY-MM-DD
 */
export async function copyWeekPlan(
  athleteId: string,
  coachId: string,
  sourceStart: string,
  sourceEnd: string,
  targetStart: string
): Promise<{ workouts: number; strengthAssignments: number }> {
  const sourceStartDate = new Date(sourceStart)
  const targetStartDate = new Date(targetStart)
  const dayOffset =
    Math.round((targetStartDate.getTime() - sourceStartDate.getTime()) / (1000 * 60 * 60 * 24))

  // 1) 元の planned ワークアウト取得
  const wq = query(
    collection(db, 'workouts'),
    where('athleteId', '==', athleteId)
  )
  const wsnap = await getDocs(wq)
  const workouts = wsnap.docs
    .map((d) => ({ ...(d.data() as Workout), id: d.id }))
    .filter((w) => w.date >= sourceStart && w.date <= sourceEnd && w.planned)

  let workoutCount = 0
  for (const w of workouts) {
    const newDate = shiftDate(w.date, dayOffset)
    const newRef = doc(collection(db, 'workouts'))
    await setDoc(newRef, {
      athleteId,
      coachId,
      date: newDate,
      type: 'planned',
      planned: w.planned,
      completed: null,
      coachFeedback: null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
    workoutCount++
  }

  // 2) 元の strengthAssignments 取得
  const sq = query(
    collection(db, 'strengthAssignments'),
    where('athleteId', '==', athleteId)
  )
  const ssnap = await getDocs(sq)
  const strengthItems = ssnap.docs
    .map((d) => ({ ...(d.data() as StrengthAssignment), id: d.id }))
    .filter((s) => s.date >= sourceStart && s.date <= sourceEnd)

  let strengthCount = 0
  for (const s of strengthItems) {
    const newDate = shiftDate(s.date, dayOffset)
    const newRef = doc(collection(db, 'strengthAssignments'))
    await setDoc(newRef, {
      templateId: s.templateId,
      coachId,
      athleteId,
      date: newDate,
      templateSnapshot: s.templateSnapshot,
      status: 'assigned',
      completionReport: null,
      coachFeedback: null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
    strengthCount++
  }

  return { workouts: workoutCount, strengthAssignments: strengthCount }
}

function shiftDate(dateStr: string, days: number): string {
  const d = new Date(dateStr)
  d.setDate(d.getDate() + days)
  return d.toISOString().split('T')[0]
}

/**
 * 1つの planned ワークアウトを別日にコピー
 */
export async function duplicateWorkoutToDate(
  workoutId: string,
  targetDate: string
): Promise<string | null> {
  const original = await getWorkout(workoutId)
  if (!original || !original.planned) return null

  const newRef = doc(collection(db, 'workouts'))
  await setDoc(newRef, {
    athleteId: original.athleteId,
    coachId: original.coachId,
    date: targetDate,
    type: 'planned',
    planned: original.planned,
    completed: null,
    coachFeedback: null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  return newRef.id
}

/**
 * 1つの strengthAssignment を別日にコピー
 */
export async function duplicateStrengthAssignmentToDate(
  assignmentId: string,
  targetDate: string
): Promise<string | null> {
  const original = await getStrengthAssignment(assignmentId)
  if (!original) return null

  const newRef = doc(collection(db, 'strengthAssignments'))
  await setDoc(newRef, {
    templateId: original.templateId,
    coachId: original.coachId,
    athleteId: original.athleteId,
    date: targetDate,
    templateSnapshot: original.templateSnapshot,
    status: 'assigned',
    completionReport: null,
    coachFeedback: null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  return newRef.id
}

/**
 * 1つの planned ワークアウトを別日に「移動」（元を削除して新規作成）
 */
export async function moveWorkoutToDate(
  workoutId: string,
  targetDate: string
): Promise<string | null> {
  const original = await getWorkout(workoutId)
  if (!original) return null

  // 計画のみ移動（実績がある場合は計画だけ別日に移して、元workoutから計画を消す）
  // でも単純化のため、planned のみのワークアウトの場合は date を更新するだけ
  if (original.type === 'planned' || !original.completed) {
    await updateDoc(doc(db, 'workouts', workoutId), {
      date: targetDate,
      updatedAt: serverTimestamp(),
    })
    return workoutId
  }

  // 実績がある場合 - 計画だけ新しい日付にコピーして、元の planned を消す
  const newRef = doc(collection(db, 'workouts'))
  await setDoc(newRef, {
    athleteId: original.athleteId,
    coachId: original.coachId,
    date: targetDate,
    type: 'planned',
    planned: original.planned,
    completed: null,
    coachFeedback: null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  await updateDoc(doc(db, 'workouts', workoutId), {
    planned: null,
    type: 'completed',
    updatedAt: serverTimestamp(),
  })
  return newRef.id
}

/**
 * 1つの strengthAssignment を別日に「移動」
 */
export async function moveStrengthAssignmentToDate(
  assignmentId: string,
  targetDate: string
): Promise<string | null> {
  await updateDoc(doc(db, 'strengthAssignments', assignmentId), {
    date: targetDate,
    updatedAt: serverTimestamp(),
  })
  return assignmentId
}

export async function saveCoachFeedback(
  workoutId: string,
  feedback: Workout['coachFeedback']
) {
  await updateDoc(doc(db, 'workouts', workoutId), {
    coachFeedback: feedback,
    updatedAt: serverTimestamp(),
  })
  // 選手に通知
  const snap = await getDoc(doc(db, 'workouts', workoutId))
  if (snap.exists()) {
    const w = snap.data() as Workout
    await createNotification({
      recipientId: w.athleteId,
      senderId: feedback?.updatedBy ?? w.coachId,
      type: 'coach_feedback',
      relatedEntityType: 'workout',
      relatedEntityId: workoutId,
      title: 'コーチからフィードバックが届きました',
      body: w.planned?.title ?? w.completed?.title ?? '',
    })
  }
}

// ============================================================
// 筋トレテンプレート
// ============================================================

export async function getStrengthTemplates(coachId: string): Promise<StrengthTemplate[]> {
  const q = query(collection(db, 'strengthTemplates'), where('coachId', '==', coachId))
  const snap = await getDocs(q)
  return snap.docs.map((d) => ({ ...(d.data() as StrengthTemplate), id: d.id }))
}

export async function getStrengthTemplate(id: string): Promise<StrengthTemplate | null> {
  const snap = await getDoc(doc(db, 'strengthTemplates', id))
  if (!snap.exists()) return null
  return { ...(snap.data() as StrengthTemplate), id: snap.id }
}

export async function createStrengthTemplate(
  data: Omit<StrengthTemplate, 'id' | 'createdAt' | 'updatedAt'>
) {
  const ref = doc(collection(db, 'strengthTemplates'))
  await setDoc(ref, {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  return ref.id
}

export async function updateStrengthTemplate(
  id: string,
  data: Partial<StrengthTemplate>
) {
  await updateDoc(doc(db, 'strengthTemplates', id), {
    ...data,
    updatedAt: serverTimestamp(),
  })
}

export async function deleteStrengthTemplate(id: string) {
  await deleteDoc(doc(db, 'strengthTemplates', id))
}

/**
 * プロトコルを複製
 * 種目内の exerciseId は新規発行、name に「(コピー)」追加
 */
export async function duplicateStrengthTemplate(id: string): Promise<string | null> {
  const original = await getStrengthTemplate(id)
  if (!original) return null

  const newRef = doc(collection(db, 'strengthTemplates'))
  const newExercises = original.exercises.map((ex) => ({
    ...ex,
    exerciseId: uuidv4(),
  }))
  await setDoc(newRef, {
    coachId: original.coachId,
    name: `${original.name} (コピー)`,
    description: original.description,
    category: original.category,
    targetMuscles: original.targetMuscles,
    estimatedDurationMin: original.estimatedDurationMin,
    isPublic: original.isPublic,
    exercises: newExercises,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  return newRef.id
}

// ============================================================
// 筋トレ割り当て
// ============================================================

export async function getStrengthAssignmentsByMonth(
  athleteId: string,
  year: number,
  month: number,
  coachId?: string
): Promise<StrengthAssignment[]> {
  const prefix = `${year}-${String(month).padStart(2, '0')}-`
  const constraints =
    coachId && coachId !== athleteId
      ? [where('athleteId', '==', athleteId), where('coachId', '==', coachId)]
      : [where('athleteId', '==', athleteId)]
  const q = query(collection(db, 'strengthAssignments'), ...constraints)
  const snap = await getDocs(q)
  return snap.docs
    .map((d) => ({ ...(d.data() as StrengthAssignment), id: d.id }))
    .filter((s) => s.date.startsWith(prefix))
}

export async function getStrengthAssignment(id: string): Promise<StrengthAssignment | null> {
  const snap = await getDoc(doc(db, 'strengthAssignments', id))
  if (!snap.exists()) return null
  return { ...(snap.data() as StrengthAssignment), id: snap.id }
}

export async function createStrengthAssignment(
  data: Omit<StrengthAssignment, 'id' | 'createdAt' | 'updatedAt'>
) {
  const ref = doc(collection(db, 'strengthAssignments'))
  await setDoc(ref, {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  // 選手に通知
  await createNotification({
    recipientId: data.athleteId,
    senderId: data.coachId,
    type: 'strength_assigned',
    relatedEntityType: 'strengthAssignment',
    relatedEntityId: ref.id,
    title: '💪 新しい筋力トレーニングが追加されました',
    body: `${data.date}: ${data.templateSnapshot.name}`,
  })
  return ref.id
}

export async function submitStrengthReport(
  assignmentId: string,
  report: StrengthAssignment['completionReport']
) {
  await updateDoc(doc(db, 'strengthAssignments', assignmentId), {
    completionReport: report,
    status: 'completed',
    updatedAt: serverTimestamp(),
  })
  // コーチに通知
  const snap = await getDoc(doc(db, 'strengthAssignments', assignmentId))
  if (snap.exists()) {
    const a = snap.data() as StrengthAssignment
    const painNote = report?.hadPain ? '⚠ 痛みあり: ' + report.painLocations.join('、') : ''
    await createNotification({
      recipientId: a.coachId,
      senderId: a.athleteId,
      type: 'workout_logged',
      relatedEntityType: 'strengthAssignment',
      relatedEntityId: assignmentId,
      title: '実施報告が届きました',
      body: `${a.templateSnapshot.name} ${painNote}`,
    })
  }
}

// ============================================================
// 種目ライブラリ（コーチが登録する単独種目）
// ============================================================

export async function getExerciseLibrary(coachId: string): Promise<ExerciseLibraryItem[]> {
  const q = query(collection(db, 'exerciseLibrary'), where('coachId', '==', coachId))
  const snap = await getDocs(q)
  return snap.docs
    .map((d) => ({ ...(d.data() as ExerciseLibraryItem), id: d.id }))
    .sort((a, b) => a.name.localeCompare(b.name, 'ja'))
}

export async function getExerciseLibraryItem(id: string): Promise<ExerciseLibraryItem | null> {
  const snap = await getDoc(doc(db, 'exerciseLibrary', id))
  if (!snap.exists()) return null
  return { ...(snap.data() as ExerciseLibraryItem), id: snap.id }
}

export async function createExerciseLibraryItem(
  data: Omit<ExerciseLibraryItem, 'id' | 'createdAt' | 'updatedAt'>
) {
  const ref = doc(collection(db, 'exerciseLibrary'))
  await setDoc(ref, {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  return ref.id
}

export async function updateExerciseLibraryItem(
  id: string,
  data: Partial<ExerciseLibraryItem>
) {
  await updateDoc(doc(db, 'exerciseLibrary', id), {
    ...data,
    updatedAt: serverTimestamp(),
  })
}

export async function deleteExerciseLibraryItem(id: string) {
  await deleteDoc(doc(db, 'exerciseLibrary', id))
}

// ============================================================
// コーチAIプロフィール
// ============================================================

export async function getCoachAiProfile(coachId: string): Promise<CoachAiProfile | null> {
  const snap = await getDoc(doc(db, 'users', coachId, 'aiProfile', 'main'))
  if (!snap.exists()) return null
  return snap.data() as CoachAiProfile
}

export async function saveCoachAiProfile(coachId: string, profile: Omit<CoachAiProfile, 'updatedAt'>) {
  await setDoc(doc(db, 'users', coachId, 'aiProfile', 'main'), {
    ...profile,
    updatedAt: serverTimestamp(),
  })
}

// ============================================================
// Wellness（日々の体調記録）
// ============================================================

/**
 * Wellness は date 単位で 1日1件
 * Firestore ドキュメント ID: {athleteId}_{date}
 */
function wellnessDocId(athleteId: string, date: string): string {
  return `${athleteId}_${date}`
}

export async function saveWellnessEntry(
  athleteId: string,
  date: string,
  data: Omit<WellnessEntry, 'id' | 'athleteId' | 'date' | 'createdAt' | 'updatedAt'>
) {
  const id = wellnessDocId(athleteId, date)
  const ref = doc(db, 'wellnessEntries', id)
  // getDoc を使わず setDoc+merge で保存（新規ドキュメントの getDoc が Firestore ルールで拒否されるため）
  await setDoc(
    ref,
    {
      athleteId,
      date,
      ...data,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  )
  // コーチに通知
  const userSnap = await getDoc(doc(db, 'users', athleteId))
  const coachId = userSnap.exists() ? (userSnap.data() as UserProfile).coachId : null
  if (coachId && coachId !== athleteId) {
    const athleteName = (userSnap.data() as UserProfile).displayName ?? '選手'
    await createNotification({
      recipientId: coachId,
      senderId: athleteId,
      type: 'wellness_logged',
      relatedEntityType: 'wellness',
      relatedEntityId: id,
      title: '📊 ウェルネス登録がありました',
      body: `${athleteName} - ${date}`,
    })
  }
  return id
}

export async function getWellnessEntry(
  athleteId: string,
  date: string
): Promise<WellnessEntry | null> {
  const snap = await getDoc(doc(db, 'wellnessEntries', wellnessDocId(athleteId, date)))
  if (!snap.exists()) return null
  return { ...(snap.data() as WellnessEntry), id: snap.id }
}

export async function getRecentWellnessEntries(
  athleteId: string,
  days: number
): Promise<WellnessEntry[]> {
  const now = new Date()
  const start = new Date(now.getTime() - (days - 1) * 24 * 60 * 60 * 1000)
  const startStr = start.toISOString().split('T')[0]
  const q = query(
    collection(db, 'wellnessEntries'),
    where('athleteId', '==', athleteId)
  )
  const snap = await getDocs(q)
  return snap.docs
    .map((d) => ({ ...(d.data() as WellnessEntry), id: d.id }))
    .filter((e) => e.date >= startStr)
    .sort((a, b) => a.date.localeCompare(b.date))
}

export async function getLatestWellnessForAthletes(
  athleteIds: string[]
): Promise<Record<string, WellnessEntry | null>> {
  const result: Record<string, WellnessEntry | null> = {}
  await Promise.all(
    athleteIds.map(async (id) => {
      const entries = await getRecentWellnessEntries(id, 3)
      result[id] = entries.length > 0 ? entries[entries.length - 1] : null
    })
  )
  return result
}

// ============================================================
// 動作分析
// ============================================================

export async function createMotionAnalysis(
  data: Omit<MotionAnalysis, 'id' | 'uploadedAt' | 'reviewedAt' | 'status' | 'coachFeedback'>
) {
  const ref = doc(collection(db, 'motionAnalyses'))
  await setDoc(ref, {
    ...data,
    status: 'pending',
    coachFeedback: null,
    uploadedAt: serverTimestamp(),
    reviewedAt: null,
  })
  // コーチに通知
  await createNotification({
    recipientId: data.coachId,
    senderId: data.athleteId,
    type: 'annotation_added',
    relatedEntityType: 'annotation',
    relatedEntityId: ref.id,
    title: '動作分析の動画が届きました',
    body: data.motionType,
  })
  return ref.id
}

export async function getMotionAnalyses(athleteId: string): Promise<MotionAnalysis[]> {
  const q = query(collection(db, 'motionAnalyses'), where('athleteId', '==', athleteId))
  const snap = await getDocs(q)
  return snap.docs
    .map((d) => ({ ...(d.data() as MotionAnalysis), id: d.id }))
    .sort((a, b) => {
      const ta = (a.uploadedAt as any)?.toMillis?.() ?? 0
      const tb = (b.uploadedAt as any)?.toMillis?.() ?? 0
      return tb - ta
    })
}

export async function getMotionAnalysesForCoach(coachId: string): Promise<MotionAnalysis[]> {
  const q = query(collection(db, 'motionAnalyses'), where('coachId', '==', coachId))
  const snap = await getDocs(q)
  return snap.docs
    .map((d) => ({ ...(d.data() as MotionAnalysis), id: d.id }))
    .sort((a, b) => {
      const ta = (a.uploadedAt as any)?.toMillis?.() ?? 0
      const tb = (b.uploadedAt as any)?.toMillis?.() ?? 0
      return tb - ta
    })
}

export async function getMotionAnalysis(id: string): Promise<MotionAnalysis | null> {
  const snap = await getDoc(doc(db, 'motionAnalyses', id))
  if (!snap.exists()) return null
  return { ...(snap.data() as MotionAnalysis), id: snap.id }
}

export async function saveMotionAnalysisFeedback(id: string, feedback: string) {
  await updateDoc(doc(db, 'motionAnalyses', id), {
    coachFeedback: feedback,
    status: 'reviewed',
    reviewedAt: serverTimestamp(),
  })
  // 選手に通知
  const snap = await getDoc(doc(db, 'motionAnalyses', id))
  if (snap.exists()) {
    const m = snap.data() as MotionAnalysis
    await createNotification({
      recipientId: m.athleteId,
      senderId: m.coachId,
      type: 'annotation_added',
      relatedEntityType: 'annotation',
      relatedEntityId: id,
      title: '動作分析のフィードバックが届きました',
      body: m.motionType,
    })
  }
}

export async function deleteMotionAnalysis(id: string) {
  await deleteDoc(doc(db, 'motionAnalyses', id))
}

// 動画書き込み（フレーム赤ペン）
export async function createMotionAnnotation(
  motionId: string,
  data: {
    coachId: string
    timestampSec: number
    annotatedImageUrl: string
    canvasData: any
    note: string
  }
): Promise<string> {
  const ref = doc(collection(db, 'motionAnalyses', motionId, 'annotations'))
  await setDoc(ref, {
    motionId,
    coachId: data.coachId,
    timestampSec: data.timestampSec,
    annotatedImageUrl: data.annotatedImageUrl,
    canvasData: data.canvasData,
    note: data.note,
    createdAt: serverTimestamp(),
  })
  return ref.id
}

export async function listMotionAnnotations(motionId: string) {
  const snap = await getDocs(collection(db, 'motionAnalyses', motionId, 'annotations'))
  return snap.docs
    .map((d) => ({ id: d.id, ...(d.data() as any) }))
    .sort((a, b) => (a.timestampSec ?? 0) - (b.timestampSec ?? 0))
}

export async function deleteMotionAnnotation(motionId: string, annotationId: string) {
  await deleteDoc(doc(db, 'motionAnalyses', motionId, 'annotations', annotationId))
}

// ============================================================
// チャット
// ============================================================

export function chatThreadId(coachId: string, athleteId: string): string {
  return `${coachId}_${athleteId}`
}

/**
 * スレッドが存在しなければ作成（初回送信時に呼ぶ）
 */
export async function ensureChatThread(
  coachId: string,
  athleteId: string,
  coachName: string,
  athleteName: string
): Promise<string> {
  const id = chatThreadId(coachId, athleteId)
  const ref = doc(db, 'chats', id)
  const snap = await getDoc(ref)
  if (!snap.exists()) {
    await setDoc(ref, {
      participants: [coachId, athleteId],
      coachId,
      athleteId,
      coachName,
      athleteName,
      lastMessage: null,
      lastReadBy: {},
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
  }
  return id
}

export async function getChatThread(threadId: string): Promise<ChatThread | null> {
  const snap = await getDoc(doc(db, 'chats', threadId))
  if (!snap.exists()) return null
  return { ...(snap.data() as ChatThread), id: snap.id }
}

/**
 * ユーザーが参加しているスレッド一覧をリアルタイム購読
 */
export function subscribeChatThreads(
  userId: string,
  callback: (threads: ChatThread[]) => void
): Unsubscribe {
  const q = query(
    collection(db, 'chats'),
    where('participants', 'array-contains', userId)
  )
  return onSnapshot(q, (snap) => {
    const threads = snap.docs
      .map((d) => ({ ...(d.data() as ChatThread), id: d.id }))
      .sort((a, b) => {
        const ta = (a.updatedAt as any)?.toMillis?.() ?? 0
        const tb = (b.updatedAt as any)?.toMillis?.() ?? 0
        return tb - ta
      })
    callback(threads)
  })
}

/**
 * スレッド内のメッセージをリアルタイム購読
 */
export function subscribeChatMessages(
  threadId: string,
  callback: (messages: ChatMessage[]) => void
): Unsubscribe {
  const q = query(collection(db, 'chats', threadId, 'messages'))
  return onSnapshot(q, (snap) => {
    const messages = snap.docs
      .map((d) => ({ ...(d.data() as ChatMessage), id: d.id }))
      .sort((a, b) => {
        const ta = (a.sentAt as any)?.toMillis?.() ?? 0
        const tb = (b.sentAt as any)?.toMillis?.() ?? 0
        return ta - tb
      })
    callback(messages)
  })
}

export async function sendChatMessage(
  threadId: string,
  senderId: string,
  data: { type: 'text' | 'image'; text: string; imageUrl?: string | null; imageWidth?: number | null; imageHeight?: number | null }
) {
  // メッセージ追加
  await addDoc(collection(db, 'chats', threadId, 'messages'), {
    threadId,
    senderId,
    type: data.type,
    text: data.text,
    imageUrl: data.imageUrl ?? null,
    imageWidth: data.imageWidth ?? null,
    imageHeight: data.imageHeight ?? null,
    sentAt: serverTimestamp(),
  })

  // スレッドの lastMessage 更新
  await updateDoc(doc(db, 'chats', threadId), {
    lastMessage: {
      text: data.type === 'image' ? '📷 画像' : data.text,
      senderId,
      sentAt: serverTimestamp(),
      type: data.type,
    },
    updatedAt: serverTimestamp(),
  })

  // 相手に通知（双方向）
  const threadSnap = await getDoc(doc(db, 'chats', threadId))
  if (threadSnap.exists()) {
    const t = threadSnap.data() as ChatThread
    const recipientId = t.participants.find((p) => p !== senderId)
    if (recipientId) {
      const senderName = senderId === t.coachId ? t.coachName : t.athleteName
      await createNotification({
        recipientId,
        senderId,
        type: 'chat_message',
        relatedEntityType: 'chat',
        relatedEntityId: threadId,
        title: `💬 ${senderName} からメッセージ`,
        body: data.type === 'image' ? '📷 画像' : data.text.slice(0, 80),
      })
    }
  }
}

/**
 * 既読マーク
 */
export async function markChatRead(threadId: string, userId: string) {
  await updateDoc(doc(db, 'chats', threadId), {
    [`lastReadBy.${userId}`]: serverTimestamp(),
  })
}

/**
 * チャットメッセージ削除（送信者本人のみ）
 */
export async function deleteChatMessage(threadId: string, messageId: string) {
  await deleteDoc(doc(db, 'chats', threadId, 'messages', messageId))
}

/**
 * 未読カウント計算（Firestoreインデックス不要なクライアントサイド計算）
 */
export function computeUnreadCount(thread: ChatThread, userId: string): number {
  if (!thread.lastMessage) return 0
  if (thread.lastMessage.senderId === userId) return 0
  const lastRead = thread.lastReadBy?.[userId]
  if (!lastRead) return 1 // 既読なし＝未読あり
  const lastSent = (thread.lastMessage.sentAt as any)?.toMillis?.() ?? 0
  const lastReadMs = (lastRead as any)?.toMillis?.() ?? 0
  return lastSent > lastReadMs ? 1 : 0
}

// ============================================================
// 招待
// ============================================================

export async function createInvite(coachId: string, email?: string): Promise<string> {
  const token = uuidv4()
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + 7)

  // token を doc ID に使うことで、招待リンク経由の単一 doc 取得をセキュリティルールで許可可能に
  const ref = doc(db, 'invites', token)
  await setDoc(ref, {
    coachId,
    email: email ?? null,
    token,
    status: 'pending',
    expiresAt,
    acceptedByUserId: null,
    createdAt: serverTimestamp(),
  })
  return token
}

export async function getInviteByToken(token: string): Promise<Invite | null> {
  // 旧データ（自動IDで作成され、token が field のみ）にもフォールバック
  const direct = await getDoc(doc(db, 'invites', token))
  if (direct.exists()) {
    return { ...(direct.data() as Invite), id: direct.id }
  }
  const q = query(collection(db, 'invites'), where('token', '==', token))
  const snap = await getDocs(q)
  if (snap.empty) return null
  const d = snap.docs[0]
  return { ...(d.data() as Invite), id: d.id }
}

export async function acceptInvite(inviteId: string, userId: string) {
  await updateDoc(doc(db, 'invites', inviteId), {
    status: 'accepted',
    acceptedByUserId: userId,
  })
}

// ============================================================
// 通知
// ============================================================

export function subscribeNotifications(
  userId: string,
  callback: (notifications: Notification[]) => void
): Unsubscribe {
  // 複合インデックスを避けるため orderBy はクライアント側で実施
  const q = query(
    collection(db, 'notifications'),
    where('recipientId', '==', userId),
    where('isRead', '==', false)
  )
  return onSnapshot(q, (snap) => {
    const notifications = snap.docs
      .map((d) => ({ ...(d.data() as Notification), id: d.id }))
      .sort((a, b) => {
        const ta = (a.createdAt as any)?.toMillis?.() ?? 0
        const tb = (b.createdAt as any)?.toMillis?.() ?? 0
        return tb - ta
      })
    callback(notifications)
  })
}

export async function markNotificationRead(notificationId: string) {
  await updateDoc(doc(db, 'notifications', notificationId), { isRead: true })
}

export async function createNotification(
  data: Omit<Notification, 'id' | 'createdAt' | 'isRead'>
) {
  await addDoc(collection(db, 'notifications'), {
    ...data,
    isRead: false,
    createdAt: serverTimestamp(),
  })
  fetch('/api/notifications/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ recipientId: data.recipientId, title: data.title, body: data.body }),
  }).catch(() => {})
}
