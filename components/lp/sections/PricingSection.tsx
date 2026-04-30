import { Check, Minus } from 'lucide-react'
import { MYASP } from '../constants'

const PLANS = [
  {
    name: 'ライト',
    price: '9,800',
    target: '自走できる中上級者向け',
    popular: false,
    cta: '申し込む',
    href: MYASP.light,
    features: [
      { label: '個別ランニングプログラム', included: true },
      { label: 'プログラム作成頻度', value: '月1回' },
      { label: '筋トレプロトコル', value: '基本パッケージ' },
      { label: '体調トラッキング', included: true },
      { label: 'Strava自動連携', included: true },
      { label: 'CTL/ATL/TSB自動計算', included: true },
      { label: '動画フォーム解析', value: '月1本' },
      { label: 'チャット返信', value: '48時間以内' },
      { label: 'ワークアウト個別フィードバック', included: false },
      { label: '週次レビュー', included: false },
      { label: '故障歴リハビリ補強', included: false },
      { label: 'Zoom個別相談', included: false },
    ],
  },
  {
    name: 'スタンダード',
    price: '19,800',
    target: '多くの方におすすめ',
    popular: true,
    cta: '申し込む（人気）',
    href: MYASP.standard,
    features: [
      { label: '個別ランニングプログラム', included: true },
      { label: 'プログラム作成頻度', value: '週次' },
      { label: '筋トレプロトコル', value: '個別調整' },
      { label: '体調トラッキング', included: true },
      { label: 'Strava自動連携', included: true },
      { label: 'CTL/ATL/TSB自動計算', included: true },
      { label: '動画フォーム解析', value: '月3本' },
      { label: 'チャット返信', value: '24時間以内' },
      { label: 'ワークアウト個別フィードバック', included: true },
      { label: '週次レビュー', included: true },
      { label: '故障歴リハビリ補強', included: true },
      { label: 'Zoom個別相談', value: '月1回（30分）' },
    ],
  },
  {
    name: 'プレミアム',
    price: '38,000',
    target: '最短で結果を出したい方',
    popular: false,
    cta: '申し込む',
    href: MYASP.premium,
    features: [
      { label: '個別ランニングプログラム', included: true },
      { label: 'プログラム作成頻度', value: '都度オーダーメイド' },
      { label: '筋トレプロトコル', value: 'フルカスタム' },
      { label: '体調トラッキング', included: true },
      { label: 'Strava自動連携', included: true },
      { label: 'CTL/ATL/TSB自動計算', included: true },
      { label: '動画フォーム解析', value: '無制限' },
      { label: 'チャット返信', value: '最優先対応' },
      { label: 'ワークアウト個別フィードバック', included: true },
      { label: '週次レビュー', included: true },
      { label: '故障歴リハビリ補強', included: true },
      { label: 'Zoom個別相談', value: '月2回（60分）' },
    ],
  },
]

type Feature = { label: string; included?: boolean; value?: string }

function FeatureRow({ f }: { f: Feature }) {
  if (f.included === false) {
    return (
      <li className="flex items-center gap-2 text-slate-600 text-xs py-1.5 border-b border-slate-800/50 last:border-0">
        <Minus className="h-3.5 w-3.5 shrink-0" />
        <span>{f.label}</span>
      </li>
    )
  }
  return (
    <li className="flex items-start gap-2 text-slate-300 text-xs py-1.5 border-b border-slate-800/50 last:border-0">
      <Check className="h-3.5 w-3.5 shrink-0 mt-0.5 text-emerald-400" />
      <span>
        {f.label}
        {f.value && <span className="ml-1 font-semibold text-white">（{f.value}）</span>}
      </span>
    </li>
  )
}

export function PricingSection() {
  return (
    <section id="pricing" className="py-24 sm:py-32 bg-slate-950">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        {/* 見出し */}
        <div className="text-center mb-16">
          <p className="text-xs font-semibold uppercase tracking-widest text-emerald-400 mb-3">
            Pricing
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            あなたに合った3つのプラン
          </h2>
          <p className="text-slate-400 text-sm">
            税込価格 / 年間契約で10%OFF / いつでも変更・解約可能
          </p>
        </div>

        {/* 3カード */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 items-start">
          {PLANS.map((plan) => (
            <div
              key={plan.name}
              className={`relative rounded-2xl border p-7 flex flex-col ${
                plan.popular
                  ? 'border-emerald-500 bg-emerald-950/20 ring-2 ring-emerald-500 ring-offset-2 ring-offset-slate-950 scale-[1.02]'
                  : 'border-slate-800 bg-slate-900'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                  <span className="rounded-full bg-emerald-500 px-4 py-1 text-xs font-bold text-white shadow">
                    人気 No.1
                  </span>
                </div>
              )}

              <div className="mb-6">
                <h3 className="text-lg font-bold text-white mb-1">{plan.name}</h3>
                <p className="text-slate-500 text-xs mb-4">{plan.target}</p>
                <div className="flex items-end gap-1">
                  <span className="text-slate-400 text-sm">¥</span>
                  <span className="text-4xl font-black text-white">{plan.price}</span>
                  <span className="text-slate-400 text-sm mb-1">/月（税込）</span>
                </div>
              </div>

              <ul className="flex-1 space-y-0 mb-7">
                {plan.features.map((f) => (
                  <FeatureRow key={f.label} f={f} />
                ))}
              </ul>

              <a
                href={plan.href}
                className={`block w-full rounded-xl py-3.5 text-center text-sm font-bold transition-colors ${
                  plan.popular
                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                    : 'border border-slate-700 hover:bg-slate-800 text-slate-300'
                }`}
              >
                {plan.cta}
              </a>
            </div>
          ))}
        </div>

        {/* 注記 */}
        <p className="mt-8 text-center text-xs text-slate-600">
          全プラン共通：初期テスト計算機・専属チャット・ターゲットレース管理・フィットネス指標自動計算・アプリ全機能アクセス
        </p>
      </div>
    </section>
  )
}
