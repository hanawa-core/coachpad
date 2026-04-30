/**
 * アイコン候補プレビューページ — T ダッシュボード 12案
 */

export const metadata = {
  title: 'アイコン候補 | CoachPad',
}

export default function IconPreviewPage() {
  return (
    <div className="min-h-screen bg-slate-950 px-4 py-10 sm:px-6 sm:py-16">
      <div className="mx-auto max-w-5xl">
        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
          CoachPad アイコン候補
        </h1>
        <p className="text-sm text-slate-400 mb-8">
          テーマ：<span className="text-emerald-400">ダッシュボード</span> ×{' '}
          <span className="text-amber-400">コーチング</span> — 12バリエーション
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
          <IconCard name="T1. ゲージ＋折れ線" desc="半円メーター＋折れ線グラフ。オリジナルTのブラッシュアップ版。">
            <IconT1 />
          </IconCard>
          <IconCard name="T2. ビッグサークルゲージ" desc="大きな単一の円形ゲージが中心。シンプル・力強い。">
            <IconT2 />
          </IconCard>
          <IconCard name="T3. 3リング" desc="同心3リング（Apple Watch風）。進捗を3指標で表現。">
            <IconT3 />
          </IconCard>
          <IconCard name="T4. 4分割グリッド" desc="4象限に異なる指標。総合ダッシュボード感。">
            <IconT4 />
          </IconCard>
          <IconCard name="T5. 縦ゲージ＋バー" desc="左に縦型スロットバー、右に上昇棒グラフ。">
            <IconT5 />
          </IconCard>
          <IconCard name="T6. ダブルゲージ" desc="左右2つの半円メーター。CTL/ATL の2指標感。">
            <IconT6 />
          </IconCard>
          <IconCard name="T7. 半円＋数値" desc="大きな半円ゲージ＋中央に大きな数値表示。">
            <IconT7 />
          </IconCard>
          <IconCard name="T8. 心拍 ECG" desc="心電図ライン＋ステータスドット。生体データ感。">
            <IconT8 />
          </IconCard>
          <IconCard name="T9. ドーナツチャート" desc="セグメント分割されたドーナツ。達成率の可視化。">
            <IconT9 />
          </IconCard>
          <IconCard name="T10. スピードメーター" desc="フル針式スピードメーター。パフォーマンス出力感。">
            <IconT10 />
          </IconCard>
          <IconCard name="T11. 上昇バーチャート" desc="シンプルな上昇棒グラフのみ。成長・積み上げ。">
            <IconT11 />
          </IconCard>
          <IconCard name="T12. ミニマル1弧" desc="単一の大きな弧＋ラインのみ。超シンプル。">
            <IconT12 />
          </IconCard>
        </div>

        <div className="mt-12 rounded-xl border border-slate-800 bg-slate-900 p-6">
          <h2 className="text-lg font-bold text-white mb-3">採用方法</h2>
          <p className="text-sm text-slate-300">
            気に入った候補（T1〜T12）を伝えてください。`app/icon.tsx` と `app/apple-icon.tsx`
            を該当デザインに差し替え、PWAアイコン・Strava申請用ロゴ等にも展開します。
          </p>
        </div>
      </div>
    </div>
  )
}

function IconCard({
  name,
  desc,
  children,
}: {
  name: string
  desc: string
  children: React.ReactNode
}) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
      <div className="flex items-center justify-center mb-3 aspect-square rounded-2xl bg-slate-950 p-3">
        <div className="w-full max-w-[160px] aspect-square">{children}</div>
      </div>
      <h3 className="text-xs font-bold text-white leading-snug">{name}</h3>
      <p className="mt-1 text-[11px] text-slate-500 leading-relaxed">{desc}</p>
    </div>
  )
}

