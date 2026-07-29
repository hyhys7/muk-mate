'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  Building2,
  Clock,
  DollarSign,
  Info,
  MapPin,
  ShoppingBag,
  Sparkles,
  Users,
} from 'lucide-react'
import { createPot } from '@/lib/api'
import { ZONES } from '@/lib/constants'
import type { TargetType, ZoneCode } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

const STORE_PRESETS = [
  '깐부치킨 전북대점',
  '이삭토스트 전북대구정문점',
  '탕화쿵푸 마라탕',
  '동대문엽기떡볶이 전북대점',
  '스시로우 전주점',
]

const PICKUP_PRESETS = [
  '진수관 1층 로비',
  '구정문 GS25 앞',
  '기숙사 참빛관 입구',
  '사대부고 정문 버스정류장',
]

const DEADLINE_OPTIONS = [
  { label: '15분 후', value: 15 },
  { label: '30분 후', value: 30 },
  { label: '45분 후', value: 45 },
  { label: '1시간 후', value: 60 },
]

export function PotCreateForm() {
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)

  // Form states
  const [storeName, setStoreName] = useState('')
  const [storeAddress, setStoreAddress] = useState('')
  const [orderSummary, setOrderSummary] = useState('')
  const [zoneCode, setZoneCode] = useState<ZoneCode>('DORM')
  const [targetType, setTargetType] = useState<TargetType>('HEADCOUNT')
  const [targetValue, setTargetValue] = useState<number>(4)
  const [deliveryFee, setDeliveryFee] = useState<number>(4000)
  const [deadlineMinutes, setDeadlineMinutes] = useState<number>(30)
  const [pickupMinutes, setPickupMinutes] = useState<number>(60)
  const [pickupName, setPickupName] = useState('')
  const [pickupAddress, setPickupAddress] = useState('')
  const [pickupNote, setPickupNote] = useState('')
  const [extraNote, setExtraNote] = useState('')
  const [errorMsg, setErrorMsg] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!storeName.trim()) {
      setErrorMsg('가게 이름을 입력해주세요.')
      return
    }
    if (!orderSummary.trim()) {
      setErrorMsg('주문 요약 또는 함께 주문할 메뉴를 입력해주세요.')
      return
    }
    if (!pickupName.trim()) {
      setErrorMsg('수령 장소를 입력해주세요.')
      return
    }
    if (targetValue <= 0) {
      setErrorMsg('목표 인원 또는 금액을 1 이상으로 설정해주세요.')
      return
    }

    try {
      setSubmitting(true)
      setErrorMsg('')
      const created = await createPot({
        storeName: storeName.trim(),
        storeAddress: storeAddress.trim(),
        orderSummary: orderSummary.trim(),
        zoneCode,
        targetType,
        targetValue,
        deliveryFee,
        deadlineMinutes,
        pickupMinutes,
        pickupName: pickupName.trim(),
        pickupAddress: pickupAddress.trim(),
        pickupNote: pickupNote.trim(),
        extraNote: extraNote.trim(),
      })
      router.push(`/pots/${created.id}`)
      router.refresh()
    } catch (err) {
      console.error(err)
      setErrorMsg('모집 글 등록에 실패했습니다. 다시 시도해 주세요.')
      setSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-full flex-col bg-background pb-20">
      {/* 헤더 */}
      <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-background/90 px-4 backdrop-blur">
        <Link
          href="/"
          className="flex size-9 items-center justify-center rounded-full text-foreground transition active:scale-95 hover:bg-muted"
        >
          <ArrowLeft className="size-5" />
        </Link>
        <h1 className="text-lg font-bold text-foreground">공동주문 모집 글 올리기</h1>
      </header>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6 p-4">
        {errorMsg && (
          <div className="flex items-center gap-2 rounded-xl bg-destructive/10 p-3.5 text-sm font-medium text-destructive">
            <Info className="size-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* 1. 가게 정보 */}
        <section className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 shadow-sm">
          <div className="flex items-center gap-2 text-primary">
            <Building2 className="size-5" />
            <h2 className="font-bold text-foreground">가게 정보</h2>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-muted-foreground">가게 이름 *</label>
            <Input
              placeholder="예: 깐부치킨 전북대점"
              value={storeName}
              onChange={(e) => setStoreName(e.target.value)}
              className="h-11 rounded-xl"
            />
            {/* 추천 프리셋 */}
            <div className="mt-1 flex flex-wrap gap-1.5">
              {STORE_PRESETS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setStoreName(preset)}
                  className="rounded-lg bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground transition hover:bg-primary/10 hover:text-primary"
                >
                  + {preset.split(' ')[0]}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-muted-foreground">활동 권역 선택 *</label>
            <div className="grid grid-cols-2 gap-2">
              {ZONES.map((z) => (
                <button
                  key={z.code}
                  type="button"
                  onClick={() => setZoneCode(z.code)}
                  className={`flex h-11 items-center justify-center rounded-xl border text-sm font-semibold transition active:scale-[0.98] ${
                    zoneCode === z.code
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border bg-background text-muted-foreground hover:border-primary/50'
                  }`}
                >
                  {z.label}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* 2. 모집 목표 및 메뉴 */}
        <section className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 shadow-sm">
          <div className="flex items-center gap-2 text-primary">
            <ShoppingBag className="size-5" />
            <h2 className="font-bold text-foreground">모집 목표 & 메뉴</h2>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-muted-foreground">주문 요약 / 메뉴 설명 *</label>
            <Input
              placeholder="예: 후라이드 + 양념 반반, 배달비 1/N해요!"
              value={orderSummary}
              onChange={(e) => setOrderSummary(e.target.value)}
              className="h-11 rounded-xl"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-muted-foreground">모집 방식 *</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setTargetType('HEADCOUNT')
                  setTargetValue(4)
                }}
                className={`flex h-11 items-center justify-center gap-1.5 rounded-xl border text-sm font-semibold transition ${
                  targetType === 'HEADCOUNT'
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border bg-background text-muted-foreground'
                }`}
              >
                <Users className="size-4" />
                인원수 모집
              </button>
              <button
                type="button"
                onClick={() => {
                  setTargetType('AMOUNT')
                  setTargetValue(15000)
                }}
                className={`flex h-11 items-center justify-center gap-1.5 rounded-xl border text-sm font-semibold transition ${
                  targetType === 'AMOUNT'
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border bg-background text-muted-foreground'
                }`}
              >
                <DollarSign className="size-4" />
                목표 금액 모집
              </button>
            </div>
          </div>

          {targetType === 'HEADCOUNT' ? (
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-muted-foreground">목표 인원 (명)</label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min={2}
                  max={20}
                  value={targetValue}
                  onChange={(e) => setTargetValue(Number(e.target.value))}
                  className="h-11 rounded-xl"
                />
                <span className="shrink-0 font-bold text-foreground">명</span>
              </div>
              <div className="mt-1 flex gap-2">
                {[2, 3, 4, 5].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setTargetValue(num)}
                    className={`h-8 flex-1 rounded-lg border text-xs font-semibold ${
                      targetValue === num
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border bg-background text-muted-foreground'
                    }`}
                  >
                    {num}명
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-muted-foreground">목표 금액 (원)</label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  step={1000}
                  min={1000}
                  value={targetValue}
                  onChange={(e) => setTargetValue(Number(e.target.value))}
                  className="h-11 rounded-xl"
                />
                <span className="shrink-0 font-bold text-foreground">원</span>
              </div>
              <div className="mt-1 flex gap-2">
                {[12000, 15000, 20000, 25000].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setTargetValue(amt)}
                    className={`h-8 flex-1 rounded-lg border text-xs font-semibold ${
                      targetValue === amt
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border bg-background text-muted-foreground'
                    }`}
                  >
                    {amt.toLocaleString()}원
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-muted-foreground">총 배달비 (원)</label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                step={500}
                value={deliveryFee}
                onChange={(e) => setDeliveryFee(Number(e.target.value))}
                className="h-11 rounded-xl"
              />
              <span className="shrink-0 font-bold text-foreground">원</span>
            </div>
          </div>
        </section>

        {/* 3. 시간 & 장소 */}
        <section className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 shadow-sm">
          <div className="flex items-center gap-2 text-primary">
            <MapPin className="size-5" />
            <h2 className="font-bold text-foreground">수령 시간 & 장소</h2>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-muted-foreground">모집 마감 시각 *</label>
            <div className="grid grid-cols-4 gap-2">
              {DEADLINE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    setDeadlineMinutes(opt.value)
                    setPickupMinutes(opt.value + 30)
                  }}
                  className={`h-9 rounded-xl border text-xs font-semibold transition ${
                    deadlineMinutes === opt.value
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border bg-background text-muted-foreground'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-muted-foreground">수령 장소 명칭 *</label>
            <Input
              placeholder="예: 진수관 1층 로비, 구정문 GS25 앞"
              value={pickupName}
              onChange={(e) => setPickupName(e.target.value)}
              className="h-11 rounded-xl"
            />
            <div className="mt-1 flex flex-wrap gap-1.5">
              {PICKUP_PRESETS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setPickupName(preset)}
                  className="rounded-lg bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground transition hover:bg-primary/10 hover:text-primary"
                >
                  + {preset}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-muted-foreground">수령 관련 전달사항 (선택)</label>
            <Input
              placeholder="예: 로비 택배함 앞에서 만나요"
              value={pickupNote}
              onChange={(e) => setPickupNote(e.target.value)}
              className="h-11 rounded-xl"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-muted-foreground">추가 참고사항 / 팁 (선택)</label>
            <Textarea
              placeholder="예: 뼈 없는 걸로 통일할게요! 기숙사생 환영합니다."
              value={extraNote}
              onChange={(e) => setExtraNote(e.target.value)}
              className="min-h-[80px] rounded-xl"
            />
          </div>
        </section>

        {/* 제출 버튼 */}
        <Button
          type="submit"
          disabled={submitting}
          className="h-13 w-full gap-2 rounded-2xl text-base font-bold shadow-lg shadow-primary/25"
        >
          {submitting ? (
            <span>모집 글 올리는 중...</span>
          ) : (
            <>
              <Sparkles className="size-5" />
              <span>공동주문 모집 글 올리기</span>
            </>
          )}
        </Button>
      </form>
    </div>
  )
}
