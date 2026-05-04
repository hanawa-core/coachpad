'use client'

import { useEffect, useRef, useState } from 'react'
import { Send, Image as ImageIcon, X, Trash2 } from 'lucide-react'
import { useAuth } from '@/components/providers/AuthProvider'
import {
  subscribeChatMessages,
  sendChatMessage,
  markChatRead,
  ensureChatThread,
  deleteChatMessage,
} from '@/lib/firebase/firestore'
import { uploadChatImage } from '@/lib/firebase/chat-image'
import type { ChatMessage } from '@/types'

interface Props {
  /** スレッドの coachId */
  coachId: string
  /** スレッドの athleteId */
  athleteId: string
  /** 相手の表示名 */
  otherName: string
  /** 自分の表示名 */
  selfName: string
  /** 役割（自分） */
  selfRole: 'coach' | 'athlete'
}

export function ChatThread({ coachId, athleteId, otherName, selfName, selfRole }: Props) {
  const { user } = useAuth()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [threadId, setThreadId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  // スレッド初期化
  useEffect(() => {
    if (!user) return
    const init = async () => {
      const id = await ensureChatThread(
        coachId,
        athleteId,
        selfRole === 'coach' ? selfName : otherName,
        selfRole === 'athlete' ? selfName : otherName
      )
      setThreadId(id)
      // 既読マーク
      await markChatRead(id, user.uid)
    }
    init()
  }, [coachId, athleteId, user, selfName, otherName, selfRole])

  // メッセージ購読
  useEffect(() => {
    if (!threadId) return
    const unsub = subscribeChatMessages(threadId, (msgs) => {
      setMessages(msgs)
      // 既読マーク（新着があれば）
      if (user) markChatRead(threadId, user.uid)
    })
    return unsub
  }, [threadId, user])

  // 自動スクロール
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages])

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    setImageFile(f)
    setImagePreview(URL.createObjectURL(f))
  }

  const handleClearImage = () => {
    setImageFile(null)
    if (imagePreview) URL.revokeObjectURL(imagePreview)
    setImagePreview(null)
  }

  const handleDelete = async (messageId: string) => {
    if (!threadId) return
    if (!confirm('このメッセージを削除しますか？')) return
    setDeletingId(messageId)
    try {
      await deleteChatMessage(threadId, messageId)
    } finally {
      setDeletingId(null)
    }
  }

  const handleSend = async () => {
    if (!user) return
    if (!text.trim() && !imageFile) return

    // スレッドIDが未取得なら念のため作成
    let tid = threadId
    if (!tid) {
      tid = await ensureChatThread(
        coachId,
        athleteId,
        selfRole === 'coach' ? selfName : otherName,
        selfRole === 'athlete' ? selfName : otherName
      )
      setThreadId(tid)
    }

    setSending(true)
    try {
      if (imageFile) {
        setUploading(true)
        const result = await uploadChatImage(tid, imageFile)
        await sendChatMessage(tid, user.uid, {
          type: 'image',
          text: text.trim(),
          imageUrl: result.url,
          imageWidth: result.width,
          imageHeight: result.height,
        })
        setUploading(false)
        handleClearImage()
        setText('')
      } else {
        await sendChatMessage(tid, user.uid, {
          type: 'text',
          text: text.trim(),
        })
        setText('')
      }
    } finally {
      setSending(false)
      setUploading(false)
    }
  }

  return (
    <div className="flex h-[calc(100dvh-9rem)] sm:h-[calc(100vh-7rem)] flex-col rounded-xl border border-slate-800 bg-slate-900 overflow-hidden">
      {/* ヘッダー */}
      <div className="flex items-center gap-3 border-b border-slate-800 px-5 py-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-600 text-sm font-bold text-white">
          {otherName.charAt(0)}
        </div>
        <div>
          <p className="text-sm font-semibold text-white">{otherName}</p>
          <p className="text-[10px] text-slate-500">
            {selfRole === 'coach' ? '選手' : 'コーチ'}
          </p>
        </div>
      </div>

      {/* メッセージエリア */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-500">
            まだメッセージがありません。最初のメッセージを送ってみましょう
          </p>
        ) : (
          messages.map((m, i) => {
            const isMe = m.senderId === user?.uid
            const prev = i > 0 ? messages[i - 1] : null
            const showDate =
              !prev ||
              dateChanged(prev.sentAt, m.sentAt)
            return (
              <div key={m.id}>
                {showDate && (
                  <div className="my-3 flex justify-center">
                    <span className="rounded-full bg-slate-800 px-3 py-0.5 text-[10px] text-slate-400">
                      {formatDate(m.sentAt)}
                    </span>
                  </div>
                )}
                <div className={`flex items-end gap-1 group ${isMe ? 'justify-end' : 'justify-start'}`}>
                  {isMe && (
                    <button
                      onClick={() => handleDelete(m.id)}
                      disabled={deletingId === m.id}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded text-slate-500 hover:text-red-400 disabled:opacity-40 shrink-0"
                      title="削除"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                  <div
                    className={`max-w-[75%] rounded-2xl px-4 py-2 ${
                      isMe
                        ? 'bg-emerald-600 text-white rounded-br-sm'
                        : 'bg-slate-800 text-slate-100 rounded-bl-sm'
                    }`}
                  >
                    {m.type === 'image' && m.imageUrl && (
                      <a
                        href={m.imageUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block mb-1"
                      >
                        <img
                          src={m.imageUrl}
                          alt=""
                          className="rounded-lg max-w-full max-h-80"
                          style={{ maxWidth: '300px' }}
                        />
                      </a>
                    )}
                    {m.text && <p className="text-sm whitespace-pre-wrap break-words">{m.text}</p>}
                    <p
                      className={`mt-0.5 text-[10px] ${
                        isMe ? 'text-emerald-100/70' : 'text-slate-500'
                      }`}
                    >
                      {formatTime(m.sentAt)}
                    </p>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* 入力エリア */}
      <div className="border-t border-slate-800 p-3">
        {imagePreview && (
          <div className="mb-2 inline-block relative">
            <img
              src={imagePreview}
              alt=""
              className="h-20 rounded-lg border border-slate-700"
            />
            <button
              onClick={handleClearImage}
              className="absolute -top-1 -right-1 rounded-full bg-slate-900 p-0.5 text-white hover:bg-slate-700"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        )}
        <div className="flex items-end gap-2">
          <label className="flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700">
            <input
              type="file"
              accept="image/*"
              onChange={handleImageSelect}
              className="hidden"
            />
            <ImageIcon className="h-4 w-4" />
          </label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
                e.preventDefault()
                handleSend()
              }
            }}
            placeholder="メッセージを入力..."
            rows={1}
            className="flex-1 max-h-32 resize-none rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
          />
          <button
            onClick={handleSend}
            disabled={sending || (!text.trim() && !imageFile)}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-600 text-white hover:bg-emerald-500 disabled:opacity-40"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
        {uploading && (
          <p className="mt-1 text-[10px] text-slate-500">画像をアップロード中...</p>
        )}
      </div>
    </div>
  )
}

function formatTime(ts: any): string {
  if (!ts) return ''
  const d = ts.toDate ? ts.toDate() : new Date(ts)
  return d.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })
}

function formatDate(ts: any): string {
  if (!ts) return ''
  const d = ts.toDate ? ts.toDate() : new Date(ts)
  const today = new Date()
  const yesterday = new Date()
  yesterday.setDate(today.getDate() - 1)

  const isSameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()

  if (isSameDay(d, today)) return '今日'
  if (isSameDay(d, yesterday)) return '昨日'
  return d.toLocaleDateString('ja-JP', { month: 'long', day: 'numeric', weekday: 'short' })
}

function dateChanged(a: any, b: any): boolean {
  const da = a?.toDate ? a.toDate() : new Date(a)
  const db = b?.toDate ? b.toDate() : new Date(b)
  return (
    da.getFullYear() !== db.getFullYear() ||
    da.getMonth() !== db.getMonth() ||
    da.getDate() !== db.getDate()
  )
}
