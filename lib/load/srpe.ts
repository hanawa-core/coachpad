/**
 * sRPE（セッションRPE）ベースの負荷モデル
 * ------------------------------------------------------------
 * ランニング/トレイル以外（球技・対人競技 等）のクライアント向け。
 * Strava 同期 → TSS → CTL/ATL/TSB の既存パス（lib/strava/sync.ts,
 * components/dashboard/FitnessChart.tsx）には一切依存・干渉しない。
 *
 * このモジュールは **副作用も外部依存も持たない純関数のみ** で構成する。
 * Firebase 型は `import type` で参照する（実行時には消去されるため、
 * Node の `--test`（型ストリッピング）で依存解決なしに単体テストできる）。
 *
 * 中核ロジック（仕様準拠）:
 *   sessionLoad(AU) = sRPE(0〜10, Borg CR-10) × 運動時間(分)
 *   dailyLoad       = その日の全セッションの sessionLoad 合計
 *   λ = 2 / (N + 1)
 *   acuteEWMA   : N=7   ewma_t = daily_t·λ + (1−λ)·ewma_(t−1)
 *   chronicEWMA : N=28  同上
 *   ACWR = acuteEWMA / chronicEWMA
 */

import type { Workout, WellnessEntry } from '@/types'

// ============================================================
// 型
// ============================================================

/** 負荷モデルの種別。strava_ctl は既存の CTL/ATL/TSB、srpe は本モジュール。 */
export type LoadModel = 'strava_ctl' | 'srpe'

/** ACWR ゾーン。building は慢性負荷のベースライン構築中（データ28日未満）。 */
export type AcwrZone = 'building' | 'low' | 'optimal' | 'high' | 'risk'

export interface AcwrZoneMeta {
  zone: AcwrZone
  label: string
  /** Tailwind テキスト色 */
  color: string
  /** Tailwind 背景色（淡） */
  bg: string
  /** Recharts 等で使う生の HEX */
  hex: string
  hint: string
}

/** 1日分の sRPE 集計結果 */
export interface SrpeDay {
  date: string // YYYY-MM-DD
  dailyLoad: number
  acuteEWMA: number
  chronicEWMA: number
  /** acuteEWMA / chronicEWMA。慢性負荷が 0 のときは null。 */
  acwr: number | null
  zone: AcwrZone
  /** 慢性負荷のベースラインが確立済み（最初のデータから28日以上経過）か */
  established: boolean
}

/** 負荷計算に必要な最小限のワークアウト入力（Firebase 非依存） */
export interface LoadWorkoutInput {
  date: string // YYYY-MM-DD
  rpe: number | null
  durationMin: number | null
}

// ============================================================
// 定数
// ============================================================

export const ACUTE_N = 7
export const CHRONIC_N = 28
/** 慢性負荷ベースライン確立に必要な日数 */
export const MIN_CHRONIC_DAYS = 28
export const RPE_MIN = 0
export const RPE_MAX = 10

// ============================================================
// 1. セッション負荷
// ============================================================

/**
 * セッション負荷(AU) = RPE × 運動時間(分)。
 * RPE 未入力・時間未入力・範囲外（RPE 0〜10）は null（＝負荷算入しない）。
 * RPE=0 は「完全休養」を意味し負荷 0 として扱う。
 */
export function sessionLoad(rpe: number | null | undefined, durationMin: number | null | undefined): number | null {
  if (rpe == null || durationMin == null) return null
  if (!Number.isFinite(rpe) || !Number.isFinite(durationMin)) return null
  if (rpe < RPE_MIN || rpe > RPE_MAX) return null
  if (durationMin <= 0) return null
  return rpe * durationMin
}

// ============================================================
// 2. 日別負荷の集計（同日複数セッションは合算）
// ============================================================

/**
 * ワークアウト配列 → 日付ごとの dailyLoad マップ。
 * sessionLoad が null（RPE/時間欠損）のセッションは加算しない。
 */
