import { NextResponse } from 'next/server'

import { getOrCreateDmRoom, getSessionUserOrNull } from '@/lib/server-data'

/** 친구와의 1:1 대화방을 가져오거나 새로 만든다 — 친구 사이에서만 허용된다(서버가 항상 재검증). */
export async function POST(_request: Request, { params }: { params: Promise<{ userId: string }> }) {
  const me = await getSessionUserOrNull()
  if (!me) {
    return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
  }

  const { userId } = await params
  try {
    const roomId = await getOrCreateDmRoom(me.id, userId)
    return NextResponse.json({ roomId })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : '처리에 실패했어요.' }, { status: 409 })
  }
}
