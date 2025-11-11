import Image from 'next/image'

import { cn } from '~/client/lib/utils'

export function Logo({ className }: { className?: string }) {
  // return <Image className={cn(className)} src='/logo.webp' alt='Plați RB logo' width={96} height={24} />

  return (
    <div
      className={cn('bg-primary relative aspect-24/6', className)}
      style={{
        maskImage: 'url(/logo.webp)',
        maskRepeat: 'no-repeat',
        maskSize: 'contain',
        WebkitMaskImage: 'url(/logo.webp)',
        WebkitMaskRepeat: 'no-repeat',
        WebkitMaskSize: 'contain'
      }}
    />
  )
}
