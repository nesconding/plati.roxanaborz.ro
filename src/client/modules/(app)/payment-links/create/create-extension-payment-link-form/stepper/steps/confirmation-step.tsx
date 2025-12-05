'use client'

import { useQuery } from '@tanstack/react-query'
import { Divide, Equal, Minus, X } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { withForm } from '~/client/components/form/config'
import { FieldGroup } from '~/client/components/ui/field'
import {
  Item,
  ItemContent,
  ItemDescription,
  ItemHeader,
  ItemTitle
} from '~/client/components/ui/item'
import { Label } from '~/client/components/ui/label'
import { ScrollArea, ScrollBar } from '~/client/components/ui/scroll-area'
import { Separator } from '~/client/components/ui/separator'
import { cn } from '~/client/lib/utils'
import { CreateExtensionPaymentLinkFormStep } from '~/client/modules/(app)/payment-links/create/create-extension-payment-link-form/stepper/config'
import { useTRPC } from '~/client/trpc/react'
import { PricingService } from '~/lib/pricing'
import { DatesService } from '~/server/services/dates'
import { CreateExtensionPaymentLinkFormDefaultValues } from '~/shared/create-extension-payment-link-form/create-extension-payment-link-form-schema'
import { CreateExtensionPaymentLinkFormSection } from '~/shared/create-extension-payment-link-form/enums/create-extension-payment-link-form-sections'
import { PaymentCurrencyType } from '~/shared/enums/payment-currency-type'

