import { notFound, redirect } from 'next/navigation'
import { MannerReviewView } from '@/components/pots/manner-review-view'
import { getCurrentUser, getMannerReviewStatus, getPotById } from '@/lib/server-data'

export default async function MannerReviewPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const me = await getCurrentUser()

  const pot = await getPotById(id, me.id)
  if (!pot) notFound()

  const status = await getMannerReviewStatus(id, me.id)
  if (!status.eligible) redirect(`/pots/${id}`)

  return <MannerReviewView potId={id} storeName={pot.storeName} initialTargets={status.targets} />
}
