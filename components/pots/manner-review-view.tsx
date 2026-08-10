'use client'

import { useState } from 'react'
import { CheckCircle2 } from 'lucide-react'
import { AppHeader } from '@/components/app-header'
import { StoreAvatar } from '@/components/store-avatar'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { submitMannerReview } from '@/lib/api'
import { MANNER_TAG_META } from '@/lib/constants'
import type { MannerRating, MannerReviewTarget } from '@/lib/types'
import { cn } from '@/lib/utils'

const RATING_OPTIONS: { rating: MannerRating; label: string }[] = [
  { rating: 'GOOD', label: '좋았어요' },
  { rating: 'NEUTRAL', label: '보통이에요' },
  { rating: 'BAD', label: '아쉬웠어요' },
]

export function MannerReviewView({
  potId,
  storeName,
  initialTargets,
}: {
  potId: string
  storeName: string
  initialTargets: MannerReviewTarget[]
}) {
  const [targets, setTargets] = useState(initialTargets)
  const remaining = targets.filter((t) => !t.alreadyReviewed).length

  return (
    <div className="flex flex-1 flex-col pb-8">
      <AppHeader title="매너 평가" showBack />

      <div className="border-b border-border bg-muted/30 px-4 py-3">
        <p className="text-sm font-semibold text-foreground">{storeName} 공동주문</p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          한 번 제출한 평가는 수정할 수 없어요. 남은 평가 {remaining}건
        </p>
      </div>

      <div className="flex flex-col gap-3 p-4">
        {targets.map((target) => (
          <ReviewCard
            key={target.userId}
            potId={potId}
            target={target}
            onSubmitted={() =>
              setTargets((prev) =>
                prev.map((t) => (t.userId === target.userId ? { ...t, alreadyReviewed: true } : t)),
              )
            }
          />
        ))}
      </div>
    </div>
  )
}

function ReviewCard({
  potId,
  target,
  onSubmitted,
}: {
  potId: string
  target: MannerReviewTarget
  onSubmitted: () => void
}) {
  const [rating, setRating] = useState<MannerRating | null>(null)
  const [tags, setTags] = useState<string[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (target.alreadyReviewed) {
    return (
      <Card className="flex items-center gap-3 p-4 opacity-70">
        <StoreAvatar name={target.nickname} className="size-9 text-sm" />
        <p className="flex-1 text-sm font-semibold text-foreground">{target.nickname}</p>
        <span className="flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
          <CheckCircle2 className="size-4" />
          평가 완료
        </span>
      </Card>
    )
  }

  function toggleTag(tag: string) {
    setTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]))
  }

  async function handleSubmit() {
    if (!rating) {
      setError('평가를 선택해 주세요.')
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      await submitMannerReview(potId, { revieweeId: target.userId, rating, tags })
      onSubmitted()
    } catch (err) {
      setError(err instanceof Error ? err.message : '평가 제출에 실패했어요.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Card className="flex flex-col gap-3 p-4">
      <div className="flex items-center gap-3">
        <StoreAvatar name={target.nickname} className="size-9 text-sm" />
        <p className="text-sm font-bold text-foreground">{target.nickname}</p>
      </div>

      {error && <p className="text-xs font-semibold text-destructive">{error}</p>}

      <div className="grid grid-cols-3 gap-2">
        {RATING_OPTIONS.map((opt) => (
          <button
            key={opt.rating}
            type="button"
            onClick={() => {
              setRating(opt.rating)
              setTags([])
              setError(null)
            }}
            className={cn(
              'flex h-10 items-center justify-center rounded-xl border text-xs font-semibold transition',
              rating === opt.rating
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-border bg-background text-foreground hover:bg-muted/50',
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {rating && (
        <div className="flex flex-wrap gap-1.5">
          {Object.entries(MANNER_TAG_META[rating]).map(([code, label]) => (
            <button
              key={code}
              type="button"
              onClick={() => toggleTag(code)}
              className={cn(
                'rounded-full border px-2.5 py-1 text-xs font-medium transition',
                tags.includes(code)
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border bg-background text-muted-foreground hover:bg-muted/50',
              )}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      <Button
        onClick={handleSubmit}
        disabled={!rating || submitting}
        className="h-11 rounded-xl font-bold"
      >
        {submitting ? '제출하는 중...' : '평가 제출'}
      </Button>
    </Card>
  )
}
