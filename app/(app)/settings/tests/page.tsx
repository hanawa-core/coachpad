'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, CheckCircle2, Clock, MapPin, Heart, Zap, ChevronDown, ChevronUp } from 'lucide-react'
import { useAuth } from '@/components/providers/AuthProvider'
import { TopBar } from '@/components/layout/TopBar'
import { updateUserProfile } from '@/lib/firebase/firestore'
import { TestCalculator } from '@/components/running/TestCalculator'
import type { TestResult } from '@/components/running/TestCalculator'

// ── テスト結果の蓄積 ───────────────────────────
interface Accumulated {
  lthr?: number
  thresholdPace?: string
  ftp?: number
}

// ── テスト定義 ────────────────────────────────
const TESTS = [
  {
    id: 'basic',
    icon: '📋',
    title: '基本測定（必須）',
    badge: '今すぐできる',
    badgeColor: 'bg-emerald-500/20 text-emerald-300',
    steps: [
      { icon: Heart, text: '安静時心拍：朝起きてすぐ、横になったまま1分間計測。3日間の平均を使う' },
      { icon: MapPin, text: '体重・身長：ランニングウェアで計測（靴なし）' },
    ],
    note: '安静時心拍はコンディション管理の基準になります。毎朝記録すると体調の変化に気づけます。',
    hasCalc: false,
  },
  {
    id: '20min',
    icon: '🏃',
    title: '20分全力走テスト（最重要）',
    badge: '強く推奨',
    badgeColor: 'bg-amber-500/20 text-amber-300',
    steps: [
      { icon: Clock, text: '場所：できるだけ平坦なロード（トラックが理想）' },
      { icon: Clock, text: 'ウォームアップ：10〜15分ジョグ + 流し2本' },
      { icon: Zap, text: '本番：20分間、最大限のペースで走る。ペースを一定に保つのがポイント（最初から突っ込みすぎない）' },
      { icon: Heart, text: '記録：ガーミン・AppleWatchなどで「平均心拍」と「平均ペース」を確認' },
    ],
    note: 'これ1本でLTHR（乳酸閾値心拍）と閾値ペースが自動計算できます。コーチがゾーン設定・メニュー作成に使う最も重要なデータです。',
    hasCalc: true,
    calcNote: '走り終わったら下の計算機に入力してください',
  },
  {
    id: '5km',
    icon: '⏱️',
    title: '5kmタイムトライアル（代替テスト）',
    badge: '20分走が難しい場合',
    badgeColor: 'bg-slate-500/20 text-slate-400',
    steps: [
      { icon: Clock, text: '5kmレースまたはタイムトライアルを全力で走る' },
      { icon: Clock, text: 'ゴールタイムを記録（例：21分30秒）' },
    ],
    note: '20分全力走の代替として使えます。Jack Daniels法でT-ペース（閾値ペース）を計算します。',
    hasCalc: true,
    calcNote: 'ゴールタイムを入力してください',
  },
  {
    id: 'ftp',
    icon: '⚡',
    title: 'FTPテスト（パワーメーター使用者のみ）',
    badge: 'オプション',
    badgeColor: 'bg-blue-500/20 text-blue-400',
    steps: [
      { icon: Zap, text: '20分間、最大平均パワーで走る（または自転車で） ' },
      { icon: Clock, text: '平均パワー（W）を記録' },
    ],
    note: 'パワーメーターがある選手向け。FTPはトレーニング強度の基準になります。',
    hasCalc: true,
    calcNote: '平均パワーを入力してください',
  },
]

