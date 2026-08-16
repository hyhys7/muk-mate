'use client'

import { useEffect, useState } from 'react'
import { Check, UserPlus, Users } from 'lucide-react'

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { MannerAvatar } from '@/components/manner-avatar'
import { EmptyState } from '@/components/empty-state'
import { getFriends, invitePotFriend } from '@/lib/api'
import type { FriendSummary } from '@/lib/types'

export function InviteFriendsDialog({
  open,
  onOpenChange,
  potId,
  excludeUserIds,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  potId: string
  /** 이미 참여(신청 포함) 중인 친구는 다시 초대할 필요가 없다 */
  excludeUserIds: string[]
}) {
  const [loading, setLoading] = useState(false)
  const [friends, setFriends] = useState<FriendSummary[] | null>(null)
  const [invited, setInvited] = useState<Set<string>>(new Set())
  const [busyId, setBusyId] = useState<string | null>(null)

  useEffect(() => {
    if (!open || friends !== null) return
    setLoading(true)
    getFriends()
      .then((res) => setFriends(res.friends))
      .catch(() => setFriends([]))
      .finally(() => setLoading(false))
  }, [open, friends])

  async function handleInvite(userId: string) {
    setBusyId(userId)
    try {
      await invitePotFriend(potId, userId)
      setInvited((prev) => new Set(prev).add(userId))
    } catch (err) {
      alert(err instanceof Error ? err.message : '초대에 실패했어요.')
    } finally {
      setBusyId(null)
    }
  }

  const excludeSet = new Set(excludeUserIds)
  const candidates = (friends ?? []).filter((f) => !excludeSet.has(f.userId))

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[80vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>친구 초대</DialogTitle>
        </DialogHeader>

        {loading ? (
          <p className="py-6 text-center text-sm text-muted-foreground">불러오는 중...</p>
        ) : candidates.length === 0 ? (
          <EmptyState
            icon={Users}
            title="초대할 친구가 없어요"
            description="이미 참여 중이거나, 아직 추가한 친구가 없어요."
          />
        ) : (
          <div className="flex flex-col gap-2">
            {candidates.map((f) => {
              const isInvited = invited.has(f.userId)
              return (
                <div key={f.userId} className="flex items-center gap-3 rounded-lg border border-border p-2.5">
                  <MannerAvatar
                    stage={f.manner?.stage ?? 'NEW'}
                    color={f.manner?.avatarColor ?? 'NAVY'}
                    accessory={f.manner?.avatarAccessory ?? 'NONE'}
                    className="size-9 shrink-0"
                  />
                  <span className="min-w-0 flex-1 truncate text-sm font-semibold text-foreground">{f.nickname}</span>
                  <button
                    type="button"
                    disabled={busyId === f.userId || isInvited}
                    onClick={() => handleInvite(f.userId)}
                    className="flex h-8 shrink-0 items-center gap-1 rounded-full border border-primary px-3 text-xs font-bold text-primary transition disabled:border-border disabled:text-muted-foreground"
                  >
                    {isInvited ? (
                      <>
                        <Check className="size-3.5" />
                        초대함
                      </>
                    ) : (
                      <>
                        <UserPlus className="size-3.5" />
                        초대
                      </>
                    )}
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
