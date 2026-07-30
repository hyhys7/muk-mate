import { notFound } from 'next/navigation'
import { ChatRoomView } from '@/components/chat/chat-room-view'
import {
  getCurrentUser,
  getMessagesForRoom,
  getRoomForViewer,
  getRoomReads,
  markRoomRead,
} from '@/lib/server-data'
import type { RoomReadEntry } from '@/lib/types'

export default async function ChatRoomPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const me = await getCurrentUser()

  // CHAT-01: 승인되지 않은 사용자는 URL을 직접 입력해도 접근 불가 — 여기서 서버가 막는다.
  const access = await getRoomForViewer(id, me.id)
  if (!access) notFound()

  const initialMessages = await getMessagesForRoom(id, 0, me.id)

  let initialReads: RoomReadEntry[] = []
  if (access.type === 'ORDER' && access.pot) {
    await markRoomRead(id, me.id)
    initialReads = await getRoomReads(id, access.pot.id)
  }

  return <ChatRoomView room={access} initialMessages={initialMessages} initialReads={initialReads} />
}
