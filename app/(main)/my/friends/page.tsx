import { FriendsView } from '@/components/my/friends-view'
import { getCurrentUser, getFriendsOverview } from '@/lib/server-data'

export default async function FriendsPage() {
  const me = await getCurrentUser()
  const overview = await getFriendsOverview(me.id)
  return <FriendsView overview={overview} />
}
