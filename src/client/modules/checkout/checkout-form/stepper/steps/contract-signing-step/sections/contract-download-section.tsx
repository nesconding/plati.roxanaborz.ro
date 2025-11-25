'use client'

import { useMutation } from '@tanstack/react-query'
import { useStore } from '@tanstack/react-form'
import { Download, FileText } from 'lucide-react'
import { useTranslations } from 'next-intl'

import { withForm } from '~/client/components/form/config'
import { Button } from '~/client/components/ui/button'
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLegend,
  FieldSet
} from '~/client/components/ui/field'
import { Spinner } from '~/client/components/ui/spinner'
import {
  CheckoutFormDefaultValues as defaultValues,
  CheckoutFormSection
} from '~/client/modules/checkout/checkout-form/schema'
import { CheckoutFormStep } from '~/client/modules/checkout/checkout-form/stepper/config'
import { useTRPC } from '~/client/trpc/react'

export const ContractDownloadSection = withForm({
  defaultValues,
  props: {
    paymentLinkId: ''
  },
  render: function Render(props) {
    const trpc = useTRPC()
    const t = useTranslations(
      `modules.(app).checkout._components.checkout-form.steps.${CheckoutFormStep.ContractSigning}.forms.contract-download`
    )

    const billingData = useStore(
      props.form.store,
      (state) => state.values[CheckoutFormSection.BillingData]
    )

    const generateFilledContract = useMutation(
      trpc.public.contracts.generateFilledContract.mutationOptions()
    )

    async function handleDownload() {
      const result = await generateFilledContract.mutateAsync({
        billingData,
        paymentLinkId: props.paymentLinkId
      })

      // Create a download link
      const byteCharacters = atob(result.pdfBase64)
      const byteNumbers = new Array(byteCharacters.length)
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i)
      }
      const byteArray = new Uint8Array(byteNumbers)
      const blob = new Blob([byteArray], { type: 'application/pdf' })

      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${result.contractName}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    }

    return (
      <FieldSet>
        <FieldLegend>{t('legend')}</FieldLegend>
        <FieldDescription>{t('description')}</FieldDescription>

        <FieldGroup className='mt-4'>
          <Field>
            <div className='bg-muted/50 flex items-center justify-between gap-4 rounded-lg p-4'>
              <div className='flex items-center gap-3'>
                <FileText className='text-muted-foreground size-8' />
                <div>
                  <p className='text-sm font-medium'>{t('contract.title')}</p>
                  <p className='text-muted-foreground text-xs'>
                    {t('contract.description')}
                  </p>
                </div>
              </div>

              <Button
                disabled={generateFilledContract.isPending}
                onClick={handleDownload}
                type='button'
                variant='outline'
              >
                {generateFilledContract.isPending ? (
                  <Spinner />
                ) : (
                  <Download className='size-4' />
                )}
                {generateFilledContract.isPending
                  ? t('buttons.download.loading')
                  : t('buttons.download.default')}
              </Button>
            </div>
          </Field>
        </FieldGroup>
      </FieldSet>
    )
  }
})
