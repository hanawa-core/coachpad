import { adminDb } from '@/lib/firebase/admin'
import type Anthropic from '@anthropic-ai/sdk'

interface CoachProfileData {
  philosophy: string
  methodology: string
  preferences: string
  nutrition: string
  injuryPrevention: string
  references: string
  customInstructions: string
}

/**
 * コーチのAIプロフィールをサーバー側で取得
 */
export async function fetchCoachAiProfile(coachId: string): Promise<CoachProfileData | null> {
  const snap = await adminDb()
    .collection('users')
    .doc(coachId)
    .collection('aiProfile')
    .doc('main')
    .get()
  if (!snap.exists) return null
  const d = snap.data()!
  return {
    philosophy: d.philosophy ?? '',
    methodology: d.methodology ?? '',
    preferences: d.preferences ?? '',
    nutrition: d.nutrition ?? '',
    injuryPrevention: d.injuryPrevention ?? '',
    references: d.references ?? '',
    customInstructions: d.customInstructions ?? '',
  }
}

/**
 * コーチプロフィールをMarkdown形式に整形
 */
export function formatCoachProfileBlock(profile: CoachProfileData): string {
  const sections: string[] = []

  sections.push('# このコーチの指導理念とメソッド\n')
  sections.push(
    'これからのあなたの提案は、すべて以下のコーチの理念とメソッドに沿ったものでなければなりません。\n'
  )

  if (profile.philosophy.trim()) {
    sections.push(`## 基本理念・コーチング哲学\n${profile.philosophy.trim()}\n`)
  }
  if (profile.methodology.trim()) {
    sections.push(`## 指導メソッド・トレーニング理論\n${profile.methodology.trim()}\n`)
  }
  if (profile.preferences.trim()) {
    sections.push(`## 好む種目・避ける種目・補強の方針\n${profile.preferences.trim()}\n`)
  }
  if (profile.nutrition.trim()) {
    sections.push(`## 栄養・補給に関する方針\n${profile.nutrition.trim()}\n`)
  }
  if (profile.injuryPrevention.trim()) {
    sections.push(`## 怪我予防の考え方\n${profile.injuryPrevention.trim()}\n`)
  }
  if (profile.references.trim()) {
    sections.push(`## 参考とする理論・文献\n${profile.references.trim()}\n`)
  }
  if (profile.customInstructions.trim()) {
    sections.push(`## AIへの追加指示\n${profile.customInstructions.trim()}\n`)
  }

  sections.push(
    '\n上記の理念・メソッドを最優先し、矛盾がある場合は一般論よりこのコーチの方針に従ってください。'
  )

  return sections.join('\n')
}

/**
 * コーチプロフィールが何か登録されているかチェック
 */
export function hasContent(profile: CoachProfileData): boolean {
  return (
    profile.philosophy.trim().length > 0 ||
    profile.methodology.trim().length > 0 ||
    profile.preferences.trim().length > 0 ||
    profile.nutrition.trim().length > 0 ||
    profile.injuryPrevention.trim().length > 0 ||
    profile.references.trim().length > 0 ||
    profile.customInstructions.trim().length > 0
  )
}

/**
 * コーチがアップロードしたドキュメントの file_id 一覧を取得
 */
export async function fetchCoachDocumentIds(coachId: string): Promise<
  { fileId: string; filename: string; description: string }[]
> {
  const snap = await adminDb()
    .collection('users')
    .doc(coachId)
    .collection('aiProfile')
    .doc('main')
    .get()
  if (!snap.exists) return []
  const docs = (snap.data()?.documents ?? []) as any[]
  return docs.map((d) => ({
    fileId: d.fileId,
    filename: d.filename ?? '',
    description: d.description ?? '',
  }))
}

/**
 * コーチプロフィール込みのシステムプロンプト配列を構築
 * 末尾の固定プロンプトに cache_control を入れることでキャッシュヒット
 *
 * 構造:
 *   [0] コーチプロフィール（変動が少ない・1日に何度も使うのでキャッシュ）← cache_control
 *   [1] 機能固有のシステムプロンプト（変動なし）
 */
export async function buildSystemPromptWithCoach(
  coachId: string,
  baseSystemPrompt: string
): Promise<Anthropic.TextBlockParam[]> {
  const profile = await fetchCoachAiProfile(coachId)

  const blocks: Anthropic.TextBlockParam[] = []

  if (profile && hasContent(profile)) {
    blocks.push({
      type: 'text',
      text: formatCoachProfileBlock(profile),
      // 5分TTLキャッシュ。同じコーチが連続で生成すると2回目以降は10分の1のコスト
      cache_control: { type: 'ephemeral' },
    })
  }

  blocks.push({
    type: 'text',
    text: baseSystemPrompt,
  })

  return blocks
}
