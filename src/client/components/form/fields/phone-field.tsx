import { useFieldContext } from '~/client/components/form/config'
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel
} from '~/client/components/ui/field'
import { PhoneInput } from '~/client/components/ui/phone-input'
import { cn } from '~/client/lib/utils'

interface PhoneFieldProps {
  label: string
  description?: string
  isLoading?: boolean
  isDisabled?: boolean
  placeholder?: string
  isRequired?: boolean
}

export function PhoneField({
  label,
  description,
  isLoading,
  isDisabled: isDisabledProp,
  placeholder,
  isRequired = false
}: PhoneFieldProps) {
  const field = useFieldContext<string>()
  const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid
  const isDisabled = isLoading || isDisabledProp

  return (
    <Field
      aria-disabled={isDisabled}
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

      <PhoneInput
        aria-disabled={isDisabled}
        aria-invalid={isInvalid}
        autoComplete='tel'
        className={cn({
          'cursor-not-allowed': isDisabled,
          'overflow-ellipsis': !isDisabled
        })}
        data-disabled={isDisabled}
        defaultCountry='RO'
        disabled={isDisabled}
        id={field.name}
        name={field.name}
        onBlur={field.handleBlur}
        onChange={field.handleChange}
        placeholder={placeholder}
        value={field.state.value}
      />

      {isInvalid && <FieldError errors={field.state.meta.errors} />}
    </Field>
  )
}
