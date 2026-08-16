import { and, eq } from 'drizzle-orm'
import { NextResponse } from 'next/server'

import { getDb } from '@/lib/db'
import { participations, pots } from '@/lib/db/schema'
import { completeOrderIfConsensusReached, computeEffectiveStatus, getPotById, getSessionUserOrNull } from '@/lib/server-data'

/**
 * 거래 완료 동의 — CLOSED 상태에서 APPROVED 참여자(방장 포함) 본인만 자기 몫을 동의할 수 있다.
 * 전원이 동의하면 서버가 자동으로 ORDERED로 전이하고 채팅방을 정리한다. §5-1, 전원동의 방식.
 */
export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const me = await getSessionUserOrNull()
  if (!me) {
    return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
  }

  const { id } = await params
  const db = getDb()

  const [potRow] = await db
    .select({ status: pots.status, deadlineAt: pots.deadlineAt, storeName: pots.storeName })
    .from(pots)
    .where(eq(pots.id, id))
    .limit(1)

  if (!potRow) {
    return NextResponse.json({ error: '존재하지 않는 공동주문입니다.' }, { status: 404 })
  }

  const effective = computeEffectiveStatus(potRow.status, potRow.deadlineAt)
  if (effective !== 'CLOSED') {
    return NextResponse.json(
      { error: '모집이 마감된 이후에만 거래 완료에 동의할 수 있어요.' },
      { status: 409 },
    )
  }

  const [myPart] = await db
    .select({ id: participations.id, completedAt: participations.completedAt })
    .from(participations)
    .where(
      and(
        eq(participations.potId, id),
        eq(participations.userId, me.id),
        eq(participations.approvalStatus, 'APPROVED'),
      ),
    )
    .limit(1)

  if (!myPart) {
    return NextResponse.json({ error: '참여가 승인된 사람만 거래 완료에 동의할 수 있어요.' }, { status: 403 })
  }

  if (!myPart.completedAt) {
    await db.update(participations).set({ completedAt: new Date() }).where(eq(participations.id, myPart.id))
  }

  const { completed } = await completeOrderIfConsensusReached(id, potRow.storeName, me.id)

  const pot = await getPotById(id, me.id)
  return NextResponse.json({ pot, completed })
}
