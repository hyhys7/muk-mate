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
  /** v2.17: 인증 완료된 전북대 이메일 */
  email: string
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

// ─────────────────────────────────────────────────────────────
// 이메일 인증 (v2.17, §17-6) — 회원가입/아이디 찾기/비밀번호 찾기/아이디 변경 공용
// ─────────────────────────────────────────────────────────────

export type VerificationPurpose = 'SIGNUP' | 'FIND_ID' | 'RESET_PASSWORD' | 'CHANGE_LOGIN_ID'

async function parseAuthResponse<T>(res: Response): Promise<{ ok: true; data: T } | { ok: false; error: string }> {
  const data = await res.json().catch(() => null)
  if (!res.ok) {
    return { ok: false, error: (data as { error?: string } | null)?.error ?? '요청에 실패했어요.' }
  }
  return { ok: true, data: data as T }
}

/** CHANGE_LOGIN_ID는 email을 안 줘도 된다 — 서버가 세션 계정의 등록된 이메일로 보낸다. */
export async function sendVerificationCode(
  purpose: VerificationPurpose,
  email?: string,
): Promise<{ ok: true; maskedEmail?: string } | { ok: false; error: string }> {
  const res = await fetch('/api/auth/email/send-code', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ purpose, email }),
  })
  const result = await parseAuthResponse<{ ok: true; maskedEmail?: string }>(res)
  if (!result.ok) return result
  return { ok: true, maskedEmail: result.data.maskedEmail }
}

export async function verifyEmailCode(
  purpose: VerificationPurpose,
  code: string,
  email?: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const res = await fetch('/api/auth/email/verify-code', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ purpose, code, email }),
  })
  const result = await parseAuthResponse<{ ok: true }>(res)
  if (!result.ok) return result
  return { ok: true }
}

export async function findLoginId(email: string): Promise<{ ok: true; loginId: string } | { ok: false; error: string }> {
  const res = await fetch('/api/auth/find-id', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  })
  const result = await parseAuthResponse<{ loginId: string }>(res)
  if (!result.ok) return result
  return { ok: true, loginId: result.data.loginId }
}

export async function resetPassword(
  email: string,
  newPassword: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const res = await fetch('/api/auth/reset-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, newPassword }),
  })
  const result = await parseAuthResponse<{ ok: true }>(res)
  if (!result.ok) return result
  return { ok: true }
}

export async function changeLoginId(newLoginId: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const res = await fetch('/api/me/login-id', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ newLoginId }),
  })
  const result = await parseAuthResponse<{ ok: true }>(res)
  if (!result.ok) return result
  return { ok: true }
}
