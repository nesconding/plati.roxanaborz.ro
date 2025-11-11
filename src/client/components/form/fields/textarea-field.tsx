import { useFieldContext } from '~/client/components/form/config'
import { RequiredMarker } from '~/client/components/form/fields/utils'
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel
} from '~/client/components/ui/field'
import {
  InputGroup,
  InputGroupAddon,
  InputGroupText,
  InputGroupTextarea
} from '~/client/components/ui/input-group'
import { cn } from '~/client/lib/utils'

interface TextareaFieldProps {
  label: string
  description?: string
  isDisabled?: boolean
  isLoading?: boolean
  maxLength?: number
  placeholder?: string
  isRequired?: boolean
}

export function TextareaField({
  label,
  description,
  isDisabled: isDisabledProp,
  isLoading,
  maxLength = 500,
  placeholder,
  isRequired = false
}: TextareaFieldProps) {
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

      <InputGroup
        aria-disabled={isDisabled}
        aria-invalid={isInvalid}
        className={cn({
          'cursor-not-allowed': isDisabled,
          'opacity-50': isDisabled
        })}
        data-disabled={isDisabled}
      >
        <InputGroupTextarea
          aria-disabled={isDisabled}
          aria-invalid={isInvalid}
          className='min-h-48'
          data-disabled={isDisabled}
          disabled={isDisabled}
          id={field.name}
          maxLength={maxLength}
          name={field.name}
          onBlur={field.handleBlur}
          onChange={(e) => field.handleChange(e.target.value)}
          placeholder={placeholder}
          value={field.state.value}
        />

        <InputGroupAddon align='block-end'>
          <InputGroupText className='ml-auto'>{`${field.state.value?.length ?? 0}/${maxLength}`}</InputGroupText>
        </InputGroupAddon>
      </InputGroup>

      {isInvalid && <FieldError errors={field.state.meta.errors} />}
    </Field>
  )
}
