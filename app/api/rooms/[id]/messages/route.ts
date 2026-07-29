import { NextResponse } from 'next/server'

import { getDb } from '@/lib/db'
import { messages } from '@/lib/db/schema'
import { getMessagesForRoom, getRoomForViewer, getSessionUserOrNull } from '@/lib/server-data'

const CONTENT_MAX = 500

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const me = await getSessionUserOrNull()
  if (!me) {
    return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
  }

  const { id } = await params
  const access = await getRoomForViewer(id, me.id)
  if (!access) {
    return NextResponse.json({ error: '접근 권한이 없습니다.' }, { status: 403 })
  }

  const afterRaw = new URL(request.url).searchParams.get('after')
  const after = Number(afterRaw ?? '0')

  const list = await getMessagesForRoom(id, Number.isFinite(after) ? after : 0, me.id)
  return NextResponse.json(list)
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const me = await getSessionUserOrNull()
  if (!me) {
    return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
  }

  const { id } = await params
  const access = await getRoomForViewer(id, me.id)
  if (!access) {
    return NextResponse.json({ error: '접근 권한이 없습니다.' }, { status: 403 })
  }

  const body = await request.json().catch(() => null)
  const content = typeof body?.content === 'string' ? body.content.trim() : ''
  if (!content || content.length > CONTENT_MAX) {
    return NextResponse.json({ error: '메시지를 확인해 주세요.' }, { status: 400 })
  }

  const db = getDb()
  const [created] = await db
    .insert(messages)
    .values({ roomId: id, senderId: me.id, type: 'TEXT', content })
    .returning()

  return NextResponse.json(
    {
      message: {
        id: String(created.id),
        roomId: created.roomId,
        senderId: created.senderId ?? '',
        senderNickname: me.nickname,
        type: created.type,
        content: created.content,
        createdAt: created.createdAt.toISOString(),
        isMine: true,
      },
    },
    { status: 201 },
  )
}
