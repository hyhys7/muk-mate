import { eq } from 'drizzle-orm'
import { NextResponse } from 'next/server'

import { getDb } from '@/lib/db'
import { users } from '@/lib/db/schema'
import { hasRecentlyConfirmedEmail } from '@/lib/server-data'

/** 아이디 찾기 — 이메일 인증(FIND_ID) 확인 후 등록된 아이디를 알려준다. 로그인 불필요. */
export async function POST(request: Request) {
  const body = await request.json().catch(() => null)
  const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : ''
  if (!email) {
    return NextResponse.json({ error: '이메일을 입력해 주세요.' }, { status: 400 })
  }

  if (!(await hasRecentlyConfirmedEmail(email, 'FIND_ID'))) {
    return NextResponse.json({ error: '이메일 인증을 먼저 완료해 주세요.' }, { status: 409 })
  }

  const db = getDb()
  const [account] = await db.select({ loginId: users.loginId }).from(users).where(eq(users.email, email)).limit(1)
  if (!account) {
    return NextResponse.json({ error: '등록된 계정을 찾을 수 없어요.' }, { status: 404 })
  }

  return NextResponse.json({ loginId: account.loginId })
}
