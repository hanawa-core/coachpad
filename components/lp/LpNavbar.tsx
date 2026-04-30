'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Menu, X } from 'lucide-react'
import { MYASP } from './constants'

const NAV_LINKS = [
  { label: 'サービス', href: '#method' },
  { label: 'なぜCoachPad', href: '#why' },
  { label: '料金', href: '#pricing' },
  { label: 'コーチ紹介', href: '#profile' },
  { label: 'FAQ', href: '#faq' },
]

export function LpNavbar() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 80)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? 'bg-slate-950/95 backdrop-blur-md border-b border-slate-800/60 shadow-lg' : 'bg-transparent'
      }`}
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* ロゴ */}
          <a href="#hero" className="flex items-center gap-2.5">
            <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-slate-900 border border-slate-800">
              <svg width="18" height="18" viewBox="0 0 100 100" fill="none">
                <line x1="12" y1="30" x2="88" y2="30" stroke="#1E293B" strokeWidth="3" />
                <line x1="12" y1="45" x2="88" y2="45" stroke="#1E293B" strokeWidth="3" />
                <line x1="12" y1="60" x2="88" y2="60" stroke="#1E293B" strokeWidth="3" />
                <line x1="12" y1="75" x2="88" y2="75" stroke="#1E293B" strokeWidth="3" />
                <line x1="12" y1="25" x2="12" y2="80" stroke="#1E293B" strokeWidth="3" />
                <line x1="30" y1="25" x2="30" y2="80" stroke="#1E293B" strokeWidth="3" />
                <line x1="48" y1="25" x2="48" y2="80" stroke="#1E293B" strokeWidth="3" />
                <line x1="66" y1="25" x2="66" y2="80" stroke="#1E293B" strokeWidth="3" />
                <line x1="84" y1="25" x2="84" y2="80" stroke="#1E293B" strokeWidth="3" />
                <polyline points="12,52 22,52 25,52 27,30 29,52 31,68 35,52 44,52 54,52 58,52 62,26 64,52 66,62 70,52 80,52 88,52"
                  stroke="#10B981" strokeWidth="6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="62" cy="26" r="7" fill="#FBBF24" />
                <circle cx="88" cy="52" r="5" fill="#10B981" />
              </svg>
            </div>
            <span className="text-white font-bold text-base">CoachPad</span>
          </a>

          {/* デスクトップナビ */}
          <nav className="hidden md:flex items-center gap-6">
            {NAV_LINKS.map((l) => (
              <a
                key={l.href}
                href={l.href}
                className="text-sm text-slate-400 hover:text-white transition-colors"
              >
                {l.label}
              </a>
            ))}
          </nav>

          {/* 右：CTAボタン */}
          <div className="hidden md:flex items-center gap-3">
            <a
              href={MYASP.counseling}
              className="text-sm text-slate-400 hover:text-white transition-colors"
            >
              無料相談
            </a>
            <a
              href={MYASP.standard}
              className="rounded-lg bg-emerald-600 hover:bg-emerald-500 transition-colors px-4 py-2 text-sm font-bold text-white"
            >
              申し込む
            </a>
          </div>

          {/* モバイルハンバーガー */}
          <button
            className="md:hidden p-2 text-slate-400 hover:text-white"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="メニュー"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* モバイルメニュー */}
      {mobileOpen && (
        <div className="md:hidden border-t border-slate-800 bg-slate-950/98 backdrop-blur-md px-4 py-4">
          <nav className="space-y-1">
            {NAV_LINKS.map((l) => (
              <a
                key={l.href}
                href={l.href}
                onClick={() => setMobileOpen(false)}
                className="block rounded-lg px-4 py-3 text-sm text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
              >
                {l.label}
              </a>
            ))}
            <div className="pt-3 border-t border-slate-800 space-y-2">
              <a
                href={MYASP.counseling}
                onClick={() => setMobileOpen(false)}
                className="block rounded-lg border border-slate-700 px-4 py-3 text-center text-sm font-semibold text-slate-300 hover:bg-slate-800"
              >
                無料相談（30分）
              </a>
              <a
                href={MYASP.standard}
                onClick={() => setMobileOpen(false)}
                className="block rounded-lg bg-emerald-600 hover:bg-emerald-500 px-4 py-3 text-center text-sm font-bold text-white"
              >
                申し込む
              </a>
            </div>
          </nav>
        </div>
      )}
    </header>
  )
}
