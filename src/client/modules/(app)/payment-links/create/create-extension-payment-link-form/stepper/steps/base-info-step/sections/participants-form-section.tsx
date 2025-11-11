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

type Meeting = TRPCRouterOutput['protected']['meetings']['findAll'][number]

export const ParticipantsFormSection = withForm({
  defaultValues,
  props: {
    meetings: [] as Meeting[]
  },
  render: function Render({ form, meetings }) {
    const [isOpen, setIsOpen] = useState(false)
    const t = useTranslations(
      `modules.(app).payment-links._components.create-payment-link-form.steps.${CreateProductPaymentLinkFormStep.BaseInfo}.forms.${CreateProductPaymentLinkFormSection.Participants}`
    )

    return (
      <FieldSet>
        <FieldLegend>{t('legend')}</FieldLegend>
        <FieldDescription>{t('description')}</FieldDescription>

        <FieldGroup>
          <form.AppField
            name={`${CreateProductPaymentLinkFormSection.Participants}.meetingId`}
          >
            {(field) => {
              const isInvalid =
                field.state.meta.isTouched && !field.state.meta.isValid
              const meeting = meetings.find(
                (meeting) => meeting.id === field.state.value
              )

              function handleOnSelectMeeting(meetingId: string) {
                field.handleChange(meetingId)
                setIsOpen(false)
              }

              return (
                <Field data-invalid={isInvalid}>
                  <FieldLabel className='w-fit! gap-0.5' htmlFor={field.name}>
                    {t('fields.meetingId.title')}
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
                          {meeting ? (
                            <div className='flex w-[calc(100%-(--spacing(4))-(--spacing(2))-(--spacing(4))-(--spacing(2)))] items-center justify-between gap-2 text-sm'>
                              <p className='h-[calc(--spacing(4)+(--spacing(1))/2)] font-normal'>
                                {meeting.participant_names}
                              </p>

                              <p className='text-muted-foreground line-clamp-1 h-[calc(--spacing(4)+(--spacing(1))/2)] font-normal overflow-ellipsis whitespace-nowrap'>
                                <span className='capitalize'>
                                  {format(
                                    Number(meeting.meeting_start_at) * 1000,
                                    'PPP',
                                    {
                                      locale: ro
                                    }
                                  )}
                                </span>
                                <span>{` la ${format(
                                  Number(meeting.meeting_start_at) * 1000,
                                  'HH:mm',
                                  {
                                    locale: ro
                                  }
                                )}`}</span>
                              </p>
                            </div>
                          ) : (
                            <p className='text-muted-foreground line-clamp-1 font-normal overflow-ellipsis whitespace-nowrap'>
                              {t('fields.meetingId.placeholder')}
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
                          placeholder={t('fields.meetingId.values.placeholder')}
                        />
                        <CommandList>
                          <CommandEmpty>
                            {t('fields.meetingId.values.not-found')}
                          </CommandEmpty>
                          <CommandGroup>
                            {meetings.map((meeting) => (
                              <CommandItem
                                asChild
                                key={meeting.id}
                                onSelect={() =>
                                  handleOnSelectMeeting(meeting.id)
                                }
                              >
                                <Item className='w-full p-2' size='sm'>
                                  <ItemHeader>
                                    <ItemTitle>{meeting.name}</ItemTitle>
                                    <Badge
                                      className={cn({
                                        'bg-green-700 text-white dark:bg-green-800':
                                          meeting.status === 'active'
                                      })}
                                      variant={
                                        meeting.status === 'canceled'
                                          ? 'destructive'
                                          : 'default'
                                      }
                                    >
                                      {t(
                                        `fields.meetingId.values.status.${meeting.status}`
                                      )}
                                    </Badge>
                                  </ItemHeader>

                                  <ItemContent className='gap-0.5'>
                                    <ItemTitle>
                                      {meeting.participant_names}
                                    </ItemTitle>
                                    <ItemDescription>
                                      {meeting.participant_emails}
                                    </ItemDescription>
                                  </ItemContent>

                                  <ItemContent className='mt-auto items-end gap-0.5'>
                                    <ItemDescription>
                                      <span className='capitalize'>
                                        {format(
                                          Number(meeting.meeting_start_at) *
                                            1000,
                                          'PPP',
                                          {
                                            locale: ro
                                          }
                                        )}
                                      </span>
                                      <span>{` la ${format(
                                        Number(meeting.meeting_start_at) * 1000,
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
                                      field.state.value === meeting.id
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
