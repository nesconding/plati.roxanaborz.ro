'use client'

import { useTranslations } from 'next-intl'

import {
  Field,
  FieldGroup,
  FieldLegend,
  FieldSet
} from '~/client/components/ui/field'
import { useCheckout } from '~/client/modules/checkout/checkout-form/context'
import { CheckoutFormStep } from '~/client/modules/checkout/checkout-form/stepper/config'
import { PricingService } from '~/lib/pricing'
import { PaymentLinkType } from '~/shared/enums/payment-link-type'
import { PaymentProductType } from '~/shared/enums/payment-product-type'

interface DetailRowProps {
  label: string
  value: string | undefined | null
  highlight?: boolean
}

function DetailRow({ label, value, highlight }: DetailRowProps) {
  return (
    <div className='flex items-start justify-between gap-4 py-2'>
      <span className='text-muted-foreground text-sm'>{label}</span>
      <span
        className={`text-right text-sm ${highlight ? 'text-lg font-bold text-primary' : 'font-medium'}`}
      >
        {value || '-'}
      </span>
    </div>
  )
}

function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return '-'
  return new Date(dateString).toLocaleDateString('ro-RO', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })
}

export function PaymentOverviewSection() {
  const { paymentLink, isExtension } = useCheckout()
  const t = useTranslations(
    `modules.(app).checkout._components.checkout-form.steps.${CheckoutFormStep.PaymentMethod}.forms.payment-overview`
  )

  const {
    productName,
    type,
    currency,
    totalAmountToPay,
    depositAmount,
    remainingAmountToPay,
    productInstallmentAmountToPay,
    productInstallmentsCount,
    remainingInstallmentAmountToPay,
    firstPaymentDateAfterDeposit,
    product,
    paymentProductType
  } = paymentLink

  // Get duration based on product type
  const getDuration = () => {
    if (paymentProductType === PaymentProductType.Extension) {
      // For extensions, try to find extension months from product.extensions
      // This might need adjustment based on how extension data is passed
      return null // Extension months not available in current query
    }
    return product?.membershipDurationMonths
  }

  const duration = getDuration()

  // Calculate pay now and future amounts based on payment type
  const getPaymentBreakdown = () => {
    switch (type) {
      case PaymentLinkType.Integral:
        return {
          payLater: null,
          payLaterDescription: null,
          payNow: totalAmountToPay
        }
      case PaymentLinkType.Deposit:
        return {
          payLater: remainingAmountToPay,
          payLaterDescription: t('sections.summary.afterDate', {
            date: formatDate(firstPaymentDateAfterDeposit)
          }),
          payNow: depositAmount
        }
      case PaymentLinkType.Installments:
        return {
          payLater:
            productInstallmentsCount && productInstallmentAmountToPay
              ? String(
                  Number(productInstallmentAmountToPay) *
                    (productInstallmentsCount - 1)
                )
              : null,
          payLaterDescription:
            productInstallmentsCount && productInstallmentAmountToPay
              ? t('sections.summary.installmentsRemaining', {
                  amount: PricingService.formatPrice(
                    productInstallmentAmountToPay,
                    currency
                  ),
                  count: productInstallmentsCount - 1
                })
              : null,
          payNow: productInstallmentAmountToPay
        }
      case PaymentLinkType.InstallmentsDeposit:
        return {
          payLater: remainingAmountToPay,
          payLaterDescription:
            productInstallmentsCount && remainingInstallmentAmountToPay
              ? t('sections.summary.installmentsRemaining', {
                  amount: PricingService.formatPrice(
                    remainingInstallmentAmountToPay,
                    currency
                  ),
                  count: productInstallmentsCount
                })
              : null,
          payNow: depositAmount
        }
      default:
        return {
          payLater: null,
          payLaterDescription: null,
          payNow: totalAmountToPay
        }
    }
  }

  const breakdown = getPaymentBreakdown()

  return (
    <FieldSet>
      <FieldLegend>{t('legend')}</FieldLegend>

      <FieldGroup className='gap-4'>
        {/* Product Info Card */}
        <Field>
          <div className='bg-muted/50 rounded-lg p-4'>
            <h4 className='mb-3 text-sm font-semibold'>
              {t('sections.product.title')}
            </h4>
            <div className='divide-y'>
              <DetailRow
                label={t('sections.product.name')}
                value={productName}
              />
              {duration && (
                <DetailRow
                  label={t('sections.product.duration')}
                  value={t('sections.product.durationValue', {
                    months: duration
                  })}
                />
              )}
              {isExtension && (
                <DetailRow
                  label={t('sections.product.extension')}
                  value={t('sections.product.extensionLabel')}
                />
              )}
            </div>
          </div>
        </Field>

        {/* Payment Plan Card */}
        <Field>
          <div className='bg-muted/50 rounded-lg p-4'>
            <h4 className='mb-3 text-sm font-semibold'>
              {t('sections.plan.title')}
            </h4>
            <div className='divide-y'>
              <DetailRow
                label={t('sections.plan.type')}
                value={t(`sections.plan.typeValues.${type}`)}
              />
              {type !== PaymentLinkType.Integral && (
                <>
                  {(type === PaymentLinkType.Deposit ||
                    type === PaymentLinkType.InstallmentsDeposit) &&
                    depositAmount && (
                      <DetailRow
                        label={t('sections.plan.depositAmount')}
                        value={PricingService.formatPrice(
                          depositAmount,
                          currency
                        )}
                      />
                    )}
                  {(type === PaymentLinkType.Installments ||
                    type === PaymentLinkType.InstallmentsDeposit) &&
                    productInstallmentsCount && (
                      <DetailRow
                        label={t('sections.plan.installmentsCount')}
                        value={String(productInstallmentsCount)}
                      />
                    )}
                  {type === PaymentLinkType.Installments &&
                    productInstallmentAmountToPay && (
                      <DetailRow
                        label={t('sections.plan.perInstallment')}
                        value={PricingService.formatPrice(
                          productInstallmentAmountToPay,
                          currency
                        )}
                      />
                    )}
                  {type === PaymentLinkType.InstallmentsDeposit &&
                    remainingInstallmentAmountToPay && (
                      <DetailRow
                        label={t('sections.plan.perInstallmentAfterDeposit')}
                        value={PricingService.formatPrice(
                          remainingInstallmentAmountToPay,
                          currency
                        )}
                      />
                    )}
                  <DetailRow
                    label={t('sections.plan.totalAmount')}
                    value={PricingService.formatPrice(
                      totalAmountToPay,
                      currency
                    )}
                  />
                </>
              )}
            </div>
          </div>
        </Field>

        {/* Payment Summary Card */}
        <Field>
          <div className='bg-primary/5 border-primary/20 rounded-lg border p-4'>
            <h4 className='mb-3 text-sm font-semibold'>
              {t('sections.summary.title')}
            </h4>
            <div className='divide-y'>
              <DetailRow
                highlight
                label={t('sections.summary.payNow')}
                value={
                  breakdown.payNow
                    ? PricingService.formatPrice(breakdown.payNow, currency)
                    : '-'
                }
              />
              {breakdown.payLater && (
                <div className='py-2'>
                  <div className='flex items-start justify-between gap-4'>
                    <span className='text-muted-foreground text-sm'>
                      {t('sections.summary.payLater')}
                    </span>
                    <span className='text-right text-sm font-medium'>
                      {PricingService.formatPrice(breakdown.payLater, currency)}
                    </span>
                  </div>
                  {breakdown.payLaterDescription && (
                    <p className='text-muted-foreground mt-1 text-xs'>
                      {breakdown.payLaterDescription}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </Field>
      </FieldGroup>
    </FieldSet>
  )
}
