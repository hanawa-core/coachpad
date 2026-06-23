/**
 * sRPE 負荷モデルの単体テスト。
 * Node 24 の型ストリッピング + 組み込み test runner で実行（依存追加なし）:
 *   node --test lib/load/srpe.test.ts
 *
 * srpe.ts は純関数のみ・値の外部 import なし（Workout は import type で消去）なので
 * トランスパイル/バンドルなしにそのまま実行できる。
 */

import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  sessionLoad,
  buildDailyLoad,
  ewmaLambda,
  ewmaSeries,
  acwrZone,
  computeSrpeSeries,
  monotony,
  strain,
  weekOverWeekChangePct,
  toDateStr,
  mergeDailyLoad,
} from './srpe.ts'

// ---- sessionLoad = rpe × durationMin --------------------------------------
test('sessionLoad: rpe × durationMin', () => {
  assert.equal(sessionLoad(7, 60), 420)
  assert.equal(sessionLoad(0, 60), 0) // 完全休養
  assert.equal(sessionLoad(10, 90), 900)
})

test('sessionLoad: 欠損・範囲外は null（負荷算入しない）', () => {
  assert.equal(sessionLoad(null, 60), null)
  assert.equal(sessionLoad(7, null), null)
  assert.equal(sessionLoad(7, 0), null)
  assert.equal(sessionLoad(-1, 60), null) // 範囲外
  assert.equal(sessionLoad(11, 60), null) // 範囲外
  assert.equal(sessionLoad(NaN, 60), null)
})

// ---- 同日複数セッションの合算 ----------------------------------------------
test('buildDailyLoad: 同日複数セッションを合算、RPE欠損は除外', () => {
  const map = buildDailyLoad([
    { date: '2026-06-01', rpe: 5, durationMin: 60 }, // 300
    { date: '2026-06-01', rpe: 8, durationMin: 30 }, // 240
    { date: '2026-06-01', rpe: null, durationMin: 45 }, // 除外
    { date: '2026-06-02', rpe: 6, durationMin: 50 }, // 300
  ])
  assert.equal(map.get('2026-06-01'), 540)
  assert.equal(map.get('2026-06-02'), 300)
})

// ---- EWMA: λ と漸化式の再現 ------------------------------------------------
test('ewmaLambda: λ = 2/(N+1)', () => {
  assert.equal(ewmaLambda(7), 0.25)
  assert.equal(ewmaLambda(28), 2 / 29)
})

test('ewmaSeries: 既知系列で漸化式どおり（N=7, λ=0.25, seed=0）', () => {
  // e0 = 100*0.25 + 0*0.75       = 25
  // e1 =   0*0.25 + 25*0.75      = 18.75
  // e2 =   0*0.25 + 18.75*0.75   = 14.0625
  const s = ewmaSeries([100, 0, 0], 7)
  assert.equal(s[0], 25)
  assert.equal(s[1], 18.75)
  assert.equal(s[2], 14.0625)
})

test('ewmaSeries: 定常入力は入力値へ漸近', () => {
  const s = ewmaSeries(Array(500).fill(50), 28)
  assert.ok(Math.abs(s[s.length - 1] - 50) < 1e-3)
})

// ---- ACWR ゾーンの境界値（0.8 / 1.3 / 1.5） --------------------------------
test('acwrZone: 境界値で正しく切替（安全側帰属）', () => {
  assert.equal(acwrZone(0.79), 'low')
  assert.equal(acwrZone(0.8), 'optimal') // 境界 0.8 → 適正
  assert.equal(acwrZone(1.0), 'optimal')
  assert.equal(acwrZone(1.3), 'optimal') // 境界 1.3 → 適正
  assert.equal(acwrZone(1.31), 'high')
  assert.equal(acwrZone(1.5), 'high') // 境界 1.5 → やや高い
  assert.equal(acwrZone(1.51), 'risk')
  assert.equal(acwrZone(2.0), 'risk')
  assert.equal(acwrZone(null), 'building')
})

