import { notFound } from "next/navigation"
import { PotDetailView } from "@/components/pots/pot-detail-view"
import { getCurrentUser, getParticipationsForPot, getPotById } from "@/lib/server-data"

export default async function PotDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const me = await getCurrentUser()
  const [pot, participations] = await Promise.all([
    getPotById(id),
    getParticipationsForPot(id, me.id),
  ])

  if (!pot) notFound()

  return (
    <PotDetailView pot={pot} participations={participations} isHost={pot.hostId === me.id} />
  )
}
