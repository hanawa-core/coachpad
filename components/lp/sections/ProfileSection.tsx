const ACHIEVEMENTS = [
  'Taiwan Beast 100k Winner（2017）',
  'Tor Des Geants（イタリア330km）完走',
  'Shiga Round Trail 438km 完走',
  'THAILAND 500（500km）走破',
  'Tokyo Grand Trail 100マイル完走',
  'TAMBA 100マイル完走',
  'NIKE ALL ASIA CAMP チーム日本専属トレーナー',
  'NIKE CHANCE メディカルトレーナー',
  '全国高校サッカー選手権 群馬県代表帯同',
  '東京国体ソフトテニス競技 公式トレーナー',
  'JSPO認定アスレティックトレーナー',
]

export function ProfileSection() {
  return (
    <section id="profile" className="py-24 sm:py-32 bg-slate-900/40">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        {/* 見出し */}
        <div className="text-center mb-16">
          <p className="text-xs font-semibold uppercase tracking-widest text-emerald-400 mb-3">
            Coach Profile
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold text-white">
            あなたの専属コーチ
          </h2>
        </div>

        <div className="lg:grid lg:grid-cols-2 lg:gap-16 lg:items-start">
          {/* 写真 */}
          <div className="mb-10 lg:mb-0">
            <div className="rounded-2xl bg-slate-800 border border-slate-700 aspect-square max-w-sm mx-auto flex items-center justify-center">
              <div className="text-center">
                <div className="w-20 h-20 rounded-full bg-emerald-500/10 border-2 border-emerald-500/30 flex items-center justify-center mx-auto mb-4">
                  <svg className="w-10 h-10 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <p className="text-slate-500 text-xs">コーチ写真</p>
                <p className="text-slate-600 text-xs">（後で差し替え）</p>
              </div>
            </div>

            {/* メッセージ */}
            <blockquote className="mt-6 rounded-xl border border-slate-800 bg-slate-900 p-5 max-w-sm mx-auto">
              <p className="text-slate-300 text-sm leading-relaxed italic">
                「収入ゼロ、震災、挫折、そして栄光。そのすべてを経験した一人のランナーとして、あなたの身体が持つ真の可能性を、最も誠実な方法で引き出します」
              </p>
              <footer className="mt-3 text-right text-xs text-slate-500">— 塙 翔太</footer>
            </blockquote>
          </div>

          {/* テキスト */}
          <div>
            <h3 className="text-2xl font-bold text-white mb-1">塙 翔太</h3>
            <p className="text-emerald-400 text-sm font-semibold mb-6">
              LLC コアデザイン CEO / BODY ARCHITECT &amp; ATHLETIC TRAINER
            </p>

            <div className="text-slate-400 text-sm leading-relaxed space-y-4 mb-8">
              <p>
                1988年生まれ。JSPO認定アスレティックトレーナー。18歳でトレーナーの世界へ。アリゾナで世界最高峰の現場を学んだ後、東日本大震災を機にフリーランスへ転身。
              </p>
              <p>
                2017年、台湾100km「Beast 100k」で優勝し、合同会社コアデザインを設立。これまでに<span className="text-white font-semibold">3,000人以上のランナー</span>への指導経験を持つ。
              </p>
              <p>
                自身もウルトラトレイルランナーとして第一線で挑戦を続ける。Tor Des Geants（イタリア330km）、Shiga Round Trail 438km、THAILAND 500（500km）など世界最難関のレースを走破。
              </p>
              <p>
                「鍛える前に整える」を提唱し、医学的根拠に基づく身体づくりとピーキング理論を組み合わせた独自メソッドを構築。
              </p>
            </div>

            {/* 実績 */}
            <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
              <p className="text-white font-semibold text-sm mb-4">主な実績</p>
              <ul className="space-y-2">
                {ACHIEVEMENTS.map((a) => (
                  <li key={a} className="flex gap-2 text-xs text-slate-400">
                    <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400" />
                    <span>{a}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
