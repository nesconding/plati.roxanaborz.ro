import { SentEmailModule } from '~/client/modules/(auth)/sent-email'

interface SentEmailPageProps {
  searchParams: Promise<{
    email: string
  }>
}

export default async function SentEmailPage({
  searchParams
}: SentEmailPageProps) {
  const { email } = await searchParams
  return <SentEmailModule email={email} />
}
