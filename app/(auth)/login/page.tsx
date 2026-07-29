'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'

export default function LoginPage() {
  const router = useRouter()
  const [loginId, setLoginId] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)

    const result = await signIn('credentials', { loginId, password, redirect: false })

    setSubmitting(false)
    if (result?.error) {
      setError('아이디 또는 비밀번호가 올바르지 않습니다.')
      return
    }
    router.push('/pots')
  }

  return (
    <div className="flex flex-1 flex-col justify-center px-6 pb-10">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-extrabold tracking-tight text-primary">먹메이트</h1>
        <p className="mt-2 text-sm text-muted-foreground">북대에서 같이 먹자!</p>
      </div>

      <Card className="p-5">
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <Input
            type="text"
            inputMode="text"
            autoComplete="username"
            placeholder="아이디"
            value={loginId}
            onChange={(e) => setLoginId(e.target.value)}
          />
          <Input
            type="password"
            autoComplete="current-password"
            placeholder="비밀번호"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button
            type="submit"
            disabled={submitting || loginId.length === 0 || password.length === 0}
            className="mt-1 h-12 w-full gap-1.5 rounded-xl text-base font-bold transition active:scale-[0.98]"
          >
            {submitting && <Loader2 className="size-4 animate-spin" />}
            로그인
          </Button>
        </form>

        <div className="mt-4 text-center">
          <Link
            href="/signup"
            className="text-sm font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
          >
            회원가입
          </Link>
        </div>
      </Card>
    </div>
  )
}
