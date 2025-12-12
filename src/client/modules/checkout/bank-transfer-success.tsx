'use client'

import { useQuery } from '@tanstack/react-query'
import {
  CalendarDays,
  CheckCircle2,
  Copy,
  Download,
  Info,
  Landmark
} from 'lucide-react'
import { useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { Logo } from '~/client/components/logo'
import { Badge } from '~/client/components/ui/badge'
import { Button } from '~/client/components/ui/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from '~/client/components/ui/card'
import { ScrollArea } from '~/client/components/ui/scroll-area'
import { Skeleton } from '~/client/components/ui/skeleton'
import { generateBankTransferPdf } from '~/client/lib/pdf/generate-bank-transfer-pdf'
import { cn } from '~/client/lib/utils'
import { useTRPC } from '~/client/trpc/react'
import {
  calculatePaymentSchedule,
  type PaymentScheduleItem
} from '~/lib/payment-schedule'
import { PricingService } from '~/lib/pricing'

interface BankTransferSuccessModuleProps {
  paymentLinkId: string
}

export function BankTransferSuccessModule({
  paymentLinkId
}: BankTransferSuccessModuleProps) {
  const t = useTranslations('modules.(app).checkout.bank-transfer-success')
  const searchParams = useSearchParams()
  const trpc = useTRPC()
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false)

  const orderId = searchParams.get('orderId') ?? ''

  // Fetch payment link data
  const paymentLinkQuery = useQuery(
    trpc.public.paymentLinks.findOneById.queryOptions({
      id: paymentLinkId
    })
  )

  // Fetch bank details
  const bankDetailsQuery = useQuery(
    trpc.public.settings.getBankDetails.queryOptions()
  )

  const paymentLink = paymentLinkQuery.data
  const bankDetails = bankDetailsQuery.data
  const isLoading = paymentLinkQuery.isLoading || bankDetailsQuery.isLoading

  const formattedAmount = paymentLink
    ? PricingService.formatPrice(
        paymentLink.totalAmountToPay,
        paymentLink.currency
      )
    : ''

  // Calculate payment schedule
  const paymentSchedule = useMemo(() => {
    if (!paymentLink) return []
    // Handle both product and extension payment links
    const installmentAmountToPay =
      'productInstallmentAmountToPay' in paymentLink
        ? paymentLink.productInstallmentAmountToPay
        : 'extensionInstallmentAmountToPay' in paymentLink
          ? paymentLink.extensionInstallmentAmountToPay
          : null
    const installmentsCount =
      'productInstallmentsCount' in paymentLink
        ? paymentLink.productInstallmentsCount
        : 'extensionInstallmentsCount' in paymentLink
          ? paymentLink.extensionInstallmentsCount
          : null
    return calculatePaymentSchedule({
      currency: paymentLink.currency,
      depositAmount: paymentLink.depositAmount,
      firstPaymentDateAfterDeposit: paymentLink.firstPaymentDateAfterDeposit,
      productInstallmentAmountToPay: installmentAmountToPay,
      productInstallmentsCount: installmentsCount,
      remainingAmountToPay: paymentLink.remainingAmountToPay,
      remainingInstallmentAmountToPay:
        paymentLink.remainingInstallmentAmountToPay,
      totalAmountToPay: paymentLink.totalAmountToPay,
      type: paymentLink.type
    })
  }, [paymentLink])

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success(t('toast.copied'))
  }

  const handleDownloadPdf = () => {
    if (!paymentLink || !bankDetails) return

    setIsGeneratingPdf(true)
    try {
      generateBankTransferPdf({
        bankDetails: {
          bank: bankDetails.bank,
          bic: bankDetails.bic,
          cui: bankDetails.cui,
          iban: bankDetails.iban,
          name: bankDetails.name,
          registrationNumber: bankDetails.registrationNumber
        },
        formattedAmount,
        orderId,
        paymentSchedule,
        productName: paymentLink.productName
      })
    } finally {
      setIsGeneratingPdf(false)
    }
  }

  return (
    <div className='grid h-svh w-full grid-cols-1 grid-rows-[auto_1fr_auto] items-center justify-center gap-6 p-4'>
      {/* Header */}
      <Logo className='w-48 justify-self-center pt-4' />

      {/* Main content - scrollable */}
      <ScrollArea className='w-full max-w-lg justify-self-center'>
        <div className='flex flex-col items-center gap-6 pb-8'>
          {/* Success icon */}
          <div className='rounded-full bg-emerald-500/10 p-4'>
            <CheckCircle2 className='size-16 text-emerald-600' />
          </div>

          {/* Title & description */}
          <div className='flex flex-col items-center gap-2 text-center'>
            <h1 className='text-2xl font-bold'>{t('title')}</h1>
            <p className='text-muted-foreground'>{t('description')}</p>
          </div>

          {/* Bank details card */}
          <Card className='w-full'>
            <CardHeader className='pb-2'>
              <CardTitle className='text-muted-foreground flex items-center gap-2 text-sm font-semibold uppercase tracking-wide'>
                <Landmark className='size-4' />
                {t('bank-details.title')}
              </CardTitle>
            </CardHeader>
            <CardContent className='space-y-4'>
              {isLoading ? (
                <div className='space-y-3'>
                  <Skeleton className='h-10 w-full' />
                  <Skeleton className='h-12 w-full' />
                  <div className='grid grid-cols-2 gap-3'>
                    <Skeleton className='h-10 w-full' />
                    <Skeleton className='h-10 w-full' />
                  </div>
                </div>
              ) : bankDetails ? (
                <>
                  {/* Beneficiary */}
                  <div className='space-y-1'>
                    <span className='text-muted-foreground text-sm'>
                      {t('bank-details.beneficiary')}
                    </span>
                    <CopyableField
                      onCopy={() => copyToClipboard(bankDetails.name)}
                      value={bankDetails.name}
                    />
                  </div>

                  {/* IBAN (prominent) */}
                  <div className='space-y-1'>
                    <span className='text-muted-foreground text-sm'>
                      {t('bank-details.iban')}
                    </span>
                    <div className='border-primary/10 bg-primary/5 flex items-center justify-between rounded-lg border px-4 py-3'>
                      <span className='font-mono text-base font-medium tracking-wide'>
                        {bankDetails.iban}
                      </span>
                      <Button
                        className='size-8'
                        onClick={() => copyToClipboard(bankDetails.iban)}
                        size='icon'
                        variant='ghost'
                      >
                        <Copy className='size-4' />
                      </Button>
                    </div>
                  </div>

                  {/* Bank and BIC */}
                  <div className='grid grid-cols-2 gap-3'>
                    <div className='space-y-1'>
                      <span className='text-muted-foreground text-sm'>
                        {t('bank-details.bank')}
                      </span>
                      <div className='bg-muted/50 rounded-lg px-3 py-2'>
                        <span className='text-sm font-medium'>
                          {bankDetails.bank}
                        </span>
                      </div>
                    </div>
                    <div className='space-y-1'>
                      <span className='text-muted-foreground text-sm'>
                        {t('bank-details.bic')}
                      </span>
                      <div className='bg-muted/50 rounded-lg px-3 py-2'>
                        <span className='font-mono text-sm'>
                          {bankDetails.bic}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* CUI and Registration Number */}
                  <div className='grid grid-cols-2 gap-3'>
                    <div className='space-y-1'>
                      <span className='text-muted-foreground text-sm'>
                        {t('bank-details.cui')}
                      </span>
                      <div className='bg-muted/50 rounded-lg px-3 py-2'>
                        <span className='text-sm font-medium'>
                          {bankDetails.cui}
                        </span>
                      </div>
                    </div>
                    <div className='space-y-1'>
                      <span className='text-muted-foreground text-sm'>
                        {t('bank-details.registration-number')}
                      </span>
                      <div className='bg-muted/50 rounded-lg px-3 py-2'>
                        <span className='text-sm font-medium'>
                          {bankDetails.registrationNumber}
                        </span>
                      </div>
                    </div>
                  </div>
                </>
              ) : null}
            </CardContent>
          </Card>

          {/* Payment details card */}
          <Card className='w-full'>
            <CardHeader className='pb-2'>
              <CardTitle className='text-muted-foreground text-sm font-semibold uppercase tracking-wide'>
                {t('payment-info.title')}
              </CardTitle>
            </CardHeader>
            <CardContent className='space-y-4'>
              {isLoading ? (
                <div className='space-y-3'>
                  <Skeleton className='h-12 w-full' />
                  <div className='grid grid-cols-2 gap-3'>
                    <Skeleton className='h-16 w-full' />
                    <Skeleton className='h-16 w-full' />
                  </div>
                </div>
              ) : paymentLink ? (
                <>
                  {/* Payment Reference */}
                  <div className='space-y-1'>
                    <div className='flex items-center gap-1'>
                      <span className='text-muted-foreground text-sm'>
                        {t('payment-info.reference')}
                      </span>
                      <span className='text-muted-foreground/60 text-xs'>
                        ({t('payment-info.reference-hint')})
                      </span>
                    </div>
                    <div className='border-primary/10 bg-primary/5 flex items-center justify-between rounded-lg border px-4 py-3'>
                      <span className='font-mono text-base font-medium'>
                        {orderId}
                      </span>
                      <Button
                        className='size-8'
                        onClick={() => copyToClipboard(orderId)}
                        size='icon'
                        variant='ghost'
                      >
                        <Copy className='size-4' />
                      </Button>
                    </div>
                  </div>

                  {/* Product and Amount */}
                  <div className='grid grid-cols-2 gap-3'>
                    <div className='space-y-1'>
                      <span className='text-muted-foreground text-sm'>
                        {t('payment-info.product')}
                      </span>
                      <div className='bg-muted/50 rounded-lg px-3 py-2'>
                        <span className='text-sm font-medium'>
                          {paymentLink.productName}
                        </span>
                      </div>
                    </div>
                    <div className='space-y-1'>
                      <span className='text-muted-foreground text-sm'>
                        {t('payment-info.amount')}
                      </span>
                      <div className='bg-muted/50 rounded-lg px-3 py-2'>
                        <span className='text-primary text-xl font-bold'>
                          {formattedAmount}
                        </span>
                      </div>
                    </div>
                  </div>
                </>
              ) : null}
            </CardContent>
          </Card>

          {/* Payment Schedule Card - show only for non-Integral */}
          {paymentSchedule.length > 1 && (
            <Card className='w-full'>
              <CardHeader className='pb-2'>
                <CardTitle className='text-muted-foreground flex items-center gap-2 text-sm font-semibold uppercase tracking-wide'>
                  <CalendarDays className='size-4' />
                  {t('payment-schedule.title')}
                </CardTitle>
              </CardHeader>
              <CardContent className='space-y-3'>
                {paymentSchedule.map((item, index) => (
                  <PaymentScheduleRow
                    index={index + 1}
                    isFirst={index === 0}
                    item={item}
                    // biome-ignore lint/suspicious/noArrayIndexKey: <asd>
                    key={index}
                    t={t}
                  />
                ))}

                {/* Total row */}
                <div className='mt-4 flex items-center justify-between border-t pt-4'>
                  <span className='font-semibold'>Total</span>
                  <span className='text-primary font-mono text-lg font-bold'>
                    {formattedAmount}
                  </span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Instructions card */}
          <Card className='w-full'>
            <CardHeader className='pb-2'>
              <CardTitle className='text-muted-foreground flex items-center gap-2 text-sm font-semibold uppercase tracking-wide'>
                <Info className='size-4' />
                {t('instructions.title')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ol className='text-muted-foreground list-inside list-decimal space-y-2 text-sm'>
                <li>{t('instructions.step1')}</li>
                <li>{t('instructions.step2')}</li>
                <li>{t('instructions.step3')}</li>
              </ol>
            </CardContent>
          </Card>

          {/* Download button */}
          <Button
            className='gap-2'
            disabled={isLoading || isGeneratingPdf}
            onClick={handleDownloadPdf}
            size='lg'
          >
            <Download className='size-5' />
            {t('buttons.download-pdf')}
          </Button>

          {/* Close message */}
          <p className='text-muted-foreground text-center text-sm'>
            {t('close')}
          </p>
        </div>
      </ScrollArea>

      {/* Footer spacer */}
      <div />
    </div>
  )
}

