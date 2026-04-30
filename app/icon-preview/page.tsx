/**
 * アイコン候補プレビューページ — No.20〜30（テキスト・数字なし）
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
          No.20〜30 — <span className="text-emerald-400">テキスト・数字なし</span>の純グラフィック版
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
          <IconCard name="No.20" desc="半円ゲージ＋針。目盛りのみ、文字なし。">
            <Icon20 />
          </IconCard>
          <IconCard name="No.21" desc="3同心リング。外から緑・黄・青。">
            <Icon21 />
          </IconCard>
          <IconCard name="No.22" desc="6軸レーダーチャート＋データポリゴン。">
            <Icon22 />
          </IconCard>
          <IconCard name="No.23" desc="上昇バーチャート＋トレンドライン。">
            <Icon23 />
          </IconCard>
          <IconCard name="No.24" desc="二重弧ゲージ。左右対称。">
            <Icon24 />
          </IconCard>
          <IconCard name="No.25" desc="円弧上にドットを配置したプログレス。">
            <Icon25 />
          </IconCard>
          <IconCard name="No.26" desc="ECG波形ライン＋グリッド。">
            <Icon26 />
          </IconCard>
          <IconCard name="No.27" desc="同心円ターゲット＋放射ライン。">
            <Icon27 />
          </IconCard>
          <IconCard name="No.28" desc="吹き出し内に棒グラフ（文字なし版）。">
            <Icon28 />
          </IconCard>
          <IconCard name="No.29" desc="横積み3本プログレスバー。">
            <Icon29 />
          </IconCard>
          <IconCard name="No.30" desc="データ点を結んだダイヤモンド型。">
            <Icon30 />
          </IconCard>
        </div>

        <div className="mt-12 rounded-xl border border-slate-800 bg-slate-900 p-6">
          <h2 className="text-lg font-bold text-white mb-3">採用方法</h2>
          <p className="text-sm text-slate-300">
            気に入った番号を教えてください。`app/icon.tsx` と `app/apple-icon.tsx`
            を該当デザインに差し替えます。
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
// No.20 — 半円ゲージ＋針（文字なし）
// ============================================================
function Icon20() {
  const ticks = Array.from({ length: 9 }, (_, i) => {
    const angle = -180 + i * 22.5
    const rad = (angle * Math.PI) / 180
    const len = i % 4 === 0 ? 7 : 4
    return {
      x1: 50 + 34 * Math.cos(rad),
      y1: 60 + 34 * Math.sin(rad),
      x2: 50 + (34 - len) * Math.cos(rad),
      y2: 60 + (34 - len) * Math.sin(rad),
    }
  })
  return (
    <svg viewBox="0 0 100 100" className="w-full h-full">
      <rect width="100" height="100" rx="22" fill="#0F172A" />
      {/* 背景弧 */}
      <path d="M 16 60 A 34 34 0 0 1 84 60" stroke="#1E293B" strokeWidth="7" fill="none" strokeLinecap="round" />
      {/* 低域（赤）*/}
      <path d="M 16 60 A 34 34 0 0 1 30 33" stroke="#EF4444" strokeWidth="7" fill="none" strokeLinecap="round" opacity="0.7" />
      {/* 中域（黄） */}
      <path d="M 30 33 A 34 34 0 0 1 70 33" stroke="#FBBF24" strokeWidth="7" fill="none" strokeLinecap="round" opacity="0.7" />
      {/* 高域（緑） */}
      <path d="M 70 33 A 34 34 0 0 1 84 60" stroke="#10B981" strokeWidth="7" fill="none" strokeLinecap="round" opacity="0.7" />
      {/* 目盛り */}
      {ticks.map((t, i) => (
        <line key={i} x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2}
          stroke="#475569" strokeWidth="1.5" strokeLinecap="round" />
      ))}
      {/* 針（緑ゾーン方向） */}
      <line x1="50" y1="60" x2="74" y2="38" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" />
      {/* 針の根元 */}
      <circle cx="50" cy="60" r="5" fill="#1E293B" stroke="#FFFFFF" strokeWidth="2" />
      {/* 底辺ドット2つ */}
      <circle cx="16" cy="60" r="2.5" fill="#EF4444" opacity="0.6" />
      <circle cx="84" cy="60" r="2.5" fill="#10B981" opacity="0.8" />
    </svg>
  )
}

