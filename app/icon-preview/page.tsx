/**
 * アイコン候補プレビューページ（第2弾）
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
          CoachPad アイコン候補（第2弾）
        </h1>
        <p className="text-sm text-slate-400 mb-8">
          より洗練された6案。コーチング × 耐久系競技の本質を、ミニマル・抽象的な表現で。
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <IconCard
            name="G. 等高線（Topography）"
            desc="トレイル地図の等高線。山頂が中心に向かって収束する。実用書のような知的・洗練さ。"
          >
            <IconG />
          </IconCard>

          <IconCard
            name="H. 山頂の朝日（Sunrise Summit）"
            desc="山の稜線から昇る朝日。早朝ランの神聖さ・希望・新たな1日の始まりを象徴。"
          >
            <IconH />
          </IconCard>

          <IconCard
            name="I. 三峰（Triple Peak）"
            desc="重なる3つの三角。アルプス三大、レース3峰、Body/Mind/Performance。プレミアム感。"
          >
            <IconI />
          </IconCard>

          <IconCard
            name="J. 筆山（Brushstroke）"
            desc="書道の一筆書きで描いた山。日本的・力強い・コーチの『書き込み』とも呼応。"
          >
            <IconJ />
          </IconCard>

          <IconCard
            name="K. アーク（Arc & Path）"
            desc="弧の中に登る一本道。シンプルで識別性◎。アプリアイコンとして機能美。"
          >
            <IconK />
          </IconCard>

          <IconCard
            name="L. ピーク・グラフ"
            desc="トレーニング負荷グラフが山形に。データドリブンの世界観を抽象化。テック寄り。"
          >
            <IconL />
          </IconCard>
        </div>

        <div className="mt-12 rounded-xl border border-slate-800 bg-slate-900 p-6">
          <h2 className="text-lg font-bold text-white mb-3">採用方法</h2>
          <p className="text-sm text-slate-300 mb-3">
            気に入った候補（G〜L）を伝えてください。`app/icon.tsx` と `app/apple-icon.tsx` を該当デザインに切り替え、PWAアイコン・Stravaアプリ申請用ロゴ等にも展開します。
          </p>
          <p className="text-xs text-slate-500">
            ※ 配色違い・線の太さ調整・別シェイプ（円形・正方形・角丸）への変更等にも対応可能。
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
// G. Topography（等高線）
// ============================================================
function IconG() {
  return (
    <svg viewBox="0 0 100 100" className="w-full h-full">
      <rect width="100" height="100" rx="22" fill="#0F172A" />
      {/* 等高線（外→内に小さくなる） */}
      <path
        d="M 18 78 Q 50 40 82 78"
        stroke="#10B981"
        strokeWidth="2"
        fill="none"
        opacity="0.3"
        strokeLinecap="round"
      />
      <path
        d="M 25 75 Q 50 45 75 75"
        stroke="#10B981"
        strokeWidth="2"
        fill="none"
        opacity="0.5"
        strokeLinecap="round"
      />
      <path
        d="M 32 72 Q 50 50 68 72"
        stroke="#10B981"
        strokeWidth="2"
        fill="none"
        opacity="0.7"
        strokeLinecap="round"
      />
      <path
        d="M 39 68 Q 50 55 61 68"
        stroke="#10B981"
        strokeWidth="2"
        fill="none"
        opacity="0.85"
        strokeLinecap="round"
      />
      <path
        d="M 45 64 Q 50 60 55 64"
        stroke="#10B981"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
      />
      {/* 山頂マーカー */}
      <circle cx="50" cy="62" r="2.5" fill="#FBBF24" />
    </svg>
  )
}

// ============================================================
// H. Sunrise Summit（山頂の朝日）
// ============================================================
function IconH() {
  return (
    <svg viewBox="0 0 100 100" className="w-full h-full">
      <rect width="100" height="100" rx="22" fill="#0F172A" />
      {/* 太陽（半円） */}
      <circle cx="50" cy="55" r="22" fill="#FBBF24" opacity="0.9" />
      {/* 太陽の光輪 */}
      <circle cx="50" cy="55" r="28" fill="#FBBF24" opacity="0.15" />
      {/* 山（前景・太陽を半分隠す） */}
      <path
        d="M 0 78 L 25 55 L 38 65 L 55 42 L 72 60 L 85 50 L 100 78 Z"
        fill="#0F172A"
      />
      {/* 山の稜線 */}
      <path
        d="M 0 78 L 25 55 L 38 65 L 55 42 L 72 60 L 85 50 L 100 78"
        stroke="#10B981"
        strokeWidth="2.5"
        fill="none"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      {/* 地平線（薄い水平線） */}
      <line x1="10" y1="78" x2="90" y2="78" stroke="#10B981" strokeWidth="1.5" opacity="0.5" />
    </svg>
  )
}

