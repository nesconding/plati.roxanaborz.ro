'use client'

import { format, set } from 'date-fns'
import { ro } from 'date-fns/locale'
import { CalendarPlus, ChevronDown, Clock } from 'lucide-react'
import { useState } from 'react'

import { useFieldContext } from '~/client/components/form/config'
import { RequiredMarker } from '~/client/components/form/fields/utils'
import { Button } from '~/client/components/ui/button'
import { Calendar } from '~/client/components/ui/calendar'
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldSeparator
} from '~/client/components/ui/field'
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput
} from '~/client/components/ui/input-group'
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '~/client/components/ui/popover'
import { cn } from '~/client/lib/utils'

interface DateFieldProps {
  label: string
  description?: string
  isLoading?: boolean
  isDisabled?: boolean
  placeholder?: string
  isRequired?: boolean
}

function parseTime(time: string) {
  const [hours, minutes] = time.split(':').map(Number)
  return { hours, minutes }
}

export function DateField({
  label,
  description,
  isLoading,
  isDisabled: isDisabledProp,
  placeholder,
  isRequired = false
}: DateFieldProps) {
  const [time, setTime] = useState<string>('00:00')
  const [open, setOpen] = useState(false)
  const field = useFieldContext<string | undefined>()
  const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid
  const isDisabled = isLoading || isDisabledProp

  const now = new Date(Date.now())

  function handleOnSelect(date: Date | undefined) {
    if (date) {
      field.handleChange(set(date, parseTime(time)).toISOString())
      return
    }

    field.handleChange(undefined)
  }

  const handleOnTimeChange: React.ChangeEventHandler<HTMLInputElement> = (
    e
  ) => {
    if (!field.state.value) return

    const time = e.target.value
    setTime(time)

    field.handleChange(
      set(new Date(field.state.value), parseTime(time)).toISOString()
    )
  }

  const isTimeDisabled = !field.state.value || isDisabled

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

      <Popover onOpenChange={setOpen} open={open}>
        <PopoverTrigger asChild>
          <Button
            aria-disabled={isDisabled}
            aria-invalid={isInvalid}
            className={cn({ 'cursor-not-allowed': isDisabled })}
            data-disabled={isDisabled}
            disabled={isDisabled}
            id={field.name}
            variant='outline'
          >
            <CalendarPlus />
            {field.state.value
              ? format(field.state.value, 'PPPp', { locale: ro })
              : placeholder}
            <ChevronDown className='ml-auto' />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          align='start'
          className='min-w-(--radix-popover-trigger-width)'
        >
          <FieldGroup>
            <Field>
              <Calendar
                aria-disabled={isDisabled}
                aria-invalid={isInvalid}
                captionLayout='label'
                className='w-full capitalize'
                data-disabled={isDisabled}
                disabled={isDisabled || { before: now }}
                locale={ro}
                mode='single'
                onSelect={handleOnSelect}
                selected={
                  field.state.value ? new Date(field.state.value) : undefined
                }
                startMonth={now}
              />
            </Field>

            <FieldSeparator />

            <Field>
              <InputGroup
                aria-disabled={isTimeDisabled}
                aria-invalid={isInvalid}
                className={cn({ 'opacity-50': isTimeDisabled })}
                data-disabled={isTimeDisabled}
              >
                <InputGroupInput
                  aria-disabled={isTimeDisabled}
                  aria-invalid={isInvalid}
                  className='[&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none'
                  data-disabled={isTimeDisabled}
                  disabled={isTimeDisabled}
                  id={field.name}
                  name={field.name}
                  onChange={handleOnTimeChange}
                  step='60'
                  type='time'
                  value={time}
                />

                <InputGroupAddon align='inline-start'>
                  <Clock className='group-has-aria-invalid/input-group:text-destructive' />
                </InputGroupAddon>
              </InputGroup>
            </Field>
          </FieldGroup>
        </PopoverContent>
      </Popover>

      {isInvalid && <FieldError errors={field.state.meta.errors} />}
    </Field>
  )
}
