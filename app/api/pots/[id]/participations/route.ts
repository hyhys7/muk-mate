import { eq } from 'drizzle-orm'
import { NextResponse } from 'next/server'

import { getDb, getPgErrorCode } from '@/lib/db'
import { participations, pots } from '@/lib/db/schema'
import { computeEffectiveStatus, getParticipationsForPot, getSessionUserOrNull } from '@/lib/server-data'

const APPLY_MESSAGE_MAX = 200

// Postgres unique_violation — UNIQUE(pot_id, user_id) 위반 시 발생
const UNIQUE_VIOLATION = '23505'

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const me = await getSessionUserOrNull()
  const list = await getParticipationsForPot(id, me?.id)
  return NextResponse.json(list)
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const me = await getSessionUserOrNull()
  if (!me) {
    return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
  }

  const { id } = await params
  const body = await request.json().catch(() => ({}))
  const applyMessage = typeof body?.applyMessage === 'string' ? body.applyMessage.trim() : ''

  if (applyMessage.length > APPLY_MESSAGE_MAX) {
    return NextResponse.json({ error: '참여 메시지가 너무 깁니다.' }, { status: 400 })
  }

  const db = getDb()
  const [pot] = await db
    .select({ hostId: pots.hostId, status: pots.status, deadlineAt: pots.deadlineAt })
    .from(pots)
    .where(eq(pots.id, id))
    .limit(1)

  if (!pot) {
    return NextResponse.json({ error: '존재하지 않는 공동주문입니다.' }, { status: 404 })
  }
  if (pot.hostId === me.id) {
    return NextResponse.json({ error: '자신이 만든 공동주문에는 참여 신청할 수 없습니다.' }, { status: 400 })
  }
  if (computeEffectiveStatus(pot.status, pot.deadlineAt) !== 'OPEN') {
    return NextResponse.json({ error: '마감된 공동주문에는 참여 신청할 수 없습니다.' }, { status: 409 })
  }

  try {
    const [created] = await db
      .insert(participations)
      .values({ potId: id, userId: me.id, applyMessage: applyMessage || null })
      .returning()

    return NextResponse.json(
      {
        participation: {
          id: created.id,
          potId: created.potId,
          userId: created.userId,
          applyMessage: created.applyMessage ?? '',
          approvalStatus: created.approvalStatus,
          createdAt: created.createdAt.toISOString(),
        },
      },
      { status: 201 },
    )
  } catch (err) {
    const code = getPgErrorCode(err)
    if (code === UNIQUE_VIOLATION) {
      return NextResponse.json({ error: '이미 신청한 공동주문입니다.' }, { status: 409 })
    }
    throw err
  }
}
