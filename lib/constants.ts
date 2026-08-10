import type { Approval, MannerRating, MannerStage, PotStatus, Zone, ZoneCode } from '@/lib/types'

/** signup(1단계) → onboarding(2단계) 사이에 임시로 들고 다니는 가입 정보의 sessionStorage 키 */
export const SIGNUP_DRAFT_KEY = 'mukmate:signup-draft'

/** 활동 지역(권역) 고정값 */
export const ZONES: Zone[] = [
  { code: 'GUJEONGMUN', label: '구정문 권역' },
  { code: 'SINJEONGMUN', label: '신정문 권역' },
  { code: 'DORM', label: '기숙사 권역' },
  { code: 'SADAEBUGO', label: '사대부고 주변' },
]

export function zoneLabel(code: ZoneCode): string {
  return ZONES.find((z) => z.code === code)?.label ?? '전체'
}

/** 상태 배지 라벨 + 색상 토큰 매핑 */
export const POT_STATUS_META: Record<
  PotStatus,
  { label: string; token: string }
> = {
  OPEN: { label: '모집 중', token: 'status-open' },
  CLOSED: { label: '모집 마감', token: 'status-closed' },
  ORDERED: { label: '주문 완료', token: 'status-ordered' },
  CANCELED: { label: '취소', token: 'status-canceled' },
}

export const APPROVAL_META: Record<Approval, { label: string; token: string }> = {
  PENDING: { label: '승인 대기', token: 'status-closed' },
  APPROVED: { label: '승인', token: 'status-open' },
  REJECTED: { label: '거절', token: 'status-canceled' },
}

/** 매너 포만도 단계별 라벨 + 이모지(§5) — 실제 색상 클래스는 components/manner-badge.tsx가 담당 */
export const MANNER_STAGE_META: Record<MannerStage, { label: string; emoji: string }> = {
  NEW: { label: '새로운 메이트', emoji: '🌱' },
  STARVING: { label: '허기 경보', emoji: '😩' },
  PECKISH: { label: '출출한 메이트', emoji: '😕' },
  STEADY: { label: '든든한 메이트', emoji: '🙂' },
  FULL: { label: '배부른 메이트', emoji: '😊' },
  HAPPY: { label: '행복한 먹메이트', emoji: '🤩' },
}

/** 매너평가 이유 태그(§9) — rating별 선택 가능 목록 */
export const MANNER_TAG_META: Record<MannerRating, Record<string, string>> = {
  GOOD: {
    ON_TIME: '약속 시간을 잘 지켜요',
    QUICK_REPLY: '답장이 빨라요',
    ACCURATE_SETTLEMENT: '정산이 정확해요',
    KIND: '친절하게 대화해요',
    WANT_AGAIN: '다시 함께 주문하고 싶어요',
  },
  NEUTRAL: {
    NO_ISSUE: '문제없이 거래를 마쳤어요',
  },
  BAD: {
    UNRESPONSIVE: '연락이 잘되지 않았어요',
    LATE: '약속 시간에 늦었어요',
    SETTLEMENT_ISSUE: '정산이 원활하지 않았어요',
    RUDE: '불쾌한 말을 했어요',
    NO_SHOW: '참여 후 나타나지 않았어요',
  },
}

