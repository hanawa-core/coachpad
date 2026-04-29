'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Sparkles, Check, Save, FileText, Upload, Trash2 } from 'lucide-react'
import { useAuth } from '@/components/providers/AuthProvider'
import { TopBar } from '@/components/layout/TopBar'
import {
  getCoachAiProfile,
  saveCoachAiProfile,
} from '@/lib/firebase/firestore'

const PLACEHOLDERS = {
  philosophy: `例:
「すべてのランナーに科学を」を理念に、解剖学とデータに基づいた指導を行う。
無理な根性論ではなく、再現性のある方法で長く走り続けられる身体作りを優先。
個別性（年齢・職業・家族構成）を尊重し、現実的に続けられるメニューを提案する。`,

  methodology: `例:
- ベースは Lydiard 式の有酸素ベース構築（CTL を 60→80 へ段階的に上げる）
- 週 1 回のロング走、週 1 回の閾値走、それ以外はイージーラン
- 心拍ベース（ゾーン2を80%）でゆっくり走る量を確保
- トレイル選手は登坂×登り耐性のための補強を重視
- ピーキングは Daniels の 4-3-2-1 タペーリング`,

  preferences: `例:
- 好む種目: シングルレッグスクワット、ヒップヒンジ、カーフレイズ、プランクバリエーション
- 避けたい種目: マシン主体のレッグエクステンション（単関節すぎる）、過度なジャンプ系（怪我リスク）
- 自体重・ダンベル中心。ジムなしでも完結するメニューを基本とする`,

  nutrition: `例:
- レース中の補給は体重1kgあたり0.5-0.8g/h の糖質を目標
- 日常は炭水化物を抜かない（ローカーボはトレイル選手には不向き）
- ナトリウムは発汗量に応じて 300-700mg/L 補給`,

  injuryPrevention: `例:
- 走り込み量は週10%以上増やさない（10%ルール）
- 痛みが出たら即休む。3日以上続く違和感はメディカルチェック
- 補強種目は怪我予防が第一目的、パフォーマンス向上は二次的`,

  references: `例:
- Daniels' Running Formula
- Hanson's Marathon Method
- 私のブログ: enduranceLab.example.com
- スポーツ科学誌の最新研究を参考`,

  customInstructions: `例:
- 文体は「です・ます」で丁寧に
- 専門用語は最初に簡単な説明を添える
- 選手の現在の数値（CTL/TSB等）に必ず言及してから提案する
- 「絶対」「必ず」など強い表現は避ける`,
}

