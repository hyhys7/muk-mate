import { NextResponse } from 'next/server'

import { getFriendsOverview, getSessionUserOrNull, sendFriendRequest } from '@/lib/server-data'

/** 내 친구 목록 + 받은/보낸 요청 */
export async function GET() {
  const me = await getSessionUserOrNull()
  if (!me) {
    return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
  }

  const overview = await getFriendsOverview(me.id)
  return NextResponse.json(overview)
}

/** 친구 요청 보내기 */
export async function POST(request: Request) {
  const me = await getSessionUserOrNull()
  if (!me) {
    return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
  }

  const body = await request.json().catch(() => null)
  const addresseeId = typeof body?.addresseeId === 'string' ? body.addresseeId : ''
  if (!addresseeId) {
    return NextResponse.json({ error: '잘못된 요청이에요.' }, { status: 400 })
  }

  try {
    await sendFriendRequest(me.id, addresseeId)
    return NextResponse.json({ ok: true }, { status: 201 })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : '요청에 실패했어요.' }, { status: 409 })
  }
}
