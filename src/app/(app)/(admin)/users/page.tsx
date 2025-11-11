import { RedirectType, redirect } from 'next/navigation'

import { UsersPageModule } from '~/client/modules/(app)/(admin)/users'
import { getQueryClient, trpc } from '~/client/trpc/server'
import { UserRoles } from '~/shared/enums/user-roles'

interface UsersAccountsPageProps {
  searchParams: Promise<{
    search?: string
  }>
}

export default async function UsersAccountsPage({
  searchParams
}: UsersAccountsPageProps) {
  const { search } = await searchParams

  const queryClient = getQueryClient()

  const session = await queryClient.ensureQueryData(
    trpc.public.authentication.getSession.queryOptions()
  )
  if (
    session?.user.role !== UserRoles.ADMIN &&
    session?.user.role !== UserRoles.SUPER_ADMIN
  ) {
    redirect('/', RedirectType.replace)
  }
  await queryClient.ensureQueryData(
    trpc.admin.authentication.listUsers.queryOptions()
  )

  return <UsersPageModule search={search} />
}