// ============================================================
// T1. ゲージ＋折れ線（オリジナルT ブラッシュアップ）
// ============================================================
function IconT1() {
  return (
    <svg viewBox="0 0 100 100" className="w-full h-full">
      <rect width="100" height="100" rx="22" fill="#0F172A" />
      {/* ゲージ背景弧 */}
      <path d="M 20 56 A 22 22 0 0 1 64 56" stroke="#1E293B" strokeWidth="5" fill="none" strokeLinecap="round" />
      {/* ゲージ進捗弧（約70%） */}
      <path d="M 20 56 A 22 22 0 0 1 56 37" stroke="#10B981" strokeWidth="5" fill="none" strokeLinecap="round" />
      {/* 針 */}
      <line x1="42" y1="56" x2="54" y2="40" stroke="#FBBF24" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="42" cy="56" r="3" fill="#FBBF24" />
      {/* 右：棒グラフ3本 */}
      <rect x="72" y="38" width="5" height="18" rx="1.5" fill="#10B981" opacity="0.4" />
      <rect x="80" y="32" width="5" height="24" rx="1.5" fill="#10B981" opacity="0.7" />
      <rect x="88" y="25" width="5" height="31" rx="1.5" fill="#10B981" />
      {/* 下ライン */}
      <line x1="14" y1="75" x2="86" y2="75" stroke="#1E293B" strokeWidth="1.5" />
      {/* 折れ線 */}
      <polyline
        points="14,71 25,66 36,69 48,60 60,63 72,55 84,50"
        stroke="#FBBF24"
        strokeWidth="2.5"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="84" cy="50" r="2.5" fill="#FBBF24" />
    </svg>
  )
}

// ============================================================
// T2. ビッグサークルゲージ
// ============================================================
function IconT2() {
  return (
    <svg viewBox="0 0 100 100" className="w-full h-full">
      <rect width="100" height="100" rx="22" fill="#0F172A" />
      {/* 大円背景 */}
      <circle cx="50" cy="50" r="32" stroke="#1E293B" strokeWidth="6" fill="none" />
      {/* 進捗（270°分＝75%） stroke-dasharray 計算：2π×32≈201.1 の75%=150.8 */}
      <circle
        cx="50" cy="50" r="32"
        stroke="#10B981" strokeWidth="6" fill="none"
        strokeLinecap="round"
        strokeDasharray="150.8 201.1"
        strokeDashoffset="50.3"
        transform="rotate(-225 50 50)"
      />
      {/* 小ドット（終点） */}
      <circle cx="20" cy="69" r="3" fill="#FBBF24" />
      {/* 中央数値 */}
      <text x="50" y="46" textAnchor="middle" fill="#10B981" fontSize="14" fontWeight="700" fontFamily="system-ui">75</text>
      <text x="50" y="56" textAnchor="middle" fill="#94A3B8" fontSize="7" fontFamily="system-ui">FITNESS</text>
      {/* 下部ミニバー3本 */}
      <rect x="30" y="78" width="6" height="6" rx="1" fill="#10B981" opacity="0.5" />
      <rect x="40" y="75" width="6" height="9" rx="1" fill="#10B981" opacity="0.7" />
      <rect x="50" y="72" width="6" height="12" rx="1" fill="#10B981" />
      <rect x="60" y="76" width="6" height="8" rx="1" fill="#FBBF24" opacity="0.8" />
    </svg>
  )
}

// ============================================================
// T3. 3リング（Apple Watch風）
// ============================================================
function IconT3() {
  // 外→内 r=35,26,17
  // 2π×35=219.9 / 2π×26=163.4 / 2π×17=106.8
  return (
    <svg viewBox="0 0 100 100" className="w-full h-full">
      <rect width="100" height="100" rx="22" fill="#0F172A" />
      {/* 外リング背景 */}
      <circle cx="50" cy="50" r="35" stroke="#1E293B" strokeWidth="5" fill="none" />
      {/* 外リング 80% */}
      <circle cx="50" cy="50" r="35"
        stroke="#10B981" strokeWidth="5" fill="none" strokeLinecap="round"
        strokeDasharray="175.9 219.9"
        strokeDashoffset="55"
        transform="rotate(-90 50 50)"
      />
      {/* 中リング背景 */}
      <circle cx="50" cy="50" r="26" stroke="#1E293B" strokeWidth="5" fill="none" />
      {/* 中リング 60% */}
      <circle cx="50" cy="50" r="26"
        stroke="#FBBF24" strokeWidth="5" fill="none" strokeLinecap="round"
        strokeDasharray="98 163.4"
        strokeDashoffset="41"
        transform="rotate(-90 50 50)"
      />
      {/* 内リング背景 */}
      <circle cx="50" cy="50" r="17" stroke="#1E293B" strokeWidth="5" fill="none" />
      {/* 内リング 45% */}
      <circle cx="50" cy="50" r="17"
        stroke="#38BDF8" strokeWidth="5" fill="none" strokeLinecap="round"
        strokeDasharray="48 106.8"
        strokeDashoffset="26.7"
        transform="rotate(-90 50 50)"
      />
    </svg>
  )
}

