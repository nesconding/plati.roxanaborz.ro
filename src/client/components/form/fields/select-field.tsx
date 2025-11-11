import type { LucideProps } from 'lucide-react'

import { useFieldContext } from '~/client/components/form/config'
import { RequiredMarker } from '~/client/components/form/fields/utils'
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel
} from '~/client/components/ui/field'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '~/client/components/ui/select'
import { cn } from '~/client/lib/utils'

type StringKeys<T> = keyof {
  [K in keyof T as T[K] extends string ? K : never]: T[K]
}
interface SelectFieldProps<
  T,
  Key extends StringKeys<T>,
  Value extends string = T[Key] extends string ? T[Key] : never
> {
  open?: boolean
  description?: string
  placeholder?: string
  icon?: React.ForwardRefExoticComponent<
    Omit<LucideProps, 'ref'> & React.RefAttributes<SVGSVGElement>
  >
  isLoading?: boolean
  className?: string
  isDisabled?: boolean
  label: string
  options: T[]
  valueKey: Key
  align?: 'center' | 'start' | 'end' | undefined
  renderItem?: (option: T) => React.ReactNode
  onValueChange?: (value: Value) => void
  disabled?: { [K in Key]: Value }[]
  isRequired?: boolean
}

export function SelectField<
  T,
  Key extends StringKeys<T>,
  Value extends string = T[Key] extends string ? T[Key] : never
>({
  label,
  className,
  open,
  icon: Icon,
  description,
  isLoading,
  isDisabled: isDisabledProp,
  placeholder,
  options,
  valueKey,
  renderItem,
  align = 'start',
  onValueChange,
  isRequired = false,
  disabled
}: SelectFieldProps<T, Key, Value>) {
  const field = useFieldContext<string>()
  const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid
  const isDisabled = isLoading || isDisabledProp

  const disabledValues = disabled?.map((d) => d[valueKey]) ?? []

  return (
    <Field
      aria-disabled={isDisabled}
      className={className}
      data-disabled={isDisabled}
      data-invalid={isInvalid}
    >
      <FieldLabel
        className={cn({ 'gap-0.5': isRequired })}
        htmlFor={field.name}
      >
        {label}
        {isRequired ? <RequiredMarker /> : null}
      </FieldLabel>
      {description && (
        <FieldDescription className={cn({ 'opacity-50': isDisabled })}>
          {description}
        </FieldDescription>
      )}

      <Select
        aria-disabled={isDisabled}
        aria-invalid={isInvalid}
        data-disabled={isDisabled}
        disabled={isDisabled}
        name={field.name}
        onValueChange={onValueChange ?? field.handleChange}
        open={open}
        value={field.state.value}
      >
        <SelectTrigger
          aria-disabled={isDisabled}
          aria-invalid={isInvalid}
          className={cn('px-3! text-base! md:text-sm! group/select-trigger', {
            '[&_svg]:text-destructive!': isInvalid
          })}
          data-disabled={isDisabled}
          disabled={isDisabled}
          id={field.name}
        >
          <div className='flex w-[calc(100%-(--spacing(4))-(--spacing(2)))] items-center gap-2'>
            {Icon && <Icon className='text-muted-foreground' />}

            <div className='line-clamp-1 overflow-ellipsis whitespace-nowrap text-left w-full'>
              <SelectValue placeholder={placeholder} />
            </div>
          </div>
        </SelectTrigger>

        <SelectContent
          align={align}
          className='max-sm:w-(--radix-select-trigger-width) sm:min-w-(--radix-select-trigger-width)'
        >
          {options.map((option, index) => (
            <SelectItem
              className='text-base! md:text-sm! [&_>_span]:nth-[2]:w-full'
              disabled={disabledValues?.includes(option[valueKey] as Value)}
              // biome-ignore lint/suspicious/noArrayIndexKey: <>
              key={index}
              value={option[valueKey] as string}
            >
              {renderItem ? renderItem(option) : (option[valueKey] as string)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {isInvalid && <FieldError errors={field.state.meta.errors} />}
    </Field>
  )
}
