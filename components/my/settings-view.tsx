'use client'

import Link from 'next/link'
import { Bell, ChevronRight, Globe, Lock, ShieldOff } from 'lucide-react'

import { AppHeader } from '@/components/app-header'

const ROWS = [
  {
    href: '/my/settings/notifications',
    icon: Bell,
    title: '알림 설정',
    description: '친구 요청·모집글 초대 알림을 켜고 끌 수 있어요',
  },
  {
    href: '/my/settings/blocked',
    icon: ShieldOff,
    title: '차단 관리',
    description: '차단한 회원을 확인하고 해제할 수 있어요',
  },
  {
    href: '/my/edit',
    icon: Lock,
    title: '보안 설정',
    description: '기본정보·비밀번호를 변경해요',
  },
] as const

export function SettingsView() {
  return (
    <>
      <AppHeader title="환경설정" showBack />

      <div className="flex flex-col divide-y divide-border">
        {ROWS.map((row) => {
          const Icon = row.icon
          return (
            <Link
              key={row.href}
              href={row.href}
              className="flex items-center gap-3 px-4 py-3.5 transition hover:bg-muted/50 active:bg-muted"
            >
              <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary">
                <Icon className="size-4.5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-foreground">{row.title}</p>
                <p className="mt-0.5 truncate text-xs text-muted-foreground">{row.description}</p>
              </div>
              <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
            </Link>
          )
        })}

        {/* 언어 — 자리만 먼저 만들고 실제 번역은 아직 없음 */}
        <div className="flex items-center gap-3 px-4 py-3.5">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground">
            <Globe className="size-4.5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-foreground">언어</p>
            <p className="mt-0.5 text-xs text-muted-foreground">English 지원 준비 중이에요</p>
          </div>
          <span className="shrink-0 rounded-full bg-muted px-2.5 py-1 text-xs font-semibold text-muted-foreground">
            한국어
          </span>
        </div>
      </div>
    </>
  )
}
