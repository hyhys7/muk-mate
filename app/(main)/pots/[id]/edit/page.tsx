import { notFound, redirect } from 'next/navigation'
import { PotEditForm } from '@/components/pots/pot-edit-form'
import { getCurrentUser, getPotById } from '@/lib/server-data'

export default async function PotEditPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const me = await getCurrentUser()

  const pot = await getPotById(id, me.id)
  if (!pot) notFound()

  // ORDER-08: 모집자만, 그리고 모집 중(OPEN)일 때만 수정 가능 — 서버(PATCH 핸들러)에서도 동일하게 재검증한다.
  if (pot.hostId !== me.id || pot.status !== 'OPEN') {
    redirect(`/pots/${id}`)
  }

  return <PotEditForm pot={pot} />
}
