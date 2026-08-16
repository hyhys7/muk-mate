import { eq } from 'drizzle-orm'
import { NextResponse } from 'next/server'

import { getDb } from '@/lib/db'
import { users } from '@/lib/db/schema'
import { isSchoolEmail, maskEmail } from '@/lib/constants'
import { createEmailVerification, getSessionUserOrNull } from '@/lib/server-data'
import type { VerificationPurpose } from '@/lib/types'

const VALID_PURPOSES: VerificationPurpose[] = ['SIGNUP', 'FIND_ID', 'RESET_PASSWORD', 'CHANGE_LOGIN_ID']

/**
 * 인증코드 발송 — 4가지 목적 공용.
 * - SIGNUP: 아직 계정이 없는 새 이메일. @jbnu.ac.kr만 허용, 중복 이메일 차단.
 * - FIND_ID / RESET_PASSWORD: 기존 계정의 등록된 이메일. 계정이 없어도 항상 같은 응답을
 *   줘서 "이 이메일로 가입했는지"가 응답 차이로 새 나가지 않게 한다.
 * - CHANGE_LOGIN_ID: 로그인 세션 필요. 요청 본문의 이메일은 무시하고, 반드시 세션 계정에
 *   이미 등록된 이메일로만 보낸다 — 그래야 "그 계정을 실제로 쓸 수 있는 사람"만 통과한다.
 */
export async function POST(request: Request) {
  const body = await request.json().catch(() => null)
  const purpose = VALID_PURPOSES.includes(body?.purpose) ? (body.purpose as VerificationPurpose) : null
  if (!purpose) {
    return NextResponse.json({ error: '잘못된 요청이에요.' }, { status: 400 })
  }

  const db = getDb()

  if (purpose === 'CHANGE_LOGIN_ID') {
    const me = await getSessionUserOrNull()
    if (!me) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
    }
    const [row] = await db.select({ email: users.email }).from(users).where(eq(users.id, me.id)).limit(1)
    if (!row?.email) {
      return NextResponse.json({ error: '등록된 이메일이 없어요. 먼저 이메일을 등록해 주세요.' }, { status: 409 })
    }
    try {
      await createEmailVerification(row.email, purpose, me.id)
    } catch (err) {
      return NextResponse.json({ error: err instanceof Error ? err.message : '발송에 실패했어요.' }, { status: 500 })
    }
    return NextResponse.json({ ok: true, maskedEmail: maskEmail(row.email) })
  }

  const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : ''
  if (!email) {
    return NextResponse.json({ error: '이메일을 입력해 주세요.' }, { status: 400 })
  }

  if (purpose === 'SIGNUP') {
    if (!isSchoolEmail(email)) {
      return NextResponse.json({ error: '전북대 이메일(@jbnu.ac.kr)만 사용할 수 있어요.' }, { status: 400 })
    }
    const [existing] = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1)
    if (existing) {
      return NextResponse.json({ error: '이미 가입에 사용된 이메일이에요.' }, { status: 409 })
    }
    try {
      await createEmailVerification(email, purpose)
    } catch (err) {
      return NextResponse.json({ error: err instanceof Error ? err.message : '발송에 실패했어요.' }, { status: 500 })
    }
    return NextResponse.json({ ok: true })
  }

  // FIND_ID / RESET_PASSWORD
  const [account] = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1)
  if (account) {
    try {
      await createEmailVerification(email, purpose, account.id)
    } catch (err) {
      return NextResponse.json({ error: err instanceof Error ? err.message : '발송에 실패했어요.' }, { status: 500 })
    }
  }
  return NextResponse.json({ ok: true })
}
