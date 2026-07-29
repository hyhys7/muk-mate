'use client'

import Link from 'next/link'
import { useState } from 'react'
import { MessageCircle, Users } from 'lucide-react'
import { AppHeader } from '@/components/app-header'
import { EmptyState } from '@/components/empty-state'
import { PotStatusBadge } from '@/components/status-badge'
import { StoreAvatar } from '@/components/store-avatar'
import { formatRelativeTime } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { ChatRoom } from '@/lib/types'

function RoomRow({ room }: { room: ChatRoom }) {
  return (
    <Link
      href={`/chat/${room.id}`}
      className="flex items-center gap-3 px-4 py-3 transition active:scale-[0.99] hover:bg-muted"
    >
      <StoreAvatar name={room.title} className="size-12 text-lg" />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <p className="truncate text-sm font-bold text-foreground">{room.title}</p>
          {room.potStatus && <PotStatusBadge status={room.potStatus} className="shrink-0" />}
        </div>
        {room.subtitle && <p className="truncate text-xs text-muted-foreground">{room.subtitle}</p>}
        <p className="mt-0.5 truncate text-sm text-muted-foreground">
          {room.lastMessage || '아직 메시지가 없어요.'}
        </p>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1">
        {room.lastMessageAt && (
          <span className="text-xs text-muted-foreground">{formatRelativeTime(room.lastMessageAt)}</span>
        )}
        {room.unreadCount > 0 && (
          <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[11px] font-bold text-primary-foreground">
            {room.unreadCount}
          </span>
        )}
      </div>
    </Link>
  )
}

export function ChatListView({
  myRooms,
  communityRooms,
}: {
  myRooms: ChatRoom[]
  communityRooms: ChatRoom[]
}) {
  const [tab, setTab] = useState<'MINE' | 'COMMUNITY'>('MINE')
  const rooms = tab === 'MINE' ? myRooms : communityRooms

  return (
    <>
      <AppHeader title="채팅" />

      <div className="flex border-b border-border px-4">
        {(
          [
            { key: 'MINE', label: '내 채팅' },
            { key: 'COMMUNITY', label: '음식 커뮤니티' },
          ] as const
        ).map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={cn(
              'relative flex h-11 flex-1 items-center justify-center text-sm font-semibold transition',
              tab === t.key ? 'text-primary' : 'text-muted-foreground',
            )}
          >
            {t.label}
            {tab === t.key && <span className="absolute inset-x-3 bottom-0 h-0.5 rounded-full bg-primary" />}
          </button>
        ))}
      </div>

      {rooms.length > 0 ? (
        <div className="flex flex-1 flex-col divide-y divide-border">
          {rooms.map((room) => (
            <RoomRow key={room.id} room={room} />
          ))}
        </div>
      ) : tab === 'MINE' ? (
        <EmptyState
          icon={MessageCircle}
          title="아직 참여 중인 채팅방이 없어요"
          description="공동주문을 만들거나 참여가 승인되면 채팅방이 열려요."
        />
      ) : (
        <EmptyState icon={Users} title="커뮤니티 방을 불러오지 못했어요" description="잠시 후 다시 시도해 주세요." />
      )}
    </>
  )
}
