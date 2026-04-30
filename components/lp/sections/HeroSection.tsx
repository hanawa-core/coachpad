import Link from 'next/link'
import { Check } from 'lucide-react'
import { MYASP } from '../constants'

const BULLETS = [
  'JSPO認定アスレティックトレーナー・3,000人以上の指導実績',
  '100マイル完走者が自ら設計した専用プラットフォーム「CoachPad」',
  'Strava連携で記録は自動取得、入力作業はほぼゼロ',
  '動画を送れば、コーチが直接フォームに「赤ペン」でフィードバック',
]

export function HeroSection() {
  return (
    <section
      id="hero"
      className="relative min-h-screen flex items-center justify-center overflow-hidden bg-slate-950"
    >
      {/* 背景グラデーション */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950/40 pointer-events-none" />
      {/* グロー */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 mx-auto max-w-4xl px-4 sm:px-6 py-28 sm:py-36 text-center">
        {/* バッジ */}
        <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-1.5 text-xs font-medium text-emerald-400 mb-8">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          ランナー専用オンラインコーチング
        </div>

        {/* メインコピー */}
        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight tracking-tight mb-6">
          3,000人以上のランナーを<br className="hidden sm:block" />
          指導したトレーナーが、<br />
          <span className="text-emerald-400">あなただけのために</span>設計する。
        </h1>

        <p className="text-lg sm:text-xl font-semibold text-slate-300 mb-4">
          ランナー専用、フルカスタムオンラインコーチング。
        </p>

        <p className="mx-auto max-w-2xl text-sm sm:text-base text-slate-400 leading-relaxed mb-10">
          既製のメニューも、汎用的なテンプレートも使いません。あなたの目標レース・現在の体力・コンディション・故障歴をもとに、塙翔太が一人ひとりに合わせて毎週プログラムを設計します。
        </p>

        {/* CTAボタン */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
          <a
            href={MYASP.counseling}
            className="w-full sm:w-auto inline-flex items-center justify-center rounded-xl bg-emerald-600 hover:bg-emerald-500 transition-colors px-8 py-4 text-base font-bold text-white shadow-lg shadow-emerald-500/20"
          >
            無料相談を予約する（30分）
          </a>
          <a
            href="#pricing"
            className="w-full sm:w-auto inline-flex items-center justify-center rounded-xl border border-slate-600 hover:bg-slate-800 transition-colors px-8 py-4 text-base font-semibold text-slate-300"
          >
            プランを今すぐ見る
          </a>
        </div>

        {/* 4点サブテキスト */}
        <ul className="inline-flex flex-col items-start gap-3 text-sm text-slate-400">
          {BULLETS.map((b) => (
            <li key={b} className="flex items-start gap-2">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
              <span>{b}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* 下スクロールインジケーター */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 text-slate-600">
        <span className="text-xs tracking-widest uppercase">Scroll</span>
        <div className="w-px h-8 bg-gradient-to-b from-slate-600 to-transparent" />
      </div>
    </section>
  )
}
