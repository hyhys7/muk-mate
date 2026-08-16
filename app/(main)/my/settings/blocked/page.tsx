import { BlockedUsersView } from '@/components/my/blocked-users-view'
import { getBlockedUsers, getCurrentUser } from '@/lib/server-data'

export default async function BlockedUsersPage() {
  const me = await getCurrentUser()
  const items = await getBlockedUsers(me.id)
  return <BlockedUsersView initialItems={items} />
}
