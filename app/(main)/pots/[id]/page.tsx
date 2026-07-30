import { notFound } from 'next/navigation'
import { PotDetailView } from '@/components/pots/pot-detail-view'
import { getParticipationsForPot, getPendingRequestsForPot, getPotById, getSessionUserOrNull } from '@/lib/server-data'

export default async function PotDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const me = await getSessionUserOrNull()

  const [pot, participations] = await Promise.all([
    getPotById(id, me?.id),
    getParticipationsForPot(id, me?.id),
  ])

  if (!pot) notFound()

  const isHost = Boolean(me && pot.hostId === me.id)
  const pendingRequests = isHost ? await getPendingRequestsForPot(id) : []

  return (
    <PotDetailView
      pot={pot}
      participations={participations}
      initialRequests={pendingRequests}
      isHost={isHost}
    />
  )
}
