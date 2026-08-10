import { NextResponse } from 'next/server'

import { MANNER_AVATAR_ACCESSORY_META, MANNER_AVATAR_COLOR_META } from '@/lib/constants'
import { getMannerProfile, getSessionUserOrNull, updateMannerAvatar } from '@/lib/server-data'
import type { MannerAvatarAccessory, MannerAvatarColor } from '@/lib/types'

export async function PATCH(request: Request) {
  const me = await getSessionUserOrNull()
  if (!me) {
    return NextResponse.json({ code: 'UNAUTHORIZED', error: '로그인이 필요합니다.' }, { status: 401 })
  }

  const body = await request.json().catch(() => null)
  const avatarColor = typeof body?.avatarColor === 'string' ? (body.avatarColor as MannerAvatarColor) : undefined
  const avatarAccessory =
    typeof body?.avatarAccessory === 'string' ? (body.avatarAccessory as MannerAvatarAccessory) : undefined

  if (!avatarColor || !(avatarColor in MANNER_AVATAR_COLOR_META)) {
    return NextResponse.json({ code: 'INVALID_INPUT', error: '색상을 확인해주세요.' }, { status: 400 })
  }
  if (!avatarAccessory || !(avatarAccessory in MANNER_AVATAR_ACCESSORY_META)) {
    return NextResponse.json({ code: 'INVALID_INPUT', error: '소품을 확인해주세요.' }, { status: 400 })
  }

  await updateMannerAvatar(me.id, avatarColor, avatarAccessory)
  const manner = await getMannerProfile(me.id)
  return NextResponse.json({ manner })
}
