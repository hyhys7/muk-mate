'use client'

import Link from 'next/link'
import { Check, ChevronDown, Plus, Search, ShoppingBag } from 'lucide-react'
import { useMemo, useState } from 'react'
import { NotificationBell } from '@/components/notification-bell'
import { PotCard } from '@/components/pots/pot-card'
import { StoreAvatar } from '@/components/store-avatar'
import { EmptyState } from '@/components/empty-state'
import { Button } from '@/components/ui/button'
import { ZONES } from '@/lib/constants'
import { formatDeadline } from '@/lib/format'
import type { Pot, ZoneCode } from '@/lib/types'
import { cn } from '@/lib/utils'

type Filter = 'ALL' | 'OPEN' | 'URGENT' | 'NEAR'

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'ALL', label: '전체' },
  { key: 'OPEN', label: '모집중' },
  { key: 'URGENT', label: '마감임박' },
  { key: 'NEAR', label: '가까운 순' },
]

export function PotsView({ pots, initialZone }: { pots: Pot[]; initialZone: ZoneCode }) {
  const [zone, setZone] = useState<ZoneCode>(initialZone)
  const [zoneOpen, setZoneOpen] = useState(false)
  const [filter, setFilter] = useState<Filter>('ALL')
  const [searchOpen, setSearchOpen] = useState(false)
  const [query, setQuery] = useState('')

  const zoneLabelText = ZONES.find((z) => z.code === zone)?.label ?? '전체'

  const zonePots = useMemo(() => pots.filter((p) => p.zoneCode === zone), [pots, zone])

  const openStories = useMemo(
    () => zonePots.filter((p) => p.status === 'OPEN'),
    [zonePots],
  )

  const visiblePots = useMemo(() => {
    let list = [...zonePots]
    if (filter === 'OPEN') list = list.filter((p) => p.status === 'OPEN')
    if (filter === 'URGENT')
      list = list.filter((p) => p.status === 'OPEN' && formatDeadline(p.deadlineAt).urgent)
    if (filter === 'NEAR') list.sort((a, b) => a.distanceMeters - b.distanceMeters)

    const q = query.trim().toLowerCase()
    if (q) {
      list = list.filter(
        (p) => p.storeName.toLowerCase().includes(q) || p.orderSummary.toLowerCase().includes(q),
      )
    }
    return list
  }, [zonePots, filter, query])

  return (
    <>
      {/* 헤더 */}
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-background/90 px-3 backdrop-blur">
        <div className="relative">
          <button
            type="button"
            onClick={() => setZoneOpen((v) => !v)}
            className="flex items-center gap-1 rounded-lg px-1 py-1 text-lg font-bold text-foreground transition active:scale-[0.97]"
          >
            {zoneLabelText}
            <ChevronDown
              className={cn('size-5 text-muted-foreground transition', zoneOpen && 'rotate-180')}
            />
          </button>
          {zoneOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setZoneOpen(false)} />
              <div className="absolute left-0 top-full z-20 mt-1 w-48 overflow-hidden rounded-xl border border-border bg-popover py-1 shadow-lg">
                {ZONES.map((z) => (
                  <button
                    key={z.code}
                    type="button"
                    onClick={() => {
                      setZone(z.code)
                      setZoneOpen(false)
                    }}
                    className="flex w-full items-center justify-between px-4 py-2.5 text-left text-sm font-medium text-foreground transition hover:bg-muted"
                  >
                    {z.label}
                    {z.code === zone && <Check className="size-4 text-primary" />}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => {
              setSearchOpen((v) => !v)
              if (searchOpen) setQuery('')
            }}
            aria-label="검색"
            aria-pressed={searchOpen}
            className={cn(
              'flex size-11 items-center justify-center rounded-full text-foreground transition active:scale-[0.95] hover:bg-muted',
              searchOpen && 'bg-muted',
            )}
          >
            <Search className="size-5" />
          </button>
          <NotificationBell />
        </div>
      </header>

      {searchOpen && (
        <div className="border-b border-border bg-background px-4 py-2.5">
          <div className="flex items-center gap-2 rounded-xl bg-muted px-3 py-2">
            <Search className="size-4 shrink-0 text-muted-foreground" />
            <input
              type="text"
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="가게 이름이나 메뉴로 검색"
              className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
            />
          </div>
        </div>
      )}

      <div className="flex flex-1 flex-col pb-24">
        {/* 스토리형 요약 */}
        <div className="scrollbar-none flex gap-3 overflow-x-auto px-4 py-4">
          <Link href="/pots/new" className="flex w-16 shrink-0 flex-col items-center gap-1.5">
            <span className="flex size-16 items-center justify-center rounded-full border-2 border-dashed border-primary/50 text-primary transition active:scale-[0.95]">
              <Plus className="size-6" />
            </span>
            <span className="line-clamp-1 text-xs font-medium text-foreground">만들기</span>
          </Link>

          {openStories.map((p) => (
            <Link
              key={p.id}
              href={`/pots/${p.id}`}
              className="flex w-16 shrink-0 flex-col items-center gap-1.5"
            >
              <span className="rounded-full bg-gradient-to-tr from-primary to-[#FF9D4D] p-[2px] transition active:scale-[0.95]">
                <span className="block rounded-full border-2 border-background">
                  <StoreAvatar name={p.storeName} className="size-14 text-lg" />
                </span>
              </span>
              <span className="line-clamp-2 text-center text-[11px] leading-tight text-muted-foreground">
                {p.storeName}
              </span>
            </Link>
          ))}
        </div>

        {/* 필터 칩 */}
        <div className="scrollbar-none flex gap-2 overflow-x-auto border-b border-border px-4 pb-3">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => setFilter(f.key)}
              className={cn(
                'h-8 shrink-0 rounded-full border px-3.5 text-sm font-semibold transition active:scale-[0.97]',
                filter === f.key
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border bg-background text-muted-foreground',
              )}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* 카드 리스트 */}
        {visiblePots.length > 0 ? (
          <div className="flex flex-col gap-3 p-4">
            <h2 className="-mb-1 text-lg font-extrabold tracking-tight text-foreground">
              같이 먹을 사람이 기다리고 있어요
            </h2>
            {visiblePots.map((pot, idx) => (
              <PotCard key={pot.id} pot={pot} index={idx + 1} />
            ))}
          </div>
        ) : query.trim() ? (
          <EmptyState
            icon={Search}
            title="검색 결과가 없어요"
            description="다른 가게 이름이나 메뉴로 찾아보세요."
          />
        ) : (
          <EmptyState
            icon={ShoppingBag}
            title="아직 공동주문이 없어요"
            description="이 지역의 첫 공동주문을 직접 만들어보세요!"
            action={
              <Link
                href="/pots/new"
                className="inline-flex h-11 items-center justify-center gap-1.5 rounded-xl bg-primary px-5 font-bold text-primary-foreground shadow-sm transition active:scale-[0.97] hover:bg-primary/90"
              >
                <Plus className="size-4" />
                공동주문 만들기
              </Link>

            }
          />
        )}
      </div>

      {/* FAB — 프레임 오른쪽 하단에 고정 */}
      <div className="pointer-events-none fixed inset-x-0 bottom-20 z-30">
        <div className="relative mx-auto max-w-[430px]">
          <Link
            href="/pots/new"
            aria-label="공동주문 만들기"
            className="pointer-events-auto absolute bottom-0 right-4 flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30 transition active:scale-[0.94] hover:bg-primary-hover"
          >
            <Plus className="size-7" />
          </Link>
        </div>
      </div>
    </>
  )
}
