'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { MapPin } from 'lucide-react'
import { AppHeader } from '@/components/app-header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ZONES } from '@/lib/constants'
import { changePassword, updateProfile } from '@/lib/api'
import type { ZoneCode } from '@/lib/types'
import { cn } from '@/lib/utils'

export function EditProfileView({ me }: { me: { nickname: string; zoneCode: ZoneCode } }) {
  const router = useRouter()
  const { update } = useSession()

  const [nickname, setNickname] = useState(me.nickname)
  const [zoneCode, setZoneCode] = useState<ZoneCode>(me.zoneCode)
  const [profileSaving, setProfileSaving] = useState(false)
  const [profileError, setProfileError] = useState<string | null>(null)
  const [profileSaved, setProfileSaved] = useState(false)

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [newPasswordConfirm, setNewPasswordConfirm] = useState('')
  const [passwordSaving, setPasswordSaving] = useState(false)
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [passwordSaved, setPasswordSaved] = useState(false)

  const passwordMismatch = newPasswordConfirm.length > 0 && newPassword !== newPasswordConfirm

  async function handleProfileSubmit(e: React.FormEvent) {
    e.preventDefault()
    setProfileSaving(true)
    setProfileError(null)
    setProfileSaved(false)
    try {
      const updated = await updateProfile({ nickname: nickname.trim(), zoneCode })
      // JWT 세션은 DB를 다시 안 읽으므로, 재로그인 없이 화면에 바로 반영하려면
      // useSession().update()로 토큰을 직접 갱신해야 한다 (auth.ts의 jwt 콜백 참고).
      await update({ nickname: updated.nickname, zoneCode: updated.zoneCode })
      setProfileSaved(true)
      router.refresh()
    } catch (err) {
      setProfileError(err instanceof Error ? err.message : '저장에 실패했어요.')
    } finally {
      setProfileSaving(false)
    }
  }

  async function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (passwordMismatch) return
    setPasswordSaving(true)
    setPasswordError(null)
    setPasswordSaved(false)
    try {
      await changePassword({ currentPassword, newPassword })
      setPasswordSaved(true)
      setCurrentPassword('')
      setNewPassword('')
      setNewPasswordConfirm('')
    } catch (err) {
      setPasswordError(err instanceof Error ? err.message : '변경에 실패했어요.')
    } finally {
      setPasswordSaving(false)
    }
  }

  return (
    <>
      <AppHeader title="기본정보·비밀번호 수정" showBack />

      <div className="flex flex-col gap-6 p-4">
        <form
          onSubmit={handleProfileSubmit}
          className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 shadow-sm"
        >
          <h2 className="font-bold text-foreground">기본정보</h2>

          {profileError && <p className="text-sm text-destructive">{profileError}</p>}
          {profileSaved && <p className="text-sm text-status-ordered">저장했어요.</p>}

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-muted-foreground">닉네임</label>
            <Input
              value={nickname}
              maxLength={12}
              onChange={(e) => setNickname(e.target.value)}
              className="h-11 rounded-xl"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-muted-foreground">활동 지역</label>
            <div className="grid grid-cols-2 gap-2">
              {ZONES.map((z) => (
                <button
                  key={z.code}
                  type="button"
                  onClick={() => setZoneCode(z.code)}
                  className={cn(
                    'flex h-11 items-center justify-center gap-1.5 rounded-xl border text-sm font-semibold transition',
                    zoneCode === z.code
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border bg-background text-muted-foreground hover:border-primary/50',
                  )}
                >
                  <MapPin className="size-3.5" />
                  {z.label}
                </button>
              ))}
            </div>
          </div>

          <Button
            type="submit"
            disabled={profileSaving || !nickname.trim()}
            className="h-11 w-full rounded-xl font-bold"
          >
            {profileSaving ? '저장하는 중...' : '기본정보 저장'}
          </Button>
        </form>

        <form
          onSubmit={handlePasswordSubmit}
          className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 shadow-sm"
        >
          <h2 className="font-bold text-foreground">비밀번호 변경</h2>

          {passwordError && <p className="text-sm text-destructive">{passwordError}</p>}
          {passwordSaved && <p className="text-sm text-status-ordered">비밀번호를 변경했어요.</p>}

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-muted-foreground">현재 비밀번호</label>
            <Input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="h-11 rounded-xl"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-muted-foreground">새 비밀번호 (4~16자)</label>
            <Input
              type="password"
              value={newPassword}
              maxLength={16}
              onChange={(e) => setNewPassword(e.target.value)}
              className="h-11 rounded-xl"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-muted-foreground">새 비밀번호 확인</label>
            <Input
              type="password"
              value={newPasswordConfirm}
              maxLength={16}
              aria-invalid={passwordMismatch}
              onChange={(e) => setNewPasswordConfirm(e.target.value)}
              className="h-11 rounded-xl"
            />
            {passwordMismatch && <p className="text-xs text-destructive">비밀번호가 일치하지 않아요.</p>}
          </div>

          <Button
            type="submit"
            disabled={passwordSaving || !currentPassword || newPassword.length < 4 || passwordMismatch}
            className="h-11 w-full rounded-xl font-bold"
          >
            {passwordSaving ? '변경하는 중...' : '비밀번호 변경'}
          </Button>
        </form>
      </div>
    </>
  )
}