// ============================================================
// No.21 — 3同心リング（文字なし）
// ============================================================
function Icon21() {
  return (
    <svg viewBox="0 0 100 100" className="w-full h-full">
      <rect width="100" height="100" rx="22" fill="#0F172A" />
      {/* 外リング 背景 r=36 周長226 */}
      <circle cx="50" cy="50" r="36" stroke="#1E293B" strokeWidth="6" fill="none" />
      {/* 外リング 85% */}
      <circle cx="50" cy="50" r="36"
        stroke="#10B981" strokeWidth="6" fill="none" strokeLinecap="round"
        strokeDasharray="192 226"
        strokeDashoffset="56"
        transform="rotate(-90 50 50)"
      />
      {/* 外リング終端ドット */}
      <circle cx="50" cy="14" r="3.5" fill="#10B981" />

      {/* 中リング 背景 r=27 周長170 */}
      <circle cx="50" cy="50" r="27" stroke="#1E293B" strokeWidth="6" fill="none" />
      {/* 中リング 65% */}
      <circle cx="50" cy="50" r="27"
        stroke="#FBBF24" strokeWidth="6" fill="none" strokeLinecap="round"
        strokeDasharray="110 170"
        strokeDashoffset="42"
        transform="rotate(-90 50 50)"
      />
      <circle cx="50" cy="23" r="3.5" fill="#FBBF24" />

      {/* 内リング 背景 r=18 周長113 */}
      <circle cx="50" cy="50" r="18" stroke="#1E293B" strokeWidth="6" fill="none" />
      {/* 内リング 50% */}
      <circle cx="50" cy="50" r="18"
        stroke="#38BDF8" strokeWidth="6" fill="none" strokeLinecap="round"
        strokeDasharray="56 113"
        strokeDashoffset="28"
        transform="rotate(-90 50 50)"
      />
      <circle cx="50" cy="32" r="3.5" fill="#38BDF8" />
    </svg>
  )
}

// ============================================================
// No.22 — 6軸レーダーチャート（文字なし）
// ============================================================
function Icon22() {
  // 6頂点：上, 右上, 右下, 下, 左下, 左上（r=30,20,10）
  const pts = (r: number) =>
    Array.from({ length: 6 }, (_, i) => {
      const a = (i * 60 - 90) * (Math.PI / 180)
      return [50 + r * Math.cos(a), 50 + r * Math.sin(a)]
    })
  const poly = (r: number) => pts(r).map(p => p.join(',')).join(' ')
  // データプロット（不均等に）
  const dataRatios = [0.95, 0.72, 0.85, 0.60, 0.80, 0.70]
  const dataPts = Array.from({ length: 6 }, (_, i) => {
    const a = (i * 60 - 90) * (Math.PI / 180)
    const r = 30 * dataRatios[i]
    return [50 + r * Math.cos(a), 50 + r * Math.sin(a)]
  })
  const dataPolyStr = dataPts.map(p => p.join(',')).join(' ')

  return (
    <svg viewBox="0 0 100 100" className="w-full h-full">
      <rect width="100" height="100" rx="22" fill="#0F172A" />
      {/* 軸線 */}
      {pts(30).map(([x, y], i) => (
        <line key={i} x1="50" y1="50" x2={x} y2={y} stroke="#1E293B" strokeWidth="1.5" />
      ))}
      {/* 内側グリッド多角形 */}
      <polygon points={poly(10)} stroke="#1E293B" strokeWidth="1" fill="none" />
      <polygon points={poly(20)} stroke="#1E293B" strokeWidth="1" fill="none" />
      <polygon points={poly(30)} stroke="#1E293B" strokeWidth="1" fill="none" />
      {/* データポリゴン */}
      <polygon points={dataPolyStr} fill="#10B981" opacity="0.25" stroke="#10B981" strokeWidth="2" strokeLinejoin="round" />
      {/* データ頂点ドット */}
      {dataPts.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="2.5" fill="#FBBF24" />
      ))}
    </svg>
  )
}