// ============================================================
// I. Triple Peak（三峰）
// ============================================================
function IconI() {
  return (
    <svg viewBox="0 0 100 100" className="w-full h-full">
      <rect width="100" height="100" rx="22" fill="#0F172A" />
      {/* 後の山（最も高く・最も淡い） */}
      <path d="M 50 20 L 88 75 L 12 75 Z" fill="#10B981" opacity="0.25" />
      {/* 中央の山 */}
      <path d="M 35 35 L 65 75 L 5 75 Z" fill="#10B981" opacity="0.55" />
      {/* 前の山（最も鮮やか） */}
      <path d="M 70 40 L 95 75 L 45 75 Z" fill="#10B981" />
      {/* 雪冠（最も奥の山） */}
      <path d="M 50 20 L 56 28 L 50 32 L 44 28 Z" fill="#FBBF24" />
    </svg>
  )
}

// ============================================================
// J. Brushstroke（筆山）
// ============================================================
function IconJ() {
  return (
    <svg viewBox="0 0 100 100" className="w-full h-full">
      <rect width="100" height="100" rx="22" fill="#0F172A" />
      {/* 一筆書きの山（書道風） */}
      <path
        d="M 18 72
           Q 25 70 32 65
           Q 40 50 48 30
           Q 52 25 56 32
           Q 62 50 72 65
           Q 78 70 84 72"
        stroke="#10B981"
        strokeWidth="9"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* 朱印風アクセント */}
      <rect x="68" y="20" width="14" height="14" rx="2" fill="#FBBF24" opacity="0.95" />
      <text
        x="75"
        y="32"
        fontSize="9"
        fontWeight="bold"
        fill="#0F172A"
        textAnchor="middle"
        fontFamily="serif"
      >
        走
      </text>
    </svg>
  )
}

// ============================================================
// K. Arc & Path（アーク内の登り道）
// ============================================================
function IconK() {
  return (
    <svg viewBox="0 0 100 100" className="w-full h-full">
      <rect width="100" height="100" rx="22" fill="#0F172A" />
      {/* 円弧（上半分） */}
      <path
        d="M 18 65 A 32 32 0 0 1 82 65"
        stroke="#10B981"
        strokeWidth="4"
        fill="none"
        strokeLinecap="round"
      />
      {/* 道（弧の中を登っていく） */}
      <path
        d="M 25 75 Q 38 70 45 60 T 62 45 T 78 30"
        stroke="#FBBF24"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      {/* 到達点 */}
      <circle cx="78" cy="30" r="4" fill="#FBBF24" />
      <circle cx="78" cy="30" r="8" fill="#FBBF24" opacity="0.25" />
      {/* スタート点 */}
      <circle cx="25" cy="75" r="2.5" fill="#10B981" />
    </svg>
  )
}

// ============================================================
// L. Peak Graph（ピーク・グラフ）
// ============================================================
function IconL() {
  return (
    <svg viewBox="0 0 100 100" className="w-full h-full">
      <rect width="100" height="100" rx="22" fill="#0F172A" />
      {/* 棒グラフ風（ピークに向かう） */}
      <rect x="18" y="60" width="8" height="20" rx="1.5" fill="#10B981" opacity="0.4" />
      <rect x="30" y="50" width="8" height="30" rx="1.5" fill="#10B981" opacity="0.55" />
      <rect x="42" y="38" width="8" height="42" rx="1.5" fill="#10B981" opacity="0.7" />
      <rect x="54" y="28" width="8" height="52" rx="1.5" fill="#10B981" opacity="0.85" />
      <rect x="66" y="20" width="8" height="60" rx="1.5" fill="#10B981" />
      {/* ピークライン（バーの上を結ぶ） */}
      <path
        d="M 22 60 L 34 50 L 46 38 L 58 28 L 70 20"
        stroke="#FBBF24"
        strokeWidth="2.5"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* ピーク強調 */}
      <circle cx="70" cy="20" r="3.5" fill="#FBBF24" />
    </svg>
  )
}
