const ROWS = [
  {
    item: '練習計画',
    before: '思いつきで距離を積む',
    after: 'レース日から逆算した科学的ピーキング',
  },
  {
    item: '体調管理',
    before: '「なんとなく疲れた」感覚頼り',
    after: '数値で疲労状態を客観把握',
  },
  {
    item: '故障',
    before: '同じ箇所を繰り返し痛める',
    after: '動画解析で原因を発見・修正',
  },
  {
    item: 'データ管理',
    before: 'Stravaで見るだけ',
    after: 'CTL/TSBでフィットネス積み上げを可視化',
  },
  {
    item: '相談相手',
    before: 'SNS／知り合い',
    after: '3,000人指導の専属コーチ',
  },
  {
    item: 'プラン更新',
    before: 'しない',
    after: '毎週レビュー＆オーダーメイド更新',
  },
]

export function BeforeAfterSection() {
  return (
    <section id="before-after" className="py-24 sm:py-32 bg-slate-950">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        {/* 見出し */}
        <div className="text-center mb-16">
          <p className="text-xs font-semibold uppercase tracking-widest text-emerald-400 mb-3">
            Before / After
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold text-white">
            3ヶ月後、あなたはこうなっています。
          </h2>
        </div>

        {/* 表ヘッダー */}
        <div className="grid grid-cols-[1fr_1fr_1fr] gap-2 mb-3 text-center text-xs font-bold uppercase tracking-widest">
          <div className="text-slate-500">項目</div>
          <div className="text-red-400 bg-red-500/10 rounded-lg py-2">Before</div>
          <div className="text-emerald-400 bg-emerald-500/10 rounded-lg py-2">After</div>
        </div>

        {/* 行 */}
        <div className="space-y-2">
          {ROWS.map((r, i) => (
            <div key={r.item} className={`grid grid-cols-[1fr_1fr_1fr] gap-2 items-center rounded-xl ${i % 2 === 0 ? 'bg-slate-900/60' : ''} p-2`}>
              <div className="text-slate-400 text-xs font-semibold text-center px-2">{r.item}</div>
              <div className="rounded-lg bg-slate-900 border border-slate-800 px-3 py-3 text-center">
                <p className="text-red-300/70 text-xs leading-snug">{r.before}</p>
              </div>
              <div className="rounded-lg bg-emerald-950/40 border border-emerald-800/30 px-3 py-3 text-center">
                <p className="text-emerald-300 text-xs leading-snug font-medium">{r.after}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
