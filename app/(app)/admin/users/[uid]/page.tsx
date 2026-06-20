'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { getAuth } from 'firebase/auth'
import { ArrowLeft } from 'lucide-react'
import { useAuth } from '@/components/providers/AuthProvider'
import { TopBar } from '@/components/layout/TopBar'
import { calculateAge } from '@/lib/age'

interface DetailPayload {
  user: Record<string, any>
  athleteCache: any
  workouts: any[]
  wellness: any[]
  strengthAssignments: any[]
  motionAnalyses: any[]
  roster: any[]
  aiProfile: any
  invites: any[]
  chatThreads: any[]
  counts: Record<string, number>
}

function fmt(v: any): string {
  if (v == null) return '-'
  if (typeof v === 'number' && v > 1_000_000_000_000) {
    // millis とみなして日時表示
    return new Date(v).toLocaleString('ja-JP')
  }
  if (typeof v === 'object') return JSON.stringify(v)
  return String(v)
}

export default function AdminUserDetailPage() {
  const params = useParams()
  const uid = params.uid as string
  const { profile } = useAuth()
  const [data, setData] = useState<DetailPayload | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const load = async () => {
      try {
        const token = await getAuth().currentUser?.getIdToken()
        const res = await fetch(`/api/admin/users/${uid}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        const json = await res.json()
        if (!res.ok) throw new Error(json.error || 'エラー')
        setData(json)
      } catch (e: any) {
        setError(e.message)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [uid])

  if (!profile?.isAdmin) {
    return (
      <>
        <TopBar title="管理者" />
        <div className="p-4 sm:p-6"><p className="text-sm text-slate-400">権限がありません</p></div>
      </>
    )
  }

  return (
    <>
      <TopBar title={data?.user?.displayName ?? 'ユーザー詳細'} />
      <div className="p-4 sm:p-6 max-w-5xl space-y-4">
        <Link href="/admin" className="inline-flex items-center gap-1 text-sm text-slate-400 hover:text-white">
          <ArrowLeft className="h-4 w-4" />
          管理者ダッシュボード
        </Link>

        {error && (
          <p className="rounded-lg bg-red-900/40 border border-red-800 px-3 py-2 text-sm text-red-400">
            エラー: {error}
          </p>
        )}

        {loading || !data ? (
          <div className="h-40 animate-pulse rounded-xl bg-slate-800" />
        ) : (
          <>
            {/* プロフィール */}
            <Card title="プロフィール">
              {calculateAge(data.user.birthDate) != null && (
                <p className="text-sm text-slate-300">
                  年齢: <span className="font-bold text-white">{calculateAge(data.user.birthDate)}歳</span>
                </p>
              )}
              <KvTable obj={data.user} />
            </Card>

            {/* 集計 */}
            <Card title="データ件数">
              <div className="flex flex-wrap gap-3 text-sm">
                {Object.entries(data.counts).map(([k, v]) => (
                  <span key={k} className="rounded-lg bg-slate-950 px-3 py-1.5 text-slate-300">
                    {k}: <span className="font-bold text-white">{v}</span>
                  </span>
                ))}
              </div>
            </Card>

            {/* athletes キャッシュ */}
            {data.athleteCache && (
              <Card title="集計キャッシュ (athletes)">
                <KvTable obj={data.athleteCache} />
              </Card>
            )}

            {/* ワークアウト */}
            {data.workouts.length > 0 && (
              <Card title={`ワークアウト (${data.workouts.length})`}>
                <SimpleTable
                  headers={['日付', '種別', 'タイトル', '距離', '時間', 'その他指標']}
                  rows={data.workouts.slice(0, 100).map((w) => {
                    const c = w.completed
                    return [
                      w.date,
                      w.planned?.workoutType ?? c?.workoutType ?? '-',
                      w.planned?.title ?? c?.title ?? '-',
                      c?.distanceKm != null ? `${c.distanceKm}km` : '-',
                      c?.durationMin != null ? `${c.durationMin}分` : '-',
                      c?.metrics ? JSON.stringify(c.metrics) : c?.calories != null ? `${c.calories}kcal` : '-',
                    ]
                  })}
                />
              </Card>
            )}

            {/* ウェルネス */}
            {data.wellness.length > 0 && (
              <Card title={`ウェルネス (${data.wellness.length})`}>
                <SimpleTable
                  headers={['日付', '体重', '睡眠', '疲労', '筋肉痛', '安静時HR']}
                  rows={data.wellness.slice(0, 100).map((e) => [
                    e.date,
                    e.weight != null ? `${e.weight}kg` : '-',
                    e.sleepHours != null ? `${e.sleepHours}h` : '-',
                    e.fatigue ?? '-',
                    e.soreness ?? '-',
                    e.restingHr != null ? `${e.restingHr}` : '-',
                  ])}
                />
              </Card>
            )}

            {/* 筋トレ割当 */}
            {data.strengthAssignments.length > 0 && (
              <Card title={`筋トレ割当 (${data.strengthAssignments.length})`}>
                <SimpleTable
                  headers={['日付', 'メニュー', 'ステータス']}
                  rows={data.strengthAssignments.slice(0, 100).map((s) => [
                    s.date,
                    s.templateSnapshot?.name ?? '-',
                    s.status ?? '-',
                  ])}
                />
              </Card>
            )}

            {/* ロスター（コーチ） */}
            {data.roster.length > 0 && (
              <Card title={`担当選手 (${data.roster.length})`}>
                <SimpleTable
                  headers={['名前', 'メール', 'プリセット', 'アクティブ']}
                  rows={data.roster.map((a) => [
                    a.displayName ?? '-',
                    a.email ?? '-',
                    a.activityPreset ?? 'running',
                    a.isActive ? '○' : '×',
                  ])}
                />
              </Card>
            )}

            {/* AIプロフィール（コーチ） */}
            {data.aiProfile && (
              <Card title="AIプロフィール">
                <KvTable obj={data.aiProfile} />
              </Card>
            )}

            {/* 招待（コーチ） */}
            {data.invites.length > 0 && (
              <Card title={`招待 (${data.invites.length})`}>
                <SimpleTable
                  headers={['トークン', 'メール', 'ステータス', '受諾者']}
                  rows={data.invites.map((i) => [
                    String(i.token ?? i.id).slice(0, 12) + '…',
                    i.email ?? '-',
                    i.status ?? '-',
                    i.acceptedByUserId ?? '-',
                  ])}
                />
              </Card>
            )}

            {/* チャット */}
            {data.chatThreads.length > 0 && (
              <Card title={`チャットスレッド (${data.chatThreads.length})`}>
                <SimpleTable
                  headers={['コーチ', '選手', '最終メッセージ']}
                  rows={data.chatThreads.map((t) => [
                    t.coachName ?? '-',
                    t.athleteName ?? '-',
                    t.lastMessage?.text ?? '-',
                  ])}
                />
              </Card>
            )}

            {/* 生データ（全情報） */}
            <Card title="生データ (JSON)">
              <details>
                <summary className="cursor-pointer text-sm text-slate-400 hover:text-white">展開して全データを表示</summary>
                <pre className="mt-3 max-h-[28rem] overflow-auto rounded-lg bg-slate-950 p-3 text-[11px] text-slate-300">
                  {JSON.stringify(data, null, 2)}
                </pre>
              </details>
            </Card>
          </>
        )}
      </div>
    </>
  )
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900 p-5 space-y-3">
      <h3 className="text-sm font-semibold text-white">{title}</h3>
      {children}
    </div>
  )
}

function KvTable({ obj }: { obj: Record<string, any> }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <tbody>
          {Object.entries(obj).map(([k, v]) => (
            <tr key={k} className="border-b border-slate-800/50">
              <td className="py-1.5 pr-4 font-medium text-slate-300 align-top whitespace-nowrap">{k}</td>
              <td className="py-1.5 text-slate-400 break-all">{fmt(v)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function SimpleTable({ headers, rows }: { headers: string[]; rows: (string | number)[][] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-800 text-left text-xs text-slate-500">
            {headers.map((h) => (
              <th key={h} className="px-2 py-1.5 font-medium">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-b border-slate-800/50">
              {row.map((cell, j) => (
                <td key={j} className="px-2 py-1.5 text-slate-300 break-all">{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
