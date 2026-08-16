import { eq } from 'drizzle-orm'
import { NextResponse } from 'next/server'

import { getDb } from '@/lib/db'
import { users } from '@/lib/db/schema'
import { getSessionUserOrNull, verifyEmailCode } from '@/lib/server-data'
import type { VerificationPurpose } from '@/lib/types'

const VALID_PURPOSES: VerificationPurpose[] = ['SIGNUP', 'FIND_ID', 'RESET_PASSWORD', 'CHANGE_LOGIN_ID']

/** 인증코드 확인 — 성공하면 그 자리에서 소모된다. 실제 액션(가입 제출 등)은 이 확인을
 *  다시 요구하지 않고 hasRecentlyConfirmedEmail()로 "방금 확인했는지"만 본다. */
export async function POST(request: Request) {
  const body = await request.json().catch(() => null)
  const purpose = VALID_PURPOSES.includes(body?.purpose) ? (body.purpose as VerificationPurpose) : null
  const code = typeof body?.code === 'string' ? body.code.trim() : ''
  if (!purpose || !code) {
    return NextResponse.json({ error: '잘못된 요청이에요.' }, { status: 400 })
  }

  let email: string
  if (purpose === 'CHANGE_LOGIN_ID') {
    const me = await getSessionUserOrNull()
    if (!me) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
    }
    const db = getDb()
    const [row] = await db.select({ email: users.email }).from(users).where(eq(users.id, me.id)).limit(1)
    if (!row?.email) {
      return NextResponse.json({ error: '등록된 이메일이 없어요.' }, { status: 409 })
    }
    email = row.email
  } else {
    email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : ''
    if (!email) {
      return NextResponse.json({ error: '이메일을 입력해 주세요.' }, { status: 400 })
    }
  }

  const ok = await verifyEmailCode(email, purpose, code)
  if (!ok) {
    return NextResponse.json({ error: '인증코드가 올바르지 않거나 만료됐어요.' }, { status: 400 })
  }
  return NextResponse.json({ ok: true })
}
