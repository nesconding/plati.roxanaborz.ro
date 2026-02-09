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
    remainingInstallmentAmountToPay,
    firstPaymentDateAfterDeposit,
    paymentProductType
  } = paymentLink

  // Handle product vs extension installment fields
  const installmentAmountToPay = isExtension
    ? 'extensionInstallmentAmountToPay' in paymentLink
      ? paymentLink.extensionInstallmentAmountToPay
      : null
    : 'productInstallmentAmountToPay' in paymentLink
      ? paymentLink.productInstallmentAmountToPay
      : null

  const installmentsCount = isExtension
    ? 'extensionInstallmentsCount' in paymentLink
      ? paymentLink.extensionInstallmentsCount
      : null
    : 'productInstallmentsCount' in paymentLink
      ? paymentLink.productInstallmentsCount
      : null

  // Get duration based on product type
  const getDuration = () => {
    if (paymentProductType === PaymentProductType.Extension) {
      // For extensions, get extension months from the extension field
      if ('extension' in paymentLink && paymentLink.extension) {
        return paymentLink.extension.extensionMonths
      }
      return null
    }
    // For products, get membership duration from product
    if ('product' in paymentLink && paymentLink.product) {
      return paymentLink.product.membershipDurationMonths
    }
    return null
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
            installmentsCount && installmentAmountToPay
              ? String(Number(installmentAmountToPay) * (installmentsCount - 1))
              : null,
          payLaterDescription:
            installmentsCount && installmentAmountToPay
              ? t('sections.summary.installmentsRemaining', {
                  amount: PricingService.formatPrice(
                    installmentAmountToPay,
                    currency
                  ),
                  count: installmentsCount - 1
                })
              : null,
          payNow: installmentAmountToPay
        }
      case PaymentLinkType.InstallmentsDeposit:
        return {
          payLater: remainingAmountToPay,
          payLaterDescription:
            installmentsCount && remainingInstallmentAmountToPay
              ? t('sections.summary.installmentsRemaining', {
                  amount: PricingService.formatPrice(
                    remainingInstallmentAmountToPay,
                    currency
                  ),
                  count: installmentsCount
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
                    installmentsCount && (
                      <DetailRow
                        label={t('sections.plan.installmentsCount')}
                        value={String(installmentsCount)}
                      />
                    )}
                  {type === PaymentLinkType.Installments &&
                    installmentAmountToPay && (
                      <DetailRow
                        label={t('sections.plan.perInstallment')}
                        value={PricingService.formatPrice(
                          installmentAmountToPay,
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