export function buildDailyLoad(items: LoadWorkoutInput[]): Map<string, number> {
  const byDate = new Map<string, number>()
  for (const w of items) {
    const load = sessionLoad(w.rpe, w.durationMin)
    if (load == null) continue
    byDate.set(w.date, (byDate.get(w.date) ?? 0) + load)
  }
  return byDate
}

// ============================================================
// 3. EWMA
// ============================================================

/** λ = 2 / (N + 1) */
export function ewmaLambda(n: number): number {
  return 2 / (n + 1)
}

/**
 * 漸化式 EWMA。dailyLoads[i] を時系列順（古い→新しい）に与え、
 * 各時点の EWMA 系列を返す。seed は初日「前日」の値（既定 0）。
 *   ewma_t = daily_t·λ + (1−λ)·ewma_(t−1)
 */
export function ewmaSeries(dailyLoads: number[], n: number, seed = 0): number[] {
  const lambda = ewmaLambda(n)
  const out: number[] = []
  let prev = seed
  for (const load of dailyLoads) {
    const cur = load * lambda + (1 - lambda) * prev
    out.push(cur)
    prev = cur
  }
  return out
}

// ============================================================
// 4. ACWR とゾーン判定
// ============================================================

/**
 * ACWR ゾーン判定。境界値の帰属（安全側＝低いゾーン）:
 *   acwr < 0.8           → low      （青・ディトレ気味）
 *   0.8 ≤ acwr ≤ 1.3     → optimal  （緑・スイートスポット）
 *   1.3 < acwr ≤ 1.5     → high     （黄・やや高い）
 *   acwr > 1.5           → risk     （赤・高リスク）
 */
export function acwrZone(acwr: number | null): AcwrZone {
  if (acwr == null || !Number.isFinite(acwr)) return 'building'
  if (acwr < 0.8) return 'low'
  if (acwr <= 1.3) return 'optimal'
  if (acwr <= 1.5) return 'high'
  return 'risk'
}

export const ACWR_ZONE_META: Record<AcwrZone, AcwrZoneMeta> = {
  building: {
    zone: 'building',
    label: 'ベースライン構築中',
    color: 'text-slate-400',
    bg: 'bg-slate-500/15',
    hex: '#94a3b8',
    hint: 'データ蓄積中（28日未満）。慢性負荷が安定するまで負荷バランスは暫定値です',
  },
  low: {
    zone: 'low',
    label: '低負荷',
    color: 'text-sky-400',
    bg: 'bg-sky-500/15',
    hex: '#38bdf8',
    hint: 'ディトレーニング気味。負荷をやや上げる余地があります',
  },
  optimal: {
    zone: 'optimal',
    label: '適正',
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/15',
    hex: '#34d399',
    hint: 'スイートスポット。負荷と回復のバランスが取れています',
  },
  high: {
    zone: 'high',
    label: 'やや高い',
    color: 'text-amber-400',
    bg: 'bg-amber-500/15',
    hex: '#fbbf24',
    hint: '負荷の伸びがやや急。今週の積み増しは控えめに',
  },
  risk: {
    zone: 'risk',
    label: '高リスク',
    color: 'text-red-400',
    bg: 'bg-red-500/15',
    hex: '#ef4444',
    hint: '急性負荷が慢性負荷を大きく上回っています。故障リスク。負荷を調整してください',
  },
}

// ============================================================
// 5. 時系列の構築
// ============================================================

const DAY_MS = 24 * 60 * 60 * 1000

/** YYYY-MM-DD 文字列を UTC 正午基準で安全にパース（タイムゾーンずれ回避） */
function parseDate(d: string): number {
  return Date.parse(`${d}T12:00:00Z`)
}

/** Date → YYYY-MM-DD（UTC） */
export function toDateStr(d: Date): string {
  return d.toISOString().split('T')[0]
}

