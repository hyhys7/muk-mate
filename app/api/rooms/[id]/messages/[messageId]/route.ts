import { and, eq, isNull } from 'drizzle-orm'
import { NextResponse } from 'next/server'

import { getDb } from '@/lib/db'
import { messages } from '@/lib/db/schema'
import { getRoomForViewer, getSessionUserOrNull } from '@/lib/server-data'

/** 카카오톡식 "전체 삭제" — 보낸 사람 본인만, 아직 안 지워진 메시지만 지울 수 있다. */
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string; messageId: string }> }) {
  const me = await getSessionUserOrNull()
  if (!me) {
    return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
  }

  const { id, messageId: messageIdRaw } = await params
  const access = await getRoomForViewer(id, me.id)
  if (!access) {
    return NextResponse.json({ error: '접근 권한이 없습니다.' }, { status: 403 })
  }

  const messageId = Number(messageIdRaw)
  if (!Number.isFinite(messageId)) {
    return NextResponse.json({ error: '잘못된 요청이에요.' }, { status: 400 })
  }

  const db = getDb()
  // 서버에서 항상 재검증: room_id 일치 + 보낸 사람 본인 + 아직 삭제 안 된 메시지.
  const [updated] = await db
    .update(messages)
    .set({ deletedAt: new Date() })
    .where(
      and(
        eq(messages.id, messageId),
        eq(messages.roomId, id),
        eq(messages.senderId, me.id),
        isNull(messages.deletedAt),
      ),
    )
    .returning({ id: messages.id })

  if (!updated) {
    return NextResponse.json({ error: '삭제할 수 없는 메시지예요.' }, { status: 404 })
  }

  return NextResponse.json({ ok: true })
}
