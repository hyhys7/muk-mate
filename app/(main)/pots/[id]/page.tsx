import { notFound } from 'next/navigation'
import { PotDetailView } from '@/components/pots/pot-detail-view'
import {
  getCurrentUser,
  getHostMenuAmount,
  getMannerAvatarsForUsers,
  getMannerReviewStatus,
  getParticipationsForPot,
  getPendingRequestsForPot,
  getPotById,
} from '@/lib/server-data'

export default async function PotDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const me = await getCurrentUser()

  const [pot, participations] = await Promise.all([
    getPotById(id, me.id),
    getParticipationsForPot(id, me.id),
  ])

  if (!pot) notFound()

  const isHost = pot.hostId === me.id
  const [pendingRequests, mannerReviewStatus, hostMenuAmount, hostMannerMap] = await Promise.all([
    isHost ? getPendingRequestsForPot(id) : Promise.resolve([]),
    pot.status === 'ORDERED' ? getMannerReviewStatus(id, me.id) : Promise.resolve(undefined),
    getHostMenuAmount(id, pot.hostId),
    getMannerAvatarsForUsers([pot.hostId]),
  ])

  return (
    <PotDetailView
      pot={pot}
      participations={participations}
      initialRequests={pendingRequests}
      isHost={isHost}
      mannerReviewStatus={mannerReviewStatus}
      hostMenuAmount={hostMenuAmount}
      hostManner={hostMannerMap.get(pot.hostId)}
    />
  )
}
