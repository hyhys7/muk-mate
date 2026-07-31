import Image from 'next/image'
import Link from 'next/link'

/** 첫 화면(비로그인 방문자 전용) — 화면 어디를 눌러도 /login으로 이동한다. */
export function WelcomeScreen() {
  return (
    <Link href="/login" className="relative block flex-1 overflow-hidden">
      <Image
        src="/welcome-splash.webp"
        alt="북대에서 같이 먹자! 먹메이트"
        fill
        priority
        sizes="430px"
        className="object-cover"
      />
      <span className="absolute inset-x-0 bottom-10 text-center text-xs font-medium text-muted-foreground/80">
        화면을 눌러 시작하기
      </span>
    </Link>
  )
}
