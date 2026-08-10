import { MANNER_AVATAR_COLOR_META } from '@/lib/constants'
import type { MannerAvatarAccessory, MannerAvatarColor, MannerStage } from '@/lib/types'
import { cn } from '@/lib/utils'

// §6-4: 매너 단계에 따른 표정·자세·그릇 상태는 사용자가 바꿀 수 없다 — stage가 전부 결정한다.
// §6-3: 사용자가 바꿀 수 있는 건 색상(color)과 소품(accessory)뿐.

/** 그릇 채움 정도(0~1) — §5 "빈 그릇 → 푸짐한 밥상" 서사를 원 배지에 시각적으로 반영 */
const BOWL_FILL: Record<MannerStage, number> = {
  NEW: 0,
  STARVING: 0,
  PECKISH: 0.35,
  STEADY: 0.6,
  FULL: 0.85,
  HAPPY: 1,
}

function Eyes({ stage, color }: { stage: MannerStage; color: string }) {
  switch (stage) {
    case 'STARVING':
      return (
        <>
          <path d="M32 42 Q36 47 40 43" stroke={color} strokeWidth={3.2} strokeLinecap="round" fill="none" />
          <path d="M60 43 Q64 47 68 42" stroke={color} strokeWidth={3.2} strokeLinecap="round" fill="none" />
        </>
      )
    case 'PECKISH':
      return (
        <>
          <ellipse cx={36} cy={42} rx={3} ry={4.5} fill={color} />
          <ellipse cx={64} cy={42} rx={3} ry={4.5} fill={color} />
        </>
      )
    case 'FULL':
    case 'HAPPY':
      return (
        <>
          <path d="M30 42 Q36 33 42 42" stroke={color} strokeWidth={3.6} strokeLinecap="round" fill="none" />
          <path d="M58 42 Q64 33 70 42" stroke={color} strokeWidth={3.6} strokeLinecap="round" fill="none" />
        </>
      )
    case 'NEW':
    case 'STEADY':
    default:
      return (
        <>
          <circle cx={36} cy={41} r={3.5} fill={color} />
          <circle cx={64} cy={41} r={3.5} fill={color} />
        </>
      )
  }
}

function Mouth({ stage, color }: { stage: MannerStage; color: string }) {
  switch (stage) {
    case 'STARVING':
      return <path d="M40 63 Q50 55 60 63" stroke={color} strokeWidth={3} strokeLinecap="round" fill="none" />
    case 'PECKISH':
      return <line x1={42} y1={60} x2={58} y2={60} stroke={color} strokeWidth={3} strokeLinecap="round" />
    case 'STEADY':
      return <path d="M40 58 Q50 65 60 58" stroke={color} strokeWidth={3} strokeLinecap="round" fill="none" />
    case 'FULL':
      return <path d="M36 56 Q50 71 64 56" stroke={color} strokeWidth={3.4} strokeLinecap="round" fill="none" />
    case 'HAPPY':
      return <path d="M34 55 Q50 76 66 55 Z" fill={color} opacity={0.92} />
    case 'NEW':
    default:
      return <line x1={44} y1={59} x2={56} y2={59} stroke={color} strokeWidth={3} strokeLinecap="round" />
  }
}

function AccessoryLayer({ accessory, feature }: { accessory: MannerAvatarAccessory; feature: string }) {
  switch (accessory) {
    case 'GLASSES':
      return (
        <g stroke={feature} strokeWidth={2.4} fill="none" opacity={0.85}>
          <circle cx={36} cy={41} r={9} />
          <circle cx={64} cy={41} r={9} />
          <line x1={45} y1={41} x2={55} y2={41} />
        </g>
      )
    case 'SCARF':
      return <path d="M18 78 Q50 94 82 78 L82 87 Q50 102 18 87 Z" fill={feature} opacity={0.85} />
    case 'BAG':
      return (
        <g opacity={0.85}>
          <path d="M72 58 Q76 48 80 58" stroke={feature} strokeWidth={2.4} fill="none" />
          <rect x={67} y={58} width={17} height={15} rx={3} fill={feature} />
        </g>
      )
    case 'HAT':
      // 반타원 돔 + 챙 — 이마 위쪽을 덮는 비니 모양. viewBox(0 0 100 100) 안에 다 들어온다
      return <path d="M18 28 A32 26 0 0 1 82 28 L82 31 L18 31 Z" fill={feature} opacity={0.92} />
    case 'NONE':
    default:
      return null
  }
}

/** 그릇 채움 배지 — 원형 링(그릇)에 채워진 원(음식)으로 §5 "그릇 상태"를 표현 */
function BowlBadge({ stage }: { stage: MannerStage }) {
  const fill = BOWL_FILL[stage]
  const foodRadius = 9 * fill

  return (
    <g transform="translate(64, 60)">
      <circle cx={16} cy={16} r={17} fill="#FFFFFF" />
      <circle cx={16} cy={16} r={13} fill="none" stroke="#8B5E34" strokeWidth={1.8} />
      {foodRadius > 0.5 && <circle cx={16} cy={16} r={foodRadius} fill="#F2A65A" />}
      {stage === 'HAPPY' && (
        <>
          <circle cx={28} cy={7} r={1.6} fill="#FFD166" />
          <circle cx={25} cy={27} r={1.2} fill="#FFD166" />
        </>
      )}
    </g>
  )
}

export function MannerAvatar({
  stage,
  color,
  accessory,
  className,
}: {
  stage: MannerStage
  color: MannerAvatarColor
  accessory: MannerAvatarAccessory
  className?: string
}) {
  const { hex, feature } = MANNER_AVATAR_COLOR_META[color]
  const showBlush = stage === 'FULL' || stage === 'HAPPY'

  return (
    <svg
      viewBox="0 0 100 100"
      className={cn('size-12 shrink-0', className)}
      role="img"
      aria-label={`매너 아바타 (${stage})`}
    >
      <circle cx={50} cy={45} r={42} fill={hex} />
      {showBlush && (
        <>
          <ellipse cx={25} cy={52} rx={7} ry={4.5} fill="#F98C6B" opacity={0.5} />
          <ellipse cx={75} cy={52} rx={7} ry={4.5} fill="#F98C6B" opacity={0.5} />
        </>
      )}
      <Eyes stage={stage} color={feature} />
      <Mouth stage={stage} color={feature} />
      <AccessoryLayer accessory={accessory} feature={feature} />
      <BowlBadge stage={stage} />
    </svg>
  )
}
