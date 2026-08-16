'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ShieldOff } from 'lucide-react'

import { AppHeader } from '@/components/app-header'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { EmptyState } from '@/components/empty-state'
import { StoreAvatar } from '@/components/store-avatar'
import { unblockUser } from '@/lib/api'

export function BlockedUsersView({ initialItems }: { initialItems: { userId: string; nickname: string }[] }) {
  const [items, setItems] = useState(initialItems)
  const [busyId, setBusyId] = useState<string | null>(null)

  async function handleUnblock(userId: string) {
    setBusyId(userId)
    try {
      await unblockUser(userId)
      setItems((prev) => prev.filter((u) => u.userId !== userId))
    } catch (err) {
      alert(err instanceof Error ? err.message : '처리에 실패했어요.')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <>
      <AppHeader title="차단 관리" showBack />

      {items.length === 0 ? (
        <EmptyState icon={ShieldOff} title="차단한 회원이 없어요" />
      ) : (
        <div className="flex flex-col gap-3 p-4">
          {items.map((u) => (
            <Card key={u.userId} className="flex items-center gap-3 p-3.5">
              <Link href={`/users/${u.userId}`} className="flex min-w-0 flex-1 items-center gap-3">
                <StoreAvatar name={u.nickname} className="size-10 shrink-0" />
                <span className="truncate text-sm font-semibold text-foreground">{u.nickname}</span>
              </Link>
              <Button
                size="sm"
                variant="outline"
                disabled={busyId === u.userId}
                onClick={() => handleUnblock(u.userId)}
              >
                차단 해제
              </Button>
            </Card>
          ))}
        </div>
      )}
    </>
  )
}