// ============================================================
// No.23 — 上昇バーチャート＋トレンドライン（文字なし）
// ============================================================
function Icon23() {
  const bars = [
    { x: 14, h: 14 }, { x: 25, h: 22 }, { x: 36, h: 18 },
    { x: 47, h: 32 }, { x: 58, h: 40 }, { x: 69, h: 50 }, { x: 80, h: 58 },
  ]
  return (
    <svg viewBox="0 0 100 100" className="w-full h-full">
      <rect width="100" height="100" rx="22" fill="#0F172A" />
      {/* ベースライン */}
      <line x1="10" y1="84" x2="92" y2="84" stroke="#1E293B" strokeWidth="1.5" />
      {/* バー */}
      {bars.map((b, i) => (
        <rect
          key={i} x={b.x} y={84 - b.h} width="9" height={b.h} rx="2"
          fill="#10B981"
          opacity={0.25 + i * 0.11}
        />
      ))}
      {/* 最終バートップをアンバーで強調 */}
      <rect x="80" y="26" width="9" height="4" rx="1.5" fill="#FBBF24" />
      {/* トレンドライン */}
      <polyline
        points="18,70 29,62 40,66 51,52 62,44 73,34 84,26"
        stroke="#FBBF24"
        strokeWidth="2.5"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="84" cy="26" r="3.5" fill="#FBBF24" />
      {/* グリッド横線 */}
      <line x1="10" y1="64" x2="92" y2="64" stroke="#1E293B" strokeWidth="1" strokeDasharray="3 3" />
      <line x1="10" y1="44" x2="92" y2="44" stroke="#1E293B" strokeWidth="1" strokeDasharray="3 3" />
    </svg>
  )
}

// ============================================================
// No.24 — 二重弧ゲージ（文字なし）
// ============================================================
function Icon24() {
  return (
    <svg viewBox="0 0 100 100" className="w-full h-full">
      <rect width="100" height="100" rx="22" fill="#0F172A" />
      {/* 外弧 背景 */}
      <path d="M 14 62 A 38 38 0 0 1 86 62" stroke="#1E293B" strokeWidth="6" fill="none" strokeLinecap="round" />
      {/* 外弧 進捗 80% */}
      <path d="M 14 62 A 38 38 0 0 1 79 34" stroke="#10B981" strokeWidth="6" fill="none" strokeLinecap="round" />
      {/* 外弧終端ドット */}
      <circle cx="79" cy="34" r="4" fill="#10B981" />

      {/* 内弧 背景 */}
      <path d="M 24 62 A 28 28 0 0 1 76 62" stroke="#1E293B" strokeWidth="6" fill="none" strokeLinecap="round" />
      {/* 内弧 進捗 55% */}
      <path d="M 24 62 A 28 28 0 0 1 63 38" stroke="#FBBF24" strokeWidth="6" fill="none" strokeLinecap="round" />
      {/* 内弧終端ドット */}
      <circle cx="63" cy="38" r="4" fill="#FBBF24" />

      {/* 中央ドット */}
      <circle cx="50" cy="62" r="4" fill="#1E293B" stroke="#475569" strokeWidth="2" />

      {/* 下部ミニライン3本 */}
      <line x1="26" y1="78" x2="44" y2="78" stroke="#10B981" strokeWidth="3" strokeLinecap="round" opacity="0.6" />
      <line x1="46" y1="78" x2="54" y2="78" stroke="#475569" strokeWidth="3" strokeLinecap="round" />
      <line x1="56" y1="78" x2="74" y2="78" stroke="#FBBF24" strokeWidth="3" strokeLinecap="round" opacity="0.6" />
    </svg>
  )
}

// ============================================================
// No.25 — 円弧上ドットプログレス（文字なし）
// ============================================================
function Icon25() {
  const total = 12
  const filled = 9
  return (
    <svg viewBox="0 0 100 100" className="w-full h-full">
      <rect width="100" height="100" rx="22" fill="#0F172A" />
      {/* 中心円 */}
      <circle cx="50" cy="50" r="16" stroke="#10B981" strokeWidth="2.5" fill="#10B981" opacity="0.1" />
      <circle cx="50" cy="50" r="7" fill="#10B981" opacity="0.4" />
      <circle cx="50" cy="50" r="3" fill="#10B981" />
      {/* ドット配置 */}
      {Array.from({ length: total }, (_, i) => {
        const angle = (i * (360 / total) - 90) * (Math.PI / 180)
        const r = 34
        const cx = 50 + r * Math.cos(angle)
        const cy = 50 + r * Math.sin(angle)
        const isFilled = i < filled
        return (
          <circle
            key={i}
            cx={cx} cy={cy} r={isFilled ? 4 : 3}
            fill={isFilled ? (i < 3 ? '#EF4444' : i < 7 ? '#FBBF24' : '#10B981') : '#1E293B'}
            stroke={isFilled ? 'none' : '#334155'}
            strokeWidth="1"
          />
        )
      })}
    </svg>
  )
}

