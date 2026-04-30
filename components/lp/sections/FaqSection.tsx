'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'

const FAQS = [
  {
    q: 'パソコンが苦手でも使えますか？',
    a: 'スマホだけで完結します。Strava連携で記録は自動入力されるので、手動の入力作業はほぼゼロです。動画も撮ってアップするだけ。難しい操作は一切ありません。',
  },
  {
    q: 'Stravaを持っていなくても使えますか？',
    a: '使えます。手動でワークアウトを入力する画面もあります。Stravaは無料で作れるので推奨していますが、必須ではありません。',
  },
  {
    q: '初心者でも大丈夫ですか？',
    a: 'はい。初期ヒアリングで現状レベルを把握した上で、無理のない強度から開始します。スタンダード以上ではZoomで塙が直接ヒアリングします。レース経験ゼロの方も歓迎です。',
  },
  {
    q: '年齢制限はありますか？',
    a: 'ありません。10代〜60代の方まで実績があります。年齢・体力に応じたプログラムを設計します。',
  },
  {
    q: 'プランの途中変更はできますか？',
    a: 'はい、いつでも変更可能です。次月から反映されます。まずライトで試して、慣れてきたらスタンダードに変更するケースも多いです。',
  },
  {
    q: '故障中でも申し込めますか？',
    a: '可能です。現状を把握したうえで、故障を悪化させない範囲のプログラムから始めます。むしろ故障中こそ、再発予防と回復を同時に設計できる専門家のサポートが効果的です。',
  },
  {
    q: 'プログラムは本当に毎週個別に作るのですか？',
    a: 'はい。スタンダード以上は毎週、塙翔太が一人ひとりのデータを確認した上で設計します。汎用テンプレートの流用は一切しません。',
  },
  {
    q: 'データのプライバシーは守られますか？',
    a: 'はい。アプリは認証済みユーザーのみアクセス可能なセキュリティルールで保護されており、あなたのデータはあなたとコーチ以外アクセスできない設計です。',
  },
  {
    q: '解約はどうすればいいですか？',
    a: 'マイスピーの管理画面からいつでも可能です。違約金等は一切ありません。ただし、月の途中での返金はできませんのでご注意ください。',
  },
]

export function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  return (
    <section id="faq" className="py-24 sm:py-32 bg-slate-900/40">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        {/* 見出し */}
        <div className="text-center mb-16">
          <p className="text-xs font-semibold uppercase tracking-widest text-emerald-400 mb-3">
            FAQ
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold text-white">
            よくあるご質問
          </h2>
        </div>

        {/* アコーディオン */}
        <div className="divide-y divide-slate-800 rounded-2xl border border-slate-800 bg-slate-900 overflow-hidden">
          {FAQS.map((faq, i) => (
            <div key={i}>
              <button
                onClick={() => setOpenIndex(openIndex === i ? null : i)}
                className="flex w-full items-center justify-between px-6 py-5 text-left hover:bg-slate-800/40 transition-colors"
              >
                <span className="text-white font-medium text-sm pr-4">{faq.q}</span>
                <ChevronDown
                  className={`h-5 w-5 shrink-0 text-slate-400 transition-transform duration-300 ${
                    openIndex === i ? 'rotate-180 text-emerald-400' : ''
                  }`}
                />
              </button>
              <div
                className={`overflow-hidden transition-all duration-300 ease-in-out ${
                  openIndex === i ? 'max-h-64 opacity-100' : 'max-h-0 opacity-0'
                }`}
              >
                <div className="px-6 pb-5">
                  <p className="text-slate-400 text-sm leading-relaxed">{faq.a}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
