import Link from 'next/link'
import { Landmark, MapPin } from 'lucide-react'

/**
 * 첫 화면(비로그인 방문자 전용) — 화면 어디를 눌러도 /login으로 이동한다.
 * 진짜 마스코트 일러스트·손그림 단풍은 없어서(디자인 에셋이 없음),
 * 아이콘·이모지·CSS로 비슷한 분위기만 흉내냈다.
 */
export function WelcomeScreen() {
  return (
    <Link
      href="/login"
      className="relative flex flex-1 flex-col items-center justify-center overflow-hidden bg-[#dce8f5] px-6 text-center"
    >
      {/* 은은한 배경 아이콘 */}
      <Landmark
        className="pointer-events-none absolute left-1/2 top-20 size-40 -translate-x-1/2 text-primary/10"
        strokeWidth={1}
      />

      {/* 단풍잎 장식 */}
      <span className="pointer-events-none absolute right-6 top-8 text-4xl opacity-70">🍁</span>
      <span className="pointer-events-none absolute right-14 top-24 text-lg opacity-60">🍂</span>
      <span className="pointer-events-none absolute left-8 bottom-1/3 text-2xl opacity-50">🍁</span>

      {/* 점선 경로 + 핀 */}
      <div className="pointer-events-none absolute inset-0">
        <MapPin className="absolute right-12 top-[38%] size-6 fill-primary text-primary drop-shadow-sm" />
        <MapPin className="absolute left-10 bottom-[30%] size-5 fill-primary text-primary drop-shadow-sm" />
      </div>

      {/* 로고 영역 */}
      <div className="relative z-10 flex flex-col items-center">
        <p className="text-sm font-bold text-primary">북대에서 같이 먹자!</p>
        <h1 className="mt-2 text-5xl font-extrabold tracking-tight text-foreground">먹메이트</h1>
      </div>

      <p className="absolute bottom-16 text-xs font-medium text-muted-foreground">
        화면을 눌러 시작하기
      </p>
    </Link>
  )
}
