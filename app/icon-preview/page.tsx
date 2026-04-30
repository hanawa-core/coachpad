/**
 * アイコン候補プレビューページ（第4弾）— コーチング × データ
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
          テーマ：<span className="text-emerald-400">コーチング</span> ×{' '}
          <span className="text-amber-400">データ分析</span>
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <IconCard
            name="S. ブルズアイ"
            desc="同心円のターゲットに、外側からデータポイントが中心へ収束。『データに基づく目標達成』を象徴。"
          >
            <IconS />
          </IconCard>

          <IconCard
            name="T. ダッシュボード"
            desc="複数のメトリクス（メーター・棒・線）が並ぶコックピット風。一望できる選手管理。"
          >
            <IconT />
          </IconCard>

          <IconCard
            name="U. ダイアログ・チャート"
            desc="吹き出しの中に棒グラフ。『データに基づくフィードバック』というコーチの行為そのもの。"
          >
            <IconU />
          </IconCard>

          <IconCard
            name="V. アナリティック・アイ"
            desc="眼の虹彩がチャート柄。『見抜く・観察する』コーチの目利き＋データ分析。"
          >
            <IconV />
          </IconCard>

          <IconCard
            name="W. ハブ＆スポーク"
            desc="中心ハブから放射状にデータ点。コーチを中心に複数選手・指標が繋がるネットワーク。"
          >
            <IconW />
          </IconCard>

          <IconCard
            name="X. レーダー（蜘蛛の巣）"
            desc="6軸のレーダーチャート。耐久・スピード・体調・回復・技術・経験を一望する分析感。"
          >
            <IconX />
          </IconCard>
        </div>

        <div className="mt-12 rounded-xl border border-slate-800 bg-slate-900 p-6">
          <h2 className="text-lg font-bold text-white mb-3">採用方法</h2>
          <p className="text-sm text-slate-300">
            気に入った候補（S〜X）を伝えてください。`app/icon.tsx` と `app/apple-icon.tsx`
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
// S. ブルズアイ（同心円ターゲット + 収束するデータ）
// ============================================================
function IconS() {
  return (
    <svg viewBox="0 0 100 100" className="w-full h-full">
      <rect width="100" height="100" rx="22" fill="#0F172A" />
      {/* 同心円 */}
      <circle cx="50" cy="50" r="32" stroke="#10B981" strokeWidth="2" fill="none" opacity="0.3" />
      <circle cx="50" cy="50" r="22" stroke="#10B981" strokeWidth="2" fill="none" opacity="0.5" />
      <circle cx="50" cy="50" r="13" stroke="#10B981" strokeWidth="2" fill="none" opacity="0.75" />
      <circle cx="50" cy="50" r="5" fill="#FBBF24" />
      {/* 収束する4本のデータライン */}
      <line x1="14" y1="20" x2="44" y2="46" stroke="#10B981" strokeWidth="2" strokeLinecap="round" />
      <line x1="86" y1="22" x2="56" y2="46" stroke="#10B981" strokeWidth="2" strokeLinecap="round" />
      <line x1="16" y1="80" x2="44" y2="56" stroke="#10B981" strokeWidth="2" strokeLinecap="round" />
      <line x1="84" y1="80" x2="56" y2="56" stroke="#10B981" strokeWidth="2" strokeLinecap="round" />
      {/* ラインの先端ドット */}
      <circle cx="14" cy="20" r="2.5" fill="#10B981" />
      <circle cx="86" cy="22" r="2.5" fill="#10B981" />
      <circle cx="16" cy="80" r="2.5" fill="#10B981" />
      <circle cx="84" cy="80" r="2.5" fill="#10B981" />
    </svg>
  )
}

