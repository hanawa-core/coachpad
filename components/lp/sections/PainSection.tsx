const PAINS = [
  {
    title: '「自己流で練習しているが、本当にこれでいいか不安」',
    desc: 'YouTube・SNSの情報を寄せ集めているが、自分に最適化されているか分からない。',
  },
  {
    title: '「練習しているのに、レースで結果が出ない」',
    desc: '走行距離は積めているが、ピーキングがズレてレース当日にコンディションが合わない。',
  },
  {
    title: '「故障を繰り返している」',
    desc: '同じ箇所の痛み・違和感が再発し、練習を継続できない。根本原因が分からない。',
  },
  {
    title: '「自分のコンディションが数値で見えない」',
    desc: '疲労が溜まっているのか、ピーク調整が効いているのか、客観的に判断できない。',
  },
  {
    title: '「コーチが欲しいが、対面には通えない」',
    desc: '地方在住・多忙・コスト面で対面コーチングが現実的でない。でも独学には限界がある。',
  },
  {
    title: '「目標レースへの逆算プランが組めない」',
    desc: '漠然と練習しているだけで、レース日から逆算した戦略的なプランがない。',
  },
]

export function PainSection() {
  return (
    <section id="pain" className="py-24 sm:py-32 bg-slate-950">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        {/* 見出し */}
        <div className="text-center mb-16">
          <p className="text-xs font-semibold uppercase tracking-widest text-emerald-400 mb-3">
            Pain Points
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold text-white">
            こんな悩み、抱えていませんか？
          </h2>
        </div>

        {/* 6カードグリッド */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {PAINS.map((p) => (
            <div
              key={p.title}
              className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 hover:border-slate-700 transition-colors"
            >
              <div className="flex gap-3">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-red-500/10 text-red-400">
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor">
                    <circle cx="5" cy="5" r="5" />
                  </svg>
                </span>
                <div>
                  <p className="font-bold text-white text-sm leading-snug mb-2">{p.title}</p>
                  <p className="text-slate-400 text-sm leading-relaxed">{p.desc}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* 締めコピー */}
        <p className="mt-12 text-center text-lg sm:text-xl font-semibold text-slate-300">
          その悩み、<span className="text-emerald-400">専属トレーナーが全て受け止めます。</span>
        </p>
      </div>
    </section>
  )
}
