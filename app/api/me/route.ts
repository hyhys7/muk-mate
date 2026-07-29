import { eq } from 'drizzle-orm'
import { NextResponse } from 'next/server'

import { getDb } from '@/lib/db'
import { users, zones } from '@/lib/db/schema'
import { getSessionUserOrNull } from '@/lib/server-data'

const NICKNAME_MAX = 12

export async function PATCH(request: Request) {
  const me = await getSessionUserOrNull()
  if (!me) {
    return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
  }

  const body = await request.json().catch(() => null)
  const nickname = typeof body?.nickname === 'string' ? body.nickname.trim() : ''
  const zoneCode = typeof body?.zoneCode === 'string' ? body.zoneCode : ''

  if (!nickname || nickname.length > NICKNAME_MAX) {
    return NextResponse.json({ error: '닉네임을 확인해 주세요.' }, { status: 400 })
  }
  if (!zoneCode) {
    return NextResponse.json({ error: '활동 지역을 선택해 주세요.' }, { status: 400 })
  }

  const db = getDb()
  const [zone] = await db.select({ code: zones.code }).from(zones).where(eq(zones.code, zoneCode)).limit(1)
  if (!zone) {
    return NextResponse.json({ error: '올바르지 않은 활동 지역입니다.' }, { status: 400 })
  }

  const [updated] = await db
    .update(users)
    .set({ nickname, zoneCode })
    .where(eq(users.id, me.id))
    .returning({ nickname: users.nickname, zoneCode: users.zoneCode })

  return NextResponse.json({ user: updated })
}
