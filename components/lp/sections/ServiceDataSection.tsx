const METRICS = [
  { label: 'CTL', desc: '慢性トレーニング負荷（体力ベース）', color: 'text-emerald-400' },
  { label: 'ATL', desc: '急性トレーニング負荷（直近疲労）', color: 'text-amber-400' },
  { label: 'TSB', desc: 'トレーニングストレスバランス（ピーク指標）', color: 'text-sky-400' },
]

const WELLNESS = ['睡眠時間', '睡眠の質', '筋肉痛', '疲労度', '気分', 'ストレス', '安静時心拍', '体重']

export function ServiceDataSection() {
  return (
    <section id="service-data" className="py-24 sm:py-32 bg-slate-950">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="lg:grid lg:grid-cols-2 lg:gap-16 lg:items-center">
          {/* ビジュアルプレースホルダー（左） */}
          <div className="mb-12 lg:mb-0 order-2 lg:order-1">
            <div className="rounded-2xl bg-slate-800 border border-slate-700 aspect-[4/3] flex items-center justify-center">
              <div className="text-center">
                <div className="w-16 h-16 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto mb-3">
                  <svg className="w-8 h-8 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <p className="text-slate-500 text-xs">アプリスクリーンショット</p>
                <p className="text-slate-600 text-xs">（データ・グラフ画面）</p>
              </div>
            </div>
          </div>

          {/* テキスト（右） */}
          <div className="order-1 lg:order-2">
            <p className="text-xs font-semibold uppercase tracking-widest text-amber-400 mb-3">
              Service 02
            </p>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4 leading-tight">
              「感覚」を「数値」に。<br />状態の見える化が<br className="sm:hidden" />継続を支える。
            </h2>
            <p className="text-slate-400 text-sm sm:text-base leading-relaxed mb-8">
              フィットネス指標・体調・実績を毎日トラッキング。コーチが常にあなたの状態を把握し、プログラムに反映します。
            </p>

            {/* フィットネス指標 */}
            <div className="rounded-xl border border-slate-800 bg-slate-900 p-5 mb-5">
              <p className="text-white font-semibold text-sm mb-3">フィットネス指標の自動計算</p>
              <div className="space-y-2">
                {METRICS.map((m) => (
                  <div key={m.label} className="flex items-center gap-3">
                    <span className={`text-sm font-bold w-10 shrink-0 ${m.color}`}>{m.label}</span>
                    <span className="text-slate-400 text-xs">{m.desc}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* ウェルネス */}
            <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
              <p className="text-white font-semibold text-sm mb-3">毎朝1分の体調記録（Wellness）</p>
              <div className="flex flex-wrap gap-2">
                {WELLNESS.map((w) => (
                  <span key={w} className="rounded-full bg-slate-800 border border-slate-700 px-3 py-1 text-xs text-slate-400">
                    {w}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
