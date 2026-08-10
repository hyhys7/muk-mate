import { eq } from 'drizzle-orm'
import { NextResponse } from 'next/server'

import { getAdminOrNull } from '@/lib/admin/auth'
import { getDb } from '@/lib/db'
import { users } from '@/lib/db/schema'
import { applyAdminSanction } from '@/lib/server-data'

const STATUS_SET = new Set(['ACTIVE', 'SUSPENDED', 'DISABLED'])
const SANCTION_STATUSES = new Set(['SUSPENDED', 'DISABLED'])

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getAdminOrNull()
  if (!admin) {
    return NextResponse.json({ error: '관리자 권한이 필요합니다.' }, { status: 403 })
  }

  const { id } = await params
  const body = await request.json().catch(() => null)
  const accountStatus = typeof body?.accountStatus === 'string' ? body.accountStatus : ''

  if (!STATUS_SET.has(accountStatus)) {
    return NextResponse.json({ error: '올바른 계정 상태 값을 선택해 주세요.' }, { status: 400 })
  }

  if (id === admin.id) {
    return NextResponse.json({ error: '자기 자신의 계정 상태는 변경할 수 없습니다.' }, { status: 400 })
  }

  const db = getDb()
  const [existing] = await db.select({ id: users.id, accountStatus: users.accountStatus }).from(users).where(eq(users.id, id)).limit(1)
  if (!existing) {
    return NextResponse.json({ error: '존재하지 않는 사용자입니다.' }, { status: 404 })
  }

  const [updated] = await db
    .update(users)
    .set({ accountStatus: accountStatus as never })
    .where(eq(users.id, id))
    .returning({ id: users.id, accountStatus: users.accountStatus })

  // v2.9(17-5): 신고 검토 결과 실제 제재(SUSPENDED/DISABLED)로 이어질 때만 매너 이벤트를 남긴다 —
  // 신고 접수 자체나 이미 제재된 계정을 다시 같은 상태로 두는 경우는 중복 적용하지 않는다.
  if (existing.accountStatus === 'ACTIVE' && SANCTION_STATUSES.has(accountStatus)) {
    await applyAdminSanction(id)
  }

  return NextResponse.json({ user: updated })
}
