// ─────────────────────────────────────────────────────────────
// 클라이언트(브라우저) 전용 데이터 접근 계층 — 'use client' 컴포넌트에서 호출한다.
// 여기 있는 함수는 전부 fetch()로 실제 API를 부른다. DB(@/lib/db)나 인증(@/auth)을
// 직접 import하지 않는다 — 그러면 서버 전용 코드가 브라우저 번들에 끼어 들어가려다
// 빌드가 깨진다. 서버 컴포넌트가 필요로 하는 조회는 lib/server-data.ts를 쓴다.
//
// 아직 mock-data를 쓰는 함수들(getMyHostedPots 이하)은 Phase 4/5에서 실제 API로 교체 예정.
// ─────────────────────────────────────────────────────────────
import {
  CHAT_ROOMS,
  CURRENT_USER_ID,
  MESSAGES,
  PARTICIPATIONS,
  POTS,
} from '@/lib/mock-data'
import type {
  ChatRoom,
  Message,
  Participation,
  Place,
  Pot,
  PotStatus,
  ZoneCode,
} from '@/lib/types'

function delay<T>(data: T, ms = 300): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(data), ms))
}

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

/** 내가 만든 공동주문 */
export async function getMyHostedPots(): Promise<Pot[]> {
  // TODO: replace with real API call — GET /api/me/pots?role=host (Phase 5)
  return delay(POTS.filter((p) => p.hostId === CURRENT_USER_ID))
}

/** 내가 참여 신청한 공동주문 (신청 + 원본 Pot) */
export async function getMyApplications(): Promise<
  { participation: Participation; pot: Pot }[]
> {
  // TODO: replace with real API call — GET /api/me/participations (Phase 5)
  const mine = PARTICIPATIONS.filter((p) => p.userId === CURRENT_USER_ID)
  const joined = mine
    .map((participation) => {
      const pot = POTS.find((p) => p.id === participation.potId)
      return pot ? { participation, pot } : null
    })
    .filter(Boolean) as { participation: Participation; pot: Pot }[]
  return delay(joined)
}

/** 내 채팅방 목록 */
export async function getMyRooms(): Promise<ChatRoom[]> {
  // TODO: replace with real API call — GET /api/rooms (Phase 4)
  return delay(CHAT_ROOMS)
}

/** 채팅방 단건 */
export async function getRoom(roomId: string): Promise<ChatRoom | undefined> {
  // TODO: replace with real API call — GET /api/rooms/:id (Phase 4)
  return delay(CHAT_ROOMS.find((r) => r.id === roomId))
}

/** 채팅 메시지 목록 */
export async function getMessages(roomId: string): Promise<Message[]> {
  // TODO: replace with real API call — GET /api/rooms/:id/messages?after=lastId (Phase 4)
  return delay(MESSAGES[roomId] ?? [])
}

/** 장소 검색 — GET /api/places/search?q=, 카카오 로컬 API 서버 프록시 */
export async function searchPlaces(keyword: string): Promise<Place[]> {
  const q = keyword.trim()
  if (!q) return []
  const res = await fetch(`/api/places/search?q=${encodeURIComponent(q)}`)
  return parseJsonResponse<Place[]>(res)
}
