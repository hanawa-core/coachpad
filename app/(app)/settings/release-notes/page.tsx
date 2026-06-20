'use client'

import Link from 'next/link'
import { ArrowLeft, Sparkles } from 'lucide-react'
import { TopBar } from '@/components/layout/TopBar'
import { RELEASE_NOTES } from '@/lib/release-notes'

export default function ReleaseNotesPage() {
  return (
    <>
      <TopBar title="リリースノート" />
      <div className="p-4 sm:p-6 max-w-2xl space-y-4">
        <Link
          href="/settings"
          className="inline-flex items-center gap-1 text-sm text-slate-400 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          設定に戻る
        </Link>

        <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-emerald-400" />
            <h2 className="text-base font-semibold text-white">アップデート履歴</h2>
          </div>
          <p className="mt-1 text-xs text-slate-400">アプリの主なアップデート内容をお知らせします。</p>
        </div>

        {RELEASE_NOTES.map((r) => (
          <div key={r.version} className="rounded-xl border border-slate-800 bg-slate-900 p-5">
            <div className="mb-3 flex items-center gap-2">
              <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-300">
                {r.version}
              </span>
              <span className="text-xs text-slate-500">{r.date}</span>
            </div>
            <ul className="space-y-2">
              {r.items.map((item, i) => (
                <li key={i} className="flex gap-2 text-sm text-slate-300 leading-relaxed">
                  <span className="mt-1 shrink-0 text-emerald-400">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </>
  )
}
