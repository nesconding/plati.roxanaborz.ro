'use client'

import { format } from 'date-fns'
import { ro } from 'date-fns/locale'
import { CalendarClock, Check, ChevronDown, UserRoundPen } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useState } from 'react'
import { withForm } from '~/client/components/form/config'
import { RequiredMarker } from '~/client/components/form/fields/utils'
import { Badge } from '~/client/components/ui/badge'
import { Button } from '~/client/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList
} from '~/client/components/ui/command'
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet
} from '~/client/components/ui/field'
import {
  Item,
  ItemContent,
  ItemDescription,
  ItemHeader,
  ItemTitle
} from '~/client/components/ui/item'
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '~/client/components/ui/popover'
import { cn } from '~/client/lib/utils'
import { CreateProductPaymentLinkFormStep } from '~/client/modules/(app)/payment-links/create/create-product-payment-link-form/stepper/config'
import type { TRPCRouterOutput } from '~/client/trpc/react'
import { CreateProductPaymentLinkFormDefaultValues as defaultValues } from '~/shared/create-product-payment-link-form/create-product-payment-link-form-schema'
import { CreateProductPaymentLinkFormSection } from '~/shared/create-product-payment-link-form/enums/create-product-payment-link-form-sections'

type ScheduledEvent =
  TRPCRouterOutput['protected']['scheduledEvents']['findAll'][number]

