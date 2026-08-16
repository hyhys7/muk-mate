'use client'

import { useState } from 'react'
import { Check, Loader2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { sendVerificationCode, verifyEmailCode, type VerificationPurpose } from '@/lib/auth-client'

const RESEND_COOLDOWN_SEC = 60

/**
 * 이메일 인증코드 발송/확인 재사용 컴포넌트 — 회원가입/아이디 찾기/비밀번호 찾기/아이디 변경 4곳에서 쓴다.
 * CHANGE_LOGIN_ID는 이메일 입력란 자체를 숨긴다(서버가 세션 계정의 등록된 이메일로 알아서 보낸다).
 */
export function EmailCodeVerifier({
  purpose,
  email,
  onEmailChange,
  hideEmailInput = false,
  verified,
  onVerified,
  emailError,
}: {
  purpose: VerificationPurpose
  email: string
  onEmailChange?: (value: string) => void
  hideEmailInput?: boolean
  verified: boolean
  onVerified: () => void
  /** 이메일 형식이 안 맞을 때 부모가 판단해서 넘겨주는 에러 문구(예: 도메인 제한) */
  emailError?: string | null
}) {
  const [code, setCode] = useState('')
  const [sent, setSent] = useState(false)
  const [sending, setSending] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [maskedEmail, setMaskedEmail] = useState<string | null>(null)
  const [cooldown, setCooldown] = useState(0)

  function startCooldown() {
    setCooldown(RESEND_COOLDOWN_SEC)
    const interval = setInterval(() => {
      setCooldown((c) => {
        if (c <= 1) {
          clearInterval(interval)
          return 0
        }
        return c - 1
      })
    }, 1000)
  }

  async function handleSend() {
    if (!hideEmailInput && (!email || emailError)) return
    setSending(true)
    setError(null)
    try {
      const result = await sendVerificationCode(purpose, hideEmailInput ? undefined : email)
      if (!result.ok) {
        setError(result.error)
        return
      }
      setSent(true)
      setMaskedEmail(result.maskedEmail ?? null)
      startCooldown()
    } finally {
      setSending(false)
    }
  }

  async function handleVerify() {
    if (!code) return
    setVerifying(true)
    setError(null)
    try {
      const result = await verifyEmailCode(purpose, code, hideEmailInput ? undefined : email)
      if (!result.ok) {
        setError(result.error)
        return
      }
      onVerified()
    } finally {
      setVerifying(false)
    }
  }

  if (verified) {
    return (
      <p className="flex items-center gap-1.5 rounded-xl bg-status-ordered/10 px-3.5 py-2.5 text-sm font-semibold text-status-ordered">
        <Check className="size-4" />
        이메일 인증을 완료했어요{maskedEmail ? ` (${maskedEmail})` : ''}.
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      {!hideEmailInput && (
        <div className="flex gap-2">
          <Input
            type="email"
            value={email}
            placeholder="학번@jbnu.ac.kr"
            disabled={sent}
            onChange={(e) => onEmailChange?.(e.target.value)}
          />
          <Button
            type="button"
            variant="outline"
            disabled={!email || Boolean(emailError) || sending || (sent && cooldown > 0)}
            onClick={handleSend}
            className="h-12 shrink-0 gap-1.5 rounded-xl px-3 text-sm font-semibold"
          >
            {sending && <Loader2 className="size-3.5 animate-spin" />}
            {sent ? (cooldown > 0 ? `재전송 ${cooldown}s` : '재전송') : '인증코드 받기'}
          </Button>
        </div>
      )}
      {hideEmailInput && !sent && (
        <Button
          type="button"
          variant="outline"
          disabled={sending}
          onClick={handleSend}
          className="h-12 w-full gap-1.5 rounded-xl text-sm font-semibold"
        >
          {sending && <Loader2 className="size-3.5 animate-spin" />}
          등록된 이메일로 인증코드 받기
        </Button>
      )}
      {emailError && !hideEmailInput && <p className="text-xs text-destructive">{emailError}</p>}

      {sent && (
        <div className="flex gap-2">
          <Input
            value={code}
            maxLength={6}
            inputMode="numeric"
            placeholder="6자리 인증코드"
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
          />
          <Button
            type="button"
            disabled={code.length !== 6 || verifying}
            onClick={handleVerify}
            className="h-12 shrink-0 gap-1.5 rounded-xl px-3 text-sm font-semibold"
          >
            {verifying && <Loader2 className="size-3.5 animate-spin" />}
            확인
          </Button>
        </div>
      )}
      {sent && !error && (
        <p className="text-xs text-muted-foreground">
          {maskedEmail ?? email}로 인증코드를 보냈어요. 10분 이내에 입력해 주세요.
        </p>
      )}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}