// ============================================================
// T. ダッシュボード（メーター + 棒グラフ + 線）
// ============================================================
function IconT() {
  return (
    <svg viewBox="0 0 100 100" className="w-full h-full">
      <rect width="100" height="100" rx="22" fill="#0F172A" />
      {/* 上半円メーター */}
      <path d="M 18 50 A 18 18 0 0 1 54 50" stroke="#1E293B" strokeWidth="4" fill="none" strokeLinecap="round" />
      <path d="M 18 50 A 18 18 0 0 1 44 35" stroke="#10B981" strokeWidth="4" fill="none" strokeLinecap="round" />
      {/* メーター針 */}
      <line x1="36" y1="50" x2="42" y2="38" stroke="#FBBF24" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="36" cy="50" r="2" fill="#FBBF24" />
      {/* 右上：小さな棒グラフ3本 */}
      <rect x="62" y="32" width="5" height="14" rx="1" fill="#10B981" opacity="0.5" />
      <rect x="70" y="26" width="5" height="20" rx="1" fill="#10B981" opacity="0.75" />
      <rect x="78" y="20" width="5" height="26" rx="1" fill="#10B981" />
      {/* 下半分：折れ線グラフ */}
      <line x1="14" y1="78" x2="86" y2="78" stroke="#1E293B" strokeWidth="1.5" />
      <path
        d="M 18 70
           L 30 64
           L 42 68
           L 54 56
           L 66 60
           L 78 50"
        stroke="#FBBF24"
        strokeWidth="2.5"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* 折れ線のドット */}
      <circle cx="78" cy="50" r="2.5" fill="#FBBF24" />
    </svg>
  )
}

// ============================================================
// U. ダイアログ・チャート（吹き出し + 棒グラフ）
// ============================================================
function IconU() {
  return (
    <svg viewBox="0 0 100 100" className="w-full h-full">
      <rect width="100" height="100" rx="22" fill="#0F172A" />
      {/* 吹き出し本体 */}
      <path
        d="M 18 25
           Q 18 18 25 18
           L 75 18
           Q 82 18 82 25
           L 82 60
           Q 82 67 75 67
           L 45 67
           L 32 80
           L 35 67
           L 25 67
           Q 18 67 18 60 Z"
        fill="#10B981"
        opacity="0.15"
      />
      <path
        d="M 18 25
           Q 18 18 25 18
           L 75 18
           Q 82 18 82 25
           L 82 60
           Q 82 67 75 67
           L 45 67
           L 32 80
           L 35 67
           L 25 67
           Q 18 67 18 60 Z"
        stroke="#10B981"
        strokeWidth="2.5"
        fill="none"
        strokeLinejoin="round"
      />
      {/* 中の棒グラフ */}
      <rect x="28" y="48" width="6" height="12" rx="1" fill="#10B981" />
      <rect x="38" y="40" width="6" height="20" rx="1" fill="#10B981" />
      <rect x="48" y="32" width="6" height="28" rx="1" fill="#10B981" />
      <rect x="58" y="38" width="6" height="22" rx="1" fill="#10B981" />
      <rect x="68" y="28" width="6" height="32" rx="1" fill="#FBBF24" />
    </svg>
  )
}

// ============================================================
// V. アナリティック・アイ（眼 + チャート虹彩）
// ============================================================
function IconV() {
  return (
    <svg viewBox="0 0 100 100" className="w-full h-full">
      <rect width="100" height="100" rx="22" fill="#0F172A" />
      {/* 眼の輪郭（アーモンド型） */}
      <path
        d="M 14 50 Q 50 22 86 50 Q 50 78 14 50 Z"
        fill="#10B981"
        opacity="0.1"
      />
      <path
        d="M 14 50 Q 50 22 86 50 Q 50 78 14 50 Z"
        stroke="#10B981"
        strokeWidth="2.5"
        fill="none"
        strokeLinejoin="round"
      />
      {/* 虹彩（外） */}
      <circle cx="50" cy="50" r="16" stroke="#10B981" strokeWidth="2" fill="#0F172A" />
      {/* 虹彩内のチャート（折れ線） */}
      <path
        d="M 38 56 L 44 50 L 48 53 L 54 44 L 60 48"
        stroke="#FBBF24"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="38" cy="56" r="1.5" fill="#FBBF24" />
      <circle cx="60" cy="48" r="1.5" fill="#FBBF24" />
      {/* 瞳孔 */}
      <circle cx="50" cy="50" r="3" fill="#FBBF24" />
      {/* キャッチライト */}
      <circle cx="53" cy="46" r="1.2" fill="#FFFFFF" />
    </svg>
  )
}

