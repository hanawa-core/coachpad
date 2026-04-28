'use client'

import { useEffect, useState } from 'react'
import { Heart, Moon, Battery, Smile, Brain, Activity, Scale, Save, Check } from 'lucide-react'
import { saveWellnessEntry, getWellnessEntry } from '@/lib/firebase/firestore'
import type { WellnessScore } from '@/types'

interface Props {
  athleteId: string
  date?: string
  onSaved?: () => void
}

const SCORE_LABELS: Record<string, [string, string]> = {
  // [low, high] meaning
  sleep: ['とても悪い', '最高'],
  soreness: ['なし', 'ひどい'],
  fatigue: ['爽快', '極度疲労'],
  mood: ['最悪', '最高'],
  stress: ['なし', '極度'],
}

export function WellnessForm({ athleteId, date: dateProp, onSaved }: Props) {
  const today = new Date().toISOString().split('T')[0]
  const date = dateProp ?? today

  const [sleepHours, setSleepHours] = useState('')
  const [sleepQuality, setSleepQuality] = useState<WellnessScore | null>(null)
  const [soreness, setSoreness] = useState<WellnessScore | null>(null)
  const [fatigue, setFatigue] = useState<WellnessScore | null>(null)
  const [mood, setMood] = useState<WellnessScore | null>(null)
  const [stress, setStress] = useState<WellnessScore | null>(null)
  const [restingHr, setRestingHr] = useState('')
  const [weight, setWeight] = useState('')
  const [notes, setNotes] = useState('')

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [savedAt, setSavedAt] = useState<Date | null>(null)

  useEffect(() => {
    getWellnessEntry(athleteId, date).then((entry) => {
      if (entry) {
        setSleepHours(entry.sleepHours?.toString() ?? '')
        setSleepQuality(entry.sleepQuality)
        setSoreness(entry.soreness)
        setFatigue(entry.fatigue)
        setMood(entry.mood)
        setStress(entry.stress)
        setRestingHr(entry.restingHr?.toString() ?? '')
        setWeight(entry.weight?.toString() ?? '')
        setNotes(entry.notes ?? '')
      }
      setLoading(false)
    })
  }, [athleteId, date])

  const handleSave = async () => {
    setSaving(true)
    try {
      await saveWellnessEntry(athleteId, date, {
        sleepHours: sleepHours ? parseFloat(sleepHours) : null,
        sleepQuality,
        soreness,
        fatigue,
        mood,
        stress,
        restingHr: restingHr ? parseInt(restingHr) : null,
        weight: weight ? parseFloat(weight) : null,
        notes,
      })
      setSavedAt(new Date())
      onSaved?.()
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
        <div className="h-4 w-32 animate-pulse rounded bg-slate-800" />
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900 p-6 space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-base font-semibold text-white">
          <Heart className="h-5 w-5 text-pink-400" />
          {date === today ? '本日の体調記録' : `${date} の体調記録`}
        </h2>
        {savedAt && (
          <span className="inline-flex items-center gap-1 text-xs text-emerald-400">
            <Check className="h-3 w-3" />
            保存しました
          </span>
        )}
      </div>

      {/* スコアグループ */}
      <div className="space-y-4">
        <ScoreSelector
          icon={Moon}
          color="text-blue-400"
          label="睡眠の質"
          lowLabel={SCORE_LABELS.sleep[0]}
          highLabel={SCORE_LABELS.sleep[1]}
          value={sleepQuality}
          onChange={setSleepQuality}
          reverse={false}
        />
        <ScoreSelector
          icon={Battery}
          color="text-amber-400"
          label="疲労感"
          lowLabel={SCORE_LABELS.fatigue[0]}
          highLabel={SCORE_LABELS.fatigue[1]}
          value={fatigue}
          onChange={setFatigue}
          reverse={true}
        />
        <ScoreSelector
          icon={Activity}
          color="text-red-400"
          label="筋肉痛・違和感"
          lowLabel={SCORE_LABELS.soreness[0]}
          highLabel={SCORE_LABELS.soreness[1]}
          value={soreness}
          onChange={setSoreness}
          reverse={true}
        />
        <ScoreSelector
          icon={Smile}
          color="text-emerald-400"
          label="気分"
          lowLabel={SCORE_LABELS.mood[0]}
          highLabel={SCORE_LABELS.mood[1]}
          value={mood}
          onChange={setMood}
          reverse={false}
        />
        <ScoreSelector
          icon={Brain}
          color="text-purple-400"
          label="ストレス"
          lowLabel={SCORE_LABELS.stress[0]}
          highLabel={SCORE_LABELS.stress[1]}
          value={stress}
          onChange={setStress}
          reverse={true}
        />
      </div>

      {/* 数値入力 */}
      <div className="grid grid-cols-3 gap-3 pt-3 border-t border-slate-800">
        <div>
          <label className="mb-1 flex items-center gap-1 text-xs font-medium text-slate-300">
            <Moon className="h-3 w-3" />
            睡眠時間 (h)
          </label>
          <input
            type="number"
            step="0.5"
            value={sleepHours}
            onChange={(e) => setSleepHours(e.target.value)}
            placeholder="7.5"
            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
          />
        </div>
        <div>
          <label className="mb-1 flex items-center gap-1 text-xs font-medium text-slate-300">
            <Heart className="h-3 w-3" />
            安静時心拍
          </label>
          <input
            type="number"
            value={restingHr}
            onChange={(e) => setRestingHr(e.target.value)}
            placeholder="50"
            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
          />
        </div>
        <div>
          <label className="mb-1 flex items-center gap-1 text-xs font-medium text-slate-300">
            <Scale className="h-3 w-3" />
            体重 (kg)
          </label>
          <input
            type="number"
            step="0.1"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            placeholder="60.5"
            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
          />
        </div>
      </div>

      {/* メモ */}
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-300">メモ・コメント</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          placeholder="例: 朝から少し怠い。膝の違和感あり。"
          className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
        />
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-60"
      >
        <Save className="h-4 w-4" />
        {saving ? '保存中...' : '保存'}
      </button>
    </div>
  )
}

function ScoreSelector({
  icon: Icon,
  color,
  label,
  lowLabel,
  highLabel,
  value,
  onChange,
  reverse,
}: {
  icon: React.ComponentType<{ className?: string }>
  color: string
  label: string
  lowLabel: string
  highLabel: string
  value: WellnessScore | null
  onChange: (v: WellnessScore) => void
  reverse: boolean // true なら 1=良い 5=悪い
}) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-1.5">
        <Icon className={`h-4 w-4 ${color}`} />
        <span className="text-sm font-medium text-white">{label}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-[10px] text-slate-500 w-16 text-right">{lowLabel}</span>
        <div className="flex flex-1 gap-1">
          {[1, 2, 3, 4, 5].map((n) => {
            const score = n as WellnessScore
            const isSelected = value === score
            const colorIntensity = reverse ? n : 6 - n // 良い=緑、悪い=赤
            const bgColor =
              colorIntensity <= 2
                ? 'bg-emerald-600 hover:bg-emerald-500'
                : colorIntensity === 3
                  ? 'bg-yellow-600 hover:bg-yellow-500'
                  : 'bg-red-600 hover:bg-red-500'
            return (
              <button
                type="button"
                key={n}
                onClick={() => onChange(score)}
                className={`flex-1 rounded-lg py-2 text-sm font-bold transition-all ${
                  isSelected
                    ? `${bgColor} text-white shadow-lg scale-105`
                    : 'bg-slate-800 text-slate-500 hover:bg-slate-700'
                }`}
              >
                {n}
              </button>
            )
          })}
        </div>
        <span className="text-[10px] text-slate-500 w-16">{highLabel}</span>
      </div>
    </div>
  )
}
