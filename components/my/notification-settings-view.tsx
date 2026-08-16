'use client'

import { useState } from 'react'

import { AppHeader } from '@/components/app-header'
import { Card } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { updatePreferences } from '@/lib/api'
import type { UserPreferences } from '@/lib/types'

const ROWS: { key: keyof Pick<UserPreferences, 'notifyFriendRequest' | 'notifyPotInvite'>; title: string; description: string }[] = [
  { key: 'notifyFriendRequest', title: '친구 요청 알림', description: '다른 회원이 친구 요청을 보내면 알려줘요' },
  { key: 'notifyPotInvite', title: '모집글 초대 알림', description: '친구가 공동주문에 초대하면 알려줘요' },
]

export function NotificationSettingsView({ initialPreferences }: { initialPreferences: UserPreferences }) {
  const [preferences, setPreferences] = useState(initialPreferences)
  const [savingKey, setSavingKey] = useState<string | null>(null)

  async function handleToggle(key: 'notifyFriendRequest' | 'notifyPotInvite', value: boolean) {
    setSavingKey(key)
    const prev = preferences
    setPreferences((p) => ({ ...p, [key]: value }))
    try {
      await updatePreferences({ [key]: value })
    } catch {
      setPreferences(prev)
      alert('설정을 저장하지 못했어요.')
    } finally {
      setSavingKey(null)
    }
  }

  return (
    <>
      <AppHeader title="알림 설정" showBack />

      <div className="flex flex-col gap-3 p-4">
        <p className="text-xs text-muted-foreground">
          참여 신청·승인·주문 완료처럼 공동주문 진행에 필요한 알림은 항상 켜져 있어요. 여기서는 부가 기능 알림만 조절할 수 있어요.
        </p>
        {ROWS.map((row) => (
          <Card key={row.key} className="flex items-center justify-between gap-3 p-4">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground">{row.title}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">{row.description}</p>
            </div>
            <Switch
              checked={preferences[row.key]}
              disabled={savingKey === row.key}
              onCheckedChange={(value) => handleToggle(row.key, value)}
            />
          </Card>
        ))}
      </div>
    </>
  )
}
