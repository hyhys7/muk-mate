'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { PotStatusBadge } from '@/components/status-badge'
import { adminDeletePot } from '@/lib/api'
import { zoneLabel } from '@/lib/constants'
import { formatDateTime } from '@/lib/format'
import type { Pot } from '@/lib/types'

export function AdminPotsView({ pots }: { pots: Pot[] }) {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [busyId, setBusyId] = useState<string | null>(null)

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return pots
    return pots.filter(
      (p) =>
        p.storeName.toLowerCase().includes(q) ||
        p.orderSummary.toLowerCase().includes(q) ||
        p.hostNickname.toLowerCase().includes(q),
    )
  }, [pots, query])

  async function handleDelete(pot: Pot) {
    if (!confirm(`"${pot.storeName}" 모집글을 삭제하시겠습니까? 참여자·채팅 내역이 있어도 즉시 삭제되며 되돌릴 수 없습니다.`)) return
    setBusyId(pot.id)
    try {
      await adminDeletePot(pot.id)
      router.refresh()
    } catch (err) {
      alert(err instanceof Error ? err.message : '삭제에 실패했어요.')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex items-center gap-2 border-b border-border px-4 py-3">
        <Search className="size-4 shrink-0 text-muted-foreground" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="가게 이름·메뉴·방장 닉네임으로 검색"
          className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
        />
      </div>

      {visible.length === 0 ? (
        <p className="flex flex-1 items-center justify-center p-8 text-sm text-muted-foreground">
          해당하는 모집글이 없어요.
        </p>
      ) : (
        <ul className="flex flex-col divide-y divide-border">
          {visible.map((pot) => (
            <li key={pot.id} className="flex items-center gap-3 px-4 py-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <PotStatusBadge status={pot.status} />
                  <span className="truncate text-sm font-semibold text-foreground">{pot.storeName}</span>
                </div>
                <p className="mt-1 truncate text-xs text-muted-foreground">
                  {zoneLabel(pot.zoneCode)} · {pot.hostNickname} · {pot.currentCount}/{pot.targetValue}명 ·{' '}
                  {formatDateTime(pot.createdAt)}
                </p>
              </div>
              <Button
                size="sm"
                variant="destructive"
                disabled={busyId === pot.id}
                onClick={() => handleDelete(pot)}
              >
                삭제
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