// ============================================================
// T4. 4分割グリッドダッシュボード
// ============================================================
function IconT4() {
  return (
    <svg viewBox="0 0 100 100" className="w-full h-full">
      <rect width="100" height="100" rx="22" fill="#0F172A" />
      {/* 区切り線 */}
      <line x1="50" y1="18" x2="50" y2="82" stroke="#1E293B" strokeWidth="1.5" />
      <line x1="18" y1="50" x2="82" y2="50" stroke="#1E293B" strokeWidth="1.5" />
      {/* 左上：折れ線 */}
      <polyline points="20,44 27,38 34,42 41,32 48,36"
        stroke="#10B981" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      {/* 右上：ミニゲージ半円 */}
      <path d="M 54 46 A 12 12 0 0 1 78 46" stroke="#1E293B" strokeWidth="4" fill="none" strokeLinecap="round" />
      <path d="M 54 46 A 12 12 0 0 1 74 36" stroke="#FBBF24" strokeWidth="4" fill="none" strokeLinecap="round" />
      <line x1="66" y1="46" x2="73" y2="36" stroke="#FBBF24" strokeWidth="2" strokeLinecap="round" />
      <circle cx="66" cy="46" r="2" fill="#FBBF24" />
      {/* 左下：棒グラフ3本 */}
      <rect x="22" y="62" width="5" height="12" rx="1" fill="#10B981" opacity="0.4" />
      <rect x="30" y="58" width="5" height="16" rx="1" fill="#10B981" opacity="0.7" />
      <rect x="38" y="55" width="5" height="19" rx="1" fill="#10B981" />
      {/* 右下：ドーナツ */}
      <circle cx="66" cy="66" r="12" stroke="#1E293B" strokeWidth="5" fill="none" />
      <circle cx="66" cy="66" r="12"
        stroke="#38BDF8" strokeWidth="5" fill="none" strokeLinecap="round"
        strokeDasharray="45 75.4"
        transform="rotate(-90 66 66)"
      />
    </svg>
  )
}

// ============================================================
// T5. 縦ゲージ＋上昇バー
// ============================================================
function IconT5() {
  return (
    <svg viewBox="0 0 100 100" className="w-full h-full">
      <rect width="100" height="100" rx="22" fill="#0F172A" />
      {/* 縦型スロットゲージ（左） */}
      <rect x="20" y="20" width="12" height="60" rx="6" fill="#1E293B" />
      <rect x="20" y="44" width="12" height="36" rx="6" fill="#10B981" />
      {/* ゲージ目盛り */}
      <line x1="33" y1="26" x2="36" y2="26" stroke="#1E293B" strokeWidth="1.5" />
      <line x1="33" y1="38" x2="36" y2="38" stroke="#1E293B" strokeWidth="1.5" />
      <line x1="33" y1="50" x2="36" y2="50" stroke="#10B981" strokeWidth="1.5" />
      <line x1="33" y1="62" x2="36" y2="62" stroke="#10B981" strokeWidth="1.5" />
      <line x1="33" y1="74" x2="36" y2="74" stroke="#10B981" strokeWidth="1.5" />
      {/* ゲージ頂点ドット */}
      <circle cx="26" cy="44" r="4" fill="#FBBF24" />
      {/* 右：上昇棒グラフ5本 */}
      <line x1="44" y1="80" x2="88" y2="80" stroke="#1E293B" strokeWidth="1.5" />
      <rect x="46" y="70" width="7" height="10" rx="1.5" fill="#10B981" opacity="0.3" />
      <rect x="57" y="62" width="7" height="18" rx="1.5" fill="#10B981" opacity="0.5" />
      <rect x="68" y="52" width="7" height="28" rx="1.5" fill="#10B981" opacity="0.75" />
      <rect x="79" y="40" width="7" height="40" rx="1.5" fill="#10B981" />
      {/* 折れ線 */}
      <polyline points="50,70 61,62 72,52 83,40"
        stroke="#FBBF24" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="83" cy="40" r="2.5" fill="#FBBF24" />
    </svg>
  )
}

