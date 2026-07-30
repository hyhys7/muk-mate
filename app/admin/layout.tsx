import type { ReactNode } from 'react'

import { requireAdmin } from '@/lib/admin/auth'

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const admin = await requireAdmin()

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-background/90 px-4 backdrop-blur">
        <span className="text-base font-bold text-foreground">먹메이트 관리자</span>
        <span className="text-sm text-muted-foreground">{admin.nickname}</span>
      </header>
      <nav className="flex gap-1 border-b border-border px-4 py-2">
        <a href="/admin/reports" className="rounded-lg px-3 py-1.5 text-sm font-medium text-foreground hover:bg-muted">
          신고함
        </a>
        <a href="/admin/pots" className="rounded-lg px-3 py-1.5 text-sm font-medium text-foreground hover:bg-muted">
          모집글 관리
        </a>
        <a href="/admin/users" className="rounded-lg px-3 py-1.5 text-sm font-medium text-foreground hover:bg-muted">
          회원 관리
        </a>
      </nav>
      <main className="flex flex-1 flex-col">{children}</main>
    </div>
  )
}
