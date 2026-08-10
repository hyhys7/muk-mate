import { NextResponse } from 'next/server'

import { getMannerReviewStatus, getSessionUserOrNull } from '@/lib/server-data'

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const me = await getSessionUserOrNull()
  if (!me) {
    return NextResponse.json({ code: 'UNAUTHORIZED', error: '로그인이 필요합니다.' }, { status: 401 })
  }

  const { id: potId } = await params
  const status = await getMannerReviewStatus(potId, me.id)
  return NextResponse.json(status)
}