export interface SrpeSeriesOptions {
  /** 表示する直近日数（既定 30） */
  lookbackDays?: number
  /** 計算基準日（既定 今日）。テスト再現性のため注入可能。 */
  today?: Date
  acuteN?: number
  chronicN?: number
}

/**
 * 日別負荷マップ → 表示用 sRPE 時系列。
 * 欠損日は dailyLoad=0 として連続させ、ウォームアップ期間を前置きして
 * EWMA を安定させてから表示窓を切り出す。
 */
export function computeSrpeSeries(
  dailyByDate: Map<string, number>,
  options: SrpeSeriesOptions = {}
): SrpeDay[] {
  const acuteN = options.acuteN ?? ACUTE_N
  const chronicN = options.chronicN ?? CHRONIC_N
  const lookbackDays = options.lookbackDays ?? 30
  const today = options.today ?? new Date()
  const todayStr = toDateStr(today)
  const todayMs = parseDate(todayStr)

  // 最初にデータが入った日（ベースライン確立判定の起点）
  let firstDataMs: number | null = null
  for (const [date, load] of dailyByDate) {
    if (load <= 0) continue
    const ms = parseDate(date)
    if (firstDataMs == null || ms < firstDataMs) firstDataMs = ms
  }

  // ウォームアップ: 慢性窓の約2倍を前置き。ただし最古データより前には遡らない。
  const warmup = chronicN * 2
  const totalDays = lookbackDays + warmup
  const startMs = todayMs - (totalDays - 1) * DAY_MS

  // 連続した日別負荷配列を構築
  const dates: string[] = []
  const loads: number[] = []
  for (let i = 0; i < totalDays; i++) {
    const ms = startMs + i * DAY_MS
    const ds = toDateStr(new Date(ms))
    dates.push(ds)
    loads.push(dailyByDate.get(ds) ?? 0)
  }

  const acute = ewmaSeries(loads, acuteN)
  const chronic = ewmaSeries(loads, chronicN)

  const series: SrpeDay[] = []
  for (let i = warmup; i < totalDays; i++) {
    const chronicVal = chronic[i]
    const acwr = chronicVal > 0 ? acute[i] / chronicVal : null
    const ms = parseDate(dates[i])
    const established =
      firstDataMs != null && (ms - firstDataMs) / DAY_MS >= MIN_CHRONIC_DAYS
    series.push({
      date: dates[i],
      dailyLoad: loads[i],
      acuteEWMA: acute[i],
      chronicEWMA: chronicVal,
      acwr,
      zone: established ? acwrZone(acwr) : 'building',
      established,
    })
  }

  return series
}

// ============================================================
// 6. Foster の Monotony / Strain（任意・補助指標）
// ============================================================

/** 標本標準偏差（n-1）。要素0/1個は 0。 */
function stddev(values: number[]): number {
  if (values.length < 2) return 0
  const mean = values.reduce((a, b) => a + b, 0) / values.length
  const variance =
    values.reduce((a, b) => a + (b - mean) ** 2, 0) / (values.length - 1)
  return Math.sqrt(variance)
}

/**
 * Monotony = 週平均日負荷 / 週内日負荷のSD。
 * 単調なほど（休養日が少ないほど）高くなる。SD=0 のときは null。
 */
export function monotony(weekDailyLoads: number[]): number | null {
  if (weekDailyLoads.length === 0) return null
  const mean = weekDailyLoads.reduce((a, b) => a + b, 0) / weekDailyLoads.length
  const sd = stddev(weekDailyLoads)
  if (sd === 0) return null
  return mean / sd
}

/** Strain = 週合計負荷 × Monotony。Monotony が出せないときは null。 */
export function strain(weekDailyLoads: number[]): number | null {
  const m = monotony(weekDailyLoads)
  if (m == null) return null
  const total = weekDailyLoads.reduce((a, b) => a + b, 0)
  return total * m
}

