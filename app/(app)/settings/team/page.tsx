'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, Copy, Check, Plus } from 'lucide-react'
import { useAuth } from '@/components/providers/AuthProvider'
import { TopBar } from '@/components/layout/TopBar'
import { createInvite, subscribeAthletes } from '@/lib/firebase/firestore'
import { PlanBadge } from '@/components/ui/PlanBadge'
import type { AthleteCache } from '@/types'

export default function TeamPage() {
  const { user, profile } = useAuth()
  const [athletes, setAthletes] = useState<AthleteCache[]>([])
  const [generating, setGenerating] = useState(false)
  const [inviteUrl, setInviteUrl] = useState('')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!user) return
    const unsub = subscribeAthletes(user.uid, setAthletes)
    return unsub
  }, [user])

  if (profile?.role !== 'coach') {
    return (
      <>
        <TopBar title="選手管理" />
        <div className="p-6">
          <p className="text-sm text-slate-400">この機能はコーチのみ利用できます</p>
        </div>
      </>
    )
  }

  const handleCreate = async () => {
    if (!user) return
    setGenerating(true)
    try {
      const token = await createInvite(user.uid)
      const baseUrl = window.location.origin
      setInviteUrl(`${baseUrl}/invite/${token}`)
    } finally {
      setGenerating(false)
    }
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(inviteUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <>
      <TopBar title="選手管理" />
      <div className="p-6 space-y-4 max-w-3xl">
        <Link
          href="/settings"
          className="inline-flex items-center gap-1 text-sm text-slate-400 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          設定に戻る
        </Link>

        {/* 招待リンク発行 */}
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
          <h2 className="mb-2 text-base font-semibold text-white">選手を招待</h2>
          <p className="mb-4 text-sm text-slate-400">
            招待リンクを生成して選手に共有してください。リンクの有効期限は7日です。
          </p>

          {!inviteUrl ? (
            <button
              onClick={handleCreate}
              disabled={generating}
              className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-60"
            >
              <Plus className="h-4 w-4" />
              {generating ? '生成中...' : '招待リンクを発行'}
            </button>
          ) : (
            <div className="space-y-3">
              <div className="flex gap-2">
                <input
                  readOnly
                  value={inviteUrl}
                  className="flex-1 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
                />
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1 rounded-lg bg-slate-700 px-3 py-2 text-sm text-white hover:bg-slate-600"
                >
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  {copied ? 'コピー済' : 'コピー'}
                </button>
              </div>
              <button
                onClick={() => setInviteUrl('')}
                className="text-xs text-slate-400 hover:text-white"
              >
                別のリンクを発行
              </button>
            </div>
          )}
        </div>

        {/* 選手一覧 */}
        <div className="rounded-xl border border-slate-800 bg-slate-900">
          <div className="border-b border-slate-800 px-6 py-4">
            <h2 className="text-base font-semibold text-white">選手一覧 ({athletes.length})</h2>
          </div>
          {athletes.length === 0 ? (
            <p className="px-6 py-8 text-center text-sm text-slate-500">
              まだ選手がいません
            </p>
          ) : (
            <ul className="divide-y divide-slate-800">
              {athletes.map((a) => (
                <li key={a.id} className="px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-white">{a.displayName}</p>
                        <PlanBadge plan={a.plan} />
                      </div>
                      <p className="text-xs text-slate-500">{a.email}</p>
                    </div>
                    <Link
                      href={`/athletes/${a.userId}`}
                      className="text-sm text-emerald-400 hover:text-emerald-300"
                    >
                      詳細 →
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </>
  )
}
