import { NotificationSettingsView } from '@/components/my/notification-settings-view'
import { getCurrentUser, getUserPreferences } from '@/lib/server-data'

export default async function NotificationSettingsPage() {
  const me = await getCurrentUser()
  const preferences = await getUserPreferences(me.id)
  return <NotificationSettingsView initialPreferences={preferences} />
}
