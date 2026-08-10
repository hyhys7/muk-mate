'use client'

import { useState } from 'react'
import { Check, Info } from 'lucide-react'
import { AppHeader } from '@/components/app-header'
import { MannerAvatar } from '@/components/manner-avatar'
import { MannerBadge } from '@/components/manner-badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { updateAvatar } from '@/lib/api'
import { MANNER_AVATAR_ACCESSORY_META, MANNER_AVATAR_COLOR_META } from '@/lib/constants'
import type { MannerAvatarAccessory, MannerAvatarColor, MannerProfile } from '@/lib/types'
import { cn } from '@/lib/utils'

const COLOR_OPTIONS = Object.keys(MANNER_AVATAR_COLOR_META) as MannerAvatarColor[]
const ACCESSORY_OPTIONS = Object.keys(MANNER_AVATAR_ACCESSORY_META) as MannerAvatarAccessory[]

export function AvatarCustomizeView({ manner }: { manner: MannerProfile }) {
  const [color, setColor] = useState<MannerAvatarColor>(manner.avatarColor)
  const [accessory, setAccessory] = useState<MannerAvatarAccessory>(manner.avatarAccessory)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSave() {
    setSaving(true)
    setError(null)
    setSaved(false)
    try {
      await updateAvatar({ avatarColor: color, avatarAccessory: accessory })
      setSaved(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : '저장에 실패했어요.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-1 flex-col pb-8">
      <AppHeader title="아바타 꾸미기" showBack />

      <div className="flex flex-col items-center gap-2 border-b border-border bg-muted/30 px-4 py-6">
        <MannerAvatar stage={manner.stage} color={color} accessory={accessory} className="size-24" />
        <MannerBadge
          stage={manner.stage}
          score={manner.score}
          reviewCount={manner.reviewCount}
          avatarColor={color}
          avatarAccessory={accessory}
          className="h-8 px-4 text-sm"
        />
        <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
          <Info className="size-3.5" />
          매너 단계에 따른 표정·자세는 바꿀 수 없어요.
        </p>
      </div>

      <div className="flex flex-col gap-4 p-4">
        {error && (
          <div className="rounded-xl bg-destructive/10 p-3 text-xs font-medium text-destructive">{error}</div>
        )}
        {saved && (
          <div className="flex items-center gap-1.5 rounded-xl bg-emerald-100 p-3 text-xs font-semibold text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
            <Check className="size-4" />
            저장했어요.
          </div>
        )}

        <Card className="flex flex-col gap-3 p-4">
          <h2 className="text-sm font-bold text-foreground">의상 색상</h2>
          <div className="grid grid-cols-4 gap-2">
            {COLOR_OPTIONS.map((c) => {
              const meta = MANNER_AVATAR_COLOR_META[c]
              return (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={cn(
                    'flex flex-col items-center gap-1.5 rounded-xl border p-2 transition',
                    color === c ? 'border-primary bg-primary/10' : 'border-border bg-background',
                  )}
                >
                  <span
                    className="size-7 rounded-full ring-1 ring-black/10"
                    style={{ backgroundColor: meta.hex }}
                  />
                  <span className="text-[11px] font-semibold text-foreground">{meta.label}</span>
                </button>
              )
            })}
          </div>
        </Card>

        <Card className="flex flex-col gap-3 p-4">
          <h2 className="text-sm font-bold text-foreground">소품</h2>
          <div className="grid grid-cols-5 gap-2">
            {ACCESSORY_OPTIONS.map((a) => {
              const meta = MANNER_AVATAR_ACCESSORY_META[a]
              return (
                <button
                  key={a}
                  type="button"
                  onClick={() => setAccessory(a)}
                  className={cn(
                    'flex flex-col items-center gap-1 rounded-xl border p-2 transition',
                    accessory === a ? 'border-primary bg-primary/10' : 'border-border bg-background',
                  )}
                >
                  <span className="text-lg">{meta.emoji || '·'}</span>
                  <span className="text-[10px] font-semibold text-foreground">{meta.label}</span>
                </button>
              )
            })}
          </div>
        </Card>

        <Button onClick={handleSave} disabled={saving} className="h-12 rounded-xl font-bold">
          {saving ? '저장하는 중...' : '저장'}
        </Button>
      </div>
    </div>
  )
}
