// 競技別フィジカルテストのカタログ。
// コーチが選手ごとに必要なテストを選択して割り当てる。

export type TestCategory =
  | 'running'
  | 'speed'
  | 'power'
  | 'agility'
  | 'endurance'
  | 'strength'
  | 'flexibility'
  | 'tightness'

export interface TestDef {
  key: string
  name: string
  /** 記録の単位 */
  unit: string
  category: TestCategory
  /** 関連競技タグ（コーチの選択補助用） */
  sports: string[]
  /** 実施方法 */
  howTo: string
  /** 値が小さいほど良い（タイム系）か */
  betterWhenLower?: boolean
}

export const TEST_CATEGORY_LABELS: Record<TestCategory, string> = {
  running: 'ランニング',
  speed: 'スピード',
  power: 'パワー・跳躍',
  agility: '敏捷性',
  endurance: '持久力',
  strength: '筋力',
  flexibility: '柔軟性',
  tightness: '筋タイトネス（柔軟性評価）',
}

export const TEST_CATALOG: TestDef[] = [
  // ── ランニング ──
  { key: 'run_20min', name: '20分全力走', unit: 'bpm/ペース', category: 'running', sports: ['ランニング', '陸上'], howTo: '平坦なコースで20分間、一定の最大ペースで走り、平均心拍と平均ペースを記録（LTHR・閾値ペース算出）。' },
  { key: 'run_5kmtt', name: '5kmタイムトライアル', unit: 'mm:ss', category: 'running', sports: ['ランニング', '陸上'], howTo: '5kmを全力で走りゴールタイムを記録。', betterWhenLower: true },
  { key: 'ftp', name: 'FTPテスト', unit: 'W', category: 'running', sports: ['ランニング', '自転車', 'トライアスロン'], howTo: '20分間の最大平均パワーを記録。' },
  // ── スピード ──
  { key: 'sprint_5m', name: '5mスプリント', unit: '秒', category: 'speed', sports: ['テニス', 'バスケ', 'サッカー'], howTo: '静止から5mを全力疾走しタイムを計測（初速・第一歩の速さ）。', betterWhenLower: true },
  { key: 'sprint_10m', name: '10mスプリント', unit: '秒', category: 'speed', sports: ['サッカー', 'テニス', 'バスケ', 'ラグビー'], howTo: '静止から10mを全力疾走しタイムを計測（加速力）。', betterWhenLower: true },
  { key: 'sprint_30m', name: '30mスプリント', unit: '秒', category: 'speed', sports: ['サッカー', 'テニス', '陸上', 'ラグビー'], howTo: '静止から30mを全力疾走しタイムを計測。', betterWhenLower: true },
  { key: 'sprint_50m', name: '50m走', unit: '秒', category: 'speed', sports: ['陸上', 'サッカー', '野球'], howTo: '50mを全力疾走しタイムを計測。', betterWhenLower: true },
  // ── 敏捷性 ──
  { key: 'agility_505', name: 'プロアジリティ（5-10-5）', unit: '秒', category: 'agility', sports: ['テニス', 'バスケ', 'サッカー', '野球'], howTo: '中央から左右5ヤードずつ切り返す505テスト。方向転換能力を計測。', betterWhenLower: true },
  { key: 'agility_ttest', name: 'Tテスト', unit: '秒', category: 'agility', sports: ['テニス', 'バスケ', 'サッカー'], howTo: 'T字コースを前進・サイドステップ・後退で走り切るタイム。', betterWhenLower: true },
  { key: 'agility_sidestep', name: '反復横跳び（20秒）', unit: '回', category: 'agility', sports: ['全般', 'バスケ', 'バレー'], howTo: '20秒間の反復横跳びの回数を記録。' },
  { key: 'agility_spider', name: 'スパイダーテスト', unit: '秒', category: 'agility', sports: ['テニス'], howTo: 'コート中央のボックスから5方向に置いたボールを1個ずつ取って戻る、テニス特異的な俊敏性テスト。合計タイムを計測。', betterWhenLower: true },
  { key: 'agility_hexagon', name: 'ヘキサゴンテスト', unit: '秒', category: 'agility', sports: ['テニス', '全般'], howTo: '六角形（各辺約60cm）の中央から外へ両足ジャンプで出入りを時計回りに3周。タイムを計測（俊敏性・協調性）。', betterWhenLower: true },
  // ── パワー・跳躍 ──
  { key: 'jump_cmj', name: '垂直跳び（CMJ）', unit: 'cm', category: 'power', sports: ['全般', 'バスケ', 'バレー', 'サッカー', 'テニス'], howTo: '反動を使った最大垂直跳びの高さを計測。下肢パワーの指標。' },
  { key: 'jump_broad', name: '立ち幅跳び', unit: 'cm', category: 'power', sports: ['全般', '陸上', 'テニス'], howTo: '両足踏切で前方へ跳んだ距離を計測。' },
  { key: 'mb_rotational', name: 'メディシンボール回旋投げ', unit: 'm', category: 'power', sports: ['テニス', '野球', 'ゴルフ'], howTo: '横向き立位からメディシンボール（2〜3kg）を体幹の回旋で側方へ全力投げ。飛距離を計測（テニスのストローク・サーブに重要な回旋パワー）。' },
  { key: 'mb_overhead', name: 'メディシンボール・オーバーヘッド投げ', unit: 'm', category: 'power', sports: ['テニス', 'バレー'], howTo: '頭上から前方へメディシンボールを全力投げ。飛距離を計測（サーブ・スマッシュの上肢/体幹パワー）。' },
  { key: 'mb_chest', name: 'メディシンボール・チェストパス', unit: 'm', category: 'power', sports: ['全般', 'テニス', 'バスケ'], howTo: '座位または立位で胸の前から前方へ全力でプッシュ。飛距離を計測（上肢パワー）。' },
  // ── 持久力 ──
  { key: 'yoyo_ir1', name: 'Yo-Yo IR1', unit: 'm', category: 'endurance', sports: ['サッカー', 'ラグビー', 'バスケ'], howTo: '間欠的回復走テスト。到達距離（m）を記録。間欠的持久力の指標。' },
  { key: 'beep_test', name: '20mシャトルラン（ビープテスト）', unit: '回/Level', category: 'endurance', sports: ['全般', 'サッカー', 'バスケ', 'テニス'], howTo: '電子音に合わせ20m往復。到達レベル/回数を記録（最大酸素摂取量の推定）。' },
  { key: 'cooper_12min', name: 'クーパーテスト（12分走）', unit: 'm', category: 'endurance', sports: ['全般', '陸上'], howTo: '12分間で走れた距離を記録。' },
  // ── 筋力 ──
  { key: 'grip', name: '握力', unit: 'kg', category: 'strength', sports: ['全般', '柔道', 'テニス'], howTo: '握力計で左右最大値を計測。' },
  { key: 'situp_30s', name: '上体起こし（30秒）', unit: '回', category: 'strength', sports: ['全般'], howTo: '30秒間の上体起こしの回数を記録（体幹筋力）。' },
  { key: 'plank', name: 'プランク保持', unit: '秒', category: 'strength', sports: ['全般'], howTo: 'プランク姿勢を保持できた時間（秒）を記録。' },
  // ── 柔軟性 ──
  { key: 'sit_reach', name: '長座体前屈', unit: 'cm', category: 'flexibility', sports: ['全般'], howTo: '長座位から前屈し到達距離を計測。' },
  // ── 筋タイトネス（一人で実施可・トレーナー視点の柔軟性評価） ──
  { key: 'tight_ffd', name: '指床間距離（FFD）', unit: 'cm', category: 'tightness', sports: ['全般'], howTo: '立位で膝を伸ばしたまま前屈し、指先と床の距離を計測。床に届かない=プラス、床より下=マイナス。ハムストリングス〜体幹後面のタイトネス。', betterWhenLower: true },
  { key: 'tight_hbd', name: '踵殿距離（HBD・大腿四頭筋）', unit: 'cm', category: 'tightness', sports: ['全般'], howTo: 'うつ伏せで片膝を曲げ踵を殿部へ近づけ、踵と殿部の距離を計測。距離が大きいほど大腿四頭筋がタイト（自分で踵を引き寄せて計測可）。', betterWhenLower: true },
  { key: 'tight_knee_wall', name: '膝壁テスト（足関節背屈）', unit: 'cm', category: 'tightness', sports: ['全般', 'ランニング', 'テニス'], howTo: 'つま先を壁に向け、踵を浮かさず膝を壁につけられる最大の足〜壁距離を計測。距離が大きいほど背屈可動域が広い（下腿三頭筋・ヒラメ筋）。壁さえあれば一人で可。' },
  { key: 'tight_thomas', name: 'トーマステスト変法（腸腰筋）', unit: '可/不可・°', category: 'tightness', sports: ['全般', 'ランニング'], howTo: '台の端に仰向けで片膝を抱え、反対脚を下ろす。太ももが水平より上がる=腸腰筋タイト。下ろした太ももの挙上角度を記録。' },
  { key: 'tight_shoulder', name: '背面握手（肩・結帯テスト）', unit: 'cm', category: 'tightness', sports: ['全般', 'テニス', '野球'], howTo: '片手を上から、もう一方を下から背中に回し、両手指先の距離を計測。届く=0、離れるほどタイト。左右差も確認（肩関節・広背筋）。', betterWhenLower: true },
  { key: 'tight_hip_abd', name: '開脚角度（股関節内転筋）', unit: '°', category: 'tightness', sports: ['全般', 'テニス', 'サッカー'], howTo: '長座位で無理なく開脚し、左右脚のなす角度を計測。内転筋群の柔軟性。' },
]

export function getTestDef(key: string): TestDef | undefined {
  return TEST_CATALOG.find((t) => t.key === key)
}

/** カテゴリ順にグループ化 */
export function groupedCatalog(): { category: TestCategory; label: string; tests: TestDef[] }[] {
  const order: TestCategory[] = ['running', 'speed', 'agility', 'power', 'endurance', 'strength', 'flexibility', 'tightness']
  return order.map((category) => ({
    category,
    label: TEST_CATEGORY_LABELS[category],
    tests: TEST_CATALOG.filter((t) => t.category === category),
  }))
}
