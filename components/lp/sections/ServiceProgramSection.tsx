const FEATURES = [
  {
    title: '週次プログラムの個別設計',
    items: [
      '目標レース日から逆算したピーキング戦略',
      'あなたの直近の体調・疲労を反映した負荷調整',
      '各日の距離・ペース・心拍ゾーン・トレーニング意図を明示',
      'Hard/Easy原則・週間負荷上昇10%以下を厳守',
    ],
  },
  {
    title: '走力向上を支える筋トレプロトコル',
    items: [
      'ランナー特化の補強メニュー（股関節・臀部・体幹・足首の安定性）',
      'ジム不要な自体重メニューにも対応',
      '各種目のフォーム・セット数・回数・休息を明記',
    ],
  },
  {
    title: '故障歴・既往歴に応じたリハビリ的補強',
    items: [
      '過去の故障部位を聞き取り、再発予防のメニューを優先組込',
      '「鍛える前に整える」を徹底（スタンダード以上）',
    ],
  },
]

export function ServiceProgramSection() {
  return (
    <section id="service-program" className="py-24 sm:py-32 bg-slate-900/40">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="lg:grid lg:grid-cols-2 lg:gap-16 lg:items-center">
          {/* テキスト */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-emerald-400 mb-3">
              Service 01
            </p>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4 leading-tight">
              既製プランは、<br />使いません。
            </h2>
            <p className="text-slate-400 text-sm sm:text-base leading-relaxed mb-8">
              100マイル・500kmレースの完走経験と、JSPO アスレティックトレーナーとしての医学的知見をもとに、塙翔太があなた一人のためにプログラムを設計します。
            </p>

            <div className="space-y-6">
              {FEATURES.map((f) => (
                <div key={f.title}>
                  <h3 className="text-white font-semibold mb-2 text-sm">{f.title}</h3>
                  <ul className="space-y-1.5">
                    {f.items.map((item) => (
                      <li key={item} className="flex gap-2 text-sm text-slate-400">
                        <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            <p className="mt-8 text-emerald-400 font-semibold text-sm">
              あなたの身体データ × 塙翔太の指導メソッド = 世界に1つのプログラム。
            </p>
          </div>

          {/* ビジュアルプレースホルダー */}
          <div className="mt-12 lg:mt-0">
            <div className="rounded-2xl bg-slate-800 border border-slate-700 aspect-[4/3] flex items-center justify-center">
              <div className="text-center">
                <div className="w-16 h-16 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-3">
                  <svg className="w-8 h-8 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <p className="text-slate-500 text-xs">アプリスクリーンショット</p>
                <p className="text-slate-600 text-xs">（プログラム画面）</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