// ============================================================
// No.26 — ECG波形ライン（文字なし）
// ============================================================
function Icon26() {
  return (
    <svg viewBox="0 0 100 100" className="w-full h-full">
      <rect width="100" height="100" rx="22" fill="#0F172A" />
      {/* グリッド */}
      {[30, 45, 60, 75].map(y => (
        <line key={y} x1="12" y1={y} x2="88" y2={y} stroke="#1E293B" strokeWidth="1" />
      ))}
      {[12, 30, 48, 66, 84].map(x => (
        <line key={x} x1={x} y1="25" x2={x} y2="80" stroke="#1E293B" strokeWidth="1" />
      ))}
      {/* ECG ライン */}
      <polyline
        points="12,52 22,52 25,52 27,30 29,52 31,68 35,52 44,52 54,52 58,52 62,26 64,52 66,62 70,52 80,52 88,52"
        stroke="#10B981"
        strokeWidth="2.5"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* ピーク強調ドット */}
      <circle cx="62" cy="26" r="3" fill="#FBBF24" />
      {/* 右端グロー */}
      <circle cx="88" cy="52" r="4" fill="#10B981" opacity="0.2" />
      <circle cx="88" cy="52" r="2.5" fill="#10B981" />
    </svg>
  )
}

// ============================================================
// No.27 — 同心円ターゲット＋放射ライン（文字なし）
// ============================================================
function Icon27() {
  return (
    <svg viewBox="0 0 100 100" className="w-full h-full">
      <rect width="100" height="100" rx="22" fill="#0F172A" />
      {/* 同心円 */}
      <circle cx="50" cy="50" r="34" stroke="#10B981" strokeWidth="1.5" fill="none" opacity="0.25" />
      <circle cx="50" cy="50" r="24" stroke="#10B981" strokeWidth="1.5" fill="none" opacity="0.45" />
      <circle cx="50" cy="50" r="14" stroke="#10B981" strokeWidth="1.5" fill="none" opacity="0.65" />
      {/* 中心 */}
      <circle cx="50" cy="50" r="5" fill="#FBBF24" />
      {/* 放射ライン（4方向）＋先端ドット */}
      <line x1="13" y1="18" x2="44" y2="44" stroke="#10B981" strokeWidth="2" strokeLinecap="round" />
      <circle cx="13" cy="18" r="3" fill="#10B981" />
      <line x1="87" y1="18" x2="56" y2="44" stroke="#10B981" strokeWidth="2" strokeLinecap="round" />
      <circle cx="87" cy="18" r="3" fill="#10B981" />
      <line x1="13" y1="82" x2="44" y2="56" stroke="#10B981" strokeWidth="2" strokeLinecap="round" />
      <circle cx="13" cy="82" r="3" fill="#10B981" />
      <line x1="87" y1="82" x2="56" y2="56" stroke="#10B981" strokeWidth="2" strokeLinecap="round" />
      <circle cx="87" cy="82" r="3" fill="#10B981" />
      {/* 斜め2本追加 */}
      <line x1="50" y1="14" x2="50" y2="35" stroke="#10B981" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
      <line x1="50" y1="65" x2="50" y2="86" stroke="#10B981" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
    </svg>
  )
}

// ============================================================
// No.28 — 吹き出し＋棒グラフ（文字なし）
// ============================================================
function Icon28() {
  return (
    <svg viewBox="0 0 100 100" className="w-full h-full">
      <rect width="100" height="100" rx="22" fill="#0F172A" />
      {/* 吹き出し背景 */}
      <path
        d="M 16 22 Q 16 14 24 14 L 76 14 Q 84 14 84 22 L 84 62
           Q 84 70 76 70 L 46 70 L 32 84 L 36 70 L 24 70
           Q 16 70 16 62 Z"
        fill="#10B981" opacity="0.1"
      />
      <path
        d="M 16 22 Q 16 14 24 14 L 76 14 Q 84 14 84 22 L 84 62
           Q 84 70 76 70 L 46 70 L 32 84 L 36 70 L 24 70
           Q 16 70 16 62 Z"
        stroke="#10B981" strokeWidth="2" fill="none" strokeLinejoin="round"
      />
      {/* 内の棒グラフ5本（上昇） */}
      <rect x="24" y="54" width="7" height="10" rx="1.5" fill="#10B981" opacity="0.4" />
      <rect x="35" y="46" width="7" height="18" rx="1.5" fill="#10B981" opacity="0.6" />
      <rect x="46" y="36" width="7" height="28" rx="1.5" fill="#10B981" opacity="0.8" />
      <rect x="57" y="42" width="7" height="22" rx="1.5" fill="#10B981" opacity="0.7" />
      <rect x="68" y="28" width="7" height="36" rx="1.5" fill="#FBBF24" />
      {/* ベースライン */}
      <line x1="22" y1="64" x2="78" y2="64" stroke="#10B981" strokeWidth="1" opacity="0.4" />
    </svg>
  )
}

