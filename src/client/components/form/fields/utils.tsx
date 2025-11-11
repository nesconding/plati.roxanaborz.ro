import { cn } from '~/client/lib/utils'

interface RequiredMarkerProps {
  className?: string
}
export function RequiredMarker({ className }: RequiredMarkerProps) {
  return <span className={cn('text-red-500 text-xs', className)}>*</span>
}
