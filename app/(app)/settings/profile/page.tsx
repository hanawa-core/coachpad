'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Save, Check, User } from 'lucide-react'
import { useAuth } from '@/components/providers/AuthProvider'
import { TopBar } from '@/components/layout/TopBar'
import { updateUserProfile } from '@/lib/firebase/firestore'

export default function ProfileEditPage() {
  const { user, profile } = useAuth()

  const [displayName, setDisplayName] = useState('')
  const [sex, setSex] = useState<'male' | 'female' | 'other' | ''>('')
  const [birthDate, setBirthDate] = useState('')
  const [heightCm, setHeightCm] = useState('')
  const [weightKg, setWeightKg] = useState('')
  const [city, setCity] = useState('')
  const [country, setCountry] = useState('')
  const [bio, setBio] = useState('')

  // ランニング設定（選手向け）
  const [thresholdHr, setThresholdHr] = useState('')
  const [maxHr, setMaxHr] = useState('')
  const [restingHr, setRestingHr] = useState('')
  const [thresholdPace, setThresholdPace] = useState('')
  const [ftp, setFtp] = useState('')

  const [saving, setSaving] = useState(false)
  const [savedAt, setSavedAt] = useState<Date | null>(null)

  useEffect(() => {
    if (!profile) return
    setDisplayName(profile.displayName ?? '')
    setSex((profile.sex as any) ?? '')
    setBirthDate(profile.birthDate ?? '')
    setHeightCm(profile.heightCm?.toString() ?? '')
    setWeightKg(profile.weightKg?.toString() ?? '')
    setCity(profile.city ?? '')
    setCountry(profile.country ?? '')
    setBio(profile.bio ?? '')
    setThresholdHr(profile.thresholdHr?.toString() ?? '')
    setMaxHr(profile.maxHr?.toString() ?? '')
    setRestingHr(profile.restingHr?.toString() ?? '')
    setThresholdPace(profile.thresholdPace ?? '')
    setFtp(profile.ftp?.toString() ?? '')
  }, [profile])

  const handleSave = async () => {
    if (!user) return
    setSaving(true)
    try {
      await updateUserProfile(user.uid, {
        displayName,
        sex: sex || null,
        birthDate: birthDate || null,
        heightCm: heightCm ? parseFloat(heightCm) : null,
        weightKg: weightKg ? parseFloat(weightKg) : null,
        city: city || null,
        country: country || null,
        bio: bio || null,
        thresholdHr: thresholdHr ? parseInt(thresholdHr) : null,
        maxHr: maxHr ? parseInt(maxHr) : null,
        restingHr: restingHr ? parseInt(restingHr) : null,
        thresholdPace: thresholdPace || null,
        ftp: ftp ? parseInt(ftp) : null,
      })
      setSavedAt(new Date())
    } finally {
      setSaving(false)
    }
  }

  // 心拍ゾーンを LTHR から自動計算
  const hrZones = thresholdHr
    ? {
        z1: [0, Math.round(parseInt(thresholdHr) * 0.84)],
        z2: [
          Math.round(parseInt(thresholdHr) * 0.85),
          Math.round(parseInt(thresholdHr) * 0.89),
        ],
        z3: [
          Math.round(parseInt(thresholdHr) * 0.9),
          Math.round(parseInt(thresholdHr) * 0.94),
        ],
        z4: [
          Math.round(parseInt(thresholdHr) * 0.95),
          Math.round(parseInt(thresholdHr) * 0.99),
        ],
        z5: [
          Math.round(parseInt(thresholdHr) * 1.0),
          Math.round(parseInt(thresholdHr) * 1.02),
        ],
      }
    : null

  return (
    <>
      <TopBar title="プロフィール編集" />
      <div className="p-6 max-w-3xl space-y-4">
        <Link
          href="/settings"
          className="inline-flex items-center gap-1 text-sm text-slate-400 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          設定に戻る
        </Link>

        {/* 基本情報 */}
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-6 space-y-4">
          <div className="flex items-center gap-2">
            <User className="h-5 w-5 text-emerald-400" />
            <h2 className="text-base font-semibold text-white">基本情報</h2>
          </div>

          <Field label="名前">
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
            />
          </Field>

          <div className="grid grid-cols-3 gap-3">
            <Field label="性別">
              <select
                value={sex}
                onChange={(e) => setSex(e.target.value as any)}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
              >
                <option value="">未選択</option>
                <option value="male">男性</option>
                <option value="female">女性</option>
                <option value="other">その他</option>
              </select>
            </Field>
            <Field label="生年月日">
              <input
                type="date"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
              />
            </Field>
            <Field label="身長(cm)">
              <input
                type="number"
                step="0.1"
                value={heightCm}
                onChange={(e) => setHeightCm(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
              />
            </Field>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <Field label="体重(kg)">
              <input
                type="number"
                step="0.1"
                value={weightKg}
                onChange={(e) => setWeightKg(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
              />
            </Field>
            <Field label="居住地">
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="例: 東京都新宿区"
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
              />
            </Field>
            <Field label="国">
              <input
                type="text"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                placeholder="例: Japan"
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
              />
            </Field>
          </div>

          <Field label="自己紹介・備考">
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={3}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
            />
          </Field>
        </div>

        {/* ランニング設定（選手向け） */}
        {profile?.role === 'athlete' && (
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-6 space-y-4">
            <h2 className="text-base font-semibold text-white">ランニング設定</h2>
            <p className="text-xs text-slate-400">
              閾値心拍を入力すると、AIが自動で5ゾーンを計算してメニューに反映します
            </p>

            <div className="grid grid-cols-3 gap-3">
              <Field label="閾値心拍 LTHR">
                <input
                  type="number"
                  value={thresholdHr}
                  onChange={(e) => setThresholdHr(e.target.value)}
                  placeholder="163"
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
                />
              </Field>
              <Field label="最大心拍">
                <input
                  type="number"
                  value={maxHr}
                  onChange={(e) => setMaxHr(e.target.value)}
                  placeholder="182"
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
                />
              </Field>
              <Field label="安静時心拍">
                <input
                  type="number"
                  value={restingHr}
                  onChange={(e) => setRestingHr(e.target.value)}
                  placeholder="50"
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
                />
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Field label="閾値ペース 分:秒/km">
                <input
                  type="text"
                  value={thresholdPace}
                  onChange={(e) => setThresholdPace(e.target.value)}
                  placeholder="4:15"
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
                />
              </Field>
              <Field label="FTP（パワー利用時のみ）">
                <input
                  type="number"
                  value={ftp}
                  onChange={(e) => setFtp(e.target.value)}
                  placeholder="250"
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
                />
              </Field>
            </div>

            {/* 心拍ゾーン自動表示 */}
            {hrZones && (
              <div className="rounded-lg border border-slate-700 bg-slate-950 p-4">
                <p className="text-xs font-medium text-slate-300 mb-2">
                  自動計算された心拍ゾーン (% LTHR ベース)
                </p>
                <div className="space-y-1 text-xs">
                  <ZoneRow label="Z1 Recovery (0-84%)" range={`〜${hrZones.z1[1]} bpm`} color="bg-blue-500/20" />
                  <ZoneRow label="Z2 Aerobic (85-89%)" range={`${hrZones.z2[0]}-${hrZones.z2[1]}`} color="bg-emerald-500/20" />
                  <ZoneRow label="Z3 Tempo (90-94%)" range={`${hrZones.z3[0]}-${hrZones.z3[1]}`} color="bg-yellow-500/20" />
                  <ZoneRow label="Z4 Threshold (95-99%)" range={`${hrZones.z4[0]}-${hrZones.z4[1]}`} color="bg-orange-500/20" />
                  <ZoneRow label="Z5 VO2max (100-102%+)" range={`${hrZones.z5[0]}+`} color="bg-red-500/20" />
                </div>
              </div>
            )}
          </div>
        )}

        {/* 保存バー */}
        <div className="sticky bottom-4 rounded-xl border border-slate-800 bg-slate-900/95 backdrop-blur p-4">
          <div className="flex items-center justify-between">
            {savedAt ? (
              <span className="inline-flex items-center gap-1 text-xs text-emerald-400">
                <Check className="h-3 w-3" />
                {savedAt.toLocaleTimeString('ja-JP')} に保存
              </span>
            ) : (
              <span className="text-xs text-slate-500">変更を保存してください</span>
            )}
            <button
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-5 py-2 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-60"
            >
              <Save className="h-4 w-4" />
              {saving ? '保存中...' : '保存'}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-slate-300">{label}</label>
      {children}
    </div>
  )
}

function ZoneRow({
  label,
  range,
  color,
}: {
  label: string
  range: string
  color: string
}) {
  return (
    <div className={`flex items-center justify-between rounded px-2 py-1 ${color}`}>
      <span className="text-slate-200">{label}</span>
      <span className="font-mono text-slate-300">{range}</span>
    </div>
  )
}
