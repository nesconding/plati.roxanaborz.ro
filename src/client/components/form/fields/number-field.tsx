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
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText
} from '~/client/components/ui/input-group'
import { cn } from '~/client/lib/utils'

interface Addon {
  className?: string
  align?:
    | 'inline-start'
    | 'inline-end'
    | 'block-start'
    | 'block-end'
    | null
    | undefined
}

interface IconAddon extends Addon {
  icon: React.ForwardRefExoticComponent<
    Omit<LucideProps, 'ref'> & React.RefAttributes<SVGSVGElement>
  >
}

interface TextAddon extends Addon {
  text: string
}

function isIconAddon(addon: IconAddon | TextAddon): addon is IconAddon {
  return 'icon' in addon
}

interface NumberFieldProps {
  className?: string
  label?: string | React.ReactNode
  addons?: (IconAddon | TextAddon)[]
  autoComplete?: React.HTMLInputAutoCompleteAttribute | undefined
  description?: string | React.ReactNode
  isLoading?: boolean
  isDisabled?: boolean
  placeholder?: string
  min?: number
  max?: number
  step?: number
  withoutError?: boolean
  isRequired?: boolean
}

export function NumberField({
  className,
  label,
  addons,
  autoComplete,
  description,
  isLoading,
  isDisabled: isDisabledProp,
  placeholder,
  min,
  max,
  step,
  withoutError,
  isRequired = false
}: NumberFieldProps) {
  const field = useFieldContext<string>()
  const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid
  const isDisabled = isLoading || isDisabledProp

  return (
    <Field
      aria-disabled={isDisabled}
      className={className}
      data-disabled={isDisabled}
      data-invalid={isInvalid}
    >
      {label && (
        <FieldLabel
          className={cn({ 'gap-0.5': isRequired })}
          htmlFor={field.name}
        >
          {label}
          {isRequired ? <RequiredMarker /> : null}
        </FieldLabel>
      )}
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
        <InputGroupInput
          aria-disabled={isDisabled}
          aria-invalid={isInvalid}
          autoComplete={autoComplete}
          className='overflow-ellipsis'
          data-disabled={isDisabled}
          disabled={isDisabled}
          id={field.name}
          max={max}
          min={min}
          name={field.name}
          onBlur={field.handleBlur}
          onChange={(e) => field.handleChange(e.target.value)}
          placeholder={placeholder}
          step={step}
          type='number'
          value={field.state.value}
        />

        {addons?.map((addon, index) =>
          isIconAddon(addon) ? (
            <InputGroupAddon
              align={addon.align}
              key={`${addon.icon.name}-${index}`}
            >
              <addon.icon
                className={cn(
                  'group-has-aria-invalid/input-group:text-destructive',
                  addon.className
                )}
              />
            </InputGroupAddon>
          ) : (
            <InputGroupAddon align={addon.align} key={`${addon.text}-${index}`}>
              <InputGroupText
                className={cn(
                  'group-has-aria-invalid/input-group:text-destructive',
                  addon.className
                )}
              >
                {addon.text}
              </InputGroupText>
            </InputGroupAddon>
          )
        )}
      </InputGroup>

      {isInvalid && !withoutError && (
        <FieldError errors={field.state.meta.errors} />
      )}
    </Field>
  )
}
