'use client'

import { PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js'
import { useForm, useStore } from '@tanstack/react-form'
import {
  Building2,
  Landmark,
  Mail,
  MapPin,
  Route,
  Signpost,
  UserRoundPen
} from 'lucide-react'
import { z } from 'zod'

import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSeparator,
  FieldSet
} from '~/client/components/ui/field'
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput
} from '~/client/components/ui/input-group'
import { PhoneInput } from '~/client/components/ui/phone-input'
import { cn } from '~/client/lib/utils'
import { UpdatePaymentFormValidator } from '~/validation/client/update-payment-form'

interface Subscription {
  id: string
  customerEmail: string
  customerFirstName: string
  customerLastName: string
  customerPhoneNumber: string
}

function getDefaultValues(
  subscription: Subscription
): UpdatePaymentFormValidator.$types.input {
  return {
    billingAddress: {
      city: '',
      country: 'RO',
      line1: '',
      postal_code: ''
    },
    email: subscription.customerEmail,
    firstName: subscription.customerFirstName,
    lastName: subscription.customerLastName,
    phoneNumber: subscription.customerPhoneNumber || '+40'
  }
}

interface UpdatePaymentFormProps {
  subscription: Subscription
  subscriptionId: string
  token: string
  className?: string
  formId?: string
}

