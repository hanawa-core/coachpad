const STEPS = [
  {
    num: '01',
    en: 'Evaluate',
    ja: '評価',
    color: 'text-emerald-400',
    border: 'border-emerald-500/30',
    bg: 'bg-emerald-500/5',
    desc: '現状を数値で見える化',
    details: [
      '初期テスト（20分全力走 / 5kmTT / FTPテスト）でLTHR・閾値ペース・FTPを正確に測定',
      'アプリ内ガイド付きで「テストのやり方が分からない」を解消',
      '過去データ（ターゲットレース・故障歴・ライフスタイル）の徹底ヒアリング',
    ],
  },
  {
    num: '02',
    en: 'Correct',
    ja: '補正',
    color: 'text-amber-400',
    border: 'border-amber-500/30',
    bg: 'bg-amber-500/5',
    desc: '不調・故障リスクをリセット',
    details: [
      '毎朝1分の体調記録（睡眠・疲労・筋肉痛・気分・ストレス）でコンディションを把握',
      'コーチが疲労状態を読み取り、その日の負荷をリアルタイムに調整',
      '動画フォームチェックで非効率な動作・故障リスクを「赤ペン」で指摘',
    ],
  },
  {
    num: '03',
    en: 'Integrate',
    ja: '統合',
    color: 'text-sky-400',
    border: 'border-sky-500/30',
    bg: 'bg-sky-500/5',
    desc: '爆発的なパフォーマンスへ',
    details: [
      'ピーキング理論に基づく週次・日次のオーダーメイドプログラム',
      'ボリューム期→ビルド期→ピーク期→テーパー期の位相を意識した戦略設計',
      '毎週コーチがレビュー＆チャットで微修正。レースに合わせて最適化',
    ],
  },
]

export function MethodSection() {
  return (
    <section id="method" className="py-24 sm:py-32 bg-slate-950">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        {/* 見出し */}
        <div className="text-center mb-16">
          <p className="text-xs font-semibold uppercase tracking-widest text-emerald-400 mb-3">
            Method
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold text-white">
            全プラン共通の<br className="sm:hidden" />「整えてから鍛える」3ステップ
          </h2>
        </div>

        {/* ステップ */}
        <div className="relative">
          {/* 縦コネクターライン（デスクトップ） */}
          <div className="hidden lg:block absolute left-[calc(50%-0.5px)] top-12 bottom-12 w-px bg-gradient-to-b from-emerald-500/20 via-amber-500/20 to-sky-500/20" />

          <div className="space-y-8 lg:space-y-0 lg:grid lg:grid-cols-3 lg:gap-8">
            {STEPS.map((s, i) => (
              <div key={s.num} className={`relative rounded-2xl border ${s.border} ${s.bg} p-8`}>
                {/* 番号 */}
                <div className={`text-5xl font-black ${s.color} opacity-20 absolute top-6 right-6 leading-none`}>
                  {s.num}
                </div>
                {/* ステップラベル */}
                <div className={`inline-flex items-center gap-2 rounded-full border ${s.border} px-3 py-1 text-xs font-semibold ${s.color} mb-4`}>
                  Step {i + 1}
                </div>
                <h3 className={`text-2xl font-bold ${s.color} mb-1`}>{s.en}</h3>
                <p className="text-white font-semibold mb-2">（{s.ja}）</p>
                <p className="text-slate-400 text-sm mb-6">{s.desc}</p>
                <ul className="space-y-3">
                  {s.details.map((d) => (
                    <li key={d} className="flex gap-2 text-sm text-slate-300">
                      <span className={`mt-1 h-1.5 w-1.5 shrink-0 rounded-full ${s.color.replace('text-', 'bg-')}`} />
                      <span>{d}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
