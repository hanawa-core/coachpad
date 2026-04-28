'use client'

import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts'

interface Props {
  /** 距離(m) の累積配列 */
  distance?: number[]
  /** 標高(m) 配列 */
  altitude?: number[]
  /** 心拍 配列 */
  heartrate?: number[]
  /** ペース用：速度(m/s) 配列 */
  velocity?: number[]
}

/**
 * 距離 vs 標高/心拍/ペース グラフ
 * - 標高: エリアチャート（背景）
 * - 心拍: 線（赤）
 * - ペース: 線（青）
 */
export function ElevationProfile({ distance, altitude, heartrate, velocity }: Props) {
  if (!distance || !altitude || distance.length === 0) {
    return (
      <div className="rounded-lg bg-slate-950 p-4 text-sm text-slate-500">
        標高データがありません
      </div>
    )
  }

  // データ間引き（最大200ポイント）
  const target = 200
  const step = Math.max(1, Math.floor(distance.length / target))

  const data: any[] = []
  for (let i = 0; i < distance.length; i += step) {
    const km = (distance[i] ?? 0) / 1000
    const point: any = {
      km: Number(km.toFixed(2)),
      標高: Math.round(altitude[i] ?? 0),
    }
    if (heartrate && heartrate[i] != null) {
      point.心拍 = Math.round(heartrate[i])
    }
    if (velocity && velocity[i] != null && velocity[i] > 0) {
      const secPerKm = 1000 / velocity[i]
      const pace = Math.round(secPerKm) // 秒/km
      // 妥当な範囲のペースのみ
      if (pace >= 180 && pace <= 900) {
        point.ペース秒 = pace
      }
    }
    data.push(point)
  }

  const minAlt = Math.min(...data.map((d) => d.標高))
  const maxAlt = Math.max(...data.map((d) => d.標高))
  const altRange = maxAlt - minAlt
  const altPad = Math.max(altRange * 0.1, 10)

  return (
    <div className="space-y-3">
      {/* 標高 + 心拍 */}
      <div>
        <p className="mb-1 text-xs font-medium text-slate-400">標高 / 心拍</p>
        <div className="h-48 w-full">
          <ResponsiveContainer>
            <ComposedChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" />
              <XAxis
                dataKey="km"
                tick={{ fill: '#94a3b8', fontSize: 11 }}
                stroke="#475569"
                label={{ value: 'km', position: 'insideBottomRight', offset: -5, fill: '#94a3b8', fontSize: 10 }}
              />
              <YAxis
                yAxisId="alt"
                domain={[minAlt - altPad, maxAlt + altPad]}
                tick={{ fill: '#94a3b8', fontSize: 11 }}
                stroke="#475569"
                label={{ value: 'm', angle: -90, position: 'insideLeft', fill: '#94a3b8', fontSize: 10 }}
              />
              {heartrate && (
                <YAxis
                  yAxisId="hr"
                  orientation="right"
                  domain={['dataMin - 10', 'dataMax + 10']}
                  tick={{ fill: '#f87171', fontSize: 11 }}
                  stroke="#475569"
                  label={{ value: 'bpm', angle: 90, position: 'insideRight', fill: '#f87171', fontSize: 10 }}
                />
              )}
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0f172a',
                  border: '1px solid #334155',
                  borderRadius: '8px',
                  fontSize: 12,
                }}
                labelStyle={{ color: '#e2e8f0' }}
                labelFormatter={(km) => `${km} km`}
              />
              <Area
                yAxisId="alt"
                type="monotone"
                dataKey="標高"
                fill="#475569"
                stroke="#64748b"
                fillOpacity={0.4}
              />
              {heartrate && (
                <Line
                  yAxisId="hr"
                  type="monotone"
                  dataKey="心拍"
                  stroke="#ef4444"
                  strokeWidth={2}
                  dot={false}
                />
              )}
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
