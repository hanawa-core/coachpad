const POINTS = [
  {
    title: '「現役ランナー × プロトレーナー」の経験から逆算した設計',
    desc: '100マイル・500kmレースで自分が何に困ったか。トップアスリートに帯同した現場で何が必要だったか。その全てを解決するために、機能の一つひとつが組み込まれています。',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10 border-emerald-500/20',
  },
  {
    title: 'ランナーに必要な要素をすべて1画面に統合',
    desc: '他のサービスは「Strava＋メッセージアプリ＋Googleスプレッドシート＋メール」とバラバラ。CoachPadは「ランナー専用」を前提に設計されているので、画面遷移ゼロで全てが繋がる。',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
      </svg>
    ),
    color: 'text-amber-400',
    bg: 'bg-amber-500/10 border-amber-500/20',
  },
  {
    title: '「コーチング以外の手間」をゼロに',
    desc: 'Strava連携でデータ入力ゼロ。スマホ1台で動画・記録・メッセージ・赤ペン解析が完結。だから、コーチも選手も「コーチングそのもの」に集中できる。',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
      </svg>
    ),
    color: 'text-sky-400',
    bg: 'bg-sky-500/10 border-sky-500/20',
  },
]

export function WhySection() {
  return (
    <section id="why" className="py-24 sm:py-32 bg-slate-900/40">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        {/* 見出し */}
        <div className="text-center mb-16">
          <p className="text-xs font-semibold uppercase tracking-widest text-emerald-400 mb-3">
            Why CoachPad
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            既製のサービスでは、<br />ここまでできない。
          </h2>
          <p className="mx-auto max-w-2xl text-slate-400 text-sm sm:text-base leading-relaxed">
            多くのオンラインコーチングは、汎用的なメッセージアプリとスプレッドシートを組み合わせて運営されています。CoachPadは違います。
          </p>
        </div>

        {/* 3カード */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-12">
          {POINTS.map((p) => (
            <div key={p.title} className={`rounded-2xl border ${p.bg} p-8`}>
              <div className={`${p.color} mb-4`}>{p.icon}</div>
              <h3 className={`font-bold text-white text-sm leading-snug mb-3`}>{p.title}</h3>
              <p className="text-slate-400 text-sm leading-relaxed">{p.desc}</p>
            </div>
          ))}
        </div>

        {/* 締めコピー */}
        <blockquote className="mx-auto max-w-2xl rounded-2xl border border-slate-800 bg-slate-900 p-8 text-center">
          <p className="text-white font-semibold text-base sm:text-lg leading-relaxed">
            既製品の組み合わせでは絶対に到達できない密度の指導を、自前のプラットフォームで実現する。<br />
            <span className="text-emerald-400">それが、コアデザインのオンラインコーチングです。</span>
          </p>
        </blockquote>
      </div>
    </section>
  )
}