export default function AiProfilePage() {
  const { user, profile } = useAuth()
  const [data, setData] = useState({
    philosophy: '',
    methodology: '',
    preferences: '',
    nutrition: '',
    injuryPrevention: '',
    references: '',
    customInstructions: '',
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [savedAt, setSavedAt] = useState<Date | null>(null)

  // ドキュメント管理
  const [documents, setDocuments] = useState<any[]>([])
  const [docFile, setDocFile] = useState<File | null>(null)
  const [docDescription, setDocDescription] = useState('')
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')

  useEffect(() => {
    if (!user) return
    getCoachAiProfile(user.uid).then((p) => {
      if (p) {
        setData({
          philosophy: p.philosophy ?? '',
          methodology: p.methodology ?? '',
          preferences: p.preferences ?? '',
          nutrition: p.nutrition ?? '',
          injuryPrevention: p.injuryPrevention ?? '',
          references: p.references ?? '',
          customInstructions: p.customInstructions ?? '',
        })
        setDocuments(p.documents ?? [])
      }
      setLoading(false)
    })
  }, [user])

  if (profile?.role !== 'coach') {
    return (
      <>
        <TopBar title="AIプロフィール" />
        <div className="p-4 sm:p-6">
          <p className="text-sm text-slate-400">この機能はコーチのみ利用できます</p>
        </div>
      </>
    )
  }

  const handleSave = async () => {
    if (!user) return
    setSaving(true)
    try {
      await saveCoachAiProfile(user.uid, { ...data, documents })
      setSavedAt(new Date())
    } finally {
      setSaving(false)
    }
  }

  const handleUpload = async () => {
    if (!user || !docFile) return
    setUploadError('')
    setUploading(true)
    try {
      const idToken = await user.getIdToken()
      const fd = new FormData()
      fd.append('file', docFile)
      fd.append('description', docDescription)
      const res = await fetch('/api/ai/upload-document', {
        method: 'POST',
        headers: { Authorization: `Bearer ${idToken}` },
        body: fd,
      })
      const result = await res.json()
      if (!res.ok) throw new Error(result.error || 'アップロード失敗')
      setDocuments([...documents, result.document])
      setDocFile(null)
      setDocDescription('')
    } catch (e: any) {
      setUploadError(e.message)
    } finally {
      setUploading(false)
    }
  }

  const handleDeleteDocument = async (fileId: string) => {
    if (!user) return
    if (!confirm('この資料を削除しますか？')) return
    const idToken = await user.getIdToken()
    await fetch('/api/ai/delete-document', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${idToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ fileId }),
    })
    setDocuments(documents.filter((d: any) => d.fileId !== fileId))
  }

  const totalChars = Object.values(data).reduce((sum, v) => sum + v.length, 0)

  return (
    <>
      <TopBar title="AIプロフィール" />
      <div className="p-4 sm:p-6 max-w-3xl space-y-4">
        <Link
          href="/settings"
          className="inline-flex items-center gap-1 text-sm text-slate-400 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          設定に戻る
        </Link>

        {/* 説明 */}
        <div className="rounded-xl border border-purple-700/50 bg-purple-950/20 p-5">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="h-5 w-5 text-purple-400" />
            <h2 className="text-base font-semibold text-white">あなたのメソッドを学習させる</h2>
          </div>
          <p className="text-sm text-slate-300">
            ここで入力した内容は、AIが筋トレメニュー・ランニングプラン・種目を生成するときに
            <span className="font-semibold text-purple-300"> 必ず参照されます</span>。
          </p>
          <p className="mt-2 text-xs text-slate-400">
            一般論ではなく <span className="text-white">「あなたの考え方に沿った提案」</span> をAIが生成するようになります。
          </p>
          <ul className="mt-3 space-y-1 text-xs text-slate-400">
            <li>✓ 入力内容は自動でキャッシュされ、2回目以降の生成は約10分の1のコスト</li>
            <li>✓ 文字数に厳密な制限はないが、各セクション 200〜2000字程度がバランス良い</li>
            <li>✓ 後から自由に編集・追加できます</li>
          </ul>
        </div>

        {/* 資料アップロード */}
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
          <div className="flex items-center gap-2 mb-2">
            <FileText className="h-5 w-5 text-emerald-400" />
            <h3 className="text-base font-semibold text-white">メソッド資料 (PDF・テキスト)</h3>
          </div>
          <p className="mb-4 text-xs text-slate-400">
            あなたのトレーニング理論を解説したPDF・自著・参考論文などをアップロードすると、
            AIが資料を読み込んでランニングプランを作成します（最大32MB / ファイル）
          </p>

          {/* 既存ドキュメント */}
          {documents.length > 0 && (
            <ul className="mb-4 space-y-2">
              {documents.map((d: any) => (
                <li
                  key={d.fileId}
                  className="flex items-start gap-3 rounded-lg border border-slate-700 bg-slate-950 p-3"
                >
                  <FileText className="h-4 w-4 text-slate-400 mt-0.5 shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-white">{d.filename}</p>
                    {d.description && (
                      <p className="text-xs text-slate-400 mt-0.5">{d.description}</p>
                    )}
                    <p className="text-[10px] text-slate-600 mt-0.5">
                      {Math.round(d.sizeBytes / 1024)} KB
                    </p>
                  </div>
                  <button
                    onClick={() => handleDeleteDocument(d.fileId)}
                    className="rounded p-1 text-slate-500 hover:bg-red-900/30 hover:text-red-400"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          )}

          {/* アップロードフォーム */}
          <div className="space-y-2 rounded-lg border border-dashed border-slate-700 bg-slate-950/50 p-4">
            <input
              type="file"
              accept=".pdf,.txt,.md,application/pdf,text/plain,text/markdown"
              onChange={(e) => setDocFile(e.target.files?.[0] ?? null)}
              className="block w-full text-xs text-slate-300 file:mr-3 file:rounded file:border-0 file:bg-slate-800 file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-white file:hover:bg-slate-700"
            />
            <input
              type="text"
              value={docDescription}
              onChange={(e) => setDocDescription(e.target.value)}
              placeholder="この資料の説明（例: 私の自著・トレーニング論第3版）"
              className="w-full rounded border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs text-white placeholder-slate-600"
            />
            <button
              onClick={handleUpload}
              disabled={!docFile || uploading}
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-1.5 text-xs font-medium text-white hover:bg-emerald-500 disabled:opacity-60"
            >
              <Upload className={`h-3.5 w-3.5 ${uploading ? 'animate-pulse' : ''}`} />
              {uploading ? 'アップロード中...' : 'アップロード'}
            </button>
            {uploadError && (
              <p className="text-xs text-red-400">エラー: {uploadError}</p>
            )}
          </div>
        </div>

        {/* 入力フォーム */}
        <Section
          label="基本理念・コーチング哲学"
          hint="あなたが選手に伝えたい根本的な考え方"
          value={data.philosophy}
          placeholder={PLACEHOLDERS.philosophy}
          onChange={(v) => setData({ ...data, philosophy: v })}
        />
        <Section
          label="指導メソッド・トレーニング理論"
          hint="どんなトレーニング理論をベースにしているか、CTL/TSBの解釈方針など"
          value={data.methodology}
          placeholder={PLACEHOLDERS.methodology}
          onChange={(v) => setData({ ...data, methodology: v })}
        />
        <Section
          label="好む種目・避ける種目・補強の方針"
          hint="筋トレで重視している種目、避けている種目とその理由"
          value={data.preferences}
          placeholder={PLACEHOLDERS.preferences}
          onChange={(v) => setData({ ...data, preferences: v })}
        />
        <Section
          label="栄養・補給に関する方針"
          hint="日常の食事方針、レース中の補給戦略"
          value={data.nutrition}
          placeholder={PLACEHOLDERS.nutrition}
          onChange={(v) => setData({ ...data, nutrition: v })}
        />
        <Section
          label="怪我予防の考え方"
          hint="怪我リスク管理の原則、痛みへの対応方針"
          value={data.injuryPrevention}
          placeholder={PLACEHOLDERS.injuryPrevention}
          onChange={(v) => setData({ ...data, injuryPrevention: v })}
        />
        <Section
          label="参考とする理論・文献"
          hint="どの本・研究・ブログを参考にしているか"
          value={data.references}
          placeholder={PLACEHOLDERS.references}
          onChange={(v) => setData({ ...data, references: v })}
        />
        <Section
          label="AIへの追加指示"
          hint="文体・敬語/タメ語・必ず言及してほしい点など"
          value={data.customInstructions}
          placeholder={PLACEHOLDERS.customInstructions}
          onChange={(v) => setData({ ...data, customInstructions: v })}
        />

        {/* 保存バー */}
        <div className="sticky bottom-4 rounded-xl border border-slate-800 bg-slate-900/95 backdrop-blur p-4">
          <div className="flex items-center justify-between">
            <div className="text-xs text-slate-400">
              総文字数: <span className="font-semibold text-white">{totalChars}</span>
              {savedAt && (
                <span className="ml-3 inline-flex items-center gap-1 text-emerald-400">
                  <Check className="h-3 w-3" />
                  {savedAt.toLocaleTimeString('ja-JP')} に保存
                </span>
              )}
            </div>
            <button
              onClick={handleSave}
              disabled={saving || loading}
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-5 py-2 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-60"
            >
              <Save className="h-4 w-4" />
              {saving ? '保存中...' : '保存'}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

function Section({
  label,
  hint,
  value,
  placeholder,
  onChange,
}: {
  label: string
  hint: string
  value: string
  placeholder: string
  onChange: (v: string) => void
}) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
      <label className="block">
        <div className="flex items-baseline justify-between mb-1">
          <span className="text-sm font-semibold text-white">{label}</span>
          <span className="text-xs text-slate-500">{value.length}字</span>
        </div>
        <p className="mb-2 text-xs text-slate-400">{hint}</p>
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={6}
          className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white placeholder-slate-600 focus:border-purple-500 focus:outline-none"
        />
      </label>
    </div>
  )
}