export function UpdatePaymentForm({
  subscription,
  subscriptionId,
  token,
  className,
  formId = 'update-payment-form'
}: UpdatePaymentFormProps) {
  const elements = useElements()
  const stripe = useStripe()

  const form = useForm({
    defaultValues: getDefaultValues(subscription),
    onSubmit: async ({ value }) => {
      if (!elements || !stripe) return

      await elements.submit()
      await stripe.confirmSetup({
        confirmParams: {
          payment_method_data: {
            billing_details: value
          },
          return_url: `${window.location.origin}/update-payment/${subscriptionId}/callback?token=${token}`
        },
        elements
      })
    },
    validators: {
      onSubmit: UpdatePaymentFormValidator.schema
    }
  })

  const [isSubmitting, isPristine] = useStore(
    form.store,
    (state) => [state.isSubmitting, state.isPristine] as const
  )

  const isLoading = isSubmitting
  const isDisabled = isLoading

  const handleOnSubmit: React.FormEventHandler<HTMLFormElement> = (e) => {
    e.preventDefault()
    form.handleSubmit()
  }

  return (
    <form className={className} id={formId} onSubmit={handleOnSubmit}>
      <FieldGroup>
        <FieldSet>
          <FieldLegend>Personal Details</FieldLegend>
          <FieldDescription>Review your information</FieldDescription>

          <FieldGroup>
            <form.Field name='email'>
              {(field) => {
                const isInvalid =
                  field.state.meta.isTouched && !field.state.meta.isValid

                return (
                  <Field
                    aria-disabled={isDisabled}
                    data-disabled={isDisabled}
                    data-invalid={isInvalid}
                  >
                    <FieldLabel htmlFor={field.name}>Email</FieldLabel>

                    <InputGroup
                      aria-disabled={isDisabled}
                      aria-invalid={isInvalid}
                      className={cn({ 'opacity-50': isDisabled })}
                      data-disabled={isDisabled}
                    >
                      <InputGroupInput
                        aria-invalid={isInvalid}
                        autoComplete='email'
                        disabled={isDisabled}
                        id={field.name}
                        name={field.name}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        placeholder='Email'
                        value={field.state.value}
                      />
                      <InputGroupAddon>
                        <Mail className='group-has-aria-invalid/input-group:text-destructive' />
                      </InputGroupAddon>
                    </InputGroup>

                    {isInvalid && (
                      <FieldError errors={field.state.meta.errors} />
                    )}
                  </Field>
                )
              }}
            </form.Field>

            <form.Field name='firstName'>
              {(field) => {
                const isInvalid =
                  field.state.meta.isTouched && !field.state.meta.isValid

                return (
                  <Field
                    aria-disabled={isDisabled}
                    data-disabled={isDisabled}
                    data-invalid={isInvalid}
                  >
                    <FieldLabel htmlFor={field.name}>Name</FieldLabel>

                    <InputGroup
                      aria-disabled={isDisabled}
                      aria-invalid={isInvalid}
                      className={cn({ 'opacity-50': isDisabled })}
                      data-disabled={isDisabled}
                    >
                      <InputGroupInput
                        aria-invalid={isInvalid}
                        autoComplete='given-name'
                        disabled={isDisabled}
                        id={field.name}
                        name={field.name}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        placeholder='Name'
                        value={field.state.value}
                      />
                      <InputGroupAddon>
                        <UserRoundPen className='group-has-aria-invalid/input-group:text-destructive' />
                      </InputGroupAddon>
                    </InputGroup>

                    {isInvalid && (
                      <FieldError errors={field.state.meta.errors} />
                    )}
                  </Field>
                )
              }}
            </form.Field>

            <form.Field name='lastName'>
              {(field) => {
                const isInvalid =
                  field.state.meta.isTouched && !field.state.meta.isValid

                return (
                  <Field
                    aria-disabled={isDisabled}
                    data-disabled={isDisabled}
                    data-invalid={isInvalid}
                  >
                    <FieldLabel htmlFor={field.name}>Name</FieldLabel>

                    <InputGroup
                      aria-disabled={isDisabled}
                      aria-invalid={isInvalid}
                      className={cn({ 'opacity-50': isDisabled })}
                      data-disabled={isDisabled}
                    >
                      <InputGroupInput
                        aria-invalid={isInvalid}
                        autoComplete='given-name'
                        disabled={isDisabled}
                        id={field.name}
                        name={field.name}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        placeholder='Name'
                        value={field.state.value}
                      />
                      <InputGroupAddon>
                        <UserRoundPen className='group-has-aria-invalid/input-group:text-destructive' />
                      </InputGroupAddon>
                    </InputGroup>

                    {isInvalid && (
                      <FieldError errors={field.state.meta.errors} />
                    )}
                  </Field>
                )
              }}
            </form.Field>

            <form.Field name='phoneNumber'>
              {(field) => {
                const isInvalid =
                  field.state.meta.isTouched && !field.state.meta.isValid

                return (
                  <Field
                    aria-disabled={isDisabled}
                    data-disabled={isDisabled}
                    data-invalid={isInvalid}
                  >
                    <FieldLabel htmlFor={field.name}>Phone</FieldLabel>

                    <PhoneInput
                      aria-invalid={isInvalid}
                      autoComplete='tel'
                      defaultCountry='RO'
                      disabled={isDisabled}
                      id={field.name}
                      name={field.name}
                      onBlur={field.handleBlur}
                      onChange={field.handleChange}
                      placeholder='Phone'
                      value={field.state.value}
                    />

                    {isInvalid && (
                      <FieldError errors={field.state.meta.errors} />
                    )}
                  </Field>
                )
              }}
            </form.Field>
          </FieldGroup>
        </FieldSet>

        <FieldSeparator />

        <FieldSet>
          <FieldLegend>Billing Address</FieldLegend>
          <FieldDescription>Enter your billing address</FieldDescription>

          <FieldGroup>
            <form.Field name='billingAddress.line1'>
              {(field) => {
                const isInvalid =
                  field.state.meta.isTouched && !field.state.meta.isValid

                return (
                  <Field
                    aria-disabled={isDisabled}
                    data-disabled={isDisabled}
                    data-invalid={isInvalid}
                  >
                    <FieldLabel htmlFor={field.name}>Address Line 1</FieldLabel>

                    <InputGroup
                      aria-disabled={isDisabled}
                      aria-invalid={isInvalid}
                      className={cn({ 'opacity-50': isDisabled })}
                      data-disabled={isDisabled}
                    >
                      <InputGroupInput
                        aria-invalid={isInvalid}
                        autoComplete='billing address-line1'
                        disabled={isDisabled}
                        id={field.name}
                        name={field.name}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        placeholder='Address Line 1'
                        value={field.state.value}
                      />
                      <InputGroupAddon>
                        <Route className='group-has-aria-invalid/input-group:text-destructive' />
                      </InputGroupAddon>
                    </InputGroup>

                    {isInvalid && (
                      <FieldError errors={field.state.meta.errors} />
                    )}
                  </Field>
                )
              }}
            </form.Field>

            <form.Field name='billingAddress.line2'>
              {(field) => {
                const isInvalid =
                  field.state.meta.isTouched && !field.state.meta.isValid

                return (
                  <Field
                    aria-disabled={isDisabled}
                    data-disabled={isDisabled}
                    data-invalid={isInvalid}
                  >
                    <FieldLabel htmlFor={field.name}>
                      Address Line 2 (Optional)
                    </FieldLabel>

                    <InputGroup
                      aria-disabled={isDisabled}
                      aria-invalid={isInvalid}
                      className={cn({ 'opacity-50': isDisabled })}
                      data-disabled={isDisabled}
                    >
                      <InputGroupInput
                        aria-invalid={isInvalid}
                        autoComplete='billing address-line2'
                        disabled={isDisabled}
                        id={field.name}
                        name={field.name}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        placeholder='Address Line 2'
                        value={field.state.value}
                      />
                      <InputGroupAddon>
                        <Signpost className='group-has-aria-invalid/input-group:text-destructive' />
                      </InputGroupAddon>
                    </InputGroup>

                    {isInvalid && (
                      <FieldError errors={field.state.meta.errors} />
                    )}
                  </Field>
                )
              }}
            </form.Field>

            <form.Field name='billingAddress.city'>
              {(field) => {
                const isInvalid =
                  field.state.meta.isTouched && !field.state.meta.isValid

                return (
                  <Field
                    aria-disabled={isDisabled}
                    data-disabled={isDisabled}
                    data-invalid={isInvalid}
                  >
                    <FieldLabel htmlFor={field.name}>City</FieldLabel>

                    <InputGroup
                      aria-disabled={isDisabled}
                      aria-invalid={isInvalid}
                      className={cn({ 'opacity-50': isDisabled })}
                      data-disabled={isDisabled}
                    >
                      <InputGroupInput
                        aria-invalid={isInvalid}
                        autoComplete='billing city'
                        disabled={isDisabled}
                        id={field.name}
                        name={field.name}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        placeholder='City'
                        value={field.state.value}
                      />
                      <InputGroupAddon>
                        <Building2 className='group-has-aria-invalid/input-group:text-destructive' />
                      </InputGroupAddon>
                    </InputGroup>

                    {isInvalid && (
                      <FieldError errors={field.state.meta.errors} />
                    )}
                  </Field>
                )
              }}
            </form.Field>

            <form.Field name='billingAddress.state'>
              {(field) => {
                const isInvalid =
                  field.state.meta.isTouched && !field.state.meta.isValid

                return (
                  <Field
                    aria-disabled={isDisabled}
                    data-disabled={isDisabled}
                    data-invalid={isInvalid}
                  >
                    <FieldLabel htmlFor={field.name}>
                      State (Optional)
                    </FieldLabel>

                    <InputGroup
                      aria-disabled={isDisabled}
                      aria-invalid={isInvalid}
                      className={cn({ 'opacity-50': isDisabled })}
                      data-disabled={isDisabled}
                    >
                      <InputGroupInput
                        aria-invalid={isInvalid}
                        autoComplete='billing address-level1'
                        disabled={isDisabled}
                        id={field.name}
                        name={field.name}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        placeholder='State'
                        value={field.state.value}
                      />
                      <InputGroupAddon>
                        <MapPin className='group-has-aria-invalid/input-group:text-destructive' />
                      </InputGroupAddon>
                    </InputGroup>

                    {isInvalid && (
                      <FieldError errors={field.state.meta.errors} />
                    )}
                  </Field>
                )
              }}
            </form.Field>

            <form.Field name='billingAddress.postal_code'>
              {(field) => {
                const isInvalid =
                  field.state.meta.isTouched && !field.state.meta.isValid

                return (
                  <Field
                    aria-disabled={isDisabled}
                    data-disabled={isDisabled}
                    data-invalid={isInvalid}
                  >
                    <FieldLabel htmlFor={field.name}>Postal Code</FieldLabel>

                    <InputGroup
                      aria-disabled={isDisabled}
                      aria-invalid={isInvalid}
                      className={cn({ 'opacity-50': isDisabled })}
                      data-disabled={isDisabled}
                    >
                      <InputGroupInput
                        aria-invalid={isInvalid}
                        autoComplete='billing postal-code'
                        disabled={isDisabled}
                        id={field.name}
                        name={field.name}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        placeholder='Postal Code'
                        value={field.state.value}
                      />
                      <InputGroupAddon>
                        <MapPin className='group-has-aria-invalid/input-group:text-destructive' />
                      </InputGroupAddon>
                    </InputGroup>

                    {isInvalid && (
                      <FieldError errors={field.state.meta.errors} />
                    )}
                  </Field>
                )
              }}
            </form.Field>

            <form.Field name='billingAddress.country'>
              {(field) => {
                const isInvalid =
                  field.state.meta.isTouched && !field.state.meta.isValid

                return (
                  <Field
                    aria-disabled={isDisabled}
                    data-disabled={isDisabled}
                    data-invalid={isInvalid}
                  >
                    <FieldLabel htmlFor={field.name}>Country</FieldLabel>

                    <InputGroup
                      aria-disabled={isDisabled}
                      aria-invalid={isInvalid}
                      className={cn({ 'opacity-50': isDisabled })}
                      data-disabled={isDisabled}
                    >
                      <InputGroupInput
                        aria-invalid={isInvalid}
                        autoComplete='billing country'
                        disabled={isDisabled}
                        id={field.name}
                        name={field.name}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        placeholder='Country'
                        value={field.state.value}
                      />
                      <InputGroupAddon>
                        <Landmark className='group-has-aria-invalid/input-group:text-destructive' />
                      </InputGroupAddon>
                    </InputGroup>

                    {isInvalid && (
                      <FieldError errors={field.state.meta.errors} />
                    )}
                  </Field>
                )
              }}
            </form.Field>
          </FieldGroup>
        </FieldSet>

        <FieldSeparator />

        <FieldSet>
          <FieldLegend>Payment Method</FieldLegend>
          <FieldDescription>Enter your new payment details</FieldDescription>

          <FieldGroup>
            <Field>
              <PaymentElement
                options={{
                  defaultValues: {
                    billingDetails: { address: { country: 'RO' } }
                  }
                }}
              />
            </Field>
          </FieldGroup>
        </FieldSet>
      </FieldGroup>
    </form>
  )
}
