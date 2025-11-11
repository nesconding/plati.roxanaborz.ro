import { Logo } from '~/client/components/logo'

export default function Home() {
  return (
    <div className='flex h-[calc(100vh-var(--header-height))] items-center justify-center'>
      <Logo className='w-56' />
    </div>
  )
}
