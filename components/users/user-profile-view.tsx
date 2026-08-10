'use client'

import { useState } from 'react'
import { ShieldAlert } from 'lucide-react'
import { AppHeader } from '@/components/app-header'
import { MannerBadge } from '@/components/manner-badge'
import { ReportModal } from '@/components/chat/report-modal'
import { StoreAvatar } from '@/components/store-avatar'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { MANNER_TAG_META } from '@/lib/constants'
import type { MannerProfile } from '@/lib/types'

export function UserProfileView({
  user,
  manner,
  completedPotCount,
  isSelf,
}: {
  user: { id: string; nickname: string }
  manner: MannerProfile
  completedPotCount: number
  isSelf: boolean
}) {
  const [reportOpen, setReportOpen] = useState(false)

  return (
    <>
      <AppHeader title="프로필" showBack />

      <div className="flex flex-col items-center gap-3 border-b border-border bg-card px-4 py-8">
        <StoreAvatar name={user.nickname} className="size-16 text-2xl" />
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

        {!isSelf && (
          <Button
            variant="outline"
            onClick={() => setReportOpen(true)}
            className="h-11 gap-1.5 rounded-xl font-bold text-destructive hover:text-destructive"
          >
            <ShieldAlert className="size-4" />
            신고하기
          </Button>
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
