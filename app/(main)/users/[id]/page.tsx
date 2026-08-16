import { notFound } from 'next/navigation'
import { UserProfileView } from '@/components/users/user-profile-view'
import {
  getCompletedPotCount,
  getCurrentUser,
  getFriendshipState,
  getMannerProfile,
  getPublicUserProfile,
} from '@/lib/server-data'

export default async function UserProfilePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const me = await getCurrentUser()

  const user = await getPublicUserProfile(id)
  if (!user) notFound()

  const isSelf = me.id === id
  const [manner, completedPotCount, friendship] = await Promise.all([
    getMannerProfile(id),
    getCompletedPotCount(id),
    isSelf
      ? Promise.resolve({ state: 'NONE' as const, friendshipId: undefined, blockedByMe: false })
      : getFriendshipState(me.id, id),
  ])

  return (
    <UserProfileView
      user={user}
      manner={manner}
      completedPotCount={completedPotCount}
      isSelf={isSelf}
      friendshipState={friendship.state}
      friendshipId={friendship.friendshipId}
      blockedByMe={friendship.blockedByMe ?? false}
    />
  )
}
