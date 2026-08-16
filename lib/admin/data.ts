import 'server-only'

import { count, desc, eq, gte, inArray, sql } from 'drizzle-orm'

import { getDb } from '@/lib/db'
import { pots, reports, users } from '@/lib/db/schema'
import type { AccountStatus, ReportReason, ReportStatus, UserRole, ZoneCode } from '@/lib/types'

export interface AdminReportItem {
  id: string
  reason: ReportReason
  detail: string | null
  status: ReportStatus
  adminNote: string | null
  reviewedAt: string | null
  createdAt: string
  messageContentSnapshot: string | null
  messageCreatedSnapshot: string | null
  reporter: { id: string; nickname: string; loginId: string } | null
  reportedUser: { id: string; nickname: string; loginId: string; accountStatus: string } | null
}

/** 관리자 신고함 초기 목록 — PENDING/REVIEWING 우선, 그다음 최신순 */
export async function getReportsForAdmin(): Promise<AdminReportItem[]> {
  const db = getDb()

  const rows = await db
    .select({
      id: reports.id,
      reason: reports.reason,
      detail: reports.detail,
      status: reports.status,
      adminNote: reports.adminNote,
      reviewedAt: reports.reviewedAt,
      createdAt: reports.createdAt,
      messageContentSnapshot: reports.messageContentSnapshot,
      messageCreatedSnapshot: reports.messageCreatedSnapshot,
      reporterId: reports.reporterId,
      reportedUserId: reports.reportedUserId,
    })
    .from(reports)
    .orderBy(
      sql`CASE ${reports.status} WHEN 'PENDING' THEN 0 WHEN 'REVIEWING' THEN 1 ELSE 2 END`,
      desc(reports.createdAt),
    )

  const userIds = Array.from(new Set(rows.flatMap((r) => [r.reporterId, r.reportedUserId])))
  const userRows = userIds.length
    ? await db
        .select({ id: users.id, nickname: users.nickname, loginId: users.loginId, accountStatus: users.accountStatus })
        .from(users)
        .where(inArray(users.id, userIds))
    : []
  const userMap = new Map(userRows.map((u) => [u.id, u]))

  return rows.map((r) => ({
    id: r.id,
    reason: r.reason,
    detail: r.detail,
    status: r.status,
    adminNote: r.adminNote,
    reviewedAt: r.reviewedAt?.toISOString() ?? null,
    createdAt: r.createdAt.toISOString(),
    messageContentSnapshot: r.messageContentSnapshot,
    messageCreatedSnapshot: r.messageCreatedSnapshot?.toISOString() ?? null,
    reporter: userMap.get(r.reporterId) ?? null,
    reportedUser: userMap.get(r.reportedUserId) ?? null,
  }))
}

export interface AdminUserItem {
  id: string
  loginId: string
  nickname: string
  zoneCode: ZoneCode
  role: UserRole
  accountStatus: AccountStatus
  createdAt: string
  lastLoginAt: string | null
}

/** 표시는 항상 KST 기준(§9-3)이라 "오늘"의 경계도 KST 자정으로 계산 — 서버(UTC)의 달력일과 어긋나지 않게 */
function kstTodayStartUtc(): Date {
  const now = new Date()
  const kstNow = new Date(now.getTime() + 9 * 60 * 60 * 1000)
  const kstMidnightAsUtcMs = Date.UTC(kstNow.getUTCFullYear(), kstNow.getUTCMonth(), kstNow.getUTCDate()) - 9 * 60 * 60 * 1000
  return new Date(kstMidnightAsUtcMs)
}

/** 관리자 회원 목록 — 최신 가입순 */
export async function getUsersForAdmin(): Promise<AdminUserItem[]> {
  const db = getDb()

  const rows = await db
    .select({
      id: users.id,
      loginId: users.loginId,
      nickname: users.nickname,
      zoneCode: users.zoneCode,
      role: users.role,
      accountStatus: users.accountStatus,
      createdAt: users.createdAt,
      lastLoginAt: users.lastLoginAt,
    })
    .from(users)
    .orderBy(desc(users.createdAt))

  return rows.map((r) => ({
    id: r.id,
    loginId: r.loginId,
    nickname: r.nickname,
    zoneCode: r.zoneCode as ZoneCode,
    role: r.role as UserRole,
    accountStatus: r.accountStatus as AccountStatus,
    createdAt: r.createdAt.toISOString(),
    lastLoginAt: r.lastLoginAt?.toISOString() ?? null,
  }))
}

export interface AdminDashboardStats {
  pendingReportsCount: number
  totalUsersCount: number
  suspendedUsersCount: number
  totalPotsCount: number
  openPotsCount: number
  todaySignupsCount: number
  todayActiveUsersCount: number
}

/** 관리자 랜딩 대시보드용 요약 카운트 */
export async function getAdminDashboardStats(): Promise<AdminDashboardStats> {
  const db = getDb()
  const todayStart = kstTodayStartUtc()

  const [
    [{ cnt: pendingReportsCount }],
    [{ cnt: totalUsersCount }],
    [{ cnt: suspendedUsersCount }],
    [{ cnt: totalPotsCount }],
    [{ cnt: openPotsCount }],
    [{ cnt: todaySignupsCount }],
    [{ cnt: todayActiveUsersCount }],
  ] = await Promise.all([
    db.select({ cnt: count() }).from(reports).where(eq(reports.status, 'PENDING')),
    db.select({ cnt: count() }).from(users),
    db.select({ cnt: count() }).from(users).where(eq(users.accountStatus, 'SUSPENDED')),
    db.select({ cnt: count() }).from(pots),
    db.select({ cnt: count() }).from(pots).where(eq(pots.status, 'OPEN')),
    db.select({ cnt: count() }).from(users).where(gte(users.createdAt, todayStart)),
    db.select({ cnt: count() }).from(users).where(gte(users.lastLoginAt, todayStart)),
  ])

  return {
    pendingReportsCount,
    totalUsersCount,
    suspendedUsersCount,
    totalPotsCount,
    openPotsCount,
    todaySignupsCount,
    todayActiveUsersCount,
  }
}