/** 週負荷の前週比（%）。+10% 以内が推奨ライン。前週0なら null。 */
export function weekOverWeekChangePct(thisWeekTotal: number, lastWeekTotal: number): number | null {
  if (lastWeekTotal <= 0) return null
  return ((thisWeekTotal - lastWeekTotal) / lastWeekTotal) * 100
}

// ============================================================
// 7. アダプタ（Firebase Workout → 計算入力）
// ============================================================

/**
 * 完了済み Workout を負荷計算入力へ変換。
 * RPE は completed.metrics.rpe、時間は completed.durationMin（無ければ metrics.durationMin）。
 * 完了していない（planned のみ）ワークアウトは null。
 */
export function workoutToLoadInput(w: Workout): LoadWorkoutInput | null {
  const c = w.completed
  if (!c) return null
  const rpeRaw = c.metrics?.rpe
  const rpe = typeof rpeRaw === 'number' ? rpeRaw : rpeRaw != null ? Number(rpeRaw) : null
  let durationMin: number | null = c.durationMin ?? null
  if (durationMin == null) {
    const dm = c.metrics?.durationMin
    durationMin = typeof dm === 'number' ? dm : dm != null ? Number(dm) : null
  }
  return {
    date: w.date,
    rpe: rpe != null && Number.isFinite(rpe) ? rpe : null,
    durationMin: durationMin != null && Number.isFinite(durationMin) ? durationMin : null,
  }
}

/** Workout 配列 → 日別負荷マップ（完了済みのみ） */
export function dailyLoadFromWorkouts(workouts: Workout[]): Map<string, number> {
  const inputs: LoadWorkoutInput[] = []
  for (const w of workouts) {
    const inp = workoutToLoadInput(w)
    if (inp) inputs.push(inp)
  }
  return buildDailyLoad(inputs)
}

/**
 * 毎日のウェルネス記録 → 負荷計算入力。
 * その日のセッションRPE（sessionRpe）× 運動時間（sessionDurationMin）。
 * 未入力（どちらか欠損）は null。
 */
export function wellnessToLoadInput(entry: WellnessEntry): LoadWorkoutInput | null {
  const rpe = entry.sessionRpe
  const durationMin = entry.sessionDurationMin
  if (rpe == null || durationMin == null) return null
  return {
    date: entry.date,
    rpe: Number.isFinite(rpe) ? rpe : null,
    durationMin: Number.isFinite(durationMin) ? durationMin : null,
  }
}

/** ウェルネス記録配列 → 日別負荷マップ（同日複数はありえないが念のため合算） */
export function dailyLoadFromWellness(entries: WellnessEntry[]): Map<string, number> {
  const inputs: LoadWorkoutInput[] = []
  for (const e of entries) {
    const inp = wellnessToLoadInput(e)
    if (inp) inputs.push(inp)
  }
  return buildDailyLoad(inputs)
}

/**
 * 日別負荷マップの統合。同じ日付は primary（毎日のウェルネス入力）を優先し、
 * primary に無い日だけ fallback（ワークアウト記録の合算）を使う。
 * → 両方に記録があっても二重計上しない。
 */
export function mergeDailyLoad(
  primary: Map<string, number>,
  fallback: Map<string, number>
): Map<string, number> {
  const merged = new Map<string, number>(fallback)
  for (const [date, load] of primary) {
    merged.set(date, load)
  }
  return merged
}

/**
 * 選手の日別負荷を、毎日のウェルネス入力（優先）とワークアウト記録（補完）から算出。
 * sRPE ダッシュボード・アラートはこれを入口にする。
 */
export function dailyLoadFor(
  workouts: Workout[],
  wellnessEntries: WellnessEntry[]
): Map<string, number> {
  return mergeDailyLoad(dailyLoadFromWellness(wellnessEntries), dailyLoadFromWorkouts(workouts))
}