interface CopyableFieldProps {
  onCopy: () => void
  value: string
}

function CopyableField({ onCopy, value }: CopyableFieldProps) {
  return (
    <div className='bg-muted/50 flex items-center justify-between rounded-lg px-3 py-2'>
      <span className='text-sm font-medium'>{value}</span>
      <Button className='size-8' onClick={onCopy} size='icon' variant='ghost'>
        <Copy className='size-4' />
      </Button>
    </div>
  )
}

interface PaymentScheduleRowProps {
  index: number
  isFirst: boolean
  item: PaymentScheduleItem
  t: ReturnType<typeof useTranslations>
}

function PaymentScheduleRow({
  index,
  isFirst,
  item,
  t
}: PaymentScheduleRowProps) {
  return (
    <div className='flex items-start gap-3'>
      {/* Step indicator */}
      <div
        className={cn(
          'flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-medium',
          isFirst
            ? 'bg-primary text-primary-foreground'
            : 'bg-muted text-muted-foreground'
        )}
      >
        {index}
      </div>

      {/* Payment details */}
      <div
        className={cn(
          'flex-1 rounded-lg px-4 py-3',
          isFirst ? 'border-primary/20 bg-primary/5 border' : 'bg-muted/30'
        )}
      >
        <div className='mb-1 flex items-center justify-between'>
          <span className='text-sm font-medium'>{item.description}</span>
          <Badge
            className={cn(
              'text-xs',
              isFirst
                ? 'bg-amber-100 text-amber-700 hover:bg-amber-100'
                : 'bg-muted text-muted-foreground hover:bg-muted'
            )}
            variant='secondary'
          >
            {isFirst
              ? t('payment-schedule.status.pending')
              : t('payment-schedule.status.upcoming')}
          </Badge>
        </div>
        <div className='flex items-center justify-between'>
          <span className='text-muted-foreground text-sm'>
            {item.date ?? t('payment-schedule.labels.now')}
          </span>
          <span className='font-mono text-base font-semibold'>
            {item.amount}
          </span>
        </div>
      </div>
    </div>
  )
}