export const ParticipantsFormSection = withForm({
  defaultValues,
  props: {
    scheduledEvents: [] as ScheduledEvent[]
  },
  render: function Render({ form, scheduledEvents }) {
    const [isOpen, setIsOpen] = useState(false)
    const t = useTranslations(
      `modules.(app).payment-links._components.create-product-payment-link-form.steps.${CreateProductPaymentLinkFormStep.BaseInfo}.forms.${CreateProductPaymentLinkFormSection.Participants}`
    )

    return (
      <FieldSet>
        <FieldLegend>{t('legend')}</FieldLegend>
        <FieldDescription>{t('description')}</FieldDescription>

        <FieldGroup>
          <form.AppField
            name={`${CreateProductPaymentLinkFormSection.Participants}.scheduledEventUri`}
          >
            {(field) => {
              const isInvalid =
                field.state.meta.isTouched && !field.state.meta.isValid
              const scheduledEvent = scheduledEvents.find(
                (scheduledEvent) => scheduledEvent.id === field.state.value
              )

              function handleOnSelectMeeting(scheduledEventUri: string) {
                field.handleChange(scheduledEventUri)
                setIsOpen(false)
              }

              return (
                <Field data-invalid={isInvalid}>
                  <FieldLabel className='w-fit! gap-0.5' htmlFor={field.name}>
                    {t('fields.scheduledEventUri.title')}
                    <RequiredMarker />
                  </FieldLabel>

                  <Popover onOpenChange={setIsOpen} open={isOpen}>
                    <PopoverTrigger
                      aria-invalid={isInvalid}
                      asChild
                      className={cn('border-input text-base! md:text-sm!', {
                        '[&_svg]:text-destructive!': isInvalid
                      })}
                      id={field.name}
                    >
                      <Button
                        className='bg-transparent hover:bg-transparent w-full justify-between px-3!'
                        variant='outline'
                      >
                        <div className='flex w-full items-center gap-2'>
                          <CalendarClock className='text-muted-foreground' />
                          {scheduledEvent ? (
                            <div className='flex w-[calc(100%-(--spacing(4))-(--spacing(2))-(--spacing(4))-(--spacing(2)))] items-center justify-between gap-2 text-sm'>
                              <p className='h-[calc(--spacing(4)+(--spacing(1))/2)] font-normal'>
                                {scheduledEvent.participant_names}
                              </p>

                              <p className='text-muted-foreground line-clamp-1 h-[calc(--spacing(4)+(--spacing(1))/2)] font-normal overflow-ellipsis whitespace-nowrap'>
                                <span className='capitalize'>
                                  {format(
                                    Number(scheduledEvent.meeting_start_at) *
                                      1000,
                                    'PPP',
                                    {
                                      locale: ro
                                    }
                                  )}
                                </span>
                                <span>{` la ${format(
                                  Number(scheduledEvent.meeting_start_at) *
                                    1000,
                                  'HH:mm',
                                  {
                                    locale: ro
                                  }
                                )}`}</span>
                              </p>
                            </div>
                          ) : (
                            <p className='text-muted-foreground line-clamp-1 font-normal overflow-ellipsis whitespace-nowrap'>
                              {t('fields.scheduledEventUri.placeholder')}
                            </p>
                          )}
                          <ChevronDown className='text-muted-foreground ml-auto opacity-50' />
                        </div>
                      </Button>
                    </PopoverTrigger>

                    <PopoverContent
                      align='start'
                      className='w-(--radix-popover-trigger-width) p-0'
                    >
                      <Command>
                        <CommandInput
                          autoFocus={true}
                          className='h-9 text-base md:text-sm'
                          placeholder={t(
                            'fields.scheduledEventUri.values.placeholder'
                          )}
                        />
                        <CommandList>
                          <CommandEmpty>
                            {t('fields.scheduledEventUri.values.not-found')}
                          </CommandEmpty>
                          <CommandGroup>
                            {scheduledEvents.map((scheduledEvent) => (
                              <CommandItem
                                asChild
                                key={scheduledEvent.id}
                                onSelect={() =>
                                  handleOnSelectMeeting(scheduledEvent.id)
                                }
                              >
                                <Item className='w-full p-2' size='sm'>
                                  <ItemHeader>
                                    <ItemTitle>{scheduledEvent.name}</ItemTitle>
                                    <Badge
                                      className={cn({
                                        'bg-green-700 text-white dark:bg-green-800':
                                          scheduledEvent.status === 'active'
                                      })}
                                      variant={
                                        scheduledEvent.status === 'canceled'
                                          ? 'destructive'
                                          : 'default'
                                      }
                                    >
                                      {t(
                                        `fields.scheduledEventUri.values.status.${scheduledEvent.status}`
                                      )}
                                    </Badge>
                                  </ItemHeader>

                                  <ItemContent className='gap-0.5'>
                                    <ItemTitle>
                                      {scheduledEvent.participant_names}
                                    </ItemTitle>
                                    <ItemDescription>
                                      {scheduledEvent.participant_emails}
                                    </ItemDescription>
                                  </ItemContent>

                                  <ItemContent className='mt-auto items-end gap-0.5'>
                                    <ItemDescription>
                                      <span className='capitalize'>
                                        {format(
                                          Number(
                                            scheduledEvent.meeting_start_at
                                          ) * 1000,
                                          'PPP',
                                          {
                                            locale: ro
                                          }
                                        )}
                                      </span>
                                      <span>{` la ${format(
                                        Number(
                                          scheduledEvent.meeting_start_at
                                        ) * 1000,
                                        'HH:mm',
                                        {
                                          locale: ro
                                        }
                                      )}`}</span>
                                    </ItemDescription>
                                  </ItemContent>

                                  <Check
                                    className={cn(
                                      'ml-auto',
                                      field.state.value === scheduledEvent.id
                                        ? 'opacity-100'
                                        : 'opacity-0'
                                    )}
                                  />
                                </Item>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>

                  {isInvalid && <FieldError errors={field.state.meta.errors} />}
                </Field>
              )
            }}
          </form.AppField>

          <FieldGroup className='sm:flex-row sm:items-start'>
            <form.AppField
              name={`${CreateProductPaymentLinkFormSection.Participants}.setterName`}
            >
              {(field) => (
                <field.Text
                  addons={[{ icon: UserRoundPen }]}
                  label={t('fields.setterName.title')}
                  placeholder={t('fields.setterName.placeholder')}
                />
              )}
            </form.AppField>

            <form.AppField
              name={`${CreateProductPaymentLinkFormSection.Participants}.callerName`}
            >
              {(field) => (
                <field.Text
                  addons={[{ icon: UserRoundPen }]}
                  label={t('fields.callerName.title')}
                  placeholder={t('fields.callerName.placeholder')}
                />
              )}
            </form.AppField>
          </FieldGroup>
        </FieldGroup>
      </FieldSet>
    )
  }
})
