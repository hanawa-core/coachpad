import { MYASP } from '../constants'

export function CtaSection() {
  return (
    <section id="cta" className="py-24 sm:py-32 bg-slate-950">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        {/* 見出し */}
        <div className="text-center mb-16">
          <p className="text-xs font-semibold uppercase tracking-widest text-emerald-400 mb-3">
            Get Started
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            今、最初の一歩を踏み出そう。
          </h2>
          <p className="text-slate-400 text-sm sm:text-base">
            あなたのレース・体力・目標に合ったプランを、今すぐ選べます。
          </p>
        </div>

        {/* 2カード */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-16">
          {/* すぐに始めたい方 */}
          <div className="rounded-2xl border border-emerald-500/30 bg-emerald-950/20 p-8 flex flex-col">
            <div className="mb-6">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 mb-4">
                <svg className="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">すぐに始めたい方</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                ライト・スタンダード・プレミアムの3プランから選択。マイスピー決済で即時開始。
              </p>
            </div>
            <a
              href={MYASP.standard}
              className="mt-auto block w-full rounded-xl bg-emerald-600 hover:bg-emerald-500 transition-colors py-4 text-center text-base font-bold text-white"
            >
              プランを選んで申し込む
            </a>
          </div>

          {/* まず相談したい方 */}
          <div className="rounded-2xl border border-slate-700 bg-slate-900 p-8 flex flex-col">
            <div className="mb-6">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-slate-800 border border-slate-700 mb-4">
                <svg className="w-6 h-6 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">まず相談したい方</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                「自分にどのプランが合うか分からない」「故障があるけど大丈夫？」など、気になることをまずご相談。Zoomにて30分無料で対応します。
              </p>
            </div>
            <a
              href={MYASP.counseling}
              className="mt-auto block w-full rounded-xl border border-slate-600 hover:bg-slate-800 transition-colors py-4 text-center text-base font-semibold text-slate-300"
            >
              無料相談を予約する（30分）
            </a>
          </div>
        </div>

        {/* 最下部キャッチ */}
        <div className="text-center">
          <p className="text-2xl sm:text-3xl font-bold text-white mb-4">
            あなたの限界は、もっと先にある。
          </p>
          <p className="text-slate-500 text-xs">
            © {new Date().getFullYear()} 合同会社コアデザイン All rights reserved.
          </p>
        </div>
      </div>
    </section>
  )
}
