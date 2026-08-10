import { NextResponse } from 'next/server'

import { MANNER_TAG_META } from '@/lib/constants'
import { getSessionUserOrNull, submitMannerReview } from '@/lib/server-data'
import type { MannerRating } from '@/lib/types'

const VALID_RATINGS: MannerRating[] = ['GOOD', 'NEUTRAL', 'BAD']

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const me = await getSessionUserOrNull()
  if (!me) {
    return NextResponse.json({ code: 'UNAUTHORIZED', error: '로그인이 필요합니다.' }, { status: 401 })
  }

  const { id: potId } = await params
  const body = await request.json().catch(() => null)

  const revieweeId = typeof body?.revieweeId === 'string' ? body.revieweeId : undefined
  const rating = typeof body?.rating === 'string' ? (body.rating as MannerRating) : undefined
  const rawTags = Array.isArray(body?.tags) ? (body.tags as unknown[]) : []

  if (!revieweeId || !rating || !VALID_RATINGS.includes(rating)) {
    return NextResponse.json({ code: 'INVALID_INPUT', error: '평가 대상과 평가 결과를 확인해주세요.' }, { status: 400 })
  }

  const allowedTags = new Set(Object.keys(MANNER_TAG_META[rating]))
  const tags = rawTags.filter((t): t is string => typeof t === 'string' && allowedTags.has(t))
  if (rawTags.length !== tags.length) {
    return NextResponse.json({ code: 'INVALID_INPUT', error: '선택할 수 없는 태그가 포함되어 있습니다.' }, { status: 400 })
  }

  const result = await submitMannerReview(potId, me.id, revieweeId, rating, tags)
  if (!result.ok) {
    const status = result.code === 'ALREADY_REVIEWED' ? 409 : result.code === 'NOT_A_MEMBER' ? 403 : 400
    return NextResponse.json({ code: result.code, error: result.error }, { status })
  }

  return NextResponse.json({ ok: true }, { status: 201 })
}
