import { PotsView } from '@/components/pots/pots-view'
import { getSessionUserOrNull, listPots } from '@/lib/server-data'
import type { ZoneCode } from '@/lib/types'

export default async function PotsPage() {
  const [pots, me] = await Promise.all([listPots(), getSessionUserOrNull()])
  const initialZone: ZoneCode = me?.zoneCode ?? 'GUJEONGMUN'
  return <PotsView pots={pots} initialZone={initialZone} />
}
