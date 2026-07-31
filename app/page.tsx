import { redirect } from 'next/navigation'

import { MobileFrame } from '@/components/mobile-frame'
import { WelcomeScreen } from '@/components/welcome-screen'
import { getSessionUserOrNull } from '@/lib/server-data'

export default async function RootPage() {
  const me = await getSessionUserOrNull()
  if (me) redirect('/pots')

  return (
    <MobileFrame>
      <WelcomeScreen />
    </MobileFrame>
  )
}
