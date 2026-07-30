import Link from 'next/link'

export default function AdminHomePage() {
  return (
    <div className="flex flex-1 flex-col gap-3 p-4">
      <Link
        href="/admin/reports"
        className="rounded-xl border border-border p-4 text-sm font-semibold text-foreground hover:bg-muted"
      >
        신고함 — 접수된 신고 검토·처리
      </Link>
      <Link
        href="/admin/pots"
        className="rounded-xl border border-border p-4 text-sm font-semibold text-foreground hover:bg-muted"
      >
        모집글 관리 — 전체 목록·직권 삭제
      </Link>
      <Link
        href="/admin/users"
        className="rounded-xl border border-border p-4 text-sm font-semibold text-foreground hover:bg-muted"
      >
        회원 관리 — 전체 회원 검색·계정 상태 변경
      </Link>
    </div>
  )
}
