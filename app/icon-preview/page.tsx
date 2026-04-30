/**
 * アイコン候補プレビューページ
 * /icon-preview にアクセスすると6パターンのアイコン案を確認できる
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
          コーチング・ランニングをイメージした6パターン。気に入ったものを採用してください。
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <IconCard
            name="A. マウンテン・トレイル"
            desc="山頂と登坂ライン。トレイルランナーの『山を駆け上がる』を象徴。シンプルで識別しやすい。"
          >
            <IconA />
          </IconCard>

          <IconCard
            name="B. ランナー・シルエット"
            desc="走る人の躍動。前傾フォーム＋ストライド感。スポーツ感が強い。"
          >
            <IconB />
          </IconCard>

          <IconCard
            name="C. 脈拍 → ピーク"
            desc="心拍ライン（データ）が山頂（目標）に上昇。コーチング × データの融合を表現。"
          >
            <IconC />
          </IconCard>

          <IconCard
            name="D. コンパス・ナビゲーション"
            desc="羅針盤。『正しい方向に導くコーチ』のメタファー。シャープで知性的。"
          >
            <IconD />
          </IconCard>

          <IconCard
            name="E. シューズ・ストライド"
            desc="ランニングシューズの足跡。具象的で『走り』が一目瞭然。"
          >
            <IconE />
          </IconCard>

          <IconCard
            name="F. CP モノグラム"
            desc="頭文字 C+P を組み合わせた抽象マーク。ブランドロゴとして拡張性が高い。"
          >
            <IconF />
          </IconCard>
        </div>

        <div className="mt-12 rounded-xl border border-slate-800 bg-slate-900 p-6">
          <h2 className="text-lg font-bold text-white mb-3">採用方法</h2>
          <p className="text-sm text-slate-300 mb-3">
            気に入った候補の番号（A〜F）を伝えてください。`app/icon.tsx` と `app/apple-icon.tsx` を該当デザインに切り替え、PWAアイコン・Stravaアプリ申請用ロゴ等にも展開します。
          </p>
          <p className="text-xs text-slate-500">
            ※ 配色は現在エメラルド（#10B981）+ 背景ダーク（#0F172A）。配色違いも対応可能。
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
    <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
      <div className="flex items-center justify-center mb-4 aspect-square rounded-2xl bg-slate-950 p-4">
        <div className="w-full max-w-[180px] aspect-square">{children}</div>
      </div>
      <h3 className="text-sm font-bold text-white">{name}</h3>
      <p className="mt-1 text-xs text-slate-400 leading-relaxed">{desc}</p>
    </div>
  )
}

// ============================================================
// A. マウンテン・トレイル
// ============================================================
function IconA() {
  return (
    <svg viewBox="0 0 100 100" className="w-full h-full">
      <rect width="100" height="100" rx="22" fill="#0F172A" />
      {/* 山 */}
      <path
        d="M15 75 L40 40 L55 58 L70 35 L85 75 Z"
        fill="#10B981"
        opacity="0.9"
      />
      {/* 山の影 */}
      <path d="M40 40 L55 58 L42 75 L25 75 Z" fill="#059669" opacity="0.7" />
      {/* トレイルライン */}
      <path
        d="M20 78 Q35 65 45 60 T68 45 T82 30"
        stroke="#FBBF24"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        strokeDasharray="2 4"
      />
      {/* ピークの旗 */}
      <line x1="70" y1="35" x2="70" y2="22" stroke="#FBBF24" strokeWidth="2" strokeLinecap="round" />
      <path d="M70 22 L78 25 L70 28 Z" fill="#FBBF24" />
    </svg>
  )
}

// ============================================================
// B. ランナー・シルエット
// ============================================================
function IconB() {
  return (
    <svg viewBox="0 0 100 100" className="w-full h-full">
      <rect width="100" height="100" rx="22" fill="#0F172A" />
      {/* 円形ベース */}
      <circle cx="50" cy="50" r="38" fill="#10B981" opacity="0.15" />
      {/* ランナー */}
      <g transform="translate(20, 18) scale(2.5)">
        {/* 頭 */}
        <circle cx="14" cy="5" r="3" fill="#10B981" />
        {/* 胴体 */}
        <path
          d="M 13 8 L 11 16 L 15 18 L 18 14 L 21 17"
          stroke="#10B981"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        {/* 後ろ脚 */}
        <path
          d="M 11 16 L 7 22 L 9 25"
          stroke="#10B981"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        {/* 前脚 */}
        <path
          d="M 15 18 L 18 24 L 16 27"
          stroke="#10B981"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </g>
      {/* スピードライン */}
      <line x1="14" y1="42" x2="22" y2="42" stroke="#FBBF24" strokeWidth="2" strokeLinecap="round" />
      <line x1="12" y1="50" x2="20" y2="50" stroke="#FBBF24" strokeWidth="2" strokeLinecap="round" opacity="0.6" />
      <line x1="14" y1="58" x2="22" y2="58" stroke="#FBBF24" strokeWidth="2" strokeLinecap="round" opacity="0.4" />
    </svg>
  )
}

