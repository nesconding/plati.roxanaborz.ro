'use client'

import { useField } from '@tanstack/react-form'
import { useVirtualizer, type Virtualizer } from '@tanstack/react-virtual'
import { defaultFilter } from 'cmdk'
import { format } from 'date-fns'
import { ro } from 'date-fns/locale'
import {
  ArrowRight,
  CalendarClock,
  Check,
  ChevronDown,
  UserRoundPen
} from 'lucide-react'
import { useTranslations } from 'next-intl'
import type React from 'react'
import {
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react'
import { useDebouncedCallback } from 'use-debounce'
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

const ScheduledEventSelector = withForm({
  defaultValues,
  props: {
    allFilteredEvents: [] as ScheduledEvent[],
    deferredSearchValue: '',
    isLoading: false,
    isOpen: false,
    parentRef: { current: null } as React.RefObject<HTMLDivElement | null>,
    scheduledEvents: [] as ScheduledEvent[],
    searchValue: '',
    setIsOpen: (() => {}) as (open: boolean) => void,
    setSearchValue: (() => {}) as (value: string) => void
  },
  render: function Render({
    form,
    allFilteredEvents,
    deferredSearchValue,
    isLoading,
    isOpen,
    parentRef,
    scheduledEvents,
    searchValue,
    setIsOpen,
    setSearchValue
  }) {
    const t = useTranslations(
      `modules.(app).payment-links._components.create-product-payment-link-form.steps.${CreateProductPaymentLinkFormStep.BaseInfo}.forms.${CreateProductPaymentLinkFormSection.Participants}`
    )

    // Pre-cache status translations to avoid t() calls in render loops
    const statusTranslations = useMemo(
      () => ({
        active: t('fields.scheduledEventId.values.status.active'),
        canceled: t('fields.scheduledEventId.values.status.canceled')
      }),
      [t]
    )

    const field = useField({
      form,
      name: `${CreateProductPaymentLinkFormSection.Participants}.scheduledEventId`
    })

    // Create a Map for O(1) event lookup instead of O(n) find
    const eventsMap = useMemo(() => {
      return new Map(scheduledEvents.map((event) => [event.id, event]))
    }, [scheduledEvents])

    // Memoize formatted dates to avoid expensive format() calls on every render
    const formattedDatesMap = useMemo(() => {
      return new Map(
        scheduledEvents.map((event) => [
          event.id,
          {
            endDate: format(event.endTime, 'PPP', { locale: ro }),
            endDateTime: format(event.endTime, 'PPP HH:mm', { locale: ro }),
            endTime: format(event.endTime, 'HH:mm', { locale: ro }),
            startDate: format(event.startTime, 'PPP', { locale: ro }),
            startDateTime: format(event.startTime, 'PPP HH:mm', { locale: ro }),
            startTime: format(event.startTime, 'HH:mm', { locale: ro })
          }
        ])
      )
    }, [scheduledEvents])

    const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid
    const scheduledEvent = field.state.value
      ? eventsMap.get(field.state.value)
      : undefined

    // Determine which events to display based on search and selection
    const filteredEvents = useMemo(() => {
      // If search is active (3+ chars), show filtered results
      if (deferredSearchValue && deferredSearchValue.length >= 3) {
        // If we have filtered results, show them
        if (allFilteredEvents.length > 0) {
          return allFilteredEvents
        }
        // If no filtered results BUT an item is selected, show all events (fallback)
        if (field.state.value) {
          return scheduledEvents
        }
        // Otherwise return empty (will show "not found")
        return []
      }

      // If an item is selected, show all events (allow changing selection)
      if (field.state.value) {
        return scheduledEvents
      }

      // Otherwise, show nothing (will display "type to search")
      return []
    }, [
      allFilteredEvents,
      deferredSearchValue,
      field.state.value,
      scheduledEvents
    ])

    // Setup virtualizer based on computed filteredEvents
    const virtualizer = useVirtualizer({
      count: filteredEvents.length,
      estimateSize: () => 190,
      getScrollElement: () => parentRef.current,
      overscan: 5
    })

    const handleOnSelectMeeting = useCallback(
      (scheduledEventId: string) => {
        field.handleChange(scheduledEventId)
        setIsOpen(false)
      },
      [field, setIsOpen]
    )

    // Combined effect: measure virtualizer and scroll to selected item when popover opens
    useEffect(() => {
      if (isOpen && filteredEvents.length > 0) {
        // Use setTimeout to ensure DOM is ready
        setTimeout(() => {
          // First measure the virtualizer
          virtualizer.measure()

          // Then scroll to selected item if one exists
          if (field.state.value) {
            const index = filteredEvents.findIndex(
              (event) => event.id === field.state.value
            )
            if (index !== -1) {
              virtualizer.scrollToIndex(index, { align: 'center' })
            }
          }
        }, 0)
      }
    }, [isOpen, field.state.value, filteredEvents, virtualizer])

    return (
      <Field data-invalid={isInvalid}>
        <FieldLabel className='w-fit! gap-0.5' htmlFor={field.name}>
          {t('fields.scheduledEventId.title')}
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
                      {scheduledEvent.inviteeName}
                    </p>

                    <p className='text-muted-foreground line-clamp-1 h-[calc(--spacing(4)+(--spacing(1))/2)] font-normal overflow-ellipsis whitespace-nowrap'>
                      <span className='capitalize'>
                        {formattedDatesMap.get(scheduledEvent.id)?.startDate}
                      </span>
                      <span>{` la ${formattedDatesMap.get(scheduledEvent.id)?.startTime}`}</span>
                    </p>
                  </div>
                ) : (
                  <p className='text-muted-foreground line-clamp-1 font-normal overflow-ellipsis whitespace-nowrap'>
                    {t('fields.scheduledEventId.placeholder')}
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
            <Command shouldFilter={false}>
              <CommandInput
                autoFocus={true}
                className='h-9 text-base md:text-sm'
                onValueChange={(value: string) => {
                  setSearchValue(value)
                }}
                placeholder={t('fields.scheduledEventId.values.placeholder')}
                value={searchValue}
              />
              <CommandList ref={parentRef}>
                {isLoading ? (
                  <CommandGroup>
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div
                        className='w-full py-2 px-8 h-[90px] flex flex-col gap-2'
                        // biome-ignore lint/suspicious/noArrayIndexKey: <>
                        key={`skeleton-${i}`}
                      >
                        <div className='flex items-center justify-between'>
                          <div className='h-4 bg-muted rounded w-32 animate-pulse' />
                          <div className='h-5 bg-muted rounded w-16 animate-pulse' />
                        </div>
                        <div className='flex flex-col gap-1'>
                          <div className='h-4 bg-muted rounded w-40 animate-pulse' />
                          <div className='h-3 bg-muted rounded w-48 animate-pulse' />
                        </div>
                        <div className='mt-auto'>
                          <div className='h-3 bg-muted rounded w-36 animate-pulse' />
                        </div>
                      </div>
                    ))}
                  </CommandGroup>
                ) : (
                  <>
                    {filteredEvents.length === 0 && (
                      <CommandEmpty>
                        {searchValue.length > 2
                          ? t('fields.scheduledEventId.values.not-found')
                          : t('fields.scheduledEventId.values.type-to-search')}
                      </CommandEmpty>
                    )}

                    {filteredEvents.length > 0 && (
                      <CommandGroup
                        style={{
                          height: `${virtualizer.getTotalSize()}px`,
                          position: 'relative',
                          width: '100%'
                        }}
                      >
                        {virtualizer.getVirtualItems().map((virtualItem) => {
                          const scheduledEvent =
                            filteredEvents[virtualItem.index]
                          return (
                            <CommandItem
                              asChild
                              data-index={virtualItem.index}
                              key={scheduledEvent.id}
                              onSelect={() =>
                                handleOnSelectMeeting(scheduledEvent.id)
                              }
                              ref={virtualizer.measureElement}
                              style={{
                                left: 0,
                                position: 'absolute',
                                top: 0,
                                transform: `translateY(${virtualItem.start}px)`,
                                width: '100%'
                              }}
                            >
                              <div className='flex items-center gap-2 w-full px-3'>
                                <Check
                                  className={cn('text-muted-foreground', {
                                    'opacity-0':
                                      scheduledEvent.id !== field.state.value
                                  })}
                                />

                                <div className='flex flex-col items-start gap-2 w-full'>
                                  <div className='flex items-center justify-between gap-1 flex-wrap w-full'>
                                    <p className='font-medium'>
                                      {scheduledEvent.name}
                                    </p>

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
                                      {
                                        statusTranslations[
                                          scheduledEvent.status
                                        ]
                                      }
                                    </Badge>
                                  </div>

                                  <div className='flex items-start capitalize gap-0.5 text-muted-foreground w-full'>
                                    <p className='w-fit'>
                                      {
                                        formattedDatesMap.get(scheduledEvent.id)
                                          ?.startDateTime
                                      }
                                    </p>
                                    <div className='flex items-center justify-center size-5'>
                                      <ArrowRight className='stroke-[1.5]' />
                                    </div>
                                    <p className='w-fit'>
                                      {
                                        formattedDatesMap.get(scheduledEvent.id)
                                          ?.endDateTime
                                      }
                                    </p>
                                  </div>

                                  <div>
                                    <p>Client:</p>
                                    <p className='font-medium'>
                                      {scheduledEvent.inviteeName}
                                    </p>
                                    <p className='text-muted-foreground'>
                                      {scheduledEvent.inviteeEmail}
                                    </p>
                                  </div>

                                  <div>
                                    <p>Closer:</p>
                                    <p className='font-medium'>
                                      {scheduledEvent.closerName}
                                    </p>
                                    <p className='text-muted-foreground'>
                                      {scheduledEvent.closerEmail}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </CommandItem>
                          )
                        })}
                      </CommandGroup>
                    )}
                  </>
                )}
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>

        {isInvalid && <FieldError errors={field.state.meta.errors} />}
      </Field>
    )
  }
})

