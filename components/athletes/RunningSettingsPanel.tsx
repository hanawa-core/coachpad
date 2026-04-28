'use client'

import { useEffect, useState } from 'react'
import { ChevronDown, ChevronRight, Pencil, Check, X, FlaskConical } from 'lucide-react'
import { getUserProfile, updateUserProfile } from '@/lib/firebase/firestore'
import type { UserProfile } from '@/types'

// ────────────────────────────────────────────────
// Zone calc helpers
// ────────────────────────────────────────────────
const ZONES = [
  { key: 'z1', label: 'Z1 Recovery',  pcts: [0, 84],    color: 'bg-blue-900/60 border-blue-700/40' },
  { key: 'z2', label: 'Z2 Aerobic',   pcts: [85, 89],   color: 'bg-emerald-900/60 border-emerald-700/40' },
  { key: 'z3', label: 'Z3 Tempo',     pcts: [90, 94],   color: 'bg-yellow-900/60 border-yellow-700/40' },
  { key: 'z4', label: 'Z4 Threshold', pcts: [95, 99],   color: 'bg-orange-900/60 border-orange-700/40' },
  { key: 'z5', label: 'Z5 VO2max',    pcts: [100, 102], color: 'bg-red-900/60 border-red-700/40' },
]

function calcZones(lthr: number) {
  return ZONES.map((z) => ({
    ...z,
    lo: z.pcts[0] === 0 ? 0 : Math.round(lthr * z.pcts[0] / 100),
    hi: Math.round(lthr * z.pcts[1] / 100),
  }))
}

// ────────────────────────────────────────────────
// Pace helpers  min:ss string ↔ total seconds
// ────────────────────────────────────────────────
function paceToSec(pace: string): number | null {
  const m = pace.match(/^(\d+):([0-5]\d)$/)
  if (!m) return null
  return parseInt(m[1]) * 60 + parseInt(m[2])
}

function secToPace(sec: number): string {
  const m = Math.floor(sec / 60)
  const s = Math.round(sec % 60)
  return `${m}:${String(s).padStart(2, '0')}`
}

// ────────────────────────────────────────────────
// Test calculator logic
// ────────────────────────────────────────────────
type TestResult = { lthr?: number; thresholdPace?: string; note?: string }

function calc20min(avgHr: string, avgPace: string): TestResult {
  const hr = parseInt(avgHr)
  const paceSec = paceToSec(avgPace)
  const result: TestResult = {}
  if (hr > 0) result.lthr = Math.round(hr * 0.95)
  if (paceSec) {
    // 20分全力走ペースはしきい値ペースとほぼ同じ（+5秒/km を保守的に加算）
    result.thresholdPace = secToPace(paceSec + 5)
  }
  result.note = '20分全力走の平均心拍 × 0.95 = LTHR、平均ペース +5秒/km = 閾値ペース'
  return result
}

function calc5km(finishTime: string): TestResult {
  const m = finishTime.match(/^(\d+):([0-5]\d)$/)
  if (!m) return {}
  const totalSec = parseInt(m[1]) * 60 + parseInt(m[2])
  const paceSec = totalSec / 5                          // sec/km
  const tPaceSec = Math.round(paceSec * 1.08)           // T-pace ≈ 5km pace × 1.08
  return {
    thresholdPace: secToPace(tPaceSec),
    note: '5kmペース × 1.08 ≈ 閾値ペース（Jack Daniels法）',
  }
}

function calcYasso(split800: string): TestResult {
  // Yasso: 800m split min:sec → marathon h:min
  const m = split800.match(/^(\d+):([0-5]\d)$/)
  if (!m) return {}
  const splitMin = parseInt(m[1])
  const splitSec = parseInt(m[2])
  // Marathon time = split_min hours + split_sec minutes
  const marathonSec = splitMin * 3600 + splitSec * 60
  const marathonPaceSec = marathonSec / 42.195          // sec/km
  const tPaceSec = Math.round(marathonPaceSec * 0.93)   // T-pace ≈ marathon pace × 0.93
  const mH = Math.floor(marathonSec / 3600)
  const mM = Math.floor((marathonSec % 3600) / 60)
  return {
    thresholdPace: secToPace(tPaceSec),
    note: `予測マラソンタイム: ${mH}時間${mM}分 → 閾値ペース（マラソンペース × 0.93）`,
  }
}

