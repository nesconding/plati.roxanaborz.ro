'use client'

import { useStore } from '@tanstack/react-form'
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
import { PaymentSettings } from '~/client/modules/(app)/(admin)/settings/payment-settings'
import { CreateExtensionPaymentLinkFormStep } from '~/client/modules/(app)/payment-links/create/create-extension-payment-link-form/stepper/config'
import type { TRPCRouterOutput } from '~/client/trpc/react'
import { PricingService } from '~/lib/pricing'
import { CreateExtensionPaymentLinkFormDefaultValues } from '~/shared/create-extension-payment-link-form/create-extension-payment-link-form-schema'
import { CreateExtensionPaymentLinkFormSection } from '~/shared/create-extension-payment-link-form/enums/create-extension-payment-link-form-sections'
import { MembershipStatusType } from '~/shared/enums/membership-status-type'
import { PaymentCurrencyType } from '~/shared/enums/payment-currency-type'

type Products = TRPCRouterOutput['protected']['products']['findAll']
type Memberships = TRPCRouterOutput['protected']['memberships']['findAll']

export const ExtensionFormSection = withForm({
  defaultValues: CreateExtensionPaymentLinkFormDefaultValues,
  props: {
    memberships: [] as Memberships,
    products: [] as Products
  },
  render: function Render({ form, memberships, products }) {
    const [isOpen, setIsOpen] = useState(false)
    const t = useTranslations(
      `modules.(app).payment-links._components.create-extension-payment-link-form.steps.${CreateExtensionPaymentLinkFormStep.BaseInfo}.forms.${CreateExtensionPaymentLinkFormSection.Extension}`
    )

    return (
      <FieldSet>
        <FieldLegend>{t('legend')}</FieldLegend>
        <FieldDescription>{t('description')}</FieldDescription>

        <FieldGroup>
          <form.AppField
            name={`${CreateExtensionPaymentLinkFormSection.Extension}.membershipId`}
          >
            {(field) => {
              const isInvalid =
                field.state.meta.isTouched && !field.state.meta.isValid
              const membership = memberships.find(
                (membership) => membership.id === field.state.value
              )

              function handleOnSelectMembership(membershipId: string) {
                field.handleChange(membershipId)
                setIsOpen(false)
              }

              return (
                <Field data-invalid={isInvalid}>
                  <FieldLabel className='w-fit! gap-0.5' htmlFor={field.name}>
                    {t('fields.membershipId.title')}
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
                          {membership ? (
                            <div className='flex w-[calc(100%-(--spacing(4))-(--spacing(2))-(--spacing(4))-(--spacing(2)))] items-center justify-between gap-2 text-sm'>
                              <p className='h-[calc(--spacing(4)+(--spacing(1))/2)] font-normal'>
                                {
                                  membership.parentOrder.productPaymentLink
                                    .customerName
                                }
                              </p>

                              <p className='text-muted-foreground line-clamp-1 h-[calc(--spacing(4)+(--spacing(1))/2)] font-normal overflow-ellipsis whitespace-nowrap'>
                                {
                                  membership.parentOrder.productPaymentLink
                                    .product.name
                                }
                              </p>
                            </div>
                          ) : (
                            <p className='text-muted-foreground line-clamp-1 font-normal overflow-ellipsis whitespace-nowrap'>
                              {t('fields.membershipId.placeholder')}
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
                            'fields.membershipId.values.placeholder'
                          )}
                        />
                        <CommandList>
                          <CommandEmpty>
                            {t('fields.membershipId.values.not-found')}
                          </CommandEmpty>
                          <CommandGroup>
                            {memberships.map((membership) => (
                              <CommandItem
                                asChild
                                key={membership.id}
                                onSelect={() =>
                                  handleOnSelectMembership(membership.id)
                                }
                              >
                                <Item className='w-full p-2' size='sm'>
                                  <ItemHeader>
                                    <p>
                                      {`${
                                        membership.parentOrder
                                          .productPaymentLink.product.name
                                      } - ${membership.id}`}
                                    </p>
                                    <Badge
                                      className={cn({
                                        'bg-green-700 text-white dark:bg-green-800':
                                          membership.status === 'active'
                                      })}
                                      variant={
                                        membership.status ===
                                        MembershipStatusType.Cancelled
                                          ? 'destructive'
                                          : 'default'
                                      }
                                    >
                                      {t(
                                        `fields.membershipId.values.status.${membership.status}`
                                      )}
                                    </Badge>
                                  </ItemHeader>

                                  <ItemContent className='gap-0.5'>
                                    <ItemTitle>
                                      {
                                        membership.parentOrder
                                          .productPaymentLink.customerName
                                      }
                                    </ItemTitle>
                                    <ItemDescription>
                                      {
                                        membership.parentOrder
                                          .productPaymentLink.customerEmail
                                      }
                                    </ItemDescription>
                                  </ItemContent>

                                  <ItemContent className='mt-auto '>
                                    <ItemDescription>
                                      <span className='flex items-center justify-end gap-0.5'>
                                        <span className='capitalize'>
                                          {format(membership.startDate, 'PPP', {
                                            locale: ro
                                          })}
                                        </span>
                                        <ArrowRight className='stroke-[1.5]' />
                                        <span className='capitalize'>
                                          {format(membership.endDate, 'PPP', {
                                            locale: ro
                                          })}
                                        </span>
                                      </span>
                                    </ItemDescription>
                                  </ItemContent>

                                  <Check
                                    className={cn(
                                      'ml-auto',
                                      field.state.value === membership.id
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

          <form.Subscribe
            selector={({ values }) => {
              const membershipId =
                values[CreateExtensionPaymentLinkFormSection.Extension]
                  .membershipId

              const membership = memberships.find(
                (membership) => membership.id === membershipId
              )

              const product = products.find(
                (product) =>
                  product.id ===
                  membership?.parentOrder.productPaymentLink.productId
              )

              return product
            }}
          >
            {(product) => (
              <form.AppField
                name={`${CreateExtensionPaymentLinkFormSection.Extension}.extensionId`}
              >
                {(field) => (
                  <field.Select
                    // icon={NotepadTextDashed}
                    isDisabled={!product}
                    isRequired
                    label={t('fields.extensionId.title')}
                    options={product?.extensions ?? []}
                    placeholder={t('fields.extensionId.placeholder')}
                    renderItem={({ extensionMonths, price }) => (
                      <div className='flex justify-between gap-2 w-full items-center'>
                        <p className='font-medium'>
                          {t('fields.extensionId.item.extensionMonths', {
                            extensionMonths
                          })}
                        </p>

                        <p className='text-muted-foreground  group-data-[slot=select-trigger]/select-trigger:hidden'>
                          {t.rich('fields.extensionId.item.formattedPrice', {
                            formattedPrice: PricingService.formatPrice(
                              price,
                              PaymentCurrencyType.EUR
                            )
                          })}
                        </p>
                      </div>
                    )}
                    valueKey='id'
                  />
                )}
              </form.AppField>
            )}
          </form.Subscribe>
          {/* <form.AppField
            name={`${CreateExtensionPaymentLinkFormSection.Extension}.membershipId`}
          >
            {(field) => {
              const isInvalid =
                field.state.meta.isTouched && !field.state.meta.isValid
              const membership = memberships.find(
                (membership) => membership.id === field.state.value
              )

              function handleOnSelectMembership(membershipId: string) {
                field.handleChange(membershipId)
                setIsOpen(false)
              }

              return (
                <Field data-invalid={isInvalid}>
                  <FieldLabel className='w-fit! gap-0.5' htmlFor={field.name}>
                    {t('fields.membershipId.title')}
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
                          {membership ? (
                            <div className='flex w-[calc(100%-(--spacing(4))-(--spacing(2))-(--spacing(4))-(--spacing(2)))] items-center justify-between gap-2 text-sm'>
                              <p className='h-[calc(--spacing(4)+(--spacing(1))/2)] font-normal'>
                                {
                                  membership.parentOrder.productPaymentLink
                                    .customerName
                                }
                              </p>

                              <p className='text-muted-foreground line-clamp-1 h-[calc(--spacing(4)+(--spacing(1))/2)] font-normal overflow-ellipsis whitespace-nowrap'>
                                {
                                  membership.parentOrder.productPaymentLink
                                    .product.name
                                }
                              </p>
                            </div>
                          ) : (
                            <p className='text-muted-foreground line-clamp-1 font-normal overflow-ellipsis whitespace-nowrap'>
                              {t('fields.membershipId.placeholder')}
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
                            'fields.membershipId.values.placeholder'
                          )}
                        />
                        <CommandList>
                          <CommandEmpty>
                            {t('fields.membershipId.values.not-found')}
                          </CommandEmpty>
                          <CommandGroup>
                            {memberships.map((membership) => (
                              <CommandItem
                                asChild
                                key={membership.id}
                                onSelect={() =>
                                  handleOnSelectMembership(membership.id)
                                }
                              >
                                <Item className='w-full p-2' size='sm'>
                                  <ItemHeader>
                                    <ItemTitle>
                                      {
                                        membership.parentOrder
                                          .productPaymentLink.product.name
                                      }
                                    </ItemTitle>
                                    <Badge
                                      className={cn({
                                        'bg-green-700 text-white dark:bg-green-800':
                                          membership.status === 'active'
                                      })}
                                      variant={
                                        membership.status ===
                                        MembershipStatusType.Cancelled
                                          ? 'destructive'
                                          : 'default'
                                      }
                                    >
                                      {t(
                                        `fields.membershipId.values.status.${membership.status}`
                                      )}
                                    </Badge>
                                  </ItemHeader>

                                  <ItemContent className='gap-0.5'>
                                    <ItemTitle>
                                      {
                                        membership.parentOrder
                                          .productPaymentLink.customerName
                                      }
                                    </ItemTitle>
                                    <ItemDescription>
                                      {
                                        membership.parentOrder
                                          .productPaymentLink.customerEmail
                                      }
                                    </ItemDescription>
                                  </ItemContent>

                                  <ItemContent className='mt-auto '>
                                    <ItemDescription>
                                      <div className='flex items-center justify-end gap-0.5'>
                                        <span className='capitalize'>
                                          {format(membership.startDate, 'PPP', {
                                            locale: ro
                                          })}
                                        </span>
                                        <ArrowRight className='stroke-[1.5]' />
                                        <span className='capitalize'>
                                          {format(membership.endDate, 'PPP', {
                                            locale: ro
                                          })}
                                        </span>
                                      </div>
                                    </ItemDescription>
                                  </ItemContent>

                                  <Check
                                    className={cn(
                                      'ml-auto',
                                      field.state.value === membership.id
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
          </form.AppField> */}
        </FieldGroup>
      </FieldSet>
    )
  }
})
