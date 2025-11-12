'use client'

import { Copy, CopyCheck, Link2, LinkIcon, RotateCcw } from 'lucide-react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { useState } from 'react'
import { Button } from '~/client/components/ui/button'
import { ButtonGroup } from '~/client/components/ui/button-group'
import { Field, FieldGroup } from '~/client/components/ui/field'
import { Input } from '~/client/components/ui/input'

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from '~/client/components/ui/tooltip'
import { cn } from '~/client/lib/utils'
import { CreateProductPaymentLinkFormStep } from '~/client/modules/(app)/payment-links/create/create-product-payment-link-form/stepper/config'
import type { TRPCRouterOutput } from '~/client/trpc/react'

type ProductPaymentLinkCreateOneResponse =
  TRPCRouterOutput['protected']['productPaymentLinks']['createOne']

function getPaymentLinkUrl(paymentLink: ProductPaymentLinkCreateOneResponse) {
  return new URL(
    `${globalThis.location.origin}/checkout/${paymentLink.id}`
  ).toString()
}

export function SuccessStep({
  onReset,
  createOnePaymentLinkResponse
}: {
  onReset?: () => void
  createOnePaymentLinkResponse?: ProductPaymentLinkCreateOneResponse
}) {
  const [isUrlCopied, setIsUrlCopied] = useState(false)
  const t = useTranslations(
    `modules.(app).payment-links._components.create-payment-link-form.steps.${CreateProductPaymentLinkFormStep.Success}`
  )

  if (!createOnePaymentLinkResponse) return null
  const paymentLinkUrl = getPaymentLinkUrl(createOnePaymentLinkResponse)

  const handleOnClickCopy = () => {
    navigator.clipboard.writeText(paymentLinkUrl)
    setIsUrlCopied(true)
    setTimeout(() => {
      setIsUrlCopied(false)
    }, 5000)
  }

  return (
    <FieldGroup>
      <Field>
        <ButtonGroup>
          <Button className='pointer-events-none' variant='outline'>
            <LinkIcon />
          </Button>

          <Input readOnly value={paymentLinkUrl} />

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                className='relative'
                onClick={handleOnClickCopy}
                size='icon'
                type='button'
              >
                <Copy
                  className={cn(
                    'absolute flex rotate-0 items-center gap-1 transition-all',
                    {
                      'scale-0 -rotate-90': isUrlCopied,
                      'scale-100': !isUrlCopied
                    }
                  )}
                />

                <CopyCheck
                  className={cn(
                    'absolute flex rotate-0 items-center gap-1 transition-all',
                    {
                      'scale-0 rotate-90': !isUrlCopied,
                      'scale-100': isUrlCopied
                    }
                  )}
                />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {isUrlCopied ? t('buttons.copy.copied') : t('buttons.copy.copy')}
            </TooltipContent>
          </Tooltip>
        </ButtonGroup>
      </Field>

      <FieldGroup className='gap-3 sm:flex-row sm:justify-end'>
        <Button asChild type='button' variant='secondary'>
          <Link href='/payment-links'>
            <Link2 />
            {t('buttons.go-to-payment-links')}
          </Link>
        </Button>

        <Button onClick={onReset} type='button'>
          <RotateCcw />
          {t('buttons.start-again')}
        </Button>
      </FieldGroup>
    </FieldGroup>
  )
}
