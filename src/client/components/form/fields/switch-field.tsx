import { useFieldContext } from '~/client/components/form/config'
import { RequiredMarker } from '~/client/components/form/fields/utils'
import {
  Field,
  FieldContent,
  FieldError,
  FieldLabel
} from '~/client/components/ui/field'
import { Switch } from '~/client/components/ui/switch'
import { cn } from '~/client/lib/utils'

interface SwitchFieldProps {
  className?: string
  isLoading?: boolean
  isDisabled?: boolean
  label: string
  orientation?: 'vertical' | 'horizontal' | 'responsive' | null | undefined
  onCheckedChange?: (checked: boolean) => void
  isRequired?: boolean
}

export function SwitchField({
  className,
  label,
  isLoading,
  isDisabled: isDisabledProp,
  orientation = 'horizontal',
  onCheckedChange,
  isRequired = false
}: SwitchFieldProps) {
  const field = useFieldContext<boolean>()
  const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid
  const isDisabled = isLoading || isDisabledProp

  return (
    <Field
      className={className}
      data-disabled={isDisabled}
      data-invalid={isInvalid}
      orientation={orientation}
    >
      <FieldContent>
        <FieldLabel
          className={cn({ 'gap-0.5': isRequired })}
          htmlFor={field.name}
        >
          {label}
          {isRequired ? <RequiredMarker /> : null}
        </FieldLabel>
      </FieldContent>

      <Switch
        checked={field.state.value}
        disabled={isDisabled}
        id={field.name}
        onCheckedChange={onCheckedChange ?? field.handleChange}
      />

      {isInvalid && <FieldError errors={field.state.meta.errors} />}
    </Field>
  )
}
