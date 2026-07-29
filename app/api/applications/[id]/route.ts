import { eq } from 'drizzle-orm'
import { NextResponse } from 'next/server'

import { getDb } from '@/lib/db'
import { participations, pots } from '@/lib/db/schema'
import { getSessionUserOrNull } from '@/lib/server-data'

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const me = await getSessionUserOrNull()
  if (!me) {
    return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
  }

  const { id } = await params
  const body = await request.json().catch(() => null)
  const action = body?.action

  if (action !== 'APPROVE' && action !== 'REJECT') {
    return NextResponse.json({ error: '올바르지 않은 요청입니다.' }, { status: 400 })
  }

  const db = getDb()
  const [row] = await db
    .select({ hostId: pots.hostId, approvalStatus: participations.approvalStatus })
    .from(participations)
    .innerJoin(pots, eq(participations.potId, pots.id))
    .where(eq(participations.id, id))
    .limit(1)

  if (!row) {
    return NextResponse.json({ error: '존재하지 않는 신청입니다.' }, { status: 404 })
  }
  if (row.hostId !== me.id) {
    return NextResponse.json({ error: '모집자만 처리할 수 있습니다.' }, { status: 403 })
  }
  if (row.approvalStatus !== 'PENDING') {
    return NextResponse.json({ error: '이미 처리된 신청입니다.' }, { status: 409 })
  }

  const nextStatus = action === 'APPROVE' ? 'APPROVED' : 'REJECTED'
  const [updated] = await db
    .update(participations)
    .set({ approvalStatus: nextStatus })
    .where(eq(participations.id, id))
    .returning()

  return NextResponse.json({
    participation: {
      id: updated.id,
      potId: updated.potId,
      userId: updated.userId,
      applyMessage: updated.applyMessage ?? '',
      approvalStatus: updated.approvalStatus,
      createdAt: updated.createdAt.toISOString(),
    },
  })
}