// ============================================================
// T6. ダブルゲージ
// ============================================================
function IconT6() {
  return (
    <svg viewBox="0 0 100 100" className="w-full h-full">
      <rect width="100" height="100" rx="22" fill="#0F172A" />
      {/* 左ゲージ */}
      <path d="M 14 58 A 20 20 0 0 1 54 58" stroke="#1E293B" strokeWidth="5" fill="none" strokeLinecap="round" />
      <path d="M 14 58 A 20 20 0 0 1 47 42" stroke="#10B981" strokeWidth="5" fill="none" strokeLinecap="round" />
      <line x1="34" y1="58" x2="45" y2="44" stroke="#FBBF24" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="34" cy="58" r="3" fill="#FBBF24" />
      {/* CTL ラベル */}
      <text x="34" y="70" textAnchor="middle" fill="#10B981" fontSize="7" fontWeight="700" fontFamily="system-ui">CTL</text>
      {/* 右ゲージ */}
      <path d="M 46 58 A 20 20 0 0 1 86 58" stroke="#1E293B" strokeWidth="5" fill="none" strokeLinecap="round" />
      <path d="M 46 58 A 20 20 0 0 1 55 40" stroke="#FBBF24" strokeWidth="5" fill="none" strokeLinecap="round" />
      <line x1="66" y1="58" x2="57" y2="42" stroke="#FBBF24" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="66" cy="58" r="3" fill="#FBBF24" />
      {/* ATL ラベル */}
      <text x="66" y="70" textAnchor="middle" fill="#FBBF24" fontSize="7" fontWeight="700" fontFamily="system-ui">ATL</text>
      {/* 下ライン */}
      <line x1="18" y1="80" x2="82" y2="80" stroke="#1E293B" strokeWidth="1.5" />
      <text x="50" y="88" textAnchor="middle" fill="#94A3B8" fontSize="6" fontFamily="system-ui">CoachPad</text>
    </svg>
  )
}

// ============================================================
// T7. 半円ゲージ＋大数値
// ============================================================
function IconT7() {
  return (
    <svg viewBox="0 0 100 100" className="w-full h-full">
      <rect width="100" height="100" rx="22" fill="#0F172A" />
      {/* 大きな半円ゲージ */}
      <path d="M 16 62 A 34 34 0 0 1 84 62" stroke="#1E293B" strokeWidth="7" fill="none" strokeLinecap="round" />
      {/* 進捗（約80%） */}
      <path d="M 16 62 A 34 34 0 0 1 78 38" stroke="#10B981" strokeWidth="7" fill="none" strokeLinecap="round" />
      {/* 針 */}
      <line x1="50" y1="62" x2="75" y2="40" stroke="#FBBF24" strokeWidth="3" strokeLinecap="round" />
      <circle cx="50" cy="62" r="5" fill="#1E293B" stroke="#FBBF24" strokeWidth="2" />
      {/* 中央数値 */}
      <text x="50" y="58" textAnchor="middle" fill="#FFFFFF" fontSize="16" fontWeight="700" fontFamily="system-ui">82</text>
      {/* ラベル */}
      <text x="50" y="74" textAnchor="middle" fill="#10B981" fontSize="8" fontFamily="system-ui">FITNESS</text>
      {/* 下部ミニ棒 */}
      <rect x="26" y="82" width="8" height="4" rx="1" fill="#10B981" opacity="0.4" />
      <rect x="37" y="80" width="8" height="6" rx="1" fill="#10B981" opacity="0.6" />
      <rect x="48" y="78" width="8" height="8" rx="1" fill="#10B981" />
      <rect x="59" y="80" width="8" height="6" rx="1" fill="#FBBF24" opacity="0.7" />
    </svg>
  )
}

