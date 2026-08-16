import { NextResponse } from 'next/server'

import { getSessionUserOrNull, getUserPreferences, updateUserPreferences } from '@/lib/server-data'

export async function GET() {
  const me = await getSessionUserOrNull()
  if (!me) {
    return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
  }

  const preferences = await getUserPreferences(me.id)
  return NextResponse.json({ preferences })
}

/** 알림 on/off, 언어(자리만 — 실제 번역 미구현) — body: 바꿀 필드만 부분 전송 */
export async function PATCH(request: Request) {
  const me = await getSessionUserOrNull()
  if (!me) {
    return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
  }

  const body = await request.json().catch(() => null)
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: '잘못된 요청이에요.' }, { status: 400 })
  }

  const patch: { notifyFriendRequest?: boolean; notifyPotInvite?: boolean; language?: string } = {}
  if (typeof body.notifyFriendRequest === 'boolean') patch.notifyFriendRequest = body.notifyFriendRequest
  if (typeof body.notifyPotInvite === 'boolean') patch.notifyPotInvite = body.notifyPotInvite
  if (typeof body.language === 'string') patch.language = body.language

  const preferences = await updateUserPreferences(me.id, patch)
  return NextResponse.json({ preferences })
}
