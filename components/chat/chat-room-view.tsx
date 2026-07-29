'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Clock, MapPin, Send } from 'lucide-react'
import { getMessages, sendMessage } from '@/lib/api'
import { formatClock, formatDateDivider, formatDateTime, isSameDay } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { Message, RoomAccess } from '@/lib/types'

const POLL_INTERVAL_MS = 2500

export function ChatRoomView({
  room,
  initialMessages,
}: {
  room: RoomAccess
  initialMessages: Message[]
}) {
  const router = useRouter()
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const lastIdRef = useRef<number>(
    initialMessages.length > 0 ? Number(initialMessages[initialMessages.length - 1].id) : 0,
  )
  const bottomRef = useRef<HTMLDivElement>(null)

  // 폴링: 2.5초 간격 증분 조회, 화면 이탈(언마운트) 시 정리, 탭이 안 보일 땐 호출 생략
  useEffect(() => {
    const interval = setInterval(async () => {
      if (document.hidden) return
      try {
        const fresh = await getMessages(room.id, lastIdRef.current)
        if (fresh.length === 0) return
        lastIdRef.current = Number(fresh[fresh.length - 1].id)
        setMessages((prev) => [...prev, ...fresh])
      } catch {
        // 폴링 중 일시적 에러는 조용히 무시하고 다음 tick에 재시도
      }
    }, POLL_INTERVAL_MS)

    return () => clearInterval(interval)
  }, [room.id])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: 'end' })
  }, [messages.length])

  async function handleSend(e: React.FormEvent) {
    e.preventDefault()
    const content = input.trim()
    if (!content || sending) return

    setSending(true)
    setError(null)
    try {
      const message = await sendMessage(room.id, content)
      lastIdRef.current = Number(message.id)
      setMessages((prev) => [...prev, message])
      setInput('')
    } catch (err) {
      setError(err instanceof Error ? err.message : '메시지 전송에 실패했어요.')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="flex flex-1 flex-col">
      <header className="sticky top-0 z-30 flex h-14 items-center gap-1 border-b border-border bg-background/90 px-2 backdrop-blur">
        <button
          type="button"
          onClick={() => router.back()}
          aria-label="뒤로"
          className="flex size-11 items-center justify-center rounded-full text-foreground transition active:scale-[0.95] hover:bg-muted"
        >
          <ArrowLeft className="size-5" />
        </button>
        <h1 className="truncate px-1 text-base font-bold text-foreground">{room.title}</h1>
      </header>

      {/* CHAT-07: 주문 채팅방 상단 고정 정보 */}
      {room.pot && (
        <div className="flex flex-col gap-1 border-b border-border bg-muted/40 px-4 py-2.5 text-xs text-muted-foreground">
          <span className="font-semibold text-foreground">{room.pot.storeName}</span>
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1">
              <MapPin className="size-3.5" />
              {room.pot.pickupName}
            </span>
            {room.pot.pickupAt && (
              <span className="inline-flex items-center gap-1">
                <Clock className="size-3.5" />
                {formatDateTime(room.pot.pickupAt)}
              </span>
            )}
          </div>
        </div>
      )}

      <div className="flex flex-1 flex-col gap-1 overflow-y-auto px-4 py-4">
        {messages.map((m, idx) => {
          const prev = messages[idx - 1]
          const showDivider = !prev || !isSameDay(prev.createdAt, m.createdAt)

          if (m.type === 'SYSTEM') {
            return (
              <div key={m.id}>
                {showDivider && <DateDivider iso={m.createdAt} />}
                <p className="my-2 text-center text-xs text-muted-foreground">{m.content}</p>
              </div>
            )
          }

          const showNickname = !m.isMine && (!prev || prev.senderId !== m.senderId || showDivider)

          return (
            <div key={m.id}>
              {showDivider && <DateDivider iso={m.createdAt} />}
              <div className={cn('flex flex-col gap-0.5', m.isMine ? 'items-end' : 'items-start')}>
                {showNickname && (
                  <span className="px-1 text-xs font-semibold text-muted-foreground">{m.senderNickname}</span>
                )}
                <div className={cn('flex items-end gap-1.5', m.isMine ? 'flex-row-reverse' : 'flex-row')}>
                  <div
                    className={cn(
                      'max-w-64 rounded-2xl px-3.5 py-2 text-sm leading-relaxed whitespace-pre-wrap',
                      m.isMine
                        ? 'rounded-br-sm bg-primary text-primary-foreground'
                        : 'rounded-bl-sm bg-muted text-foreground',
                    )}
                  >
                    {m.content}
                  </div>
                  <span className="shrink-0 text-[11px] text-muted-foreground">{formatClock(m.createdAt)}</span>
                </div>
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      <form
        onSubmit={handleSend}
        className="sticky bottom-0 flex items-end gap-2 border-t border-border bg-background/95 px-3 py-2.5 pb-[calc(0.625rem+env(safe-area-inset-bottom))] backdrop-blur"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="메시지를 입력하세요"
          maxLength={500}
          className="h-11 flex-1 rounded-full border border-border bg-background px-4 text-sm outline-none focus:border-primary"
        />
        <button
          type="submit"
          disabled={sending || !input.trim()}
          aria-label="전송"
          className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground transition active:scale-[0.95] disabled:opacity-40"
        >
          <Send className="size-4" />
        </button>
      </form>
      {error && <p className="px-4 pb-2 text-xs text-destructive">{error}</p>}
    </div>
  )
}

function DateDivider({ iso }: { iso: string }) {
  return (
    <div className="my-3 flex items-center justify-center">
      <span className="rounded-full bg-muted px-3 py-1 text-[11px] font-medium text-muted-foreground">
        {formatDateDivider(iso)}
      </span>
    </div>
  )
}
