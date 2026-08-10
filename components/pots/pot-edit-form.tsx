'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Clock, DollarSign, Info, MapPin, ShoppingBag, Users } from 'lucide-react'
import { updatePot } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import type { Pot } from '@/lib/types'

function pad(n: number) {
  return String(n).padStart(2, '0')
}

/** datetime-local input은 브라우저 로컬 시각(KST) 기준 문자열을 다룬다 — UTC 변환 없이 그대로 getter로 조립 */
function toDatetimeLocalValue(iso: string): string {
  if (!iso) return ''
  const d = new Date(iso)
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export function PotEditForm({ pot }: { pot: Pot }) {
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  const [orderSummary, setOrderSummary] = useState(pot.orderSummary)
  const [targetValue, setTargetValue] = useState<number>(pot.targetValue)
  const [deliveryFee, setDeliveryFee] = useState<number>(pot.deliveryFee)
  const [deadlineAt, setDeadlineAt] = useState(toDatetimeLocalValue(pot.deadlineAt))
  const [pickupAt, setPickupAt] = useState(toDatetimeLocalValue(pot.pickupAt))
  const [pickupNote, setPickupNote] = useState(pot.pickupNote)
  const [extraNote, setExtraNote] = useState(pot.extraNote)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!orderSummary.trim()) {
      setErrorMsg('주문 요약을 입력해주세요.')
      return
    }
    if (targetValue <= 0) {
      setErrorMsg('모집 목표 값을 1 이상으로 설정해주세요.')
      return
    }
    if (!deadlineAt) {
      setErrorMsg('모집 마감 시각을 선택해주세요.')
      return
    }

    try {
      setSubmitting(true)
      setErrorMsg('')
      await updatePot(pot.id, {
        orderSummary: orderSummary.trim(),
        targetValue,
        deliveryFee,
        deadlineAt: new Date(deadlineAt).toISOString(),
        pickupAt: pickupAt ? new Date(pickupAt).toISOString() : undefined,
        pickupNote: pickupNote.trim(),
        extraNote: extraNote.trim(),
      })
      router.push(`/pots/${pot.id}`)
      router.refresh()
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : '수정에 실패했습니다. 다시 시도해 주세요.')
      setSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-full flex-col bg-background pb-20">
      <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-background/90 px-4 backdrop-blur">
        <Link
          href={`/pots/${pot.id}`}
          className="flex size-9 items-center justify-center rounded-full text-foreground transition active:scale-95 hover:bg-muted"
        >
          <ArrowLeft className="size-5" />
        </Link>
        <h1 className="text-lg font-bold text-foreground">모집글 수정</h1>
      </header>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6 p-4">
        {errorMsg && (
          <div className="flex items-center gap-2 rounded-xl bg-destructive/10 p-3.5 text-sm font-medium text-destructive">
            <Info className="size-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <div className="rounded-xl bg-muted/50 p-3 text-xs text-muted-foreground">
          가게 <strong className="text-foreground">{pot.storeName}</strong>, 활동 권역, 모집 방식은 수정할 수 없어요.
          이미 참여자들이 이 정보를 보고 신청했기 때문이에요.
        </div>

        <section className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 shadow-sm">
          <div className="flex items-center gap-2 text-primary">
            <ShoppingBag className="size-5" />
            <h2 className="font-bold text-foreground">모집 목표 & 메뉴</h2>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-muted-foreground">주문 요약 / 메뉴 설명 *</label>
            <Input
              value={orderSummary}
              onChange={(e) => setOrderSummary(e.target.value)}
              className="h-11 rounded-xl"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
              <Users className="size-3.5" />
              목표 {pot.targetType === 'AMOUNT' ? '금액 (원)' : '인원 (명)'}
            </label>
            <Input
              type="number"
              min={1}
              step={pot.targetType === 'AMOUNT' ? 1000 : 1}
              value={targetValue}
              onChange={(e) => setTargetValue(Number(e.target.value))}
              className="h-11 rounded-xl"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
              <DollarSign className="size-3.5" />
              총 배달비 (원)
            </label>
            <Input
              type="number"
              step={500}
              value={deliveryFee}
              onChange={(e) => setDeliveryFee(Number(e.target.value))}
              className="h-11 rounded-xl"
            />
          </div>
        </section>

        <section className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 shadow-sm">
          <div className="flex items-center gap-2 text-primary">
            <Clock className="size-5" />
            <h2 className="font-bold text-foreground">시간 & 장소 안내</h2>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-muted-foreground">모집 마감 시각 *</label>
            <Input
              type="datetime-local"
              value={deadlineAt}
              onChange={(e) => setDeadlineAt(e.target.value)}
              className="h-11 rounded-xl"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-muted-foreground">수령 예정 시각 (선택)</label>
            <Input
              type="datetime-local"
              value={pickupAt}
              onChange={(e) => setPickupAt(e.target.value)}
              className="h-11 rounded-xl"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
              <MapPin className="size-3.5" />
              수령 장소: {pot.pickupName}
            </label>
            <Input
              placeholder="수령 관련 전달사항"
              value={pickupNote}
              onChange={(e) => setPickupNote(e.target.value)}
              className="h-11 rounded-xl"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-muted-foreground">추가 참고사항 / 팁 (선택)</label>
            <Textarea
              value={extraNote}
              onChange={(e) => setExtraNote(e.target.value)}
              className="min-h-[80px] rounded-xl"
            />
          </div>
        </section>

        <Button
          type="submit"
          disabled={submitting}
          className="h-13 w-full rounded-2xl text-base font-bold shadow-lg shadow-primary/25"
        >
          {submitting ? '저장하는 중...' : '수정 내용 저장'}
        </Button>
      </form>
    </div>
  )
}
