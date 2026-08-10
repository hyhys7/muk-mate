// PRD §5-4: 음식 값은 각자 입력값 그대로, 배달비만 인원수로 균등 분할한다 — 음식 값까지 1/N 하지 않는다.
// 개인 부담금 = 개인 주문 금액 + (배달비 ÷ 참여 확정 인원, 10원 단위 절상). 나머지는 모집자가 부담.

export interface SplitCostParticipant {
  userId: string
  nickname: string
  isHost: boolean
  menuAmount: number
}

export interface SplitCostEntry extends SplitCostParticipant {
  deliveryShare: number
  total: number
}

export function computeSplitCost(participants: SplitCostParticipant[], deliveryFee: number): SplitCostEntry[] {
  const n = participants.length
  if (n === 0) return []

  const nonHostCount = participants.filter((p) => !p.isHost).length
  const othersShare = nonHostCount > 0 ? Math.ceil(deliveryFee / n / 10) * 10 : 0
  const hostShare = deliveryFee - othersShare * nonHostCount

  return participants.map((p) => {
    const deliveryShare = p.isHost ? hostShare : othersShare
    return { ...p, deliveryShare, total: p.menuAmount + deliveryShare }
  })
}
