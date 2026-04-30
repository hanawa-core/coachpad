'use client'

import { useEffect, useState } from 'react'
import { MYASP } from './constants'

export function LpStickyCta() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 400)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <div
      className={`fixed bottom-6 right-4 sm:right-6 z-40 transition-all duration-300 ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
      }`}
    >
      <a
        href={MYASP.standard}
        className="flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 transition-colors px-5 py-3.5 text-sm font-bold text-white shadow-xl shadow-emerald-500/20"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
        今すぐ申し込む
      </a>
    </div>
  )
}
