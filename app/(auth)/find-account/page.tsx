'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Check, Loader2 } from 'lucide-react'

import { AppHeader } from '@/components/app-header'
import { EmailCodeVerifier } from '@/components/auth/email-code-verifier'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { findLoginId, resetPassword } from '@/lib/auth-client'
import { cn } from '@/lib/utils'

type Tab = 'FIND_ID' | 'RESET_PASSWORD'

export default function FindAccountPage() {
  const [tab, setTab] = useState<Tab>('FIND_ID')

  return (
    <>
      <AppHeader title="아이디·비밀번호 찾기" showBack />

      <div className="flex border-b border-border bg-card px-4">
        {(
          [
            { key: 'FIND_ID', label: '아이디 찾기' },
            { key: 'RESET_PASSWORD', label: '비밀번호 찾기' },
          ] as const
        ).map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={cn(
              'relative flex h-11 flex-1 items-center justify-center text-sm font-semibold transition',
              tab === t.key ? 'text-primary' : 'text-muted-foreground',
            )}
          >
            {t.label}
            {tab === t.key && <span className="absolute inset-x-3 bottom-0 h-0.5 rounded-full bg-primary" />}
          </button>
        ))}
      </div>

      <div className="flex flex-1 flex-col px-6 py-6">
        {tab === 'FIND_ID' ? <FindIdPanel /> : <ResetPasswordPanel />}
      </div>
    </>
  )
}

function FindIdPanel() {
  const [email, setEmail] = useState('')
  const [verified, setVerified] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loginId, setLoginId] = useState<string | null>(null)

  async function handleVerified() {
    setVerified(true)
    setLoading(true)
    setError(null)
    try {
      const result = await findLoginId(email)
      if (!result.ok) {
        setError(result.error)
        return
      }
      setLoginId(result.loginId)
    } finally {
      setLoading(false)
    }
  }

  if (loginId) {
    return (
      <div className="flex flex-col items-center gap-4 pt-8 text-center">
        <div className="flex size-14 items-center justify-center rounded-full bg-status-ordered/10 text-status-ordered">
          <Check className="size-7" />
        </div>
        <div>
          <p className="text-sm text-muted-foreground">회원님의 아이디는</p>
          <p className="mt-1 text-xl font-bold text-foreground">{loginId}</p>
        </div>
        <Link href="/login" className="mt-4 text-sm font-semibold text-primary underline underline-offset-4">
          로그인하러 가기
        </Link>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted-foreground">가입할 때 인증한 전북대 이메일을 입력해 주세요.</p>
      <EmailCodeVerifier
        purpose="FIND_ID"
        email={email}
        onEmailChange={setEmail}
        verified={verified}
        onVerified={handleVerified}
      />
      {loading && (
        <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <Loader2 className="size-3.5 animate-spin" />
          확인하는 중...
        </p>
      )}
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  )
}

function ResetPasswordPanel() {
  const [email, setEmail] = useState('')
  const [verified, setVerified] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [newPasswordConfirm, setNewPasswordConfirm] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  const mismatch = newPasswordConfirm.length > 0 && newPassword !== newPasswordConfirm
  const canSubmit = verified && newPassword.length >= 4 && newPassword.length <= 16 && !mismatch

  async function handleSubmit() {
    if (!canSubmit) return
    setSubmitting(true)
    setError(null)
    try {
      const result = await resetPassword(email, newPassword)
      if (!result.ok) {
        setError(result.error)
        return
      }
      setDone(true)
    } finally {
      setSubmitting(false)
    }
  }

  if (done) {
    return (
      <div className="flex flex-col items-center gap-4 pt-8 text-center">
        <div className="flex size-14 items-center justify-center rounded-full bg-status-ordered/10 text-status-ordered">
          <Check className="size-7" />
        </div>
        <p className="text-base font-bold text-foreground">비밀번호를 새로 설정했어요.</p>
        <Link href="/login" className="mt-2 text-sm font-semibold text-primary underline underline-offset-4">
          새 비밀번호로 로그인하기
        </Link>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted-foreground">가입할 때 인증한 전북대 이메일을 입력해 주세요.</p>
      <EmailCodeVerifier
        purpose="RESET_PASSWORD"
        email={email}
        onEmailChange={setEmail}
        verified={verified}
        onVerified={() => setVerified(true)}
      />

      {verified && (
        <div className="flex flex-col gap-3 pt-2">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-foreground">새 비밀번호</label>
            <Input
              type="password"
              value={newPassword}
              maxLength={16}
              placeholder="4~16자"
              onChange={(e) => setNewPassword(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-foreground">새 비밀번호 확인</label>
            <Input
              type="password"
              value={newPasswordConfirm}
              maxLength={16}
              placeholder="비밀번호를 한 번 더 입력"
              aria-invalid={mismatch}
              onChange={(e) => setNewPasswordConfirm(e.target.value)}
            />
            {mismatch && <p className="text-xs text-destructive">비밀번호가 일치하지 않아요.</p>}
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button
            type="button"
            disabled={!canSubmit || submitting}
            onClick={handleSubmit}
            className="mt-2 h-12 w-full gap-1.5 rounded-xl text-base font-bold"
          >
            {submitting && <Loader2 className="size-4 animate-spin" />}
            비밀번호 재설정
          </Button>
        </div>
      )}
    </div>
  )
}
