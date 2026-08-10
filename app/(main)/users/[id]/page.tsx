import { notFound } from 'next/navigation'
import { UserProfileView } from '@/components/users/user-profile-view'
import { getCompletedPotCount, getCurrentUser, getMannerProfile, getPublicUserProfile } from '@/lib/server-data'

export default async function UserProfilePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const me = await getCurrentUser()

  const user = await getPublicUserProfile(id)
  if (!user) notFound()

  const [manner, completedPotCount] = await Promise.all([
    getMannerProfile(id),
    getCompletedPotCount(id),
  ])

  return (
    <UserProfileView
      user={user}
      manner={manner}
      completedPotCount={completedPotCount}
      isSelf={me.id === id}
    />
  )
}
