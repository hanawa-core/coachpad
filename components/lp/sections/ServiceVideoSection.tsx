const COUNTS = [
  { plan: 'ライト', count: '月1本', color: 'text-slate-300' },
  { plan: 'スタンダード', count: '月3本', color: 'text-emerald-400' },
  { plan: 'プレミアム', count: '無制限', color: 'text-amber-400' },
]

export function ServiceVideoSection() {
  return (
    <section id="service-video" className="py-24 sm:py-32 bg-slate-950">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="lg:grid lg:grid-cols-2 lg:gap-16 lg:items-center">
          {/* ビジュアルプレースホルダー（左） */}
          <div className="mb-12 lg:mb-0">
            <div className="rounded-2xl bg-slate-800 border border-slate-700 aspect-[4/3] flex items-center justify-center">
              <div className="text-center">
                <div className="w-16 h-16 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-3">
                  <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </div>
                <p className="text-slate-500 text-xs">アプリスクリーンショット</p>
                <p className="text-slate-600 text-xs">（赤ペン動作解析画面）</p>
              </div>
            </div>
          </div>

          {/* テキスト（右） */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-red-400 mb-3">
              Service 04
            </p>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4 leading-tight">
              動画を送れば、<br />コーチが直接<br className="sm:hidden" />フィードバック。
            </h2>
            <p className="text-slate-400 text-sm sm:text-base leading-relaxed mb-8">
              ランニングフォーム・スクワット・ジャンプ動作など、気になる動きを撮って送るだけ。塙翔太が動画フレームに直接「赤ペン」で書き込み、改善ポイントを返します。
            </p>

            {/* 特徴 */}
            <ul className="space-y-3 mb-8">
              {[
                'スマホで撮影してそのまま送信（前面・側面・後面に対応）',
                '動画フレーム上にペン・矢印・矩形・テキストで直接書き込み',
                '「ここがこうなっている」「ここをこう直して」が一目で理解できる',
                '解析完了でアプリ通知が届く',
              ].map((item) => (
                <li key={item} className="flex gap-2 text-sm text-slate-300">
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-red-400" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>

            {/* 解析回数 */}
            <div className="rounded-xl border border-slate-800 bg-slate-900 p-5 mb-6">
              <p className="text-white font-semibold text-sm mb-3">プラン別解析回数</p>
              <div className="grid grid-cols-3 gap-3">
                {COUNTS.map((c) => (
                  <div key={c.plan} className="rounded-lg bg-slate-800 p-3 text-center">
                    <p className="text-slate-500 text-xs mb-1">{c.plan}</p>
                    <p className={`font-bold text-sm ${c.color}`}>{c.count}</p>
                  </div>
                ))}
              </div>
            </div>

            <p className="text-red-400 font-semibold text-sm">
              文章では伝わらない「ここ！」が、赤ペン1本で伝わります。
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
