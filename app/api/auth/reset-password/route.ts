import { eq } from 'drizzle-orm'
import { NextResponse } from 'next/server'

import bcrypt from 'bcryptjs'

import { getDb } from '@/lib/db'
import { users } from '@/lib/db/schema'
import { hasRecentlyConfirmedEmail } from '@/lib/server-data'

const PASSWORD_MIN = 4
const PASSWORD_MAX = 16

/** 비밀번호 찾기(재설정) — 이메일 인증(RESET_PASSWORD) 확인 후 새 비밀번호로 바꾼다. 로그인 불필요. */
export async function POST(request: Request) {
  const body = await request.json().catch(() => null)
  const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : ''
  const newPassword = typeof body?.newPassword === 'string' ? body.newPassword : ''

  if (!email) {
    return NextResponse.json({ error: '이메일을 입력해 주세요.' }, { status: 400 })
  }
  if (newPassword.length < PASSWORD_MIN || newPassword.length > PASSWORD_MAX) {
    return NextResponse.json(
      { error: `새 비밀번호는 ${PASSWORD_MIN}~${PASSWORD_MAX}자여야 합니다.` },
      { status: 400 },
    )
  }

  if (!(await hasRecentlyConfirmedEmail(email, 'RESET_PASSWORD'))) {
    return NextResponse.json({ error: '이메일 인증을 먼저 완료해 주세요.' }, { status: 409 })
  }

  const db = getDb()
  const [account] = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1)
  if (!account) {
    return NextResponse.json({ error: '등록된 계정을 찾을 수 없어요.' }, { status: 404 })
  }

  const newHash = await bcrypt.hash(newPassword, 10)
  await db.update(users).set({ passwordHash: newHash }).where(eq(users.id, account.id))

  return NextResponse.json({ ok: true })
}