export const ConfirmationStep = withForm({
  defaultValues: CreateExtensionPaymentLinkFormDefaultValues,
  render: function Render({ form }) {
    const t = useTranslations(
      `modules.(app).payment-links._components.create-extension-payment-link-form.steps.${CreateExtensionPaymentLinkFormStep.Confirmation}.sections`
    )
    const trpc = useTRPC()
    const findAllProducts = useQuery(
      trpc.protected.products.findAll.queryOptions()
    )
    const findAllPaymentSettings = useQuery(
      trpc.protected.settings.findAllPaymentSettings.queryOptions()
    )
    const findAllMemberships = useQuery(
      trpc.protected.memberships.findAll.queryOptions()
    )
    const getEURToRONRate = useQuery(
      trpc.protected.settings.getEURToRONRate.queryOptions()
    )
    const findAllFirstPaymentDateAfterDepositOptions = useQuery(
      trpc.protected.settings.findAllFirstPaymentDateAfterDepositOptions.queryOptions()
    )

    const eurToRonRate = getEURToRONRate.data

    // Participants
    const participants =
      form.state.values[CreateExtensionPaymentLinkFormSection.Participants]

    const closerName =
      participants.closerName && participants.closerName !== ''
        ? participants.closerName
        : undefined
    const closerEmail =
      participants.closerEmail && participants.closerEmail !== ''
        ? participants.closerEmail
        : undefined

    const callerName =
      participants.callerName && participants.callerName !== ''
        ? participants.callerName
        : undefined
    const callerEmail =
      participants.callerEmail && participants.callerEmail !== ''
        ? participants.callerEmail
        : undefined

    const setterName =
      participants.setterName && participants.setterName !== ''
        ? participants.setterName
        : undefined
    const setterEmail =
      participants.setterEmail && participants.setterEmail !== ''
        ? participants.setterEmail
        : undefined

    // Extension
    const extension = findAllProducts.data
      ?.flatMap((product) => product.extensions)
      .find(
        (extension) =>
          extension.id ===
          form.state.values[CreateExtensionPaymentLinkFormSection.Extension]
            .extensionId
      )
    const membership = findAllMemberships.data?.find(
      (membership) =>
        membership.id ===
        form.state.values[CreateExtensionPaymentLinkFormSection.Extension]
          .membershipId
    )

    // Payment info
    const paymentSetting = findAllPaymentSettings.data?.find(
      (paymentSetting) =>
        paymentSetting.id ===
        form.state.values[CreateExtensionPaymentLinkFormSection.PaymentInfo]
          .paymentSettingId
    )
    const paymentMethodType =
      form.state.values[CreateExtensionPaymentLinkFormSection.PaymentInfo]
        .paymentMethodType

    // Installments
    const hasInstallments =
      form.state.values[CreateExtensionPaymentLinkFormSection.Installments]
        .hasInstallments
    const extensionInstallment = extension?.installments?.find(
      (extensionInstallment) =>
        extensionInstallment.id ===
        form.state.values[CreateExtensionPaymentLinkFormSection.Installments]
          .extensionInstallmentId
    )

    // Deposit
    const hasDeposit =
      form.state.values[CreateExtensionPaymentLinkFormSection.Deposit]
        .hasDeposit
    const depositAmount =
      form.state.values[CreateExtensionPaymentLinkFormSection.Deposit]
        .depositAmount
    const firstPaymentDateAfterDepositOption =
      findAllFirstPaymentDateAfterDepositOptions.data?.find(
        (firstPaymentDateAfterDepositOption) =>
          firstPaymentDateAfterDepositOption.id ===
          form.state.values[CreateExtensionPaymentLinkFormSection.Deposit]
            .firstPaymentDateAfterDepositOptionId
      )

    if (!extension || !membership || !paymentSetting || !eurToRonRate) {
      return null
    }

    return (
      <FieldGroup>
        <ScrollArea
          className={cn(
            'h-[calc(100vh-var(--header-height)-(--spacing(4))-(--spacing(9))-(--spacing(4))-(--spacing(6))-var(--text-base)-(--spacing(2))-(var(--text-sm)*(1.25/0.875)*2)-(--spacing(6))-(--spacing(6))-(--spacing(9))-(--spacing(4))-(--spacing(9))-(--spacing(6))-(--spacing(4)))] w-full',
            'sm:h-[calc(100vh-var(--header-height)-(--spacing(4))-(--spacing(9))-(--spacing(4))-(--spacing(6))-var(--text-base)-(--spacing(2))-(var(--text-sm)*(1.25/0.875)*2)-(--spacing(6))-(--spacing(6))-(--spacing(9))-(--spacing(6))-(--spacing(4)))] w-full'
          )}
        >
          <div className='grid grid-cols-[1fr_auto_1fr_auto_1fr] gap-4 py-4 px-6'>
            <Label className='col-span-full'>{t('participants.title')}</Label>

            <Item className='py-0 col-span-2'>
              <ItemHeader>{t('participants.items.client')}</ItemHeader>
              <ItemContent>
                <ItemTitle>{membership?.customerName}</ItemTitle>
                <ItemDescription>{membership?.customerEmail}</ItemDescription>
              </ItemContent>
            </Item>

            <Item className='py-0 col-span-1'>
              <ItemHeader>{t('participants.items.closer')}</ItemHeader>
              <ItemContent>
                <ItemTitle>{closerName ?? '-'}</ItemTitle>
                <ItemDescription>{closerEmail ?? '-'}</ItemDescription>
              </ItemContent>
            </Item>

            <Item className='py-0 col-span-1'>
              <ItemHeader>{t('participants.items.caller')}</ItemHeader>
              <ItemContent>
                <ItemTitle>{callerName ?? '-'}</ItemTitle>
                <ItemDescription>{callerEmail ?? '-'}</ItemDescription>
              </ItemContent>
            </Item>

            <Item className='py-0 col-span-1'>
              <ItemHeader>{t('participants.items.setter')}</ItemHeader>
              <ItemContent>
                <ItemTitle>{setterName ?? '-'}</ItemTitle>
                <ItemDescription>{setterEmail ?? '-'}</ItemDescription>
              </ItemContent>
            </Item>

            <Separator className='col-span-full my-2' />

            <Label className='col-span-full'>{t('extension.title')}</Label>

            <Item className='py-0 col-span-2'>
              <ItemHeader>{t('extension.items.extension-months')}</ItemHeader>

              <ItemContent>
                <ItemTitle>{extension?.extensionMonths}</ItemTitle>
              </ItemContent>
            </Item>

            <Item className='py-0 col-span-2'>
              <ItemHeader>{t('extension.items.extension-price')}</ItemHeader>

              <ItemContent>
                <ItemTitle>
                  {PricingService.formatPrice(
                    paymentSetting.currency === PaymentCurrencyType.EUR
                      ? extension.price
                      : PricingService.convertEURtoRON(
                          extension.price,
                          eurToRonRate
                        ),
                    paymentSetting.currency
                  )}
                </ItemTitle>
              </ItemContent>
            </Item>

            <Separator className='col-span-full my-2' />

            <Label className='col-span-full'>{t('payment-info.title')}</Label>

            <Item className='col-span-2'>
              <ItemHeader>
                {t('payment-info.items.payment-setting-label')}
              </ItemHeader>

              <ItemContent>
                <ItemTitle>{paymentSetting?.label}</ItemTitle>
              </ItemContent>
            </Item>

            <Item>
              <ItemHeader>{t('payment-info.items.currency')}</ItemHeader>

              <ItemContent>
                <ItemTitle>{paymentSetting?.currency}</ItemTitle>
              </ItemContent>
            </Item>

            <Item>
              <ItemHeader>{t('payment-info.items.tva-rate')}</ItemHeader>

              <ItemContent>
                <ItemTitle>{`${paymentSetting?.tvaRate}%`}</ItemTitle>
              </ItemContent>
            </Item>

            <Item>
              <ItemHeader>{t('payment-info.items.extra-tax-rate')}</ItemHeader>

              <ItemContent>
                <ItemTitle>{`${paymentSetting?.extraTaxRate}%`}</ItemTitle>
              </ItemContent>
            </Item>

            <Item className='col-span-full'>
              <ItemContent>
                <ItemHeader>
                  {t('payment-info.items.payment-method')}
                </ItemHeader>
                <ItemTitle>
                  {t(
                    `payment-info.items.payment-method-values.${paymentMethodType}`
                  )}
                </ItemTitle>
              </ItemContent>
            </Item>

            {extensionInstallment && (
              <>
                <Separator className='col-span-full my-2' />

                <Label className='col-span-full'>
                  {t('installments.title')}
                </Label>

                <Item className='col-span-1'>
                  <ItemHeader>
                    {t('installments.items.installment-count')}
                  </ItemHeader>
                  <ItemContent>
                    <ItemTitle>{extensionInstallment.count}</ItemTitle>
                  </ItemContent>
                </Item>

                <div className='flex items-end col-span-1 p-4'>
                  <X className='size-3' />
                </div>

                <Item className='col-span-1'>
                  <ItemHeader>
                    {t('installments.items.installment-price')}
                  </ItemHeader>
                  <ItemContent>
                    <ItemTitle>
                      {PricingService.formatPrice(
                        paymentSetting.currency === PaymentCurrencyType.EUR
                          ? extensionInstallment.pricePerInstallment
                          : PricingService.convertEURtoRON(
                              extensionInstallment.pricePerInstallment,
                              eurToRonRate
                            ),
                        paymentSetting.currency
                      )}
                    </ItemTitle>
                  </ItemContent>
                </Item>

                <div className='flex items-end col-span-1 p-4'>
                  <Equal className='size-3' />
                </div>

                <Item className='col-span-1'>
                  <ItemHeader>
                    {t('installments.items.installment-total-price')}
                  </ItemHeader>
                  <ItemContent>
                    <ItemTitle>
                      {PricingService.formatPrice(
                        PricingService.calculateInstallmentsAmountToPay({
                          extraTaxRate: 0,
                          installmentsCount: extensionInstallment.count,
                          pricePerInstallment:
                            paymentSetting.currency === PaymentCurrencyType.EUR
                              ? extensionInstallment.pricePerInstallment
                              : PricingService.convertEURtoRON(
                                  extensionInstallment.pricePerInstallment,
                                  eurToRonRate
                                ),
                          tvaRate: 0
                        }).totalAmountToPay,
                        paymentSetting.currency
                      )}
                    </ItemTitle>
                  </ItemContent>
                </Item>
              </>
            )}

            {depositAmount && firstPaymentDateAfterDepositOption && (
              <>
                <Separator className='col-span-full my-2' />

                <Label className='col-span-full'>{t('deposit.title')}</Label>

                <Item className='col-span-2'>
                  <ItemHeader>{t('deposit.items.deposit-amount')}</ItemHeader>
                  <ItemContent>
                    <ItemTitle>
                      {PricingService.formatPrice(
                        depositAmount,
                        paymentSetting.currency
                      )}
                    </ItemTitle>
                  </ItemContent>
                </Item>

                <Item className='col-span-2'>
                  <ItemHeader>
                    {t('deposit.items.first-payment-after-deposit')}
                  </ItemHeader>
                  <ItemContent>
                    <ItemTitle>
                      {`${firstPaymentDateAfterDepositOption.value} zile`}
                    </ItemTitle>
                  </ItemContent>
                </Item>

                <Item className='col-span-1'>
                  <ItemHeader>
                    {t('deposit.items.first-payment-date-after-deposit')}
                  </ItemHeader>
                  <ItemContent>
                    <ItemTitle>
                      {DatesService.formatDate(
                        DatesService.addDays(
                          new Date(),
                          firstPaymentDateAfterDepositOption.value
                        ),
                        'PPP'
                      )}
                    </ItemTitle>
                  </ItemContent>
                </Item>
              </>
            )}

            <Separator className='col-span-full my-2' />

            <Label className='col-span-full'>{t('payment.title')}</Label>

            {!hasInstallments! && !hasDeposit && (
              <Item className='col-span-1 col-start-5 col-end-6'>
                <ItemHeader>
                  {t('payment.items.total-amount-to-pay')}
                </ItemHeader>
                <ItemContent>
                  <ItemTitle>
                    {PricingService.formatPrice(
                      PricingService.calculateTotalAmountToPay({
                        extraTaxRate: paymentSetting.extraTaxRate,
                        price:
                          paymentSetting.currency === PaymentCurrencyType.EUR
                            ? extension.price
                            : PricingService.convertEURtoRON(
                                extension.price,
                                eurToRonRate
                              ),
                        tvaRate: paymentSetting.tvaRate
                      }),
                      paymentSetting.currency
                    )}
                  </ItemTitle>
                </ItemContent>
              </Item>
            )}

            {!hasInstallments && hasDeposit && depositAmount && (
              <>
                <Item>
                  <ItemHeader>
                    {t('payment.items.total-amount-to-pay')}
                  </ItemHeader>
                  <ItemContent>
                    <ItemTitle>
                      {PricingService.formatPrice(
                        PricingService.calculateTotalAmountToPay({
                          extraTaxRate: paymentSetting.extraTaxRate,
                          price:
                            paymentSetting.currency === PaymentCurrencyType.EUR
                              ? extension.price
                              : PricingService.convertEURtoRON(
                                  extension.price,
                                  eurToRonRate
                                ),
                          tvaRate: paymentSetting.tvaRate
                        }),
                        paymentSetting.currency
                      )}
                    </ItemTitle>
                  </ItemContent>
                </Item>

                <div className='flex items-end col-span-1 p-4'>
                  <Minus className='size-3' />
                </div>

                <Item>
                  <ItemHeader>{t('payment.items.deposit-amount')}</ItemHeader>
                  <ItemContent>
                    <ItemTitle>
                      {PricingService.formatPrice(
                        depositAmount,
                        paymentSetting.currency
                      )}
                    </ItemTitle>
                  </ItemContent>
                </Item>

                <div className='flex items-end col-span-1 p-4'>
                  <Equal className='size-3' />
                </div>

                <Item>
                  <ItemHeader>
                    {t('payment.items.remaining-amount-to-pay')}
                  </ItemHeader>
                  <ItemContent>
                    <ItemTitle>
                      {PricingService.formatPrice(
                        PricingService.calculateDepositRemainingAmountToPay({
                          depositAmount: depositAmount,
                          extraTaxRate: paymentSetting.extraTaxRate,
                          price:
                            paymentSetting.currency === PaymentCurrencyType.EUR
                              ? extension.price
                              : PricingService.convertEURtoRON(
                                  extension.price,
                                  eurToRonRate
                                ),
                          tvaRate: paymentSetting.tvaRate
                        }).remainingAmountToPay,
                        paymentSetting.currency
                      )}
                    </ItemTitle>
                  </ItemContent>
                </Item>
              </>
            )}

            {hasInstallments && extensionInstallment && !hasDeposit && (
              <>
                <Item>
                  <ItemHeader>
                    {t('payment.items.installments-count')}
                  </ItemHeader>
                  <ItemContent>
                    <ItemTitle>{extensionInstallment.count}</ItemTitle>
                  </ItemContent>
                </Item>

                <div className='flex items-end col-span-1 p-4'>
                  <X className='size-3' />
                </div>

                <Item>
                  <ItemHeader>
                    {t('payment.items.installment-amount-to-pay')}
                  </ItemHeader>
                  <ItemContent>
                    <ItemTitle>
                      {PricingService.formatPrice(
                        PricingService.calculateInstallmentsAmountToPay({
                          extraTaxRate: paymentSetting.extraTaxRate,
                          installmentsCount: extensionInstallment.count,
                          pricePerInstallment:
                            paymentSetting.currency === PaymentCurrencyType.EUR
                              ? extensionInstallment.pricePerInstallment
                              : PricingService.convertEURtoRON(
                                  extensionInstallment.pricePerInstallment,
                                  eurToRonRate
                                ),
                          tvaRate: paymentSetting.tvaRate
                        }).installmentAmountToPay,
                        paymentSetting.currency
                      )}
                    </ItemTitle>
                  </ItemContent>
                </Item>

                <div className='flex items-end col-span-1 p-4'>
                  <Equal className='size-3' />
                </div>

                <Item>
                  <ItemHeader>
                    {t('payment.items.total-amount-to-pay')}
                  </ItemHeader>
                  <ItemContent>
                    <ItemTitle>
                      {PricingService.formatPrice(
                        PricingService.calculateInstallmentsAmountToPay({
                          extraTaxRate: paymentSetting.extraTaxRate,
                          installmentsCount: extensionInstallment.count,
                          pricePerInstallment:
                            paymentSetting.currency === PaymentCurrencyType.EUR
                              ? extensionInstallment.pricePerInstallment
                              : PricingService.convertEURtoRON(
                                  extensionInstallment.pricePerInstallment,
                                  eurToRonRate
                                ),
                          tvaRate: paymentSetting.tvaRate
                        }).totalAmountToPay,
                        paymentSetting.currency
                      )}
                    </ItemTitle>
                  </ItemContent>
                </Item>
              </>
            )}

            {hasInstallments &&
              extensionInstallment &&
              hasDeposit &&
              depositAmount && (
                <>
                  <Item>
                    <ItemHeader>
                      {t('payment.items.total-amount-to-pay')}
                    </ItemHeader>
                    <ItemContent>
                      <ItemTitle>
                        {PricingService.formatPrice(
                          PricingService.calculateInstallmentsAmountToPay({
                            extraTaxRate: paymentSetting.extraTaxRate,
                            installmentsCount: extensionInstallment.count,
                            pricePerInstallment:
                              paymentSetting.currency ===
                              PaymentCurrencyType.EUR
                                ? extensionInstallment.pricePerInstallment
                                : PricingService.convertEURtoRON(
                                    extensionInstallment.pricePerInstallment,
                                    eurToRonRate
                                  ),
                            tvaRate: paymentSetting.tvaRate
                          }).totalAmountToPay,
                          paymentSetting.currency
                        )}
                      </ItemTitle>
                    </ItemContent>
                  </Item>

                  <div className='flex items-end col-span-1 p-4'>
                    <Minus className='size-3' />
                  </div>

                  <Item>
                    <ItemHeader>{t('payment.items.deposit-amount')}</ItemHeader>
                    <ItemContent>
                      <ItemTitle>
                        {PricingService.formatPrice(
                          depositAmount,
                          paymentSetting.currency
                        )}
                      </ItemTitle>
                    </ItemContent>
                  </Item>

                  <div className='flex items-end col-span-1 p-4'>
                    <Equal className='size-3' />
                  </div>

                  <Item>
                    <ItemHeader>
                      {t('payment.items.remaining-amount-to-pay')}
                    </ItemHeader>
                    <ItemContent>
                      <ItemTitle>
                        {PricingService.formatPrice(
                          PricingService.calculateInstallmentsDepositRemainingAmountToPay(
                            {
                              depositAmount: depositAmount,
                              extraTaxRate: paymentSetting.extraTaxRate,
                              installmentsCount: extensionInstallment.count,
                              pricePerInstallment:
                                paymentSetting.currency ===
                                PaymentCurrencyType.EUR
                                  ? extensionInstallment.pricePerInstallment
                                  : PricingService.convertEURtoRON(
                                      extensionInstallment.pricePerInstallment,
                                      eurToRonRate
                                    ),
                              tvaRate: paymentSetting.tvaRate
                            }
                          ).remainingAmountToPay,
                          paymentSetting.currency
                        )}
                      </ItemTitle>
                    </ItemContent>
                  </Item>

                  <Item>
                    <ItemHeader>
                      {t('payment.items.remaining-amount-to-pay')}
                    </ItemHeader>
                    <ItemContent>
                      <ItemTitle>
                        {PricingService.formatPrice(
                          PricingService.calculateInstallmentsDepositRemainingAmountToPay(
                            {
                              depositAmount: depositAmount,
                              extraTaxRate: paymentSetting.extraTaxRate,
                              installmentsCount: extensionInstallment.count,
                              pricePerInstallment:
                                paymentSetting.currency ===
                                PaymentCurrencyType.EUR
                                  ? extensionInstallment.pricePerInstallment
                                  : PricingService.convertEURtoRON(
                                      extensionInstallment.pricePerInstallment,
                                      eurToRonRate
                                    ),
                              tvaRate: paymentSetting.tvaRate
                            }
                          ).remainingAmountToPay,
                          paymentSetting.currency
                        )}
                      </ItemTitle>
                    </ItemContent>
                  </Item>

                  <div className='flex items-end col-span-1 p-4'>
                    <Divide className='size-3' />
                  </div>

                  <Item>
                    <ItemHeader>
                      {t('payment.items.installments-count')}
                    </ItemHeader>
                    <ItemContent>
                      <ItemTitle>{extensionInstallment.count}</ItemTitle>
                    </ItemContent>
                  </Item>

                  <div className='flex items-end col-span-1 p-4'>
                    <Equal className='size-3' />
                  </div>

                  <Item>
                    <ItemHeader>
                      {t(
                        'payment.items.remaining-amount-to-pay-per-installment'
                      )}
                    </ItemHeader>
                    <ItemContent>
                      <ItemTitle>
                        {PricingService.formatPrice(
                          PricingService.calculateInstallmentsDepositRemainingAmountToPay(
                            {
                              depositAmount: depositAmount,
                              extraTaxRate: paymentSetting.extraTaxRate,
                              installmentsCount: extensionInstallment.count,
                              pricePerInstallment:
                                paymentSetting.currency ===
                                PaymentCurrencyType.EUR
                                  ? extensionInstallment.pricePerInstallment
                                  : PricingService.convertEURtoRON(
                                      extensionInstallment.pricePerInstallment,
                                      eurToRonRate
                                    ),
                              tvaRate: paymentSetting.tvaRate
                            }
                          ).remainingInstallmentAmountToPay,
                          paymentSetting.currency
                        )}
                      </ItemTitle>
                    </ItemContent>
                  </Item>
                </>
              )}
          </div>
          <ScrollBar orientation='horizontal' />
        </ScrollArea>
      </FieldGroup>
    )
  }
})
