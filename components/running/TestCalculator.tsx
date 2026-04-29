'use client'

import { useState } from 'react'
import { FlaskConical } from 'lucide-react'

// ── Pace helpers ──────────────────────────────────
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

// ── Test calc logic ───────────────────────────────
export type TestResult = { lthr?: number; thresholdPace?: string; ftp?: number; note?: string }
type TestTab = '20min' | '5km' | 'yasso' | 'ftp'

function calc20min(avgHr: string, avgPace: string): TestResult {
  const hr = parseInt(avgHr)
  const paceSec = paceToSec(avgPace)
  const result: TestResult = {}
  if (hr > 0) result.lthr = Math.round(hr * 0.95)
  if (paceSec) result.thresholdPace = secToPace(paceSec + 5)
  result.note = '20分全力走の平均心拍 × 0.95 = LTHR、平均ペース +5秒/km = 閾値ペース'
  return result
}

function calc5km(finishTime: string): TestResult {
  const m = finishTime.match(/^(\d+):([0-5]\d)$/)
  if (!m) return {}
  const totalSec = parseInt(m[1]) * 60 + parseInt(m[2])
  const tPaceSec = Math.round((totalSec / 5) * 1.08)
  return { thresholdPace: secToPace(tPaceSec), note: '5kmペース × 1.08 ≈ 閾値ペース（Jack Daniels法）' }
}

function calcYasso(split800: string): TestResult {
  const m = split800.match(/^(\d+):([0-5]\d)$/)
  if (!m) return {}
  const marathonSec = parseInt(m[1]) * 3600 + parseInt(m[2]) * 60
  const tPaceSec = Math.round((marathonSec / 42.195) * 0.93)
  const mH = Math.floor(marathonSec / 3600)
  const mM = Math.floor((marathonSec % 3600) / 60)
  return { thresholdPace: secToPace(tPaceSec), note: `予測マラソン: ${mH}時間${mM}分 → 閾値ペース（マラソンペース × 0.93）` }
}

function calcFtp(method: 'ftp20' | 'ftp8' | 'ramp', power: string): TestResult {
  const w = parseInt(power)
  if (!w || w <= 0) return {}
  let ftp: number
  let note: string
  if (method === 'ftp20') {
    ftp = Math.round(w * 0.95)
    note = '20分平均パワー × 0.95 = FTP（最も一般的な計算法）'
  } else if (method === 'ftp8') {
    ftp = Math.round(w * 0.90)
    note = '8分平均パワー × 0.90 = FTP'
  } else {
    ftp = Math.round(w * 0.75)
    note = 'ランプテスト最大1分パワー × 0.75 = FTP'
  }
  return { ftp, note }
}

// ── Component ─────────────────────────────────────
interface Props {
  onApply: (r: TestResult) => void
}

