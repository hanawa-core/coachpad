'use client'

import { useEffect, useState } from 'react'
import { doc, onSnapshot } from 'firebase/firestore'
import { Bot, RefreshCw, AlertTriangle, CheckCircle, Info, ChevronRight } from 'lucide-react'
import { useAuth } from '@/components/providers/AuthProvider'
import { db } from '@/lib/firebase/config'
import { clsx } from 'clsx'
import type { AthleteAiAnalysis, TeamAiAnalysis } from '@/types'

interface Props {
  coachId: string
}

export function AiTeamAnalysis({ coachId }: Props) {
  const { user } = useAuth()
  const [analysis, setAnalysis] = useState<TeamAiAnalysis | null>(null)
  const [loading, setLoading] = useState(true)
  const [running, setRunning] = useState(false)
  const [isStale, setIsStale] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Firestoreをリアルタイム監視
  useEffect(() => {
    if (!coachId) return
    const ref = doc(db, 'aiTeamAnalysis', coachId)
    const unsub = onSnapshot(ref, (snap) => {
      setLoading(false)
      if (!snap.exists()) {
        setAnalysis(null)
        return
      }
      const data = snap.data() as TeamAiAnalysis
      setAnalysis(data)
      // 6時間以上前なら stale
      const generatedAt = (data.generatedAt as any)?.toDate?.() ?? null
      if (generatedAt) {
        const hoursSince = (Date.now() - generatedAt.getTime()) / (1000 * 60 * 60)
        setIsStale(hoursSince > 6)
      }
    })
    return unsub
  }, [coachId])

  async function runAnalysis() {
    if (!user || running) return
    setRunning(true)
    setError(null)
    try {
      const token = await user.getIdToken()
      const res = await fetch('/api/ai/analyze-team', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ coachId }),
      })
      if (!res.ok) {
        const data = await res.json()
        setError(data.error ?? '分析に失敗しました')
      }
      // 成功時はonSnapshotが自動でUIを更新
    } catch (e: any) {
      setError(e.message ?? '分析に失敗しました')
    } finally {
      setRunning(false)
    }
  }

  // ローカル時刻のフォーマット
  function formatGeneratedAt(analysis: TeamAiAnalysis): string {
    const ts = (analysis.generatedAt as any)?.toDate?.()
    if (!ts) return ''
    const minutes = Math.floor((Date.now() - ts.getTime()) / 60000)
    if (minutes < 1) return 'たった今'
    if (minutes < 60) return `${minutes}分前`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}時間前`
    return `${Math.floor(hours / 24)}日前`
  }

  // danger → warning → good の順に並び替え
  function sortedAthletes(athletes: AthleteAiAnalysis[]): AthleteAiAnalysis[] {
    const order = { danger: 0, warning: 1, good: 2 }
    return [...athletes].sort((a, b) => order[a.alertLevel] - order[b.alertLevel])
  }

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900">
      {/* ヘッダー */}
      <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4">
        <div className="flex items-center gap-2">
          <Bot className="h-4 w-4 text-emerald-400" />
          <h2 className="text-base font-semibold text-white">AIチーム分析</h2>
          {analysis && (
            <span
              className={clsx(
                'ml-1 text-xs',
                isStale ? 'text-amber-400' : 'text-slate-500'
              )}
            >
              {isStale ? '⚠ ' : ''}最終更新: {formatGeneratedAt(analysis)}
            </span>
          )}
        </div>
        <button
          onClick={runAnalysis}
          disabled={running}
          className={clsx(
            'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
            isStale || !analysis
              ? 'bg-emerald-600 text-white hover:bg-emerald-500'
              : 'bg-slate-800 text-slate-300 hover:bg-slate-700',
            running && 'cursor-not-allowed opacity-60'
          )}
        >
          <RefreshCw className={clsx('h-3.5 w-3.5', running && 'animate-spin')} />
          {running ? '分析中...' : analysis ? '更新' : '分析を実行'}
        </button>
      </div>

      {/* コンテンツ */}
      <div className="px-6 py-4">
        {/* エラー */}
        {error && (
          <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}

        {/* ローディング */}
        {loading && (
          <div className="flex items-center justify-center py-8">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
          </div>
        )}

        {/* 未分析 */}
        {!loading && !analysis && !running && (
          <div className="py-8 text-center">
            <Bot className="mx-auto mb-3 h-8 w-8 text-slate-600" />
            <p className="text-sm text-slate-500">
              まだ分析がありません
            </p>
            <p className="mt-1 text-xs text-slate-600">
              「分析を実行」を押すと、全選手の直近データをAIが分析します
            </p>
          </div>
        )}

        {/* 分析実行中（初回） */}
        {running && !analysis && (
          <div className="flex flex-col items-center justify-center gap-3 py-8">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
            <p className="text-sm text-slate-400">全選手のデータを分析中...</p>
          </div>
        )}

        {/* 分析結果 */}
        {!loading && analysis && analysis.athletes.length > 0 && (
          <div className="space-y-3">
            {sortedAthletes(analysis.athletes).map((a) => (
              <AthleteCard key={a.athleteId} athlete={a} />
            ))}
          </div>
        )}

        {!loading && analysis && analysis.athletes.length === 0 && (
          <p className="py-6 text-center text-sm text-slate-500">分析結果がありません</p>
        )}
      </div>
    </div>
  )
}

function AthleteCard({ athlete }: { athlete: AthleteAiAnalysis }) {
  const [expanded, setExpanded] = useState(athlete.alertLevel !== 'good')

  const config = {
    danger: {
      border: 'border-red-500/40',
      bg: 'bg-red-500/10',
      badge: 'bg-red-500/20 text-red-400 border border-red-500/30',
      icon: AlertTriangle,
      iconColor: 'text-red-400',
      label: '要注意',
    },
    warning: {
      border: 'border-amber-500/40',
      bg: 'bg-amber-500/5',
      badge: 'bg-amber-500/20 text-amber-400 border border-amber-500/30',
      icon: Info,
      iconColor: 'text-amber-400',
      label: '注意',
    },
    good: {
      border: 'border-slate-700',
      bg: 'bg-slate-800/30',
      badge: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
      icon: CheckCircle,
      iconColor: 'text-emerald-400',
      label: '良好',
    },
  }[athlete.alertLevel]

  const Icon = config.icon

  return (
    <div className={clsx('rounded-lg border p-4 transition-colors', config.border, config.bg)}>
      {/* 選手名 + バッジ + トグル */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center justify-between text-left"
      >
        <div className="flex items-center gap-2.5">
          <Icon className={clsx('h-4 w-4 shrink-0', config.iconColor)} />
          <span className="text-sm font-medium text-white">{athlete.name}</span>
          <span className={clsx('rounded-full px-2 py-0.5 text-xs font-medium', config.badge)}>
            {config.label}
          </span>
        </div>
        <ChevronRight
          className={clsx(
            'h-4 w-4 text-slate-500 transition-transform',
            expanded && 'rotate-90'
          )}
        />
      </button>

      {/* サマリー */}
      <p className="mt-2 text-xs text-slate-400">{athlete.summary}</p>

      {/* アクション（展開時） */}
      {expanded && athlete.actions.length > 0 && (
        <ul className="mt-3 space-y-1.5">
          {athlete.actions.map((action, i) => (
            <li key={i} className="flex items-start gap-2 text-xs text-slate-300">
              <span className="mt-0.5 text-emerald-500">→</span>
              <span>{action}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
