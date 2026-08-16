import { NextResponse } from 'next/server'

import { blockUser, getBlockedUsers, getSessionUserOrNull } from '@/lib/server-data'

/** 내가 차단한 회원 목록 */
export async function GET() {
  const me = await getSessionUserOrNull()
  if (!me) {
    return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
  }

  const items = await getBlockedUsers(me.id)
  return NextResponse.json({ items })
}

/** 회원 차단 — body: { userId } */
export async function POST(request: Request) {
  const me = await getSessionUserOrNull()
  if (!me) {
    return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
  }

  const body = await request.json().catch(() => null)
  const userId = typeof body?.userId === 'string' ? body.userId : ''
  if (!userId) {
    return NextResponse.json({ error: '잘못된 요청이에요.' }, { status: 400 })
  }

  try {
    await blockUser(me.id, userId)
    return NextResponse.json({ ok: true }, { status: 201 })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : '처리에 실패했어요.' }, { status: 409 })
  }
}
