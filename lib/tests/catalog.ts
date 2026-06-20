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
}

export const TEST_CATALOG: TestDef[] = [
  // ── ランニング ──
  { key: 'run_20min', name: '20分全力走', unit: 'bpm/ペース', category: 'running', sports: ['ランニング', '陸上'], howTo: '平坦なコースで20分間、一定の最大ペースで走り、平均心拍と平均ペースを記録（LTHR・閾値ペース算出）。' },
  { key: 'run_5kmtt', name: '5kmタイムトライアル', unit: 'mm:ss', category: 'running', sports: ['ランニング', '陸上'], howTo: '5kmを全力で走りゴールタイムを記録。', betterWhenLower: true },
  { key: 'ftp', name: 'FTPテスト', unit: 'W', category: 'running', sports: ['ランニング', '自転車', 'トライアスロン'], howTo: '20分間の最大平均パワーを記録。' },
  // ── スピード ──
  { key: 'sprint_10m', name: '10mスプリント', unit: '秒', category: 'speed', sports: ['サッカー', 'テニス', 'バスケ', 'ラグビー'], howTo: '静止から10mを全力疾走しタイムを計測（加速力）。', betterWhenLower: true },
  { key: 'sprint_30m', name: '30mスプリント', unit: '秒', category: 'speed', sports: ['サッカー', 'テニス', '陸上', 'ラグビー'], howTo: '静止から30mを全力疾走しタイムを計測。', betterWhenLower: true },
  { key: 'sprint_50m', name: '50m走', unit: '秒', category: 'speed', sports: ['陸上', 'サッカー', '野球'], howTo: '50mを全力疾走しタイムを計測。', betterWhenLower: true },
  // ── 敏捷性 ──
  { key: 'agility_505', name: 'プロアジリティ（5-10-5）', unit: '秒', category: 'agility', sports: ['テニス', 'バスケ', 'サッカー', '野球'], howTo: '中央から左右5ヤードずつ切り返す505テスト。方向転換能力を計測。', betterWhenLower: true },
  { key: 'agility_ttest', name: 'Tテスト', unit: '秒', category: 'agility', sports: ['テニス', 'バスケ', 'サッカー'], howTo: 'T字コースを前進・サイドステップ・後退で走り切るタイム。', betterWhenLower: true },
  { key: 'agility_sidestep', name: '反復横跳び（20秒）', unit: '回', category: 'agility', sports: ['全般', 'バスケ', 'バレー'], howTo: '20秒間の反復横跳びの回数を記録。' },
  // ── パワー・跳躍 ──
  { key: 'jump_cmj', name: '垂直跳び（CMJ）', unit: 'cm', category: 'power', sports: ['全般', 'バスケ', 'バレー', 'サッカー'], howTo: '反動を使った最大垂直跳びの高さを計測。下肢パワーの指標。' },
  { key: 'jump_broad', name: '立ち幅跳び', unit: 'cm', category: 'power', sports: ['全般', '陸上'], howTo: '両足踏切で前方へ跳んだ距離を計測。' },
  // ── 持久力 ──
  { key: 'yoyo_ir1', name: 'Yo-Yo IR1', unit: 'm', category: 'endurance', sports: ['サッカー', 'ラグビー', 'バスケ'], howTo: '間欠的回復走テスト。到達距離（m）を記録。間欠的持久力の指標。' },
  { key: 'beep_test', name: '20mシャトルラン（ビープテスト）', unit: '回/Level', category: 'endurance', sports: ['全般', 'サッカー', 'バスケ'], howTo: '電子音に合わせ20m往復。到達レベル/回数を記録（最大酸素摂取量の推定）。' },
  { key: 'cooper_12min', name: 'クーパーテスト（12分走）', unit: 'm', category: 'endurance', sports: ['全般', '陸上'], howTo: '12分間で走れた距離を記録。' },
  // ── 筋力 ──
  { key: 'grip', name: '握力', unit: 'kg', category: 'strength', sports: ['全般', '柔道', 'テニス'], howTo: '握力計で左右最大値を計測。' },
  { key: 'situp_30s', name: '上体起こし（30秒）', unit: '回', category: 'strength', sports: ['全般'], howTo: '30秒間の上体起こしの回数を記録（体幹筋力）。' },
  { key: 'plank', name: 'プランク保持', unit: '秒', category: 'strength', sports: ['全般'], howTo: 'プランク姿勢を保持できた時間（秒）を記録。' },
  // ── 柔軟性 ──
  { key: 'sit_reach', name: '長座体前屈', unit: 'cm', category: 'flexibility', sports: ['全般'], howTo: '長座位から前屈し到達距離を計測。' },
]

export function getTestDef(key: string): TestDef | undefined {
  return TEST_CATALOG.find((t) => t.key === key)
}

/** カテゴリ順にグループ化 */
export function groupedCatalog(): { category: TestCategory; label: string; tests: TestDef[] }[] {
  const order: TestCategory[] = ['running', 'speed', 'agility', 'power', 'endurance', 'strength', 'flexibility']
  return order.map((category) => ({
    category,
    label: TEST_CATEGORY_LABELS[category],
    tests: TEST_CATALOG.filter((t) => t.category === category),
  }))
}