// ============================================================
// T8. 心拍 ECG
// ============================================================
function IconT8() {
  return (
    <svg viewBox="0 0 100 100" className="w-full h-full">
      <rect width="100" height="100" rx="22" fill="#0F172A" />
      {/* グリッド線（薄） */}
      <line x1="14" y1="35" x2="86" y2="35" stroke="#1E293B" strokeWidth="1" />
      <line x1="14" y1="50" x2="86" y2="50" stroke="#1E293B" strokeWidth="1" />
      <line x1="14" y1="65" x2="86" y2="65" stroke="#1E293B" strokeWidth="1" />
      {/* ECG ライン */}
      <polyline
        points="14,50 22,50 26,50 28,32 30,50 32,66 36,50 42,50 50,50 54,50 58,30 60,50 62,60 66,50 72,50 86,50"
        stroke="#10B981"
        strokeWidth="2.5"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* ステータスドット（右上） */}
      <circle cx="76" cy="26" r="4" fill="#10B981" />
      <circle cx="76" cy="26" r="7" fill="#10B981" opacity="0.2" />
      {/* ラベル */}
      <text x="50" y="80" textAnchor="middle" fill="#10B981" fontSize="7" fontWeight="700" fontFamily="system-ui">HEART RATE</text>
      {/* 左下：BPM */}
      <text x="22" y="79" textAnchor="middle" fill="#FFFFFF" fontSize="10" fontWeight="700" fontFamily="system-ui">148</text>
      <text x="22" y="87" textAnchor="middle" fill="#94A3B8" fontSize="6" fontFamily="system-ui">bpm</text>
    </svg>
  )
}

// ============================================================
// T9. ドーナツチャート
// ============================================================
function IconT9() {
  // 外円 r=34 → 周長 2π×34=213.6
  // セグメント: 緑35%(74.8), 黄25%(53.4), 青20%(42.7), グレー20%(42.7)
  return (
    <svg viewBox="0 0 100 100" className="w-full h-full">
      <rect width="100" height="100" rx="22" fill="#0F172A" />
      {/* ドーナツ背景 */}
      <circle cx="50" cy="50" r="32" stroke="#1E293B" strokeWidth="14" fill="none" />
      {/* セグメント1: 緑 35% */}
      <circle cx="50" cy="50" r="32"
        stroke="#10B981" strokeWidth="14" fill="none"
        strokeDasharray="74.8 213.6"
        strokeDashoffset="0"
        transform="rotate(-90 50 50)"
      />
      {/* セグメント2: 黄 25% */}
      <circle cx="50" cy="50" r="32"
        stroke="#FBBF24" strokeWidth="14" fill="none"
        strokeDasharray="53.4 213.6"
        strokeDashoffset="-74.8"
        transform="rotate(-90 50 50)"
      />
      {/* セグメント3: 青 20% */}
      <circle cx="50" cy="50" r="32"
        stroke="#38BDF8" strokeWidth="14" fill="none"
        strokeDasharray="42.7 213.6"
        strokeDashoffset="-128.2"
        transform="rotate(-90 50 50)"
      />
      {/* 中央 */}
      <circle cx="50" cy="50" r="16" fill="#0F172A" />
      <text x="50" y="46" textAnchor="middle" fill="#FFFFFF" fontSize="10" fontWeight="700" fontFamily="system-ui">TSB</text>
      <text x="50" y="57" textAnchor="middle" fill="#10B981" fontSize="8" fontFamily="system-ui">+12</text>
    </svg>
  )
}

