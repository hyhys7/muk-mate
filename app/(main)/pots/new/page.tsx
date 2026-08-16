import { PotCreateForm } from '@/components/pots/pot-create-form'
import { getCurrentUser } from '@/lib/server-data'

export default async function NewPotPage() {
  await getCurrentUser()
  return <PotCreateForm />
}
