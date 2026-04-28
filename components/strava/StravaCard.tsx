'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { doc, getDoc, deleteDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase/config'
import { useAuth } from '@/components/providers/AuthProvider'
import { Activity, Check, RefreshCw, AlertCircle, Link as LinkIcon, Unplug } from 'lucide-react'

interface StravaIntegration {
  stravaAthleteId: number
  athleteName: string
  connectedAt: any
  lastSyncAt: any | null
}

export function StravaCard() {
  const { user } = useAuth()
  const searchParams = useSearchParams()
  const [integration, setIntegration] = useState<StravaIntegration | null>(null)
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [syncResult, setSyncResult] = useState<string>('')

  // クエリパラメータからの結果表示
  const justConnected = searchParams.get('strava_connected') === '1'
  const stravaError = searchParams.get('strava_error')

  useEffect(() => {
    if (!user) return
    const load = async () => {
      const snap = await getDoc(doc(db, 'users', user.uid, 'integrations', 'strava'))
      if (snap.exists()) {
        setIntegration(snap.data() as StravaIntegration)
      }
      setLoading(false)
    }
    load()
  }, [user, justConnected])

  const handleConnect = () => {
    if (!user) return
    window.location.href = `/api/strava/connect?userId=${user.uid}`
  }

  const handleReconnect = handleConnect

  const handleDisconnect = async () => {
    if (!user) return
    if (!confirm('Stravaとの接続を解除します。よろしいですか？')) return
    await deleteDoc(doc(db, 'users', user.uid, 'integrations', 'strava'))
    setIntegration(null)
    setSyncResult('接続を解除しました')
  }

  const handleSync = async () => {
    if (!user) return
    setSyncing(true)
    setSyncResult('')
    try {
      const idToken = await user.getIdToken()
      const res = await fetch('/api/strava/sync', {
        method: 'POST',
        headers: { Authorization: `Bearer ${idToken}` },
      })
      const data = await res.json()
      if (res.ok) {
        setSyncResult(`${data.synced}件のアクティビティを同期しました`)
      } else {
        setSyncResult(`エラー: ${data.error}`)
      }
    } catch (e: any) {
      setSyncResult(`エラー: ${e.message}`)
    } finally {
      setSyncing(false)
    }
  }

  if (loading) {
    return (
      <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
        <div className="h-4 w-24 animate-pulse rounded bg-slate-800" />
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-orange-500/10 p-2.5 text-orange-500">
            <Activity className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-white">Strava 連携</h3>
            <p className="text-xs text-slate-500">
              ガーミン・スント・カロスのデータをStrava経由で自動取得
            </p>
          </div>
        </div>
        {integration && (
          <span className="flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-400">
            <Check className="h-3 w-3" />
            接続済
          </span>
        )}
      </div>

      {stravaError && (
        <div className="mt-4 flex items-center gap-2 rounded-lg bg-red-900/40 border border-red-800 px-3 py-2 text-sm text-red-400">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {stravaError}
        </div>
      )}

      {integration ? (
        <div className="mt-4 space-y-3">
          <dl className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <dt className="text-xs text-slate-500">Strava名</dt>
              <dd className="text-white">{integration.athleteName}</dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500">最終同期</dt>
              <dd className="text-white">
                {integration.lastSyncAt
                  ? formatDate(integration.lastSyncAt.toDate())
                  : '未同期'}
              </dd>
            </div>
          </dl>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleSync}
              disabled={syncing}
              className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-60"
            >
              <RefreshCw className={`h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
              {syncing ? '同期中...' : '過去30日を同期'}
            </button>
            <button
              onClick={handleReconnect}
              className="flex items-center gap-2 rounded-lg border border-orange-500 bg-transparent px-4 py-2 text-sm font-medium text-orange-400 hover:bg-orange-500/10"
            >
              <LinkIcon className="h-4 w-4" />
              再接続
            </button>
            <button
              onClick={handleDisconnect}
              className="flex items-center gap-2 rounded-lg border border-slate-700 bg-transparent px-4 py-2 text-sm font-medium text-slate-300 hover:bg-slate-800"
            >
              <Unplug className="h-4 w-4" />
              切断
            </button>
          </div>

          {syncResult && (
            <p className="text-sm text-slate-300">{syncResult}</p>
          )}

          <p className="text-xs text-slate-500">
            通常は新しいアクティビティが自動で同期されます。
          </p>
        </div>
      ) : (
        <button
          onClick={handleConnect}
          className="mt-4 flex items-center gap-2 rounded-lg bg-orange-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-orange-600"
        >
          <LinkIcon className="h-4 w-4" />
          Stravaに接続
        </button>
      )}
    </div>
  )
}

function formatDate(d: Date) {
  return d.toLocaleString('ja-JP', { dateStyle: 'short', timeStyle: 'short' })
}