// ────────────────────────────────────────────────
// Sub-components
// ────────────────────────────────────────────────
function ZoneBar({ lthr }: { lthr: number }) {
  const zones = calcZones(lthr)
  return (
    <div className="mt-4 space-y-1.5">
      <p className="text-xs font-medium text-slate-400 mb-2">自動計算された心拍ゾーン（% LTHR ベース）</p>
      {zones.map((z) => (
        <div
          key={z.key}
          className={`flex items-center justify-between rounded-lg border px-3 py-1.5 ${z.color}`}
        >
          <span className="text-xs text-white">{z.label} ({z.pcts[0]}-{z.pcts[1]}%)</span>
          <span className="text-xs text-slate-300">
            {z.key === 'z1' ? `〜${z.hi} bpm` : `${z.lo}-${z.hi} bpm`}
          </span>
        </div>
      ))}
    </div>
  )
}

type TestTab = '20min' | '5km' | 'yasso'

function TestCalculator({ onApply }: { onApply: (r: TestResult) => void }) {
  const [tab, setTab] = useState<TestTab>('20min')
  const [avgHr, setAvgHr] = useState('')
  const [avgPace, setAvgPace] = useState('')
  const [time5km, setTime5km] = useState('')
  const [yasso, setYasso] = useState('')
  const [result, setResult] = useState<TestResult | null>(null)

  const run = () => {
    if (tab === '20min') setResult(calc20min(avgHr, avgPace))
    if (tab === '5km')   setResult(calc5km(time5km))
    if (tab === 'yasso') setResult(calcYasso(yasso))
  }

  const TABS: { id: TestTab; label: string }[] = [
    { id: '20min', label: '20分全力走' },
    { id: '5km',   label: '5kmレース' },
    { id: 'yasso', label: 'ヤッソ800' },
  ]

  return (
    <div className="mt-4 rounded-xl border border-purple-800/50 bg-purple-950/20 p-4">
      <div className="flex items-center gap-2 mb-3">
        <FlaskConical className="h-4 w-4 text-purple-400" />
        <p className="text-sm font-semibold text-purple-300">テストから閾値を自動計算</p>
      </div>

      {/* タブ */}
      <div className="flex gap-1 mb-4">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => { setTab(t.id); setResult(null) }}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              tab === t.id
                ? 'bg-purple-600 text-white'
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* 入力フォーム */}
      {tab === '20min' && (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-xs text-slate-400">平均心拍（bpm）</label>
            <input
              type="number"
              value={avgHr}
              onChange={(e) => setAvgHr(e.target.value)}
              placeholder="例: 168"
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-slate-400">平均ペース（分:秒/km）</label>
            <input
              type="text"
              value={avgPace}
              onChange={(e) => setAvgPace(e.target.value)}
              placeholder="例: 4:15"
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
            />
          </div>
        </div>
      )}

      {tab === '5km' && (
        <div className="max-w-xs">
          <label className="mb-1 block text-xs text-slate-400">5kmゴールタイム（分:秒）</label>
          <input
            type="text"
            value={time5km}
            onChange={(e) => setTime5km(e.target.value)}
            placeholder="例: 21:30"
            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
          />
          <p className="mt-1 text-xs text-slate-500">5kmレースまたはタイムトライアルの結果</p>
        </div>
      )}

      {tab === 'yasso' && (
        <div className="max-w-xs">
          <label className="mb-1 block text-xs text-slate-400">800m平均スプリット（分:秒）</label>
          <input
            type="text"
            value={yasso}
            onChange={(e) => setYasso(e.target.value)}
            placeholder="例: 3:45"
            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
          />
          <p className="mt-1 text-xs text-slate-500">
            10本の800mインターバル、全力ではなくマラソンペース目安で走る
          </p>
        </div>
      )}

      <button
        onClick={run}
        className="mt-3 rounded-lg bg-purple-700 px-4 py-2 text-sm font-medium text-white hover:bg-purple-600"
      >
        計算する
      </button>

      {/* 結果 */}
      {result && (
        <div className="mt-3 rounded-lg border border-purple-700/40 bg-purple-900/20 p-3 space-y-2">
          <div className="flex flex-wrap gap-4">
            {result.lthr && (
              <div>
                <p className="text-xs text-slate-400">閾値心拍（LTHR）</p>
                <p className="text-lg font-bold text-white">{result.lthr} <span className="text-sm font-normal text-slate-400">bpm</span></p>
              </div>
            )}
            {result.thresholdPace && (
              <div>
                <p className="text-xs text-slate-400">閾値ペース</p>
                <p className="text-lg font-bold text-white">{result.thresholdPace} <span className="text-sm font-normal text-slate-400">分/km</span></p>
              </div>
            )}
          </div>
          {result.note && (
            <p className="text-xs text-slate-500">{result.note}</p>
          )}
          <button
            onClick={() => onApply(result)}
            className="w-full rounded-lg bg-emerald-700 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-600"
          >
            この値をフォームに適用
          </button>
        </div>
      )}
    </div>
  )
}

