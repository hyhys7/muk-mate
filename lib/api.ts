// ─────────────────────────────────────────────────────────────
// 클라이언트(브라우저) 전용 데이터 접근 계층 — 'use client' 컴포넌트에서 호출한다.
// 여기 있는 함수는 전부 fetch()로 실제 API를 부른다. DB(@/lib/db)나 인증(@/auth)을
// 직접 import하지 않는다 — 그러면 서버 전용 코드가 브라우저 번들에 끼어 들어가려다
// 빌드가 깨진다. 서버 컴포넌트가 필요로 하는 조회는 lib/server-data.ts를 쓴다.
//
// ─────────────────────────────────────────────────────────────
import type { Message, Participation, Place, Pot, PotStatus, ZoneCode } from '@/lib/types'

async function parseJsonResponse<T>(res: Response): Promise<T> {
  const data = await res.json().catch(() => null)
  if (!res.ok) {
    const message = (data as { error?: string } | null)?.error ?? '요청에 실패했습니다.'
    throw new Error(message)
  }
  return data as T
}

/** 공동주문 신규 모집글 등록 — POST /api/pots */
export async function createPot(input: {
  storeName: string
  storeAddress?: string
  storeLat?: number
  storeLng?: number
  orderSummary: string
  zoneCode: ZoneCode
  targetType: 'HEADCOUNT' | 'AMOUNT'
  targetValue: number
  deliveryFee: number
  deadlineMinutes: number
  pickupMinutes: number
  pickupName: string
  pickupAddress?: string
  pickupLat?: number
  pickupLng?: number
  pickupNote?: string
  extraNote?: string
}): Promise<Pot> {
  const res = await fetch('/api/pots', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
  const data = await parseJsonResponse<{ pot: Pot }>(res)
  return data.pot
}

/** 모집글 상태 변경(마감/완료/취소) — PATCH /api/pots/:id, 모집자 전용 */
export async function updatePotStatus(potId: string, status: PotStatus): Promise<Pot> {
  const res = await fetch(`/api/pots/${potId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  })
  const data = await parseJsonResponse<{ pot: Pot }>(res)
  return data.pot
}

/** 참여 신청 — POST /api/pots/:id/participations */
export async function applyToPot(potId: string, applyMessage: string): Promise<Participation> {
  const res = await fetch(`/api/pots/${potId}/participations`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ applyMessage }),
  })
  const data = await parseJsonResponse<{ participation: Participation }>(res)
  return data.participation
}

/** 참여 신청 승인/거절 — PATCH /api/applications/:id, 모집자 전용 */
export async function updateApplicationStatus(
  applicationId: string,
  action: 'APPROVE' | 'REJECT',
): Promise<Participation> {
  const res = await fetch(`/api/applications/${applicationId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action }),
  })
  const data = await parseJsonResponse<{ participation: Participation }>(res)
  return data.participation
}

/** 기본정보(닉네임/활동지역) 수정 — PATCH /api/me */
export async function updateProfile(input: { nickname: string; zoneCode: ZoneCode }): Promise<{
  nickname: string
  zoneCode: ZoneCode
}> {
  const res = await fetch('/api/me', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
  const data = await parseJsonResponse<{ user: { nickname: string; zoneCode: ZoneCode } }>(res)
  return data.user
}

/** 비밀번호 변경 — PATCH /api/me/password, 현재 비밀번호 확인 후 변경 */
export async function changePassword(input: { currentPassword: string; newPassword: string }): Promise<void> {
  const res = await fetch('/api/me/password', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
  await parseJsonResponse<{ ok: true }>(res)
}

/** 채팅 메시지 증분 조회(폴링) — GET /api/rooms/:id/messages?after= */
export async function getMessages(roomId: string, afterId = 0): Promise<Message[]> {
  const res = await fetch(`/api/rooms/${roomId}/messages?after=${afterId}`)
  return parseJsonResponse<Message[]>(res)
}

/** 메시지 전송 — POST /api/rooms/:id/messages */
export async function sendMessage(roomId: string, content: string): Promise<Message> {
  const res = await fetch(`/api/rooms/${roomId}/messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content }),
  })
  const data = await parseJsonResponse<{ message: Message }>(res)
  return data.message
}

/** 장소 검색 — GET /api/places/search?q=, 카카오 로컬 API 서버 프록시 */
export async function searchPlaces(keyword: string): Promise<Place[]> {
  const q = keyword.trim()
  if (!q) return []
  const res = await fetch(`/api/places/search?q=${encodeURIComponent(q)}`)
  return parseJsonResponse<Place[]>(res)
}