// ============================================================
// W. ハブ＆スポーク（中心 + 放射ノード）
// ============================================================
function IconW() {
  return (
    <svg viewBox="0 0 100 100" className="w-full h-full">
      <rect width="100" height="100" rx="22" fill="#0F172A" />
      {/* 中心ハブの外輪 */}
      <circle cx="50" cy="50" r="11" fill="#10B981" opacity="0.15" />
      <circle cx="50" cy="50" r="11" stroke="#10B981" strokeWidth="2" fill="none" />
      {/* 中心ハブ */}
      <circle cx="50" cy="50" r="5" fill="#FBBF24" />
      {/* 6本のスポーク + ノード */}
      {/* 上 */}
      <line x1="50" y1="50" x2="50" y2="22" stroke="#10B981" strokeWidth="2" />
      <circle cx="50" cy="20" r="4" fill="#10B981" />
      {/* 右上 */}
      <line x1="50" y1="50" x2="74" y2="34" stroke="#10B981" strokeWidth="2" />
      <circle cx="76" cy="32" r="4" fill="#10B981" />
      {/* 右下 */}
      <line x1="50" y1="50" x2="74" y2="66" stroke="#10B981" strokeWidth="2" />
      <circle cx="76" cy="68" r="4" fill="#10B981" />
      {/* 下 */}
      <line x1="50" y1="50" x2="50" y2="78" stroke="#10B981" strokeWidth="2" />
      <circle cx="50" cy="80" r="4" fill="#10B981" />
      {/* 左下 */}
      <line x1="50" y1="50" x2="26" y2="66" stroke="#10B981" strokeWidth="2" />
      <circle cx="24" cy="68" r="4" fill="#10B981" />
      {/* 左上 */}
      <line x1="50" y1="50" x2="26" y2="34" stroke="#10B981" strokeWidth="2" />
      <circle cx="24" cy="32" r="4" fill="#10B981" />
    </svg>
  )
}

// ============================================================
// X. レーダー（6軸の蜘蛛の巣 + プロット）
// ============================================================
function IconX() {
  return (
    <svg viewBox="0 0 100 100" className="w-full h-full">
      <rect width="100" height="100" rx="22" fill="#0F172A" />
      {/* 軸（6本：12時、2時、4時、6時、8時、10時方向） */}
      <g stroke="#1E293B" strokeWidth="1.5">
        <line x1="50" y1="50" x2="50" y2="18" />
        <line x1="50" y1="50" x2="78" y2="34" />
        <line x1="50" y1="50" x2="78" y2="66" />
        <line x1="50" y1="50" x2="50" y2="82" />
        <line x1="50" y1="50" x2="22" y2="66" />
        <line x1="50" y1="50" x2="22" y2="34" />
      </g>
      {/* 内側多角形（薄い） */}
      <polygon
        points="50,30 67,40 67,60 50,70 33,60 33,40"
        stroke="#1E293B"
        strokeWidth="1"
        fill="none"
      />
      {/* データプロットエリア（緑の透過多角形） */}
      <polygon
        points="50,22 72,38 70,62 50,76 30,58 28,38"
        fill="#10B981"
        opacity="0.3"
        stroke="#10B981"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      {/* プロットドット */}
      <circle cx="50" cy="22" r="2.5" fill="#FBBF24" />
      <circle cx="72" cy="38" r="2.5" fill="#FBBF24" />
      <circle cx="70" cy="62" r="2.5" fill="#FBBF24" />
      <circle cx="50" cy="76" r="2.5" fill="#FBBF24" />
      <circle cx="30" cy="58" r="2.5" fill="#FBBF24" />
      <circle cx="28" cy="38" r="2.5" fill="#FBBF24" />
    </svg>
  )
}
