'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { MessageCircle, UserCheck, UserPlus, UserX, Users, X } from 'lucide-react'

import { AppHeader } from '@/components/app-header'
import { MannerAvatar } from '@/components/manner-avatar'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { EmptyState } from '@/components/empty-state'
import { removeFriendship, respondFriendRequest, startDm } from '@/lib/api'
import type { FriendRequestSummary, FriendsOverview, FriendSummary } from '@/lib/types'
import { cn } from '@/lib/utils'

type Tab = 'FRIENDS' | 'INCOMING' | 'OUTGOING'

export function FriendsView({ overview }: { overview: FriendsOverview }) {
  const router = useRouter()
  const [tab, setTab] = useState<Tab>('FRIENDS')
  const [friends, setFriends] = useState(overview.friends)
  const [incoming, setIncoming] = useState(overview.incoming)
  const [outgoing, setOutgoing] = useState(overview.outgoing)
  const [busyId, setBusyId] = useState<string | null>(null)

  async function handleMessage(userId: string) {
    setBusyId(userId)
    try {
      const roomId = await startDm(userId)
      router.push(`/chat/${roomId}`)
    } catch (err) {
      alert(err instanceof Error ? err.message : '대화방을 열지 못했어요.')
    } finally {
      setBusyId(null)
    }
  }

  async function handleRemove(friendshipId: string) {
    if (!confirm('친구를 삭제하시겠어요?')) return
    setBusyId(friendshipId)
    try {
      await removeFriendship(friendshipId)
      setFriends((prev) => prev.filter((f) => f.friendshipId !== friendshipId))
    } catch (err) {
      alert(err instanceof Error ? err.message : '처리에 실패했어요.')
    } finally {
      setBusyId(null)
    }
  }

  async function handleCancelOutgoing(friendshipId: string) {
    setBusyId(friendshipId)
    try {
      await removeFriendship(friendshipId)
      setOutgoing((prev) => prev.filter((f) => f.friendshipId !== friendshipId))
    } catch (err) {
      alert(err instanceof Error ? err.message : '처리에 실패했어요.')
    } finally {
      setBusyId(null)
    }
  }

  async function handleRespond(friendshipId: string, action: 'accept' | 'reject') {
    setBusyId(friendshipId)
    try {
      await respondFriendRequest(friendshipId, action)
      const req = incoming.find((f) => f.friendshipId === friendshipId)
      setIncoming((prev) => prev.filter((f) => f.friendshipId !== friendshipId))
      if (action === 'accept' && req) {
        setFriends((prev) => [{ ...req }, ...prev])
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : '처리에 실패했어요.')
    } finally {
      setBusyId(null)
    }
  }

  const TABS: { key: Tab; label: string }[] = [
    { key: 'FRIENDS', label: `친구 (${friends.length})` },
    { key: 'INCOMING', label: `받은 요청 (${incoming.length})` },
    { key: 'OUTGOING', label: `보낸 요청 (${outgoing.length})` },
  ]

  return (
    <>
      <AppHeader title="친구" showBack />

      <div className="flex border-b border-border bg-card px-4">
        {TABS.map((t) => (
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

      <div className="flex flex-1 flex-col gap-3 p-4">
        {tab === 'FRIENDS' &&
          (friends.length === 0 ? (
            <EmptyState icon={Users} title="아직 친구가 없어요" description="프로필 화면에서 친구를 추가해보세요." />
          ) : (
            friends.map((f: FriendSummary) => (
              <Card key={f.friendshipId} className="flex items-center gap-3 p-3.5">
                <Link href={`/users/${f.userId}`} className="flex min-w-0 flex-1 items-center gap-3">
                  <MannerAvatar
                    stage={f.manner?.stage ?? 'NEW'}
                    color={f.manner?.avatarColor ?? 'NAVY'}
                    accessory={f.manner?.avatarAccessory ?? 'NONE'}
                    className="size-11 shrink-0"
                  />
                  <span className="truncate text-sm font-semibold text-foreground">{f.nickname}</span>
                </Link>
                <div className="flex shrink-0 gap-1.5">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={busyId === f.friendshipId}
                    onClick={() => handleMessage(f.userId)}
                  >
                    <MessageCircle className="size-3.5" />
                    메시지
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={busyId === f.friendshipId}
                    onClick={() => handleRemove(f.friendshipId)}
                    className="text-destructive hover:text-destructive"
                  >
                    삭제
                  </Button>
                </div>
              </Card>
            ))
          ))}

        {tab === 'INCOMING' &&
          (incoming.length === 0 ? (
            <EmptyState icon={UserPlus} title="받은 친구 요청이 없어요" />
          ) : (
            incoming.map((f: FriendRequestSummary) => (
              <Card key={f.friendshipId} className="flex items-center gap-3 p-3.5">
                <Link href={`/users/${f.userId}`} className="flex min-w-0 flex-1 items-center gap-3">
                  <MannerAvatar
                    stage={f.manner?.stage ?? 'NEW'}
                    color={f.manner?.avatarColor ?? 'NAVY'}
                    accessory={f.manner?.avatarAccessory ?? 'NONE'}
                    className="size-11 shrink-0"
                  />
                  <span className="truncate text-sm font-semibold text-foreground">{f.nickname}</span>
                </Link>
                <div className="flex shrink-0 gap-1.5">
                  <Button
                    size="sm"
                    disabled={busyId === f.friendshipId}
                    onClick={() => handleRespond(f.friendshipId, 'accept')}
                  >
                    <UserCheck className="size-3.5" />
                    수락
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={busyId === f.friendshipId}
                    onClick={() => handleRespond(f.friendshipId, 'reject')}
                  >
                    <UserX className="size-3.5" />
                    거절
                  </Button>
                </div>
              </Card>
            ))
          ))}

        {tab === 'OUTGOING' &&
          (outgoing.length === 0 ? (
            <EmptyState icon={UserPlus} title="보낸 친구 요청이 없어요" />
          ) : (
            outgoing.map((f: FriendRequestSummary) => (
              <Card key={f.friendshipId} className="flex items-center gap-3 p-3.5">
                <Link href={`/users/${f.userId}`} className="flex min-w-0 flex-1 items-center gap-3">
                  <MannerAvatar
                    stage={f.manner?.stage ?? 'NEW'}
                    color={f.manner?.avatarColor ?? 'NAVY'}
                    accessory={f.manner?.avatarAccessory ?? 'NONE'}
                    className="size-11 shrink-0"
                  />
                  <span className="truncate text-sm font-semibold text-foreground">{f.nickname}</span>
                  <span className="shrink-0 text-xs text-muted-foreground">응답 대기 중</span>
                </Link>
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={busyId === f.friendshipId}
                  onClick={() => handleCancelOutgoing(f.friendshipId)}
                  className="shrink-0 text-muted-foreground"
                >
                  <X className="size-3.5" />
                  취소
                </Button>
              </Card>
            ))
          ))}
      </div>
    </>
  )
}
