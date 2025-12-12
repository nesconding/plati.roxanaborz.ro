'use client'

import { useStore } from '@tanstack/react-form'
import { Building2, User } from 'lucide-react'
import { useTranslations } from 'next-intl'

import { withForm } from '~/client/components/form/config'
import { FieldGroup, FieldLegend, FieldSet } from '~/client/components/ui/field'
import { Label } from '~/client/components/ui/label'
import { RadioGroup, RadioGroupItem } from '~/client/components/ui/radio-group'
import {
  BillingType,
  CheckoutFormDefaultValues as defaultValues,
  CheckoutFormSection
} from '~/client/modules/checkout/checkout-form/schema'
import { CheckoutFormStep } from '~/client/modules/checkout/checkout-form/stepper/config'

export const BillingTypeSelector = withForm({
  defaultValues,

  render: function Render({ form }) {
    const t = useTranslations(
      `modules.(app).checkout._components.checkout-form.steps.${CheckoutFormStep.BillingInfo}.forms.billing-type`
    )

    // Get current billing type from billingData
    const currentBillingType = useStore(
      form.store,
      (state) => state.values[CheckoutFormSection.BillingData].type
    )

    const handleBillingTypeChange = (value: BillingType) => {
      const defaultAddress = {
        apartment: '',
        building: '',
        city: '',
        country: '',
        county: '',
        entrance: '',
        floor: '',
        postalCode: '',
        street: '',
        streetNumber: ''
      }

      if (value === BillingType.PERSON) {
        // Switch to person billing data
        form.setFieldValue(CheckoutFormSection.BillingData, {
          address: defaultAddress,
          cnp: '',
          email: '',
          name: '',
          phoneNumber: '',
          surname: '',
          type: BillingType.PERSON
        })
      } else {
        // Switch to company billing data
        form.setFieldValue(CheckoutFormSection.BillingData, {
          bank: '',
          bankAccount: '',
          cui: '',
          name: '',
          registrationNumber: '',
          representativeLegal: '',
          socialHeadquarters: defaultAddress,
          type: BillingType.COMPANY
        })
      }
    }

    return (
      <FieldSet>
        <FieldLegend>{t('legend')}</FieldLegend>

        <FieldGroup>
          <RadioGroup
            className='grid grid-cols-2 gap-4'
            onValueChange={(value) =>
              handleBillingTypeChange(value as BillingType)
            }
            value={currentBillingType}
          >
            <div>
              <RadioGroupItem
                className='peer sr-only'
                id='billing-type-person'
                value={BillingType.PERSON}
              />
              <Label
                className='border-muted bg-popover hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary flex cursor-pointer flex-col items-center justify-between rounded-md border-2 p-4'
                htmlFor='billing-type-person'
              >
                <User className='mb-3 size-6' />
                <span className='text-sm font-medium'>
                  {t('options.person.label')}
                </span>
                <span className='text-muted-foreground text-xs'>
                  {t('options.person.description')}
                </span>
              </Label>
            </div>

            <div>
              <RadioGroupItem
                className='peer sr-only'
                id='billing-type-company'
                value={BillingType.COMPANY}
              />
              <Label
                className='border-muted bg-popover hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary flex cursor-pointer flex-col items-center justify-between rounded-md border-2 p-4'
                htmlFor='billing-type-company'
              >
                <Building2 className='mb-3 size-6' />
                <span className='text-sm font-medium'>
                  {t('options.company.label')}
                </span>
                <span className='text-muted-foreground text-xs'>
                  {t('options.company.description')}
                </span>
              </Label>
            </div>
          </RadioGroup>
        </FieldGroup>
      </FieldSet>
    )
  }
})