// ────────────────────────────────────────────────
// Main component
// ────────────────────────────────────────────────
export function RunningSettingsPanel({ athleteId }: { athleteId: string }) {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [editing, setEditing] = useState(false)
  const [showCalc, setShowCalc] = useState(false)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)

  // form state
  const [thresholdHr, setThresholdHr] = useState('')
  const [maxHr, setMaxHr] = useState('')
  const [restingHr, setRestingHr] = useState('')
  const [thresholdPace, setThresholdPace] = useState('')
  const [ftp, setFtp] = useState('')

  useEffect(() => {
    getUserProfile(athleteId).then((p) => {
      setProfile(p)
      if (p) {
        setThresholdHr(p.thresholdHr != null ? String(p.thresholdHr) : '')
        setMaxHr(p.maxHr != null ? String(p.maxHr) : '')
        setRestingHr(p.restingHr != null ? String(p.restingHr) : '')
        setThresholdPace(p.thresholdPace ?? '')
        setFtp(p.ftp != null ? String(p.ftp) : '')
      }
      setLoading(false)
    })
  }, [athleteId])

  const handleSave = async () => {
    setSaving(true)
    try {
      await updateUserProfile(athleteId, {
        thresholdHr: thresholdHr ? parseInt(thresholdHr) : null,
        maxHr: maxHr ? parseInt(maxHr) : null,
        restingHr: restingHr ? parseInt(restingHr) : null,
        thresholdPace: thresholdPace || null,
        ftp: ftp ? parseInt(ftp) : null,
      })
      setProfile((prev) =>
        prev
          ? {
              ...prev,
              thresholdHr: thresholdHr ? parseInt(thresholdHr) : null,
              maxHr: maxHr ? parseInt(maxHr) : null,
              restingHr: restingHr ? parseInt(restingHr) : null,
              thresholdPace: thresholdPace || null,
              ftp: ftp ? parseInt(ftp) : null,
            }
          : prev
      )
      setEditing(false)
      setShowCalc(false)
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    if (profile) {
      setThresholdHr(profile.thresholdHr != null ? String(profile.thresholdHr) : '')
      setMaxHr(profile.maxHr != null ? String(profile.maxHr) : '')
      setRestingHr(profile.restingHr != null ? String(profile.restingHr) : '')
      setThresholdPace(profile.thresholdPace ?? '')
      setFtp(profile.ftp != null ? String(profile.ftp) : '')
    }
    setEditing(false)
    setShowCalc(false)
  }

  const applyTestResult = (r: TestResult) => {
    if (r.lthr) setThresholdHr(String(r.lthr))
    if (r.thresholdPace) setThresholdPace(r.thresholdPace)
  }

  if (loading) return null

  const lthrNum = parseInt(thresholdHr)
  const hasLthr = !isNaN(lthrNum) && lthrNum > 0

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-semibold text-white">ランニング設定</h3>
        {!editing ? (
          <button
            onClick={() => setEditing(true)}
            className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-700 hover:text-white"
          >
            <Pencil className="h-3.5 w-3.5" />
            編集
          </button>
        ) : (
          <div className="flex gap-2">
            <button
              onClick={handleCancel}
              className="flex items-center gap-1 rounded-lg border border-slate-700 px-3 py-1.5 text-xs text-slate-400 hover:text-white"
            >
              <X className="h-3.5 w-3.5" />
              キャンセル
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-500 disabled:opacity-60"
            >
              <Check className="h-3.5 w-3.5" />
              {saving ? '保存中...' : '保存'}
            </button>
          </div>
        )}
      </div>

      {editing ? (
        <>
          {/* 編集フォーム */}
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-400">閾値心拍 LTHR</label>
                <input
                  type="number"
                  value={thresholdHr}
                  onChange={(e) => setThresholdHr(e.target.value)}
                  placeholder="例: 163"
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-400">最大心拍</label>
                <input
                  type="number"
                  value={maxHr}
                  onChange={(e) => setMaxHr(e.target.value)}
                  placeholder="例: 182"
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-400">安静時心拍</label>
                <input
                  type="number"
                  value={restingHr}
                  onChange={(e) => setRestingHr(e.target.value)}
                  placeholder="例: 50"
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-400">閾値ペース（分:秒/km）</label>
                <input
                  type="text"
                  value={thresholdPace}
                  onChange={(e) => setThresholdPace(e.target.value)}
                  placeholder="例: 4:15"
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-400">FTP（パワー利用時のみ）</label>
                <input
                  type="number"
                  value={ftp}
                  onChange={(e) => setFtp(e.target.value)}
                  placeholder="例: 250"
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
                />
              </div>
            </div>
          </div>

          {/* ゾーンプレビュー */}
          {hasLthr && <ZoneBar lthr={lthrNum} />}

          {/* テスト計算アコーディオン */}
          <button
            onClick={() => setShowCalc((v) => !v)}
            className="mt-4 flex w-full items-center gap-2 text-sm font-medium text-purple-400 hover:text-purple-300"
          >
            {showCalc ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            テスト結果から閾値を計算する
          </button>
          {showCalc && <TestCalculator onApply={applyTestResult} />}
        </>
      ) : (
        <>
          {/* 表示モード */}
          {!profile?.thresholdHr && !profile?.thresholdPace ? (
            <p className="text-sm text-slate-500">まだ設定されていません</p>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {profile?.thresholdHr && (
                <StatItem label="閾値心拍 LTHR" value={`${profile.thresholdHr} bpm`} />
              )}
              {profile?.maxHr && (
                <StatItem label="最大心拍" value={`${profile.maxHr} bpm`} />
              )}
              {profile?.restingHr && (
                <StatItem label="安静時心拍" value={`${profile.restingHr} bpm`} />
              )}
              {profile?.thresholdPace && (
                <StatItem label="閾値ペース" value={`${profile.thresholdPace} /km`} />
              )}
              {profile?.ftp && (
                <StatItem label="FTP" value={`${profile.ftp} W`} />
              )}
            </div>
          )}
          {profile?.thresholdHr && <ZoneBar lthr={profile.thresholdHr} />}
        </>
      )}
    </div>
  )
}

function StatItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-slate-950 px-3 py-2">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-0.5 text-sm font-semibold text-white">{value}</p>
    </div>
  )
}
