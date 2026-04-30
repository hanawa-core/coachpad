/**
 * アイコン候補プレビューページ（第3弾）— 走る × データ
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
          テーマ：<span className="text-emerald-400">走る</span> ×{' '}
          <span className="text-amber-400">コーチング（データ）</span>
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <IconCard
            name="M. パルス・ランナー"
            desc="心拍ライン（データ）が走者のシルエットに変化。コーチングの『計測 → 動作』の連続性を1つの線で表現。"
          >
            <IconM />
          </IconCard>

          <IconCard
            name="N. ストライド・グラフ"
            desc="走るストライドが棒グラフに。各歩 = 1データ。トレーニング負荷の可視化を象徴。"
          >
            <IconN />
          </IconCard>

          <IconCard
            name="O. スピード・ゲージ"
            desc="半円のスピードメーター内を走るランナー。データに基づく強度管理を直感的に。"
          >
            <IconO />
          </IconCard>

          <IconCard
            name="P. GPS トレイル"
            desc="GPSピン＋蛇行する走路＋データポイント。ランニングログ × 位置情報の世界観。"
          >
            <IconP />
          </IconCard>

          <IconCard
            name="Q. データ・ストライド"
            desc="走者の足跡が円グラフのドットに変換される表現。一歩ごとの分析。"
          >
            <IconQ />
          </IconCard>

          <IconCard
            name="R. デュアルライン"
            desc="上：心拍データ／下：走行軌跡。走る動作と生体データを同時に見せる『コーチの視点』。"
          >
            <IconR />
          </IconCard>
        </div>

        <div className="mt-12 rounded-xl border border-slate-800 bg-slate-900 p-6">
          <h2 className="text-lg font-bold text-white mb-3">採用方法</h2>
          <p className="text-sm text-slate-300">
            気に入った候補（M〜R）を伝えてください。`app/icon.tsx` と `app/apple-icon.tsx`
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
// M. パルス・ランナー（心拍 → 走者）
// ============================================================
function IconM() {
  return (
    <svg viewBox="0 0 100 100" className="w-full h-full">
      <rect width="100" height="100" rx="22" fill="#0F172A" />
      {/* 心拍ライン（左から） */}
      <path
        d="M 8 55
           L 18 55
           L 22 45
           L 26 65
           L 30 50
           L 36 55"
        stroke="#FBBF24"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      {/* つなぎ線 */}
      <line x1="36" y1="55" x2="44" y2="55" stroke="#FBBF24" strokeWidth="3" strokeLinecap="round" />
      {/* ランナー（右側に位置） */}
      <g transform="translate(50, 28)">
        {/* 頭 */}
        <circle cx="14" cy="6" r="4" fill="#10B981" />
        {/* 胴体 */}
        <path
          d="M 13 11 L 10 22 L 16 25 L 22 18 L 28 22"
          stroke="#10B981"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        {/* 後ろ脚 */}
        <path
          d="M 10 22 L 5 32 L 8 38"
          stroke="#10B981"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        {/* 前脚 */}
        <path
          d="M 16 25 L 22 38 L 18 42"
          stroke="#10B981"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </g>
    </svg>
  )
}

// ============================================================
// N. ストライド・グラフ（足跡が棒グラフに）
// ============================================================
function IconN() {
  return (
    <svg viewBox="0 0 100 100" className="w-full h-full">
      <rect width="100" height="100" rx="22" fill="#0F172A" />
      {/* ベースライン */}
      <line x1="14" y1="80" x2="86" y2="80" stroke="#475569" strokeWidth="1.5" strokeLinecap="round" />
      {/* 5本の棒（ストライドの進行 = データの上昇） */}
      <rect x="16" y="65" width="9" height="15" rx="1.5" fill="#10B981" opacity="0.5" />
      <rect x="29" y="55" width="9" height="25" rx="1.5" fill="#10B981" opacity="0.65" />
      <rect x="42" y="42" width="9" height="38" rx="1.5" fill="#10B981" opacity="0.8" />
      <rect x="55" y="32" width="9" height="48" rx="1.5" fill="#10B981" opacity="0.9" />
      <rect x="68" y="22" width="9" height="58" rx="1.5" fill="#10B981" />
      {/* 進行方向：トレンドライン（黄） */}
      <path
        d="M 20 65 L 33 55 L 46 42 L 59 32 L 72 22"
        stroke="#FBBF24"
        strokeWidth="2.5"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* 矢印先端 */}
      <path d="M 72 22 L 78 18 M 72 22 L 78 26" stroke="#FBBF24" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  )
}

