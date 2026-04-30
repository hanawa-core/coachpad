const RESPONSE_PLANS = [
  { plan: 'プレミアム', time: '最優先対応', color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' },
  { plan: 'スタンダード', time: '24時間以内', color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
  { plan: 'ライト', time: '48時間以内', color: 'text-sky-400', bg: 'bg-sky-500/10 border-sky-500/20' },
]

export function ServiceChatSection() {
  return (
    <section id="service-chat" className="py-24 sm:py-32 bg-slate-900/40">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="lg:grid lg:grid-cols-2 lg:gap-16 lg:items-center">
          {/* テキスト */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-sky-400 mb-3">
              Service 03
            </p>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4 leading-tight">
              距離は遠くても、<br />コーチとの距離は近く。
            </h2>
            <p className="text-slate-400 text-sm sm:text-base leading-relaxed mb-8">
              専属コーチとの1対1チャットで、どんな疑問も気軽に相談できます。ワークアウトへの個別フィードバックも、完了報告→コメント→修正のループで素早く回ります。
            </p>

            {/* 特徴リスト */}
            <ul className="space-y-3 mb-8">
              {[
                'コーチ⇔選手の1対1リアルタイムチャット（テキスト＋画像）',
                '記録した1本ごとにコーチが個別コメント',
                '通知センターで大切なフィードバックを見逃さない',
              ].map((item) => (
                <li key={item} className="flex gap-2 text-sm text-slate-300">
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-sky-400" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>

            {/* 返信時間保証 */}
            <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
              <p className="text-white font-semibold text-sm mb-3">プラン別チャット返信保証</p>
              <div className="space-y-2">
                {RESPONSE_PLANS.map((r) => (
                  <div key={r.plan} className={`flex items-center justify-between rounded-lg border ${r.bg} px-4 py-2.5`}>
                    <span className="text-slate-300 text-sm font-medium">{r.plan}</span>
                    <span className={`text-sm font-bold ${r.color}`}>{r.time}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ビジュアルプレースホルダー */}
          <div className="mt-12 lg:mt-0">
            <div className="rounded-2xl bg-slate-800 border border-slate-700 aspect-[4/3] flex items-center justify-center">
              <div className="text-center">
                <div className="w-16 h-16 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center mx-auto mb-3">
                  <svg className="w-8 h-8 text-sky-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <p className="text-slate-500 text-xs">アプリスクリーンショット</p>
                <p className="text-slate-600 text-xs">（チャット画面）</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
