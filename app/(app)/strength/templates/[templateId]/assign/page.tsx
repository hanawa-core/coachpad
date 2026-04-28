'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { useAuth } from '@/components/providers/AuthProvider'
import { TopBar } from '@/components/layout/TopBar'
import {
  getStrengthTemplate,
  subscribeAthletes,
  createStrengthAssignment,
} from '@/lib/firebase/firestore'
import type { StrengthTemplate, AthleteCache } from '@/types'

export default function AssignTemplatePage() {
  const params = useParams()
  const router = useRouter()
  const id = params.templateId as string
  const { user } = useAuth()

  const [template, setTemplate] = useState<StrengthTemplate | null>(null)
  const [athletes, setAthletes] = useState<AthleteCache[]>([])
  const [selectedAthletes, setSelectedAthletes] = useState<string[]>([])
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    getStrengthTemplate(id).then(setTemplate)
  }, [id])

  useEffect(() => {
    if (!user) return
    const unsub = subscribeAthletes(user.uid, setAthletes)
    return unsub
  }, [user])

  const toggleAthlete = (uid: string) => {
    setSelectedAthletes((prev) =>
      prev.includes(uid) ? prev.filter((x) => x !== uid) : [...prev, uid]
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!template || !user) return
    setSubmitting(true)
    try {
      await Promise.all(
        selectedAthletes.map((athleteId) =>
          createStrengthAssignment({
            templateId: id,
            coachId: user.uid,
            athleteId,
            date,
            templateSnapshot: {
              name: template.name,
              exercises: template.exercises,
            },
            status: 'assigned',
            completionReport: null,
            coachFeedback: null,
          })
        )
      )
      router.replace(`/strength/templates/${id}`)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <TopBar title="割り当て" />
      <div className="p-6 max-w-2xl">
        <Link
          href={`/strength/templates/${id}`}
          className="inline-flex items-center gap-1 mb-4 text-sm text-slate-400 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          テンプレート詳細
        </Link>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
            <h2 className="text-base font-semibold text-white mb-3">
              {template?.name} を割り当て
            </h2>

            <div>
              <label className="mb-1 block text-xs font-medium text-slate-300">実施日</label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
              />
            </div>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
            <h3 className="text-sm font-semibold text-white mb-3">選手を選択</h3>
            <div className="space-y-2">
              {athletes.map((a) => (
                <label
                  key={a.id}
                  className="flex items-center gap-3 rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 cursor-pointer hover:bg-slate-900"
                >
                  <input
                    type="checkbox"
                    checked={selectedAthletes.includes(a.userId)}
                    onChange={() => toggleAthlete(a.userId)}
                    className="h-4 w-4 rounded border-slate-700 bg-slate-900 accent-emerald-500"
                  />
                  <span className="text-sm text-white">{a.displayName}</span>
                </label>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting || selectedAthletes.length === 0}
            className="w-full rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-60"
          >
            {submitting ? '割り当て中...' : `${selectedAthletes.length}名に割り当て`}
          </button>
        </form>
      </div>
    </>
  )
}
