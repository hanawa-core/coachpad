const PILLARS = [
  {
    icon: '◎',
    title: '個別オーダーメイド',
    desc: '目標・体力・体調・故障歴を踏まえ、毎週あなただけの専用プログラムを設計。',
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10 border-emerald-500/20',
  },
  {
    icon: '◈',
    title: '状態の見える化',
    desc: 'フィットネス指標・体調・実績を毎日トラッキング。数値で状態が一目で分かる。',
    color: 'text-amber-400',
    bg: 'bg-amber-500/10 border-amber-500/20',
  },
  {
    icon: '◉',
    title: 'プロが伴走する',
    desc: '動画解析・チャット・週次レビューで個別対応。3,000人指導の経験を一人に注ぐ。',
    color: 'text-sky-400',
    bg: 'bg-sky-500/10 border-sky-500/20',
  },
]

export function SolutionSection() {
  return (
    <section id="solution" className="py-24 sm:py-32 bg-slate-900/40">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        {/* 見出し */}
        <div className="text-center mb-16">
          <p className="text-xs font-semibold uppercase tracking-widest text-emerald-400 mb-3">
            Solution
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold text-white leading-tight">
            「整える」「鍛える」「最適化する」を、<br className="hidden sm:block" />
            専属トレーナーが伴走する
          </h2>
        </div>

        {/* 3カラム */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-16">
          {PILLARS.map((p) => (
            <div
              key={p.title}
              className={`rounded-2xl border ${p.bg} p-8 text-center`}
            >
              <div className={`text-4xl mb-4 ${p.color}`}>{p.icon}</div>
              <h3 className={`text-lg font-bold mb-3 ${p.color}`}>{p.title}</h3>
              <p className="text-slate-400 text-sm leading-relaxed">{p.desc}</p>
            </div>
          ))}
        </div>

        {/* プロダクト紹介テキスト */}
        <div className="mx-auto max-w-3xl rounded-2xl border border-slate-800 bg-slate-900 p-8 text-center">
          <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
            コアデザインのオンラインコーチングは、ジムに通えなくても対面と同じ密度で個別指導を受けられるサービスです。トレーニング記録・体調・動画・チャットをひとつの画面で完結させる専用プラットフォーム
            <span className="font-bold text-white">「CoachPad」</span>
            は、塙翔太自身が「現役ランナー兼トレーナーだからこそ必要な機能」を設計し、ゼロから作り上げた唯一無二のシステム。市販のコーチングサービスでは絶対に実現できない密度の指導が、ここにあります。
          </p>
        </div>
      </div>
    </section>
  )
}
