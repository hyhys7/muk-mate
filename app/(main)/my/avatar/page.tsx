import { AvatarCustomizeView } from '@/components/my/avatar-customize-view'
import { getCurrentUser, getMannerProfile } from '@/lib/server-data'

export default async function AvatarCustomizePage() {
  const me = await getCurrentUser()
  const manner = await getMannerProfile(me.id)

  return <AvatarCustomizeView manner={manner} />
}