// ============================================================
// O. スピード・ゲージ（半円メーター内のランナー）
// ============================================================
function IconO() {
  return (
    <svg viewBox="0 0 100 100" className="w-full h-full">
      <rect width="100" height="100" rx="22" fill="#0F172A" />
      {/* ゲージ背景アーク */}
      <path
        d="M 18 70 A 32 32 0 0 1 82 70"
        stroke="#1E293B"
        strokeWidth="6"
        fill="none"
        strokeLinecap="round"
      />
      {/* ゲージ進捗（緑→黄、3/4くらい埋まる） */}
      <path
        d="M 18 70 A 32 32 0 0 1 78 50"
        stroke="#10B981"
        strokeWidth="6"
        fill="none"
        strokeLinecap="round"
      />
      {/* 目盛り点（5つ） */}
      <circle cx="18" cy="70" r="2" fill="#475569" />
      <circle cx="28" cy="48" r="2" fill="#475569" />
      <circle cx="50" cy="38" r="2" fill="#475569" />
      <circle cx="72" cy="48" r="2" fill="#475569" />
      <circle cx="82" cy="70" r="2" fill="#FBBF24" />
      {/* ランナー（中央に小さく） */}
      <g transform="translate(38, 53) scale(0.85)">
        <circle cx="14" cy="6" r="3" fill="#FBBF24" />
        <path
          d="M 13 10 L 10 18 L 14 21 L 19 16 L 24 19"
          stroke="#FBBF24"
          strokeWidth="2.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        <path
          d="M 10 18 L 6 26 L 8 30"
          stroke="#FBBF24"
          strokeWidth="2.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        <path
          d="M 14 21 L 18 30 L 16 33"
          stroke="#FBBF24"
          strokeWidth="2.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </g>
    </svg>
  )
}

// ============================================================
// P. GPS トレイル（ピン＋曲線＋データドット）
// ============================================================
function IconP() {
  return (
    <svg viewBox="0 0 100 100" className="w-full h-full">
      <rect width="100" height="100" rx="22" fill="#0F172A" />
      {/* 蛇行する走路 */}
      <path
        d="M 16 78
           Q 30 78 32 65
           T 50 50
           T 70 35
           L 76 28"
        stroke="#10B981"
        strokeWidth="3.5"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray="0 0"
      />
      {/* スタートドット */}
      <circle cx="16" cy="78" r="3" fill="#10B981" />
      {/* 中継データドット */}
      <circle cx="32" cy="65" r="2.5" fill="#FBBF24" />
      <circle cx="50" cy="50" r="2.5" fill="#FBBF24" />
      <circle cx="70" cy="35" r="2.5" fill="#FBBF24" />
      {/* 到達GPSピン */}
      <g transform="translate(76, 28)">
        <path
          d="M 0 -8 C -7 -8 -7 1 0 8 C 7 1 7 -8 0 -8 Z"
          fill="#FBBF24"
          transform="translate(0, -2)"
        />
        <circle cx="0" cy="-6" r="2.5" fill="#0F172A" />
      </g>
    </svg>
  )
}

// ============================================================
// Q. データ・ストライド（足跡 + データ円）
// ============================================================
function IconQ() {
  return (
    <svg viewBox="0 0 100 100" className="w-full h-full">
      <rect width="100" height="100" rx="22" fill="#0F172A" />
      {/* 円形ベース（パフォーマンスメーター風） */}
      <circle cx="50" cy="50" r="35" stroke="#1E293B" strokeWidth="3" fill="none" />
      {/* 進捗弧（3/4） */}
      <circle
        cx="50"
        cy="50"
        r="35"
        stroke="#10B981"
        strokeWidth="3"
        fill="none"
        strokeDasharray="165 220"
        strokeDashoffset="-55"
        strokeLinecap="round"
        transform="rotate(-90 50 50)"
      />
      {/* 中央：3つの足跡（ストライド進行） */}
      <ellipse cx="32" cy="58" rx="4" ry="6" fill="#10B981" opacity="0.4" transform="rotate(-15 32 58)" />
      <ellipse cx="50" cy="50" rx="5" ry="7.5" fill="#10B981" opacity="0.7" />
      <ellipse cx="68" cy="42" rx="6" ry="9" fill="#FBBF24" transform="rotate(15 68 42)" />
      {/* 進行ライン */}
      <path
        d="M 32 58 L 50 50 L 68 42"
        stroke="#FBBF24"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeDasharray="2 3"
        fill="none"
        opacity="0.6"
      />
    </svg>
  )
}

// ============================================================
// R. デュアルライン（心拍 + 走行軌跡）
// ============================================================
function IconR() {
  return (
    <svg viewBox="0 0 100 100" className="w-full h-full">
      <rect width="100" height="100" rx="22" fill="#0F172A" />
      {/* 区切り線 */}
      <line x1="14" y1="50" x2="86" y2="50" stroke="#1E293B" strokeWidth="1" strokeDasharray="2 3" />
      {/* 上段：心拍ライン */}
      <path
        d="M 14 30
           L 24 30
           L 28 22
           L 32 38
           L 36 18
           L 40 30
           L 50 30
           L 54 26
           L 58 34
           L 62 22
           L 66 30
           L 86 30"
        stroke="#FBBF24"
        strokeWidth="2.5"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* 上段ラベル */}
      <text x="14" y="14" fontSize="7" fill="#FBBF24" fontWeight="bold" letterSpacing="0.5">
        BPM
      </text>
      {/* 下段：走行ペース上昇ライン（緩やかに右肩上がり） */}
      <path
        d="M 14 78
           Q 30 76 38 70
           T 60 60
           T 86 56"
        stroke="#10B981"
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
      />
      {/* 下段の走者シンボル（小さく終点に） */}
      <g transform="translate(76, 50)">
        <circle cx="0" cy="0" r="2.5" fill="#10B981" />
        <path
          d="M -1 2 L -3 7 L 0 9 L 3 6 L 6 8"
          stroke="#10B981"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </g>
      {/* 下段ラベル */}
      <text x="14" y="92" fontSize="7" fill="#10B981" fontWeight="bold" letterSpacing="0.5">
        PACE
      </text>
    </svg>
  )
}
