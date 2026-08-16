import { eq } from 'drizzle-orm'
import { NextResponse } from 'next/server'

import { getDb } from '@/lib/db'
import { pots } from '@/lib/db/schema'
import { getSessionUserOrNull, invitePotFriend } from '@/lib/server-data'

/** 모집글에 친구 초대 — 방장 전용. 초대는 자동 승인이 아니라 알림만 보낸다(참여는 여전히 신청→승인 절차를 거친다). */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const me = await getSessionUserOrNull()
  if (!me) {
    return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
  }

  const { id } = await params
  const db = getDb()
  const [pot] = await db.select({ hostId: pots.hostId }).from(pots).where(eq(pots.id, id)).limit(1)
  if (!pot) {
    return NextResponse.json({ error: '존재하지 않는 공동주문입니다.' }, { status: 404 })
  }
  if (pot.hostId !== me.id) {
    return NextResponse.json({ error: '모집자만 친구를 초대할 수 있습니다.' }, { status: 403 })
  }

  const body = await request.json().catch(() => null)
  const friendUserId = typeof body?.friendUserId === 'string' ? body.friendUserId : ''
  if (!friendUserId) {
    return NextResponse.json({ error: '잘못된 요청이에요.' }, { status: 400 })
  }

  try {
    await invitePotFriend(id, me.id, friendUserId)
    return NextResponse.json({ ok: true }, { status: 201 })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : '초대에 실패했어요.' }, { status: 409 })
  }
}
