'use client'

import { useStore } from '@tanstack/react-form'
import { useQuery } from '@tanstack/react-query'
import { useTranslations } from 'next-intl'

import { withForm } from '~/client/components/form/config'
import { Field, FieldGroup, FieldSet } from '~/client/components/ui/field'
import {
  type AddressFormValues,
  BillingType,
  CheckoutFormSection,
  CheckoutFormDefaultValues as defaultValues
} from '~/client/modules/checkout/checkout-form/schema'
import { CheckoutFormStep } from '~/client/modules/checkout/checkout-form/stepper/config'
import { useTRPC } from '~/client/trpc/react'
import { PricingService } from '~/lib/pricing'

function formatAddress(address: AddressFormValues | undefined): string {
  if (!address) return '-'

  const parts: string[] = []

  if (address.street) parts.push(`Str. ${address.street}`)
  if (address.streetNumber) parts.push(`Nr. ${address.streetNumber}`)
  if (address.building) parts.push(`Bl. ${address.building}`)
  if (address.entrance) parts.push(`Sc. ${address.entrance}`)
  if (address.floor) parts.push(`Et. ${address.floor}`)
  if (address.apartment) parts.push(`Ap. ${address.apartment}`)
  if (address.postalCode) parts.push(`${address.postalCode}`)
  if (address.city) parts.push(address.city)
  if (address.county) parts.push(address.county)
  if (address.country) parts.push(address.country)

  return parts.length > 0 ? parts.join(', ') : '-'
}

interface DetailRowProps {
  label: string
  value: string | undefined | null
}

function DetailRow({ label, value }: DetailRowProps) {
  return (
    <div className='flex items-start justify-between gap-4 py-2'>
      <span className='text-muted-foreground text-sm'>{label}</span>
      <span className='text-right text-sm font-medium'>{value || '-'}</span>
    </div>
  )
}

export const VerifyDetailsSection = withForm({
  defaultValues,
  props: {
    paymentLinkId: ''
  },
  render: function Render(props) {
    const trpc = useTRPC()
    const findOnePaymentLinkByIdQuery = useQuery(
      trpc.public.paymentLinks.findOneById.queryOptions({
        id: props.paymentLinkId
      })
    )
    const t = useTranslations(
      `modules.(app).checkout._components.checkout-form.steps.${CheckoutFormStep.Confirmation}.forms.verify-details`
    )

    const billingData = useStore(
      props.form.store,
      (state) => state.values[CheckoutFormSection.BillingData]
    )

    const paymentLink = findOnePaymentLinkByIdQuery.data

    if (!paymentLink) return null

    const isPerson = billingData.type === BillingType.PERSON

    return (
      <FieldSet>
        <FieldGroup className='mt-4'>
          {/* Payment Details */}
          <Field>
            <div className='bg-muted/50 rounded-lg p-4'>
              <h4 className='mb-3 text-sm font-semibold'>
                {t('sections.payment.title')}
              </h4>
              <div className='divide-y'>
                <DetailRow
                  label={t('sections.payment.product')}
                  value={paymentLink.productName}
                />
                <DetailRow
                  label={t('sections.payment.amount')}
                  value={PricingService.formatPrice(
                    paymentLink.totalAmountToPay,
                    paymentLink.currency
                  )}
                />
                <DetailRow
                  label={t('sections.payment.method')}
                  value={t(
                    `sections.payment.methodValues.${paymentLink.paymentMethodType}`
                  )}
                />
              </div>
            </div>
          </Field>

          {/* Billing Details */}
          <Field>
            <div className='bg-muted/50 rounded-lg p-4'>
              <h4 className='mb-3 text-sm font-semibold'>
                {isPerson
                  ? t('sections.billing.person.title')
                  : t('sections.billing.company.title')}
              </h4>
              <div className='divide-y'>
                {isPerson ? (
                  <>
                    <DetailRow
                      label={t('sections.billing.person.name')}
                      value={
                        billingData.type === BillingType.PERSON
                          ? `${billingData.surname ?? ''} ${billingData.name ?? ''}`
                          : '-'
                      }
                    />
                    <DetailRow
                      label={t('sections.billing.person.email')}
                      value={
                        billingData.type === BillingType.PERSON
                          ? billingData.email
                          : undefined
                      }
                    />
                    <DetailRow
                      label={t('sections.billing.person.phone')}
                      value={
                        billingData.type === BillingType.PERSON
                          ? billingData.phoneNumber
                          : undefined
                      }
                    />
                    <DetailRow
                      label={t('sections.billing.person.cnp')}
                      value={
                        billingData.type === BillingType.PERSON
                          ? billingData.cnp
                          : undefined
                      }
                    />
                    <DetailRow
                      label={t('sections.billing.person.address')}
                      value={
                        billingData.type === BillingType.PERSON
                          ? formatAddress(billingData.address)
                          : '-'
                      }
                    />
                  </>
                ) : (
                  <>
                    <DetailRow
                      label={t('sections.billing.company.name')}
                      value={
                        billingData.type === BillingType.COMPANY
                          ? billingData.name
                          : undefined
                      }
                    />
                    <DetailRow
                      label={t('sections.billing.company.cui')}
                      value={
                        billingData.type === BillingType.COMPANY
                          ? billingData.cui
                          : undefined
                      }
                    />
                    <DetailRow
                      label={t('sections.billing.company.registrationNumber')}
                      value={
                        billingData.type === BillingType.COMPANY
                          ? billingData.registrationNumber
                          : undefined
                      }
                    />
                    <DetailRow
                      label={t('sections.billing.company.representative')}
                      value={
                        billingData.type === BillingType.COMPANY
                          ? billingData.representativeLegal
                          : undefined
                      }
                    />
                    <DetailRow
                      label={t('sections.billing.company.bank')}
                      value={
                        billingData.type === BillingType.COMPANY
                          ? billingData.bank
                          : undefined
                      }
                    />
                    <DetailRow
                      label={t('sections.billing.company.bankAccount')}
                      value={
                        billingData.type === BillingType.COMPANY
                          ? billingData.bankAccount
                          : undefined
                      }
                    />
                    <DetailRow
                      label={t('sections.billing.company.address')}
                      value={
                        billingData.type === BillingType.COMPANY
                          ? formatAddress(billingData.socialHeadquarters)
                          : '-'
                      }
                    />
                  </>
                )}
              </div>
            </div>
          </Field>
        </FieldGroup>
      </FieldSet>
    )
  }
})
