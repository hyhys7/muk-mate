import { cn } from '@/lib/utils'
import { MANNER_STAGE_META } from '@/lib/constants'
import type { MannerStage } from '@/lib/types'

const STAGE_CLASS: Record<MannerStage, string> = {
  NEW: 'bg-muted text-muted-foreground',
  STARVING: 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  PECKISH: 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300',
  STEADY: 'bg-sky-100 text-sky-800 dark:bg-sky-950/60 dark:text-sky-300',
  FULL: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300',
  HAPPY: 'bg-orange-100 text-orange-800 dark:bg-orange-950/60 dark:text-orange-300',
}

export function MannerBadge({
  stage,
  score,
  reviewCount,
  className,
}: {
  stage: MannerStage
  /** null이면(리뷰 3개 미만) 점수는 표시하지 않는다(§4-1) */
  score: number | null
  reviewCount?: number
  className?: string
}) {
  const meta = MANNER_STAGE_META[stage]

  return (
    <span
      className={cn(
        'inline-flex h-6 items-center gap-1 rounded-full px-2.5 text-xs font-semibold',
        STAGE_CLASS[stage],
        className,
      )}
      title={typeof reviewCount === 'number' ? `평가 ${reviewCount}개 기준` : undefined}
    >
      <span aria-hidden>{meta.emoji}</span>
      {score !== null ? `매너 포만도 ${Math.round(score)}점 · ${meta.label}` : meta.label}
    </span>
  )
}