// ============================================================
// C. 脈拍 → ピーク
// ============================================================
function IconC() {
  return (
    <svg viewBox="0 0 100 100" className="w-full h-full">
      <rect width="100" height="100" rx="22" fill="#0F172A" />
      {/* 山の影 */}
      <path d="M0 75 L30 45 L50 60 L75 30 L100 75 Z" fill="#10B981" opacity="0.2" />
      {/* 脈拍 → ピーク */}
      <path
        d="M 10 55
           L 20 55
           L 25 50
           L 28 60
           L 32 45
           L 36 55
           L 50 55
           L 65 30
           L 75 50
           L 90 50"
        stroke="#10B981"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      {/* ピーク強調 */}
      <circle cx="65" cy="30" r="5" fill="#FBBF24" />
      <circle cx="65" cy="30" r="9" fill="#FBBF24" opacity="0.25" />
    </svg>
  )
}

// ============================================================
// D. コンパス・ナビゲーション
// ============================================================
function IconD() {
  return (
    <svg viewBox="0 0 100 100" className="w-full h-full">
      <rect width="100" height="100" rx="22" fill="#0F172A" />
      {/* 外円 */}
      <circle cx="50" cy="50" r="33" stroke="#10B981" strokeWidth="3" fill="none" />
      <circle cx="50" cy="50" r="33" fill="#10B981" opacity="0.08" />
      {/* 北マーク（小さい三角） */}
      <path d="M50 12 L46 18 L54 18 Z" fill="#FBBF24" />
      {/* コンパス針（北：上向き、南：下向き） */}
      <path d="M50 22 L42 50 L50 46 L58 50 Z" fill="#10B981" />
      <path d="M50 78 L42 50 L50 54 L58 50 Z" fill="#475569" />
      {/* 中心点 */}
      <circle cx="50" cy="50" r="3.5" fill="#FBBF24" />
      {/* 方位マーカー（小ドット） */}
      <circle cx="50" cy="20" r="1.5" fill="#10B981" />
      <circle cx="80" cy="50" r="1.5" fill="#475569" />
      <circle cx="50" cy="80" r="1.5" fill="#475569" />
      <circle cx="20" cy="50" r="1.5" fill="#475569" />
    </svg>
  )
}

// ============================================================
// E. シューズ・ストライド
// ============================================================
function IconE() {
  return (
    <svg viewBox="0 0 100 100" className="w-full h-full">
      <rect width="100" height="100" rx="22" fill="#0F172A" />
      {/* 大きな足跡（前） */}
      <ellipse cx="58" cy="48" rx="14" ry="22" fill="#10B981" transform="rotate(15 58 48)" />
      <ellipse cx="55" cy="33" rx="6" ry="7" fill="#10B981" transform="rotate(15 55 33)" />
      {/* 小さな足跡（後ろ・薄い） */}
      <ellipse cx="32" cy="68" rx="10" ry="16" fill="#10B981" opacity="0.4" transform="rotate(-10 32 68)" />
      <ellipse cx="30" cy="57" rx="4.5" ry="5" fill="#10B981" opacity="0.4" transform="rotate(-10 30 57)" />
      {/* スピードライン */}
      <path
        d="M 70 75 L 85 60"
        stroke="#FBBF24"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <path
        d="M 75 80 L 88 70"
        stroke="#FBBF24"
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.7"
      />
    </svg>
  )
}

// ============================================================
// F. CP モノグラム
// ============================================================
function IconF() {
  return (
    <svg viewBox="0 0 100 100" className="w-full h-full">
      <rect width="100" height="100" rx="22" fill="#0F172A" />
      {/* C: 円弧 */}
      <path
        d="M 70 30
           A 22 22 0 1 0 70 70"
        stroke="#10B981"
        strokeWidth="9"
        fill="none"
        strokeLinecap="round"
      />
      {/* P: 縦棒 + 上半円 */}
      <path
        d="M 55 32 L 55 75
           M 55 32 L 70 32
           A 8 8 0 0 1 70 48
           L 55 48"
        stroke="#FBBF24"
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  )
}
