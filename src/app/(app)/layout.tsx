import AppLayoutModule from '~/client/modules/(app)/layout'

export default async function AppLayout({
  children
}: {
  children: React.ReactNode
}) {
  return <AppLayoutModule>{children}</AppLayoutModule>
}
