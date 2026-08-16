import { eq } from 'drizzle-orm'
import { NextResponse } from 'next/server'

import { getDb, getPgErrorCode } from '@/lib/db'
import { users } from '@/lib/db/schema'
import { getSessionUserOrNull, hasRecentlyConfirmedEmail } from '@/lib/server-data'

const LOGIN_ID_MIN = 4
const LOGIN_ID_MAX = 10
const UNIQUE_VIOLATION = '23505'

/** 아이디 변경 — 로그인 세션 + 본인 계정에 등록된 이메일로 CHANGE_LOGIN_ID 인증 확인 필요. */
export async function PATCH(request: Request) {
  const me = await getSessionUserOrNull()
  if (!me) {
    return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
  }

  const body = await request.json().catch(() => null)
  const newLoginId = typeof body?.newLoginId === 'string' ? body.newLoginId.trim() : ''
  if (newLoginId.length < LOGIN_ID_MIN || newLoginId.length > LOGIN_ID_MAX) {
    return NextResponse.json(
      { error: `아이디는 ${LOGIN_ID_MIN}~${LOGIN_ID_MAX}자여야 합니다.` },
      { status: 400 },
    )
  }

  const db = getDb()
  const [row] = await db.select({ email: users.email }).from(users).where(eq(users.id, me.id)).limit(1)
  if (!row?.email) {
    return NextResponse.json({ error: '등록된 이메일이 없어요. 먼저 이메일을 등록해 주세요.' }, { status: 409 })
  }
  if (!(await hasRecentlyConfirmedEmail(row.email, 'CHANGE_LOGIN_ID'))) {
    return NextResponse.json({ error: '이메일 인증을 먼저 완료해 주세요.' }, { status: 409 })
  }

  try {
    await db.update(users).set({ loginId: newLoginId }).where(eq(users.id, me.id))
  } catch (err) {
    const code = getPgErrorCode(err)
    if (code === UNIQUE_VIOLATION) {
      return NextResponse.json({ error: '이미 사용 중인 아이디입니다.' }, { status: 409 })
    }
    throw err
  }

  return NextResponse.json({ ok: true, loginId: newLoginId })
}
