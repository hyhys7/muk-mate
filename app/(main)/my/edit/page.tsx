import { EditProfileView } from '@/components/my/edit-profile-view'
import { getCurrentUser, getMyEmail } from '@/lib/server-data'
import { maskEmail } from '@/lib/constants'

export default async function EditProfilePage() {
  const me = await getCurrentUser()
  const email = await getMyEmail(me.id)
  return (
    <EditProfileView
      me={{ nickname: me.nickname, zoneCode: me.zoneCode, loginId: me.loginId }}
      maskedEmail={email ? maskEmail(email) : null}
    />
  )
}