// ============================================================
// T10. スピードメーター（フル針式）
// ============================================================
function IconT10() {
  return (
    <svg viewBox="0 0 100 100" className="w-full h-full">
      <rect width="100" height="100" rx="22" fill="#0F172A" />
      {/* 外輪 */}
      <circle cx="50" cy="54" r="34" stroke="#1E293B" strokeWidth="2" fill="none" />
      {/* スケール目盛り 9本 */}
      {[...Array(9)].map((_, i) => {
        const angle = -180 + i * 22.5
        const rad = (angle * Math.PI) / 180
        const x1 = 50 + 30 * Math.cos(rad)
        const y1 = 54 + 30 * Math.sin(rad)
        const x2 = 50 + 26 * Math.cos(rad)
        const y2 = 54 + 26 * Math.sin(rad)
        return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#334155" strokeWidth="1.5" />
      })}
      {/* 色分け弧（赤→黄→緑） */}
      <path d="M 16 54 A 34 34 0 0 1 30 26" stroke="#EF4444" strokeWidth="5" fill="none" strokeLinecap="round" />
      <path d="M 30 26 A 34 34 0 0 1 70 26" stroke="#FBBF24" strokeWidth="5" fill="none" strokeLinecap="round" />
      <path d="M 70 26 A 34 34 0 0 1 84 54" stroke="#10B981" strokeWidth="5" fill="none" strokeLinecap="round" />
      {/* 針（緑ゾーン方向 約70%） */}
      <line x1="50" y1="54" x2="76" y2="32" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="50" cy="54" r="4.5" fill="#1E293B" stroke="#FFFFFF" strokeWidth="1.5" />
    </svg>
  )
}

// ============================================================
// T11. 上昇バーチャート（シンプル）
// ============================================================
function IconT11() {
  const bars = [
    { x: 14, h: 12, op: 0.25 },
    { x: 25, h: 20, op: 0.35 },
    { x: 36, h: 15, op: 0.4 },
    { x: 47, h: 28, op: 0.55 },
    { x: 58, h: 36, op: 0.7 },
    { x: 69, h: 44, op: 0.85 },
    { x: 80, h: 54, op: 1 },
  ]
  return (
    <svg viewBox="0 0 100 100" className="w-full h-full">
      <rect width="100" height="100" rx="22" fill="#0F172A" />
      {/* ベースライン */}
      <line x1="10" y1="82" x2="90" y2="82" stroke="#1E293B" strokeWidth="1.5" />
      <line x1="10" y1="82" x2="10" y2="16" stroke="#1E293B" strokeWidth="1.5" />
      {/* バー */}
      {bars.map((b, i) => (
        <rect
          key={i}
          x={b.x}
          y={82 - b.h}
          width="9"
          height={b.h}
          rx="2"
          fill="#10B981"
          opacity={b.op}
        />
      ))}
      {/* 最後のバーにアンバーのトップライン */}
      <rect x="80" y="28" width="9" height="54" rx="2" fill="#10B981" />
      <rect x="80" y="28" width="9" height="5" rx="2" fill="#FBBF24" />
      {/* 上昇トレンドライン */}
      <polyline
        points="18,76 29,68 40,73 51,60 62,52 73,44 84,31"
        stroke="#FBBF24"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray="3 2"
      />
    </svg>
  )
}

// ============================================================
// T12. ミニマル単一弧＋折れ線
// ============================================================
function IconT12() {
  return (
    <svg viewBox="0 0 100 100" className="w-full h-full">
      <rect width="100" height="100" rx="22" fill="#0F172A" />
      {/* 大きな弧（背景） */}
      <path d="M 18 68 A 36 36 0 0 1 82 68" stroke="#1E293B" strokeWidth="8" fill="none" strokeLinecap="round" />
      {/* 大きな弧（進捗 65%） */}
      <path d="M 18 68 A 36 36 0 0 1 70 38" stroke="#10B981" strokeWidth="8" fill="none" strokeLinecap="round" />
      {/* 終端ドット */}
      <circle cx="70" cy="38" r="4.5" fill="#FBBF24" />
      {/* 中央ライングラフ（小） */}
      <polyline
        points="30,65 40,58 50,61 60,53 70,56"
        stroke="#FFFFFF"
        strokeWidth="1.5"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.4"
      />
      {/* 中央ラベル */}
      <text x="50" y="74" textAnchor="middle" fill="#FFFFFF" fontSize="12" fontWeight="700" fontFamily="system-ui">65%</text>
    </svg>
  )
}
