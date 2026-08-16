'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { MessageCircle, ShieldAlert, ShieldOff, UserCheck, UserMinus, UserPlus, UserX } from 'lucide-react'
import { AppHeader } from '@/components/app-header'
import { MannerAvatar } from '@/components/manner-avatar'
import { MannerBadge } from '@/components/manner-badge'
import { ReportModal } from '@/components/chat/report-modal'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  blockUser,
  removeFriendship,
  respondFriendRequest,
  sendFriendRequest,
  startDm,
  unblockUser,
} from '@/lib/api'
import { MANNER_TAG_META } from '@/lib/constants'
import type { FriendshipState, MannerProfile } from '@/lib/types'

export function UserProfileView({
  user,
  manner,
  completedPotCount,
  isSelf,
  friendshipState,
  friendshipId,
  blockedByMe,
}: {
  user: { id: string; nickname: string }
  manner: MannerProfile
  completedPotCount: number
  isSelf: boolean
  friendshipState: FriendshipState
  friendshipId?: string
  blockedByMe: boolean
}) {
  const router = useRouter()
  const [reportOpen, setReportOpen] = useState(false)
  const [state, setState] = useState(friendshipState)
  const [fid, setFid] = useState(friendshipId)
  const [busy, setBusy] = useState(false)

  async function handleAdd() {
    setBusy(true)
    try {
      await sendFriendRequest(user.id)
      setState('REQUEST_SENT')
    } catch (err) {
      alert(err instanceof Error ? err.message : '요청에 실패했어요.')
    } finally {
      setBusy(false)
    }
  }

  async function handleCancelOrRemove() {
    if (!fid) return
    if (state === 'FRIENDS' && !confirm('친구를 삭제하시겠어요?')) return
    setBusy(true)
    try {
      await removeFriendship(fid)
      setState('NONE')
      setFid(undefined)
    } catch (err) {
      alert(err instanceof Error ? err.message : '처리에 실패했어요.')
    } finally {
      setBusy(false)
    }
  }

  async function handleRespond(action: 'accept' | 'reject') {
    if (!fid) return
    setBusy(true)
    try {
      await respondFriendRequest(fid, action)
      setState(action === 'accept' ? 'FRIENDS' : 'NONE')
    } catch (err) {
      alert(err instanceof Error ? err.message : '처리에 실패했어요.')
    } finally {
      setBusy(false)
    }
  }

  async function handleMessage() {
    setBusy(true)
    try {
      const roomId = await startDm(user.id)
      router.push(`/chat/${roomId}`)
    } catch (err) {
      alert(err instanceof Error ? err.message : '대화방을 열지 못했어요.')
    } finally {
      setBusy(false)
    }
  }

  async function handleBlock() {
    if (!confirm(`${user.nickname}님을 차단하시겠어요? 친구 관계가 있다면 함께 해제돼요.`)) return
    setBusy(true)
    try {
      await blockUser(user.id)
      setState('BLOCKED')
      router.refresh()
    } catch (err) {
      alert(err instanceof Error ? err.message : '처리에 실패했어요.')
    } finally {
      setBusy(false)
    }
  }

  async function handleUnblock() {
    setBusy(true)
    try {
      await unblockUser(user.id)
      setState('NONE')
    } catch (err) {
      alert(err instanceof Error ? err.message : '처리에 실패했어요.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <AppHeader title="프로필" showBack />

      <div className="flex flex-col items-center gap-3 border-b border-border bg-card px-4 py-8">
        <MannerAvatar
          stage={manner.stage}
          color={manner.avatarColor}
          accessory={manner.avatarAccessory}
          className="size-16"
        />
        <p className="text-lg font-bold text-foreground">{user.nickname}</p>
        <MannerBadge
          stage={manner.stage}
          score={manner.score}
          reviewCount={manner.reviewCount}
          avatarColor={manner.avatarColor}
          avatarAccessory={manner.avatarAccessory}
        />
        {manner.topTags.length > 0 && (
          <div className="flex flex-wrap justify-center gap-1">
            {manner.topTags.map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground"
              >
                {MANNER_TAG_META.GOOD[tag] ?? tag}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-col gap-3 p-4">
        <Card className="flex items-center justify-between p-4">
          <span className="text-sm font-semibold text-muted-foreground">완료한 공동주문</span>
          <span className="text-base font-bold text-primary">{completedPotCount}회</span>
        </Card>

        {!isSelf && state === 'BLOCKED' && (
          <Card className="flex items-center justify-between p-4">
            <span className="text-sm font-semibold text-muted-foreground">차단된 사용자예요</span>
            {blockedByMe && (
              <Button size="sm" variant="outline" disabled={busy} onClick={handleUnblock}>
                <ShieldOff className="size-3.5" />
                차단 해제
              </Button>
            )}
          </Card>
        )}

        {!isSelf && state !== 'BLOCKED' && (
          <div className="flex gap-2">
            {state === 'NONE' && (
              <Button disabled={busy} onClick={handleAdd} className="h-11 flex-1 gap-1.5 rounded-xl font-bold">
                <UserPlus className="size-4" />
                친구 추가
              </Button>
            )}
            {state === 'REQUEST_SENT' && (
              <Button
                variant="outline"
                disabled={busy}
                onClick={handleCancelOrRemove}
                className="h-11 flex-1 gap-1.5 rounded-xl font-bold"
              >
                요청 취소
              </Button>
            )}
            {state === 'REQUEST_RECEIVED' && (
              <>
                <Button disabled={busy} onClick={() => handleRespond('accept')} className="h-11 flex-1 gap-1.5 rounded-xl font-bold">
                  <UserCheck className="size-4" />
                  수락
                </Button>
                <Button
                  variant="outline"
                  disabled={busy}
                  onClick={() => handleRespond('reject')}
                  className="h-11 flex-1 gap-1.5 rounded-xl font-bold"
                >
                  <UserX className="size-4" />
                  거절
                </Button>
              </>
            )}
            {state === 'FRIENDS' && (
              <>
                <Button disabled={busy} onClick={handleMessage} className="h-11 flex-1 gap-1.5 rounded-xl font-bold">
                  <MessageCircle className="size-4" />
                  메시지 보내기
                </Button>
                <Button
                  variant="outline"
                  disabled={busy}
                  onClick={handleCancelOrRemove}
                  className="h-11 gap-1.5 rounded-xl font-bold text-muted-foreground"
                >
                  <UserMinus className="size-4" />
                  친구 삭제
                </Button>
              </>
            )}
          </div>
        )}

        {!isSelf && (
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setReportOpen(true)}
              className="h-11 flex-1 gap-1.5 rounded-xl font-bold text-destructive hover:text-destructive"
            >
              <ShieldAlert className="size-4" />
              신고하기
            </Button>
            {state !== 'BLOCKED' && (
              <Button
                variant="outline"
                disabled={busy}
                onClick={handleBlock}
                className="h-11 flex-1 gap-1.5 rounded-xl font-bold text-muted-foreground"
              >
                차단하기
              </Button>
            )}
          </div>
        )}
      </div>

      {!isSelf && (
        <ReportModal
          open={reportOpen}
          onOpenChange={setReportOpen}
          targetNickname={user.nickname}
          reportedUserId={user.id}
        />
      )}
    </>
  )
}
