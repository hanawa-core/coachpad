'use client'

import { Suspense } from 'react'
import { useAuth } from '@/components/providers/AuthProvider'
import { TopBar } from '@/components/layout/TopBar'
import { StravaCard } from '@/components/strava/StravaCard'
import Link from 'next/link'
import { Users, Sparkles, User as UserIcon, Trophy, FlaskConical } from 'lucide-react'

export default function SettingsPage() {
  const { profile } = useAuth()

  return (
    <>
      <TopBar title="設定" />
      <div className="p-4 sm:p-6 space-y-4 max-w-3xl">
        {/* プロフィール */}
        <Link
          href="/settings/profile"
          className="block rounded-xl border border-slate-800 bg-slate-900 p-6 hover:bg-slate-900/80 transition-colors"
        >
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-slate-800 p-2.5 text-slate-300">
                <UserIcon className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-white">プロフィール</h2>
                <p className="mt-1 text-xs text-slate-500">
                  名前: <span className="text-white">{profile?.displayName}</span>
                  {' · '}
                  {profile?.email}
                  {' · '}
                  {profile?.role === 'coach' ? 'コーチ' : '選手'}
                </p>
              </div>
            </div>
            <span className="text-slate-500">編集 →</span>
          </div>
        </Link>

        {/* チーム管理（コーチのみ） */}
        {profile?.role === 'coach' && (
          <>
            <Link
              href="/settings/team"
              className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900 p-6 hover:bg-slate-900/80 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-emerald-500/10 p-2.5 text-emerald-400">
                  <Users className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-white">選手管理</h3>
                  <p className="text-xs text-slate-500">招待リンク発行・選手一覧</p>
                </div>
              </div>
              <span className="text-slate-500">→</span>
            </Link>

            <Link
              href="/settings/ai-profile"
              className="flex items-center justify-between rounded-xl border border-purple-700/50 bg-purple-950/20 p-6 hover:bg-purple-950/30 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-purple-500/20 p-2.5 text-purple-400">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-white">AIプロフィール</h3>
                  <p className="text-xs text-slate-400">あなたの理念・メソッドをAIに学習させる</p>
                </div>
              </div>
              <span className="text-slate-500">→</span>
            </Link>
          </>
        )}

        {/* 初期テストガイド（選手のみ） */}
        {profile?.role === 'athlete' && (
          <Link
            href="/settings/tests"
            className="flex items-center justify-between rounded-xl border border-purple-700/50 bg-purple-950/20 p-6 hover:bg-purple-950/30 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-purple-500/20 p-2.5 text-purple-400">
                <FlaskConical className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-white">初期テストガイド</h3>
                <p className="text-xs text-slate-400">
                  20分走・5kmTT などから LTHR・閾値ペース・FTP を自動計算
                </p>
              </div>
            </div>
            <span className="text-slate-500">→</span>
          </Link>
        )}

        {/* ターゲットレース（選手のみ） */}
        {profile?.role === 'athlete' && (
          <Link
            href="/settings/races"
            className="flex items-center justify-between rounded-xl border border-amber-700/50 bg-amber-950/10 p-6 hover:bg-amber-950/20 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-amber-500/20 p-2.5 text-amber-400">
                <Trophy className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-white">ターゲットレース</h3>
                <p className="text-xs text-slate-400">
                  目標レースを設定すると AI がピーキング理論で計画してくれます
                </p>
              </div>
            </div>
            <span className="text-slate-500">→</span>
          </Link>
        )}

        {/* Strava 連携（選手のみ） */}
        {profile?.role === 'athlete' && (
          <Suspense fallback={<div />}>
            <StravaCard />
          </Suspense>
        )}

        {/* 法務リンク */}
        <div className="pt-6 flex items-center justify-center gap-3 text-xs text-slate-500">
          <Link href="/terms" className="hover:text-slate-300 hover:underline">
            利用規約
          </Link>
          <span>·</span>
          <Link href="/privacy" className="hover:text-slate-300 hover:underline">
            プライバシーポリシー
          </Link>
        </div>
      </div>
    </>
  )
}