export const ParticipantsFormSection = withForm({
  defaultValues,
  props: {
    scheduledEvents: [] as ScheduledEvent[]
  },
  render: function Render({ form, scheduledEvents }) {
    const [isOpen, setIsOpen] = useState(false)
    const [searchInput, setSearchInput] = useState('') // For immediate UI feedback
    const [searchValue, setSearchValue] = useState('') // For actual filtering
    const parentRef = useRef<HTMLDivElement>(null)
    const t = useTranslations(
      `modules.(app).payment-links._components.create-product-payment-link-form.steps.${CreateProductPaymentLinkFormStep.BaseInfo}.forms.${CreateProductPaymentLinkFormSection.Participants}`
    )

    // Debounce the search value updates (300ms delay)
    const debouncedSetSearchValue = useDebouncedCallback(setSearchValue, 300)

    // Defer the filtering operation to keep input responsive
    const deferredSearchValue = useDeferredValue(searchValue)

    // Memoize searchable text per event (only recalculates when events change)
    const eventsWithSearchableText = useMemo(() => {
      return scheduledEvents.map((event) => ({
        event,
        searchableText: [
          event.name,
          event.inviteeName,
          event.closerName,
          event.inviteeEmail,
          event.closerEmail,
          event.status
        ]
          .join(' ')
          .toLowerCase() // Pre-lowercase for faster matching
      }))
    }, [scheduledEvents])

    // Filter and sort using deferred search value (only search filtering, not selection logic)
    const allFilteredEvents = useMemo(() => {
      // If search is active (3+ chars), return filtered results
      if (deferredSearchValue && deferredSearchValue.length >= 3) {
        // Pre-lowercase search term once instead of for every event
        const searchLower = deferredSearchValue.toLowerCase()

        return eventsWithSearchableText
          .map(({ event, searchableText }) => ({
            event,
            score: defaultFilter(searchableText, searchLower)
          }))
          .sort((a, b) => b.score - a.score) // Sort by score descending (best matches first)
          .slice(0, 100) // Limit to top 100 results
          .map(({ event }) => event)
      }

      // No search, return empty (selection logic handled in ScheduledEventSelector)
      return []
    }, [eventsWithSearchableText, deferredSearchValue])

    const isLoading =
      !scheduledEvents ||
      scheduledEvents.length === 0 ||
      debouncedSetSearchValue.isPending() ||
      searchValue !== deferredSearchValue // Prevent flash when deferred value lags behind

    // Stable callback for search value changes
    const handleSearchValueChange = useCallback(
      (value: string) => {
        setSearchInput(value) // Update input immediately for responsive typing
        debouncedSetSearchValue(value) // Debounce the expensive filtering
      },
      [debouncedSetSearchValue]
    )

    return (
      <FieldSet>
        <FieldLegend>{t('legend')}</FieldLegend>
        <FieldDescription>{t('description')}</FieldDescription>

        <FieldGroup>
          <ScheduledEventSelector
            allFilteredEvents={allFilteredEvents}
            deferredSearchValue={deferredSearchValue}
            form={form}
            isLoading={isLoading}
            isOpen={isOpen}
            parentRef={parentRef}
            scheduledEvents={scheduledEvents}
            searchValue={searchInput} // Use immediate value for input display
            setIsOpen={setIsOpen}
            setSearchValue={handleSearchValueChange}
          />

          <FieldGroup className='sm:flex-row sm:items-start'>
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

            <form.AppField
              name={`${CreateProductPaymentLinkFormSection.Participants}.callerEmail`}
            >
              {(field) => (
                <field.Text
                  addons={[{ icon: UserRoundPen }]}
                  label={t('fields.callerEmail.title')}
                  placeholder={t('fields.callerEmail.placeholder')}
                />
              )}
            </form.AppField>
          </FieldGroup>

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
              name={`${CreateProductPaymentLinkFormSection.Participants}.setterEmail`}
            >
              {(field) => (
                <field.Text
                  addons={[{ icon: UserRoundPen }]}
                  label={t('fields.setterEmail.title')}
                  placeholder={t('fields.setterEmail.placeholder')}
                />
              )}
            </form.AppField>
          </FieldGroup>
        </FieldGroup>
      </FieldSet>
    )
  }
})
