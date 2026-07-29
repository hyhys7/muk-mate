import 'server-only'

import { desc, eq, inArray } from 'drizzle-orm'
import { redirect } from 'next/navigation'

import { auth } from '@/auth'
import { getDb } from '@/lib/db'
import { participations, pots, users } from '@/lib/db/schema'
import type { Participation, Pot, PotStatus, User, ZoneCode } from '@/lib/types'

// ─────────────────────────────────────────────────────────────
// 서버 컴포넌트 전용 데이터 접근 계층.
// 클라이언트 컴포넌트에서 이 파일을 import하면 안 된다 (위 'server-only' import가
// 실수로 그렇게 했을 때 빌드 타임에 바로 에러를 내준다). 브라우저에서 호출해야 하는
// 뮤테이션/조회는 lib/api.ts의 fetch() 기반 함수를 쓴다.
//
// 여기 있는 조회 로직은 app/api/pots*/route.ts의 GET 핸들러와 동일한 쿼리를
// 공유한다 — 페이지(서버 컴포넌트)가 직접 부르든, 외부에서 API로 부르든 같은 결과가
// 나오도록 하기 위함. Route Handler에서 인증/응답 포맷팅만 얹어서 재사용한다.
// ─────────────────────────────────────────────────────────────

export function computeEffectiveStatus(status: PotStatus, deadlineAt: Date): PotStatus {
  if (status === 'OPEN' && deadlineAt.getTime() < Date.now()) return 'CLOSED'
  return status
}

const potColumns = {
  id: pots.id,
  hostId: pots.hostId,
  hostNickname: users.nickname,
  zoneCode: pots.zoneCode,
  storeName: pots.storeName,
  storeAddress: pots.storeAddress,
  storeLat: pots.storeLat,
  storeLng: pots.storeLng,
  orderSummary: pots.orderSummary,
  targetType: pots.targetType,
  targetValue: pots.targetValue,
  deliveryFee: pots.deliveryFee,
  deadlineAt: pots.deadlineAt,
  pickupAt: pots.pickupAt,
  pickupName: pots.pickupName,
  pickupAddress: pots.pickupAddress,
  pickupNote: pots.pickupNote,
  extraNote: pots.extraNote,
  status: pots.status,
  createdAt: pots.createdAt,
} as const

type PotRow = {
  id: string
  hostId: string
  hostNickname: string
  zoneCode: string
  storeName: string
  storeAddress: string | null
  storeLat: string | null
  storeLng: string | null
  orderSummary: string
  targetType: 'HEADCOUNT' | 'AMOUNT'
  targetValue: number
  deliveryFee: number | null
  deadlineAt: Date
  pickupAt: Date | null
  pickupName: string
  pickupAddress: string | null
  pickupNote: string | null
  extraNote: string | null
  status: PotStatus
  createdAt: Date
}

function mapPotRow(row: PotRow, agg: { count: number; amount: number }): Pot {
  return {
    id: row.id,
    hostId: row.hostId,
    hostNickname: row.hostNickname,
    zoneCode: row.zoneCode as ZoneCode,
    storeName: row.storeName,
    storeAddress: row.storeAddress ?? '',
    orderSummary: row.orderSummary,
    targetType: row.targetType,
    targetValue: row.targetValue,
    currentCount: agg.count,
    currentAmount: row.targetType === 'AMOUNT' ? agg.amount : undefined,
    deliveryFee: row.deliveryFee ?? 0,
    deadlineAt: row.deadlineAt.toISOString(),
    pickupAt: row.pickupAt ? row.pickupAt.toISOString() : '',
    pickupName: row.pickupName,
    pickupAddress: row.pickupAddress ?? '',
    pickupNote: row.pickupNote ?? '',
    extraNote: row.extraNote ?? '',
    // §10-3③: 크론 없이 조회 시점에 마감 여부를 판정한다.
    status: computeEffectiveStatus(row.status, row.deadlineAt),
    // Naver 지역 검색 결과로 좌표까지 채워진 경우에만 "위치확인" — Phase 3 전까지는 항상 false
    isLocationVerified: Boolean(row.storeLat && row.storeLng),
    // ORDER-10(P1, Phase 6)에서 클라이언트 Geolocation으로 채울 때까지는 표시하지 않음
    distanceMeters: 0,
    createdAt: row.createdAt.toISOString(),
  }
}