// ---- 時系列: ベースライン構築中（28日未満）と確立後 -------------------------
test('computeSrpeSeries: データ28日未満は building、ACWRは暫定', () => {
  const today = new Date('2026-06-20T12:00:00Z')
  // 直近5日だけ負荷を入れる（最初のデータから28日未満）
  const map = buildDailyLoad([
    { date: '2026-06-16', rpe: 6, durationMin: 60 },
    { date: '2026-06-17', rpe: 6, durationMin: 60 },
    { date: '2026-06-18', rpe: 6, durationMin: 60 },
    { date: '2026-06-19', rpe: 6, durationMin: 60 },
    { date: '2026-06-20', rpe: 6, durationMin: 60 },
  ])
  const series = computeSrpeSeries(map, { today, lookbackDays: 10 })
  const last = series[series.length - 1]
  assert.equal(last.date, '2026-06-20')
  assert.equal(last.established, false)
  assert.equal(last.zone, 'building')
  assert.ok(last.dailyLoad === 360)
})

test('computeSrpeSeries: 28日以上の履歴があれば established=true', () => {
  const today = new Date('2026-06-30T12:00:00Z')
  const inputs = []
  // 5/1 〜 6/30 まで毎日 RPE6 × 60分 = 360 を投入（60日分）
  for (let i = 0; i < 60; i++) {
    const d = toDateStr(new Date(Date.parse('2026-05-02T12:00:00Z') + i * 86400000))
    inputs.push({ date: d, rpe: 6, durationMin: 60 })
  }
  const map = buildDailyLoad(inputs)
  const series = computeSrpeSeries(map, { today, lookbackDays: 14 })
  const last = series[series.length - 1]
  assert.equal(last.established, true)
  // 定常負荷なので acute≈chronic≈360, ACWR≈1.0 → optimal
  assert.ok(last.acwr != null && Math.abs(last.acwr - 1) < 0.05)
  assert.equal(last.zone, 'optimal')
})

test('computeSrpeSeries: 欠損日は dailyLoad=0 で連続', () => {
  const today = new Date('2026-06-20T12:00:00Z')
  const map = buildDailyLoad([{ date: '2026-06-18', rpe: 5, durationMin: 60 }])
  const series = computeSrpeSeries(map, { today, lookbackDays: 5 })
  // 連続した日付が返る（窓内に隙間なし）
  for (let i = 1; i < series.length; i++) {
    const prev = Date.parse(series[i - 1].date + 'T12:00:00Z')
    const cur = Date.parse(series[i].date + 'T12:00:00Z')
    assert.equal(cur - prev, 86400000)
  }
  const day19 = series.find((d) => d.date === '2026-06-19')
  assert.ok(day19 && day19.dailyLoad === 0)
})

// ---- Foster: Monotony / Strain --------------------------------------------
test('monotony / strain', () => {
  // 完全に一定の週 → SD=0 → null
  assert.equal(monotony([300, 300, 300, 300, 300, 300, 300]), null)
  assert.equal(strain([300, 300, 300, 300, 300, 300, 300]), null)

  const week = [400, 0, 300, 0, 500, 0, 200] // 変動あり
  const m = monotony(week)
  assert.ok(m != null && m > 0)
  const s = strain(week)
  const total = week.reduce((a, b) => a + b, 0)
  assert.ok(s != null && Math.abs(s - total * (m as number)) < 1e-6)
})

// ---- 日別負荷の統合（ウェルネス優先・二重計上しない） ----------------------
test('mergeDailyLoad: 同日はウェルネス優先、無い日はワークアウト補完', () => {
  const wellness = new Map([
    ['2026-06-01', 420], // ウェルネスで入力
    ['2026-06-03', 300],
  ])
  const workouts = new Map([
    ['2026-06-01', 999], // 同日にワークアウトもあるが二重計上しない
    ['2026-06-02', 250], // ウェルネス無し → 補完
  ])
  const merged = mergeDailyLoad(wellness, workouts)
  assert.equal(merged.get('2026-06-01'), 420) // ウェルネス優先
  assert.equal(merged.get('2026-06-02'), 250) // ワークアウト補完
  assert.equal(merged.get('2026-06-03'), 300)
})

test('weekOverWeekChangePct', () => {
  assert.equal(weekOverWeekChangePct(1100, 1000), 10) // +10%
  assert.equal(weekOverWeekChangePct(1000, 1000), 0)
  assert.equal(weekOverWeekChangePct(1000, 0), null) // 前週0
})
