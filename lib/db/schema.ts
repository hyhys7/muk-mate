// Drizzle 스키마 — docs/PRD.md §11-2 DDL과 1:1 대응.
// 컬럼을 바꾸려면 PRD §11-2와 .claude/skills/mukmate-db-schema/SKILL.md도 함께 갱신할 것.

import { sql } from 'drizzle-orm'
import {
  bigserial,
  index,
  integer,
  numeric,
  pgEnum,
  pgTable,
  smallint,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core'

export const potStatusEnum = pgEnum('pot_status', ['OPEN', 'CLOSED', 'ORDERED', 'CANCELED'])
export const approvalEnum = pgEnum('approval', ['PENDING', 'APPROVED', 'REJECTED'])
export const roomTypeEnum = pgEnum('room_type', ['ORDER', 'COMMUNITY'])
export const messageTypeEnum = pgEnum('message_type', ['TEXT', 'SYSTEM'])
export const targetTypeEnum = pgEnum('target_type', ['HEADCOUNT', 'AMOUNT'])

/** 활동 지역: 목록이 아직 미확정(PRD §17-1)이라 enum이 아니라 테이블로 분리 */
export const zones = pgTable('zones', {
  code: text('code').primaryKey(), // 'GUJEONGMUN' | 'SINJEONGMUN' | 'DORM' | 'SADAEBUGO' — lib/constants.ts와 반드시 일치
  label: text('label').notNull(),
  sortOrder: smallint('sort_order').notNull().default(0),
})

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  loginId: text('login_id').notNull().unique(), // 외부에 노출하지 않음 — 표시는 nickname만
  passwordHash: text('password_hash').notNull(), // bcrypt 해시, 평문 저장 금지
  nickname: text('nickname').notNull(),
  zoneCode: text('zone_code').references(() => zones.code),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const pots = pgTable(
  'pots',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    hostId: uuid('host_id')
      .notNull()
      .references(() => users.id),
    zoneCode: text('zone_code')
      .notNull()
      .references(() => zones.code),

    // 가게 (네이버 지역 검색 API 결과)
    storeName: text('store_name').notNull(),
    storeAddress: text('store_address'),
    storeLat: numeric('store_lat', { precision: 10, scale: 7 }),
    storeLng: numeric('store_lng', { precision: 10, scale: 7 }),

    orderSummary: text('order_summary').notNull(),
    targetType: targetTypeEnum('target_type').notNull(),
    targetValue: integer('target_value').notNull(), // 명 또는 원
    deliveryFee: integer('delivery_fee'), // P1 분담 계산용 (선택 입력)

    deadlineAt: timestamp('deadline_at', { withTimezone: true }).notNull(),
    pickupAt: timestamp('pickup_at', { withTimezone: true }),

    // 수령 장소 (네이버 API 결과 + 직접 설명)
    pickupName: text('pickup_name').notNull(),
    pickupAddress: text('pickup_address'),
    pickupLat: numeric('pickup_lat', { precision: 10, scale: 7 }),
    pickupLng: numeric('pickup_lng', { precision: 10, scale: 7 }),
    pickupNote: text('pickup_note'),

    extraNote: text('extra_note'),
    status: potStatusEnum('status').notNull().default('OPEN'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index('idx_pots_zone_status').on(table.zoneCode, table.status, table.deadlineAt)],
)

export const participations = pgTable(
  'participations',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    potId: uuid('pot_id')
      .notNull()
      .references(() => pots.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id),
    applyMessage: text('apply_message'), // 참여 신청 시 짧은 메시지
    menuAmount: integer('menu_amount'), // P1: 분담 금액 계산용 (nullable)
    approvalStatus: approvalEnum('approval_status').notNull().default('PENDING'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('participations_pot_user_key').on(table.potId, table.userId), // 중복 신청 방지
    index('idx_participations_user').on(table.userId, table.createdAt),
  ],
)

export const chatRooms = pgTable('chat_rooms', {
  id: uuid('id').primaryKey().defaultRandom(),
  type: roomTypeEnum('type').notNull(),
  potId: uuid('pot_id')
    .unique()
    .references(() => pots.id, { onDelete: 'cascade' }), // ORDER일 때만
  title: text('title').notNull(), // COMMUNITY 고정방 이름
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const messages = pgTable(
  'messages',
  {
    id: bigserial('id', { mode: 'number' }).primaryKey(), // 폴링 커서로 사용
    roomId: uuid('room_id')
      .notNull()
      .references(() => chatRooms.id, { onDelete: 'cascade' }),
    senderId: uuid('sender_id').references(() => users.id), // SYSTEM 메시지는 NULL
    type: messageTypeEnum('type').notNull().default('TEXT'),
    content: text('content').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index('idx_messages_room').on(table.roomId, table.id)],
)

// re-export for callers that want a raw sql tag without importing drizzle-orm directly
export { sql }
