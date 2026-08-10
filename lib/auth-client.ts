// 회원가입 관련 REST 호출 — 로그인/로그아웃 자체는 next-auth/react의 signIn/signOut을 그대로 쓴다.

export async function checkLoginIdAvailable(loginId: string): Promise<boolean> {
  const res = await fetch(`/api/auth/check-id?loginId=${encodeURIComponent(loginId)}`)
  if (!res.ok) return false
  const data = (await res.json()) as { available?: boolean }
  return Boolean(data.available)
}

export interface SignupInput {
  loginId: string
  password: string
  nickname: string
  zoneCode: string
  /** 온보딩에서 고른 아바타 색상(선택) — 안 주면 서버가 기본값(NAVY)으로 처리 */
  avatarColor?: string
}

export async function signup(input: SignupInput): Promise<{ ok: true } | { ok: false; error: string }> {
  const res = await fetch('/api/auth/signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })

  if (!res.ok) {
    const data = (await res.json().catch(() => null)) as { error?: string } | null
    return { ok: false, error: data?.error ?? '회원가입에 실패했습니다.' }
  }

  return { ok: true }
}
