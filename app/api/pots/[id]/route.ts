import { eq } from 'drizzle-orm'
import { NextResponse } from 'next/server'

import { getDb } from '@/lib/db'
import { pots } from '@/lib/db/schema'
import { computeEffectiveStatus, getPotById, getSessionUserOrNull } from '@/lib/server-data'
import type { PotStatus } from '@/lib/types'

// PRD §5-1 상태 전이: OPEN → CLOSED → ORDERED, 그리고 (OPEN|CLOSED) → CANCELED.
// ORDERED/CANCELED는 종료 상태 — 더 이상 전이하지 않는다.
const ALLOWED_TRANSITIONS: Record<PotStatus, PotStatus[]> = {
  OPEN: ['CLOSED', 'CANCELED'],
  CLOSED: ['ORDERED', 'CANCELED'],
  ORDERED: [],
  CANCELED: [],
}

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const pot = await getPotById(id)
  if (!pot) {
    return NextResponse.json({ error: '존재하지 않는 공동주문입니다.' }, { status: 404 })
  }
  return NextResponse.json(pot)
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const me = await getSessionUserOrNull()
  if (!me) {
    return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
  }

  const { id } = await params
  const body = await request.json().catch(() => null)
  const nextStatus = body?.status as PotStatus | undefined

  if (!nextStatus || !(nextStatus in ALLOWED_TRANSITIONS)) {
    return NextResponse.json({ error: '올바르지 않은 상태 값입니다.' }, { status: 400 })
  }

  const db = getDb()
  const [row] = await db
    .select({ hostId: pots.hostId, status: pots.status, deadlineAt: pots.deadlineAt })
    .from(pots)
    .where(eq(pots.id, id))
    .limit(1)

  if (!row) {
    return NextResponse.json({ error: '존재하지 않는 공동주문입니다.' }, { status: 404 })
  }
  if (row.hostId !== me.id) {
    return NextResponse.json({ error: '모집자만 상태를 변경할 수 있습니다.' }, { status: 403 })
  }

  const currentEffective = computeEffectiveStatus(row.status, row.deadlineAt)
  if (!ALLOWED_TRANSITIONS[currentEffective].includes(nextStatus)) {
    return NextResponse.json(
      { error: `${currentEffective} 상태에서는 ${nextStatus}로 변경할 수 없습니다.` },
      { status: 409 },
    )
  }

  await db.update(pots).set({ status: nextStatus }).where(eq(pots.id, id))

  const pot = await getPotById(id)
  return NextResponse.json({ pot })
}
