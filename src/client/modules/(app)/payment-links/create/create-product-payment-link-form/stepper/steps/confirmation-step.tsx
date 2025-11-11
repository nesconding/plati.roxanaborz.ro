'use client'

import { withForm } from '~/client/components/form/config'
import { CreateProductPaymentLinkFormDefaultValues } from '~/shared/create-product-payment-link-form/create-product-payment-link-form-schema'

export const ConfirmationStep = withForm({
  defaultValues: CreateProductPaymentLinkFormDefaultValues,
  render: function Render({ form }) {
    return (
      <div className='flex flex-col gap-4'>
        {Object.entries(form.state.values).map(([key, value]) => (
          <div className='flex flex-col gap-2' key={key}>
            <div className='font-semibold'>{key}</div>
            <div className='flex flex-col gap-2 pl-4'>
              {Object.entries(value).map(([key, v]) => (
                <div className='flex gap-2 items-start' key={key}>
                  <div className='font-medium'>{key}</div>
                  <div>{v.toString()}</div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    )
  }
})