export function TestCalculator({ onApply }: Props) {
  const [tab, setTab] = useState<TestTab>('20min')
  const [avgHr, setAvgHr] = useState('')
  const [avgPace, setAvgPace] = useState('')
  const [time5km, setTime5km] = useState('')
  const [yasso, setYasso] = useState('')
  const [ftpMethod, setFtpMethod] = useState<'ftp20' | 'ftp8' | 'ramp'>('ftp20')
  const [ftpPower, setFtpPower] = useState('')
  const [result, setResult] = useState<TestResult | null>(null)

  const run = () => {
    if (tab === '20min') setResult(calc20min(avgHr, avgPace))
    if (tab === '5km')   setResult(calc5km(time5km))
    if (tab === 'yasso') setResult(calcYasso(yasso))
    if (tab === 'ftp')   setResult(calcFtp(ftpMethod, ftpPower))
  }

  const TABS: { id: TestTab; label: string }[] = [
    { id: '20min', label: '20分全力走' },
    { id: '5km',   label: '5kmレース' },
    { id: 'yasso', label: 'ヤッソ800' },
    { id: 'ftp',   label: 'FTP' },
  ]

  const FTP_METHODS: { id: 'ftp20' | 'ftp8' | 'ramp'; label: string; placeholder: string; desc: string }[] = [
    { id: 'ftp20', label: '20分テスト', placeholder: '例: 280', desc: '20分間の最大平均パワー（W）' },
    { id: 'ftp8',  label: '8分テスト',  placeholder: '例: 310', desc: '8分間の最大平均パワー（W）' },
    { id: 'ramp',  label: 'ランプテスト', placeholder: '例: 380', desc: '最大1分間のピークパワー（W）' },
  ]

  const currentFtpMethod = FTP_METHODS.find((m) => m.id === ftpMethod)!

  return (
    <div className="mt-4 rounded-xl border border-purple-800/50 bg-purple-950/20 p-4">
      <div className="flex items-center gap-2 mb-3">
        <FlaskConical className="h-4 w-4 text-purple-400" />
        <p className="text-sm font-semibold text-purple-300">テストから閾値を自動計算</p>
      </div>

      {/* タブ */}
      <div className="flex flex-wrap gap-1 mb-4">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => { setTab(t.id); setResult(null) }}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              tab === t.id ? 'bg-purple-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* 20分全力走 */}
      {tab === '20min' && (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-xs text-slate-400">平均心拍（bpm）</label>
            <input type="number" value={avgHr} onChange={(e) => setAvgHr(e.target.value)}
              placeholder="例: 168"
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white" />
          </div>
          <div>
            <label className="mb-1 block text-xs text-slate-400">平均ペース（分:秒/km）</label>
            <input type="text" value={avgPace} onChange={(e) => setAvgPace(e.target.value)}
              placeholder="例: 4:15"
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white" />
          </div>
        </div>
      )}

      {/* 5km */}
      {tab === '5km' && (
        <div className="max-w-xs">
          <label className="mb-1 block text-xs text-slate-400">5kmゴールタイム（分:秒）</label>
          <input type="text" value={time5km} onChange={(e) => setTime5km(e.target.value)}
            placeholder="例: 21:30"
            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white" />
          <p className="mt-1 text-xs text-slate-500">5kmレースまたはタイムトライアルの結果</p>
        </div>
      )}

      {/* ヤッソ800 */}
      {tab === 'yasso' && (
        <div className="max-w-xs">
          <label className="mb-1 block text-xs text-slate-400">800m平均スプリット（分:秒）</label>
          <input type="text" value={yasso} onChange={(e) => setYasso(e.target.value)}
            placeholder="例: 3:45"
            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white" />
          <p className="mt-1 text-xs text-slate-500">10本の800mインターバル平均スプリット</p>
        </div>
      )}

      {/* FTP */}
      {tab === 'ftp' && (
        <div className="space-y-3">
          {/* テスト方法選択 */}
          <div className="flex gap-1">
            {FTP_METHODS.map((m) => (
              <button
                key={m.id}
                onClick={() => { setFtpMethod(m.id); setResult(null) }}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                  ftpMethod === m.id ? 'bg-slate-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
          <div className="max-w-xs">
            <label className="mb-1 block text-xs text-slate-400">{currentFtpMethod.desc}</label>
            <input type="number" value={ftpPower} onChange={(e) => setFtpPower(e.target.value)}
              placeholder={currentFtpMethod.placeholder}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white" />
          </div>
          <p className="text-xs text-slate-500">
            {ftpMethod === 'ftp20' && '× 0.95 = FTP'}
            {ftpMethod === 'ftp8'  && '× 0.90 = FTP'}
            {ftpMethod === 'ramp'  && '× 0.75 = FTP'}
          </p>
        </div>
      )}

      <button onClick={run}
        className="mt-3 rounded-lg bg-purple-700 px-4 py-2 text-sm font-medium text-white hover:bg-purple-600">
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
            {result.ftp && (
              <div>
                <p className="text-xs text-slate-400">FTP</p>
                <p className="text-lg font-bold text-white">{result.ftp} <span className="text-sm font-normal text-slate-400">W</span></p>
              </div>
            )}
          </div>
          {result.note && <p className="text-xs text-slate-500">{result.note}</p>}
          <button onClick={() => onApply(result)}
            className="w-full rounded-lg bg-emerald-700 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-600">
            この値をフォームに適用
          </button>
        </div>
      )}
    </div>
  )
}
