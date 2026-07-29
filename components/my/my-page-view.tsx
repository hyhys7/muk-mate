'use client'

import Link from 'next/link'
import { useState } from 'react'
import { signOut } from 'next-auth/react'
import { ChevronRight, LogOut, ShoppingBag, Users } from 'lucide-react'
import { AppHeader } from '@/components/app-header'
import { EmptyState } from '@/components/empty-state'
import { PotCard } from '@/components/pots/pot-card'
import { ApprovalBadge, PotStatusBadge } from '@/components/status-badge'
import { StoreAvatar } from '@/components/store-avatar'
import { Card } from '@/components/ui/card'
import { zoneLabel } from '@/lib/constants'
import { cn } from '@/lib/utils'
import type { Participation, Pot, ZoneCode } from '@/lib/types'

function MyApplicationRow({ pot, participation }: { pot: Pot; participation: Participation }) {
  return (
    <Link href={`/pots/${pot.id}`} className="block transition active:scale-[0.99]">
      <Card className="flex items-center gap-3 p-3.5">
        <StoreAvatar name={pot.storeName} className="size-10 text-sm" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-foreground">{pot.storeName}</p>
          <p className="truncate text-xs text-muted-foreground">{pot.orderSummary}</p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          <PotStatusBadge status={pot.status} />
          <ApprovalBadge status={participation.approvalStatus} />
        </div>
      </Card>
    </Link>
  )
}

export function MyPageView({
  me,
  hostedPots,
  applications,
}: {
  // id/loginId는 이 화면에서 쓸 일이 없다 — 서버→클라이언트 props는 Next.js가 그대로
  // RSC 페이로드에 직렬화해 브라우저로 보내므로, 화면에 필요 없는 필드는 아예 넘기지 않는다.
  me: { nickname: string; zoneCode: ZoneCode }
  hostedPots: Pot[]
  applications: { participation: Participation; pot: Pot }[]
}) {
  const [tab, setTab] = useState<'HOSTED' | 'JOINED'>('HOSTED')

  return (
    <>
      <AppHeader title="마이" />

      <div className="flex items-center gap-3 border-b border-border px-4 py-4">
        <StoreAvatar name={me.nickname} className="size-12 text-lg" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-base font-bold text-foreground">{me.nickname}</p>
          <p className="text-sm text-muted-foreground">{zoneLabel(me.zoneCode)}</p>
        </div>
        <Link
          href="/my/edit"
          className="flex shrink-0 items-center gap-0.5 text-sm font-semibold text-muted-foreground transition hover:text-foreground"
        >
          정보 수정
          <ChevronRight className="size-4" />
        </Link>
      </div>

      <div className="flex border-b border-border px-4">
        {(
          [
            { key: 'HOSTED', label: `만든 공동주문 (${hostedPots.length})` },
            { key: 'JOINED', label: `참여한 공동주문 (${applications.length})` },
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

      <div className="flex flex-1 flex-col gap-3 p-4">
        {tab === 'HOSTED' ? (
          hostedPots.length > 0 ? (
            hostedPots.map((pot) => <PotCard key={pot.id} pot={pot} />)
          ) : (
            <EmptyState
              icon={ShoppingBag}
              title="아직 만든 공동주문이 없어요"
              description="첫 공동주문을 만들어보세요!"
            />
          )
        ) : applications.length > 0 ? (
          applications.map(({ pot, participation }) => (
            <MyApplicationRow key={participation.id} pot={pot} participation={participation} />
          ))
        ) : (
          <EmptyState
            icon={Users}
            title="아직 참여 신청한 공동주문이 없어요"
            description="공동주문 탭에서 참여할 곳을 찾아보세요."
          />
        )}
      </div>

      <div className="border-t border-border p-4">
        <button
          type="button"
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="flex h-11 w-full items-center justify-center gap-1.5 rounded-xl border border-border text-sm font-semibold text-muted-foreground transition hover:bg-muted"
        >
          <LogOut className="size-4" />
          로그아웃
        </button>
      </div>
    </>
  )
}
