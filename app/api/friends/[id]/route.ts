import { NextResponse } from 'next/server'

import { getSessionUserOrNull, removeFriendship, respondFriendRequest } from '@/lib/server-data'

/** 받은 친구 요청 수락/거절 — body: { action: 'accept' | 'reject' }. 받은 사람 본인만 처리할 수 있다. */
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const me = await getSessionUserOrNull()
  if (!me) {
    return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
  }

  const { id } = await params
  const body = await request.json().catch(() => null)
  const action = body?.action === 'accept' || body?.action === 'reject' ? body.action : null
  if (!action) {
    return NextResponse.json({ error: '잘못된 요청이에요.' }, { status: 400 })
  }

  try {
    await respondFriendRequest(id, me.id, action)
    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : '처리에 실패했어요.' }, { status: 409 })
  }
}

/** 친구 삭제(수락된 관계 해제) 또는 보낸 요청 취소 — 당사자만 가능 */
export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const me = await getSessionUserOrNull()
  if (!me) {
    return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
  }

  const { id } = await params
  try {
    await removeFriendship(id, me.id)
    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : '처리에 실패했어요.' }, { status: 409 })
  }
}