// ============================================================
// No.29 — 横積みプログレスバー3本（文字なし）
// ============================================================
function Icon29() {
  return (
    <svg viewBox="0 0 100 100" className="w-full h-full">
      <rect width="100" height="100" rx="22" fill="#0F172A" />

      {/* バー1（上）緑 80% */}
      <rect x="16" y="26" width="68" height="10" rx="5" fill="#1E293B" />
      <rect x="16" y="26" width="54" height="10" rx="5" fill="#10B981" />
      <circle cx="70" cy="31" r="5" fill="#0F172A" stroke="#10B981" strokeWidth="2" />
      <circle cx="70" cy="31" r="2.5" fill="#10B981" />

      {/* バー2（中）黄 55% */}
      <rect x="16" y="45" width="68" height="10" rx="5" fill="#1E293B" />
      <rect x="16" y="45" width="37" height="10" rx="5" fill="#FBBF24" />
      <circle cx="53" cy="50" r="5" fill="#0F172A" stroke="#FBBF24" strokeWidth="2" />
      <circle cx="53" cy="50" r="2.5" fill="#FBBF24" />

      {/* バー3（下）青 35% */}
      <rect x="16" y="64" width="68" height="10" rx="5" fill="#1E293B" />
      <rect x="16" y="64" width="24" height="10" rx="5" fill="#38BDF8" />
      <circle cx="40" cy="69" r="5" fill="#0F172A" stroke="#38BDF8" strokeWidth="2" />
      <circle cx="40" cy="69" r="2.5" fill="#38BDF8" />

      {/* 左端ドットマーカー3つ */}
      <rect x="10" y="28" width="4" height="6" rx="1" fill="#10B981" />
      <rect x="10" y="47" width="4" height="6" rx="1" fill="#FBBF24" />
      <rect x="10" y="66" width="4" height="6" rx="1" fill="#38BDF8" />
    </svg>
  )
}

// ============================================================
// No.30 — データ点を結んだダイヤモンド型（文字なし）
// ============================================================
function Icon30() {
  // 4軸（上・右・下・左）× 3グリッド
  const grid = [15, 25, 35]
  // データ点（各軸の距離）
  const data = { top: 32, right: 28, bottom: 30, left: 34 }
  const cx = 50, cy = 50
  return (
    <svg viewBox="0 0 100 100" className="w-full h-full">
      <rect width="100" height="100" rx="22" fill="#0F172A" />
      {/* 4軸 */}
      <line x1={cx} y1={cy - 36} x2={cx} y2={cy + 36} stroke="#1E293B" strokeWidth="1.5" />
      <line x1={cx - 36} y1={cy} x2={cx + 36} y2={cy} stroke="#1E293B" strokeWidth="1.5" />
      {/* グリッドひし形 */}
      {grid.map(r => (
        <polygon
          key={r}
          points={`${cx},${cy - r} ${cx + r},${cy} ${cx},${cy + r} ${cx - r},${cy}`}
          stroke="#1E293B" strokeWidth="1" fill="none"
        />
      ))}
      {/* データひし形（緑） */}
      <polygon
        points={`${cx},${cy - data.top} ${cx + data.right},${cy} ${cx},${cy + data.bottom} ${cx - data.left},${cy}`}
        fill="#10B981" opacity="0.2"
        stroke="#10B981" strokeWidth="2.5" strokeLinejoin="round"
      />
      {/* 4頂点ドット */}
      <circle cx={cx} cy={cy - data.top} r="4" fill="#FBBF24" />
      <circle cx={cx + data.right} cy={cy} r="4" fill="#FBBF24" />
      <circle cx={cx} cy={cy + data.bottom} r="4" fill="#FBBF24" />
      <circle cx={cx - data.left} cy={cy} r="4" fill="#FBBF24" />
      {/* 中心 */}
      <circle cx={cx} cy={cy} r="3.5" fill="#10B981" />
    </svg>
  )
}