async function getApprovedAggregates(potIds: string[]) {
  const byPot = new Map<string, { count: number; amount: number }>()
  if (potIds.length === 0) return byPot

  const rows = await getDb()
    .select({
      potId: participations.potId,
      approvalStatus: participations.approvalStatus,
      menuAmount: participations.menuAmount,
    })
    .from(participations)
    .where(inArray(participations.potId, potIds))

  for (const row of rows) {
    if (row.approvalStatus !== 'APPROVED') continue
    const entry = byPot.get(row.potId) ?? { count: 0, amount: 0 }
    entry.count += 1
    entry.amount += row.menuAmount ?? 0
    byPot.set(row.potId, entry)
  }
  return byPot
}

export async function listPots(filter?: { zone?: string; status?: string }): Promise<Pot[]> {
  const db = getDb()

  const rows = (await db
    .select(potColumns)
    .from(pots)
    .innerJoin(users, eq(pots.hostId, users.id))
    .where(filter?.zone ? eq(pots.zoneCode, filter.zone) : undefined)
    .orderBy(desc(pots.createdAt))) as PotRow[]

  const agg = await getApprovedAggregates(rows.map((r) => r.id))
  let result = rows.map((r) => mapPotRow(r, agg.get(r.id) ?? { count: 0, amount: 0 }))

  if (filter?.status && filter.status !== 'ALL') {
    result = result.filter((p) => p.status === filter.status)
  }
  return result
}

export async function getPotById(id: string): Promise<Pot | undefined> {
  const db = getDb()

  const [row] = (await db
    .select(potColumns)
    .from(pots)
    .innerJoin(users, eq(pots.hostId, users.id))
    .where(eq(pots.id, id))
    .limit(1)) as PotRow[]

  if (!row) return undefined

  const agg = await getApprovedAggregates([id])
  return mapPotRow(row, agg.get(id) ?? { count: 0, amount: 0 })
}

/**
 * 공동주문의 참여자 목록. 호스트 자신의 행은 화면에서 별도(주최자 배지)로 표시하므로 제외한다.
 * 호스트가 아닌 조회자에게는 APPROVED 신청만 보여준다 — PENDING/REJECTED의 참여 메시지 등은
 * 호스트만 볼 수 있는 정보라 여기서 서버가 걸러야 한다 (클라이언트에서 숨기는 것만으로는 불충분).
 */
export async function getParticipationsForPot(potId: string, viewerId: string | undefined): Promise<Participation[]> {
  const db = getDb()

  const [pot] = await db.select({ hostId: pots.hostId }).from(pots).where(eq(pots.id, potId)).limit(1)
  if (!pot) return []

  const isHost = viewerId === pot.hostId

  const rows = await db
    .select({
      id: participations.id,
      potId: participations.potId,
      userId: participations.userId,
      nickname: users.nickname,
      applyMessage: participations.applyMessage,
      menuAmount: participations.menuAmount,
      approvalStatus: participations.approvalStatus,
      createdAt: participations.createdAt,
    })
    .from(participations)
    .innerJoin(users, eq(participations.userId, users.id))
    .where(eq(participations.potId, potId))

  const visible = isHost ? rows : rows.filter((r) => r.approvalStatus === 'APPROVED')

  return visible
    .filter((r) => r.userId !== pot.hostId)
    .map((r) => ({
      id: r.id,
      potId: r.potId,
      userId: r.userId,
      nickname: r.nickname,
      applyMessage: r.applyMessage ?? '',
      menuAmount: r.menuAmount ?? 0,
      approvalStatus: r.approvalStatus,
      createdAt: r.createdAt.toISOString(),
    }))
}

/** 로그인된 사용자 정보. 세션이 없으면 로그인 화면으로 보낸다 — (main) 구간은 전부 로그인 전제. */
export async function getCurrentUser(): Promise<User> {
  const session = await auth()
  if (!session?.user) {
    redirect('/login')
  }
  return {
    id: session.user.id,
    loginId: session.user.loginId,
    nickname: session.user.nickname,
    zoneCode: session.user.zoneCode as ZoneCode,
  }
}

/** API Route Handler에서 쓰는 버전 — 리다이렉트 대신 null을 돌려주고 401 처리는 호출부가 한다. */
export async function getSessionUserOrNull(): Promise<{ id: string; loginId: string; nickname: string; zoneCode: ZoneCode } | null> {
  const session = await auth()
  if (!session?.user) return null
  return {
    id: session.user.id,
    loginId: session.user.loginId,
    nickname: session.user.nickname,
    zoneCode: session.user.zoneCode as ZoneCode,
  }
}