export default function InitialTestsPage() {
  const { user, profile } = useAuth()
  const [expanded, setExpanded] = useState<string | null>('20min')
  const [accumulated, setAccumulated] = useState<Accumulated>({})
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  if (profile?.role !== 'athlete') {
    return (
      <>
        <TopBar title="初期テストガイド" />
        <div className="p-6">
          <p className="text-sm text-slate-400">この機能は選手のみ利用できます</p>
        </div>
      </>
    )
  }

  const hasAnyResult = accumulated.lthr || accumulated.thresholdPace || accumulated.ftp

  const applyResult = (r: TestResult) => {
    setAccumulated((prev) => ({
      ...prev,
      ...(r.lthr && { lthr: r.lthr }),
      ...(r.thresholdPace && { thresholdPace: r.thresholdPace }),
      ...(r.ftp && { ftp: r.ftp }),
    }))
    setSaved(false)
  }

  const handleSave = async () => {
    if (!user || !hasAnyResult) return
    setSaving(true)
    try {
      await updateUserProfile(user.uid, {
        ...(accumulated.lthr && { thresholdHr: accumulated.lthr }),
        ...(accumulated.thresholdPace && { thresholdPace: accumulated.thresholdPace }),
        ...(accumulated.ftp && { ftp: accumulated.ftp }),
      })
      setSaved(true)
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <TopBar title="初期テストガイド" />
      <div className="p-6 max-w-2xl space-y-4">
        <Link
          href="/settings"
          className="inline-flex items-center gap-1 text-sm text-slate-400 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          設定に戻る
        </Link>

        {/* イントロ */}
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
          <h2 className="text-base font-semibold text-white mb-1">初期テストについて</h2>
          <p className="text-sm text-slate-400 leading-relaxed">
            コーチがあなたに合ったメニューを作るために、まず現在の体力を数値で把握します。
            最初に<span className="text-white font-medium">「20分全力走」</span>を1本行うだけで、
            心拍ゾーンと閾値ペースが自動で設定されます。
          </p>
        </div>

        {/* テスト一覧 */}
        {TESTS.map((test) => (
          <div key={test.id} className="rounded-xl border border-slate-800 bg-slate-900 overflow-hidden">
            {/* ヘッダー */}
            <button
              onClick={() => setExpanded(expanded === test.id ? null : test.id)}
              className="w-full flex items-center justify-between px-5 py-4 hover:bg-slate-800/50 transition-colors text-left"
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">{test.icon}</span>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-sm font-semibold text-white">{test.title}</h3>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${test.badgeColor}`}>
                      {test.badge}
                    </span>
                  </div>
                  {/* 取得済み結果バッジ */}
                  {test.hasCalc && (
                    <div className="flex gap-2 mt-1 flex-wrap">
                      {accumulated.lthr && (test.id === '20min') && (
                        <span className="text-xs text-emerald-400">✓ LTHR {accumulated.lthr} bpm</span>
                      )}
                      {accumulated.thresholdPace && (test.id === '20min' || test.id === '5km') && (
                        <span className="text-xs text-emerald-400">✓ 閾値ペース {accumulated.thresholdPace}</span>
                      )}
                      {accumulated.ftp && test.id === 'ftp' && (
                        <span className="text-xs text-emerald-400">✓ FTP {accumulated.ftp}W</span>
                      )}
                    </div>
                  )}
                </div>
              </div>
              {expanded === test.id
                ? <ChevronUp className="h-4 w-4 text-slate-500 shrink-0" />
                : <ChevronDown className="h-4 w-4 text-slate-500 shrink-0" />
              }
            </button>

            {/* 展開内容 */}
            {expanded === test.id && (
              <div className="px-5 pb-5 border-t border-slate-800 pt-4 space-y-4">
                {/* 手順 */}
                <ol className="space-y-2">
                  {test.steps.map((step, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-700 text-xs font-bold text-slate-300 mt-0.5">
                        {i + 1}
                      </span>
                      <p className="text-sm text-slate-300 leading-relaxed">{step.text}</p>
                    </li>
                  ))}
                </ol>

                {/* 補足 */}
                <div className="rounded-lg bg-slate-800/60 px-4 py-3">
                  <p className="text-xs text-slate-400 leading-relaxed">💡 {test.note}</p>
                </div>

                {/* 計算機 */}
                {test.hasCalc && (
                  <div>
                    <p className="text-xs text-slate-500 mb-1">{test.calcNote}</p>
                    <TestCalculator onApply={applyResult} />
                  </div>
                )}
              </div>
            )}
          </div>
        ))}

        {/* 取得済み結果・保存エリア */}
        {hasAnyResult && (
          <div className="rounded-xl border border-emerald-700/40 bg-emerald-950/10 p-5 space-y-3">
            <h3 className="text-sm font-semibold text-emerald-300">取得した数値</h3>
            <div className="flex flex-wrap gap-4">
              {accumulated.lthr && (
                <div>
                  <p className="text-xs text-slate-400">閾値心拍 LTHR</p>
                  <p className="text-xl font-bold text-white">{accumulated.lthr} <span className="text-sm font-normal text-slate-400">bpm</span></p>
                </div>
              )}
              {accumulated.thresholdPace && (
                <div>
                  <p className="text-xs text-slate-400">閾値ペース</p>
                  <p className="text-xl font-bold text-white">{accumulated.thresholdPace} <span className="text-sm font-normal text-slate-400">分/km</span></p>
                </div>
              )}
              {accumulated.ftp && (
                <div>
                  <p className="text-xs text-slate-400">FTP</p>
                  <p className="text-xl font-bold text-white">{accumulated.ftp} <span className="text-sm font-normal text-slate-400">W</span></p>
                </div>
              )}
            </div>

            {saved ? (
              <div className="flex items-center gap-2 text-emerald-400">
                <CheckCircle2 className="h-4 w-4" />
                <span className="text-sm font-medium">プロフィールに保存しました</span>
              </div>
            ) : (
              <button
                onClick={handleSave}
                disabled={saving}
                className="w-full rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-60"
              >
                {saving ? '保存中...' : 'プロフィールに保存する'}
              </button>
            )}
          </div>
        )}

        {/* プロフィール編集へのリンク */}
        <p className="text-xs text-center text-slate-500">
          安静時心拍・体重などは{' '}
          <Link href="/settings/profile" className="text-slate-400 underline hover:text-white">
            プロフィール編集
          </Link>
          {' '}から入力できます
        </p>
      </div>
    </>
  )
}
