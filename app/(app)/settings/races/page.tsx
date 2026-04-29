'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Plus, Trophy, Calendar, Trash2, Save } from 'lucide-react'
import { Timestamp } from 'firebase/firestore'
import { useAuth } from '@/components/providers/AuthProvider'
import { TopBar } from '@/components/layout/TopBar'
import { updateUserProfile } from '@/lib/firebase/firestore'
import type { TargetRace } from '@/types'

interface EditRace {
  raceName: string
  raceDate: string // YYYY-MM-DD
  distanceKm: string
}

export default function RacesPage() {
  const { user, profile } = useAuth()
  const [races, setRaces] = useState<TargetRace[]>([])
  const [editing, setEditing] = useState<EditRace>({
    raceName: '',
    raceDate: '',
    distanceKm: '',
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!profile) return
    setRaces(profile.targetRaces ?? [])
  }, [profile])

  const handleAdd = async () => {
    if (!user || !editing.raceName || !editing.raceDate) return
    const newRace: TargetRace = {
      raceName: editing.raceName,
      raceDate: Timestamp.fromDate(new Date(editing.raceDate)),
      distanceKm: editing.distanceKm ? parseFloat(editing.distanceKm) : 0,
    }
    const updated = [...races, newRace].sort((a, b) => {
      const da = (a.raceDate as any).toDate
        ? (a.raceDate as any).toDate().getTime()
        : 0
      const db = (b.raceDate as any).toDate
        ? (b.raceDate as any).toDate().getTime()
        : 0
      return da - db
    })
    setSaving(true)
    try {
      await updateUserProfile(user.uid, { targetRaces: updated })
      setRaces(updated)
      setEditing({ raceName: '', raceDate: '', distanceKm: '' })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (idx: number) => {
    if (!user) return
    if (!confirm('このレースを削除しますか？')) return
    const updated = races.filter((_, i) => i !== idx)
    await updateUserProfile(user.uid, { targetRaces: updated })
    setRaces(updated)
  }

  const formatDate = (race: TargetRace): string => {
    const d = (race.raceDate as any).toDate
      ? (race.raceDate as any).toDate()
      : new Date(race.raceDate as any)
    return d.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'short',
    })
  }

  const daysToRace = (race: TargetRace): number => {
    const d = (race.raceDate as any).toDate
      ? (race.raceDate as any).toDate()
      : new Date(race.raceDate as any)
    return Math.round((d.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
  }

  return (
    <>
      <TopBar title="ターゲットレース" />
      <div className="p-4 sm:p-6 max-w-3xl space-y-4">
        <Link
          href="/settings"
          className="inline-flex items-center gap-1 text-sm text-slate-400 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          設定に戻る
        </Link>

        {/* 説明 */}
        <div className="rounded-xl border border-amber-700/50 bg-amber-950/10 p-5">
          <div className="flex items-center gap-2 mb-2">
            <Trophy className="h-5 w-5 text-amber-400" />
            <h2 className="text-base font-semibold text-white">ターゲットレース管理</h2>
          </div>
          <p className="text-sm text-slate-300">
            登録したレースは選手のカレンダーで強調表示され、AIメニュー生成時にピーキング理論が自動適用されます。
          </p>
          <ul className="mt-2 text-xs text-slate-400 space-y-0.5">
            <li>🟢 <strong>ボリューム期</strong>（レース42日以上前）: ベース構築・有酸素能力向上</li>
            <li>🔵 <strong>ビルド期</strong>（14〜42日前）: レース特異的強度を上げる</li>
            <li>🟡 <strong>ピーク</strong>（8〜14日前）: 質の高い練習に絞る</li>
            <li>🟠 <strong>テーパー</strong>（1〜7日前）: 量を抑え疲労を抜く</li>
            <li>🔴 <strong>レースウィーク</strong>: ピークパフォーマンス</li>
            <li>💙 <strong>リカバリー</strong>（レース後14日）: 回復期</li>
          </ul>
        </div>

        {/* 既存レース一覧 */}
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
          <h3 className="mb-3 text-base font-semibold text-white">登録済みレース ({races.length})</h3>
          {races.length === 0 ? (
            <p className="py-4 text-center text-sm text-slate-500">
              レースがまだ登録されていません
            </p>
          ) : (
            <ul className="space-y-2">
              {races.map((race, idx) => {
                const days = daysToRace(race)
                const past = days < 0
                return (
                  <li
                    key={idx}
                    className={`flex items-center justify-between rounded-lg border px-4 py-3 ${
                      past
                        ? 'border-slate-700 bg-slate-950/50 opacity-60'
                        : 'border-amber-700/40 bg-amber-950/20'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <Trophy className="h-4 w-4 text-amber-400" />
                        <span className="text-sm font-semibold text-white">
                          {race.raceName}
                        </span>
                      </div>
                      <p className="mt-0.5 text-xs text-slate-400">
                        {formatDate(race)}
                        {race.distanceKm > 0 && ` ・ ${race.distanceKm}km`}
                      </p>
                      <p className="mt-0.5 text-xs">
                        {past ? (
                          <span className="text-slate-500">{Math.abs(days)}日前のレース</span>
                        ) : days === 0 ? (
                          <span className="text-red-400 font-bold">本日！</span>
                        ) : (
                          <span className="text-emerald-400 font-medium">あと{days}日</span>
                        )}
                      </p>
                    </div>
                    <button
                      onClick={() => handleDelete(idx)}
                      className="rounded p-1.5 text-slate-500 hover:bg-red-900/30 hover:text-red-400"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </div>

        {/* 新規追加 */}
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
          <h3 className="mb-3 flex items-center gap-2 text-base font-semibold text-white">
            <Plus className="h-4 w-4" />
            レースを追加
          </h3>
          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-300">レース名</label>
              <input
                type="text"
                value={editing.raceName}
                onChange={(e) =>
                  setEditing({ ...editing, raceName: e.target.value })
                }
                placeholder="例: UTMF 2026"
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-300">日付</label>
                <input
                  type="date"
                  value={editing.raceDate}
                  onChange={(e) =>
                    setEditing({ ...editing, raceDate: e.target.value })
                  }
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-300">距離(km)</label>
                <input
                  type="number"
                  step="0.1"
                  value={editing.distanceKm}
                  onChange={(e) =>
                    setEditing({ ...editing, distanceKm: e.target.value })
                  }
                  placeholder="100"
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
                />
              </div>
            </div>
            <button
              onClick={handleAdd}
              disabled={saving || !editing.raceName || !editing.raceDate}
              className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-60"
            >
              <Save className="h-4 w-4" />
              {saving ? '保存中...' : 'レースを追加'}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
