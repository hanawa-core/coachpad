'use client'

import { useEffect, useRef, useState } from 'react'
import { Pen, Square, ArrowRight, Eraser, Type, Undo2, X, Save } from 'lucide-react'
import { clsx } from 'clsx'
import type { AnnotationTool, AnnotationStroke, CanvasData } from '@/types'

interface VideoAnnotatorProps {
  /** ベースとなる画像（動画から切り出したフレーム） */
  baseImageDataUrl: string
  /** ベース画像のサイズ */
  width: number
  height: number
  /** 動画タイムスタンプ（秒） */
  timestampSec: number
  onCancel: () => void
  /** 注釈付き画像の Blob と canvasData を返して保存処理は親に任せる */
  onSave: (
    annotatedImageBlob: Blob,
    canvasData: CanvasData,
    note: string
  ) => Promise<void>
}

const COLORS = ['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#a855f7', '#ffffff']

export function VideoAnnotator({
  baseImageDataUrl,
  width,
  height,
  timestampSec,
  onCancel,
  onSave,
}: VideoAnnotatorProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const baseImgRef = useRef<HTMLImageElement | null>(null)

  const [tool, setTool] = useState<AnnotationTool>('pen')
  const [color, setColor] = useState(COLORS[0])
  const [lineWidth, setLineWidth] = useState(4)
  const [strokes, setStrokes] = useState<AnnotationStroke[]>([])
  const [drawing, setDrawing] = useState(false)
  const [currentStroke, setCurrentStroke] = useState<AnnotationStroke | null>(null)
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)

  // 表示サイズ（コンテナフィット）
  const displayMaxWidth = 800
  const displayScale = Math.min(1, displayMaxWidth / width)
  const displayWidth = Math.round(width * displayScale)
  const displayHeight = Math.round(height * displayScale)

  // ベース画像を描画する
  const redraw = () => {
    const canvas = canvasRef.current
    const baseImg = baseImgRef.current
    if (!canvas || !baseImg) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // ベース画像
    ctx.clearRect(0, 0, width, height)
    ctx.drawImage(baseImg, 0, 0, width, height)

    // 既存ストローク
    for (const s of strokes) {
      drawStroke(ctx, s)
    }
    if (currentStroke) {
      drawStroke(ctx, currentStroke)
    }
  }

  // ストロークを1本描画
  const drawStroke = (ctx: CanvasRenderingContext2D, s: AnnotationStroke) => {
    ctx.strokeStyle = s.color
    ctx.fillStyle = s.color
    ctx.lineWidth = s.lineWidth
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'

    if (s.tool === 'pen' || s.tool === 'eraser') {
      if (s.tool === 'eraser') {
        ctx.globalCompositeOperation = 'destination-out'
        ctx.lineWidth = s.lineWidth * 4
      }
      ctx.beginPath()
      const pts = s.points
      if (pts.length === 0) return
      ctx.moveTo(pts[0].x, pts[0].y)
      for (let i = 1; i < pts.length; i++) {
        ctx.lineTo(pts[i].x, pts[i].y)
      }
      ctx.stroke()
      ctx.globalCompositeOperation = 'source-over'
    } else if (s.tool === 'rectangle' && s.startX != null && s.startY != null && s.endX != null && s.endY != null) {
      ctx.strokeRect(s.startX, s.startY, s.endX - s.startX, s.endY - s.startY)
    } else if (s.tool === 'arrow' && s.startX != null && s.startY != null && s.endX != null && s.endY != null) {
      drawArrow(ctx, s.startX, s.startY, s.endX, s.endY, s.lineWidth)
    } else if (s.tool === 'text' && s.text && s.startX != null && s.startY != null) {
      const fs = s.fontSize ?? 24
      ctx.font = `bold ${fs}px sans-serif`
      // 黒い縁取り
      ctx.lineWidth = 4
      ctx.strokeStyle = '#000'
      ctx.strokeText(s.text, s.startX, s.startY)
      ctx.fillStyle = s.color
      ctx.fillText(s.text, s.startX, s.startY)
    }
  }

  const drawArrow = (
    ctx: CanvasRenderingContext2D,
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    lw: number
  ) => {
    const headlen = Math.max(12, lw * 4)
    const angle = Math.atan2(y2 - y1, x2 - x1)
    ctx.beginPath()
    ctx.moveTo(x1, y1)
    ctx.lineTo(x2, y2)
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(x2, y2)
    ctx.lineTo(
      x2 - headlen * Math.cos(angle - Math.PI / 6),
      y2 - headlen * Math.sin(angle - Math.PI / 6)
    )
    ctx.lineTo(
      x2 - headlen * Math.cos(angle + Math.PI / 6),
      y2 - headlen * Math.sin(angle + Math.PI / 6)
    )
    ctx.closePath()
    ctx.fill()
  }

  // ベース画像のロード
  useEffect(() => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      baseImgRef.current = img
      redraw()
    }
    img.src = baseImageDataUrl
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [baseImageDataUrl])

  // ストローク変更で再描画
  useEffect(() => {
    redraw()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [strokes, currentStroke])

  // 表示座標 → キャンバス座標
  const getCanvasPoint = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current!
    const rect = canvas.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * width
    const y = ((e.clientY - rect.top) / rect.height) * height
    return { x, y }
  }

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (saving) return
    const p = getCanvasPoint(e)

    if (tool === 'text') {
      const text = window.prompt('テキストを入力')
      if (text && text.trim()) {
        setStrokes((prev) => [
          ...prev,
          {
            tool: 'text',
            color,
            lineWidth: 0,
            points: [],
            startX: p.x,
            startY: p.y,
            text: text.trim(),
            fontSize: 28,
          },
        ])
      }
      return
    }

    setDrawing(true)
    if (tool === 'pen' || tool === 'eraser') {
      setCurrentStroke({ tool, color, lineWidth, points: [p] })
    } else if (tool === 'rectangle' || tool === 'arrow') {
      setCurrentStroke({
        tool,
        color,
        lineWidth,
        points: [],
        startX: p.x,
        startY: p.y,
        endX: p.x,
        endY: p.y,
      })
    }
  }

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawing || !currentStroke) return
    const p = getCanvasPoint(e)
    if (currentStroke.tool === 'pen' || currentStroke.tool === 'eraser') {
      setCurrentStroke({ ...currentStroke, points: [...currentStroke.points, p] })
    } else {
      setCurrentStroke({ ...currentStroke, endX: p.x, endY: p.y })
    }
  }

  const handlePointerUp = () => {
    if (currentStroke) {
      setStrokes((prev) => [...prev, currentStroke])
      setCurrentStroke(null)
    }
    setDrawing(false)
  }

  const handleUndo = () => {
    setStrokes((prev) => prev.slice(0, -1))
  }

  const handleSave = async () => {
    const canvas = canvasRef.current
    if (!canvas) return
    setSaving(true)
    try {
      // 高画質 PNG として書き出し
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob((b) => resolve(b), 'image/png', 0.95)
      )
      if (!blob) throw new Error('画像変換に失敗しました')

      const canvasData: CanvasData = {
        width,
        height,
        strokes,
      }
      await onSave(blob, canvasData, note.trim())
    } finally {
      setSaving(false)
    }
  }

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60)
    const s = Math.floor(sec % 60)
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black/95 backdrop-blur">
      {/* ヘッダー */}
      <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950 px-4 py-3">
        <div className="flex items-center gap-3">
          <h2 className="text-sm font-semibold text-white">フレームに書き込み</h2>
          <span className="rounded bg-slate-800 px-2 py-0.5 text-xs text-slate-300">
            {formatTime(timestampSec)}
          </span>
        </div>
        <button
          onClick={onCancel}
          disabled={saving}
          className="rounded p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white disabled:opacity-50"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* キャンバスエリア */}
      <div className="flex-1 overflow-auto flex items-center justify-center p-4">
        <canvas
          ref={canvasRef}
          width={width}
          height={height}
          style={{ width: displayWidth, height: displayHeight, touchAction: 'none' }}
          className="rounded-lg shadow-2xl bg-black cursor-crosshair"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
        />
      </div>

      {/* ツールバー */}
      <div className="border-t border-slate-800 bg-slate-950 px-4 py-3 space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          {/* ツール */}
          <div className="flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-900 p-1">
            <ToolButton active={tool === 'pen'} onClick={() => setTool('pen')} icon={Pen} label="ペン" />
            <ToolButton active={tool === 'arrow'} onClick={() => setTool('arrow')} icon={ArrowRight} label="矢印" />
            <ToolButton active={tool === 'rectangle'} onClick={() => setTool('rectangle')} icon={Square} label="矩形" />
            <ToolButton active={tool === 'text'} onClick={() => setTool('text')} icon={Type} label="テキスト" />
            <ToolButton active={tool === 'eraser'} onClick={() => setTool('eraser')} icon={Eraser} label="消しゴム" />
          </div>

          {/* 色 */}
          <div className="flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-900 p-1.5">
            {COLORS.map((c) => (
              <button
                key={c}
                onClick={() => setColor(c)}
                className={clsx(
                  'h-6 w-6 rounded-full border-2 transition-all',
                  color === c ? 'border-white scale-110' : 'border-transparent'
                )}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>

          {/* 線の太さ */}
          <div className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2">
            <span className="text-xs text-slate-400">太さ</span>
            <input
              type="range"
              min={1}
              max={20}
              value={lineWidth}
              onChange={(e) => setLineWidth(Number(e.target.value))}
              className="w-20"
            />
            <span className="text-xs text-slate-300 w-6 text-right">{lineWidth}</span>
          </div>

          {/* 元に戻す */}
          <button
            onClick={handleUndo}
            disabled={strokes.length === 0}
            className="flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-slate-300 hover:bg-slate-800 disabled:opacity-50"
          >
            <Undo2 className="h-3.5 w-3.5" />
            元に戻す
          </button>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="この書き込みへのコメント（任意）"
            className="flex-1 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white placeholder-slate-500"
          />
          <button
            onClick={handleSave}
            disabled={saving || strokes.length === 0}
            className="flex items-center gap-1.5 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-500 disabled:opacity-60"
          >
            <Save className="h-4 w-4" />
            {saving ? '保存中...' : '保存'}
          </button>
        </div>
      </div>
    </div>
  )
}

function ToolButton({
  active,
  onClick,
  icon: Icon,
  label,
}: {
  active: boolean
  onClick: () => void
  icon: React.ComponentType<{ className?: string }>
  label: string
}) {
  return (
    <button
      onClick={onClick}
      title={label}
      className={clsx(
        'rounded p-2 transition-colors',
        active ? 'bg-red-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
      )}
    >
      <Icon className="h-4 w-4" />
    </button>
  )
}
