'use client'

import { useStore } from '@tanstack/react-form'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Blocks,
  Building2,
  CreditCard,
  DoorOpen,
  FileDigit,
  Gavel,
  Globe,
  Hash,
  Home,
  IdCard,
  Landmark,
  Layers,
  MapPin,
  Route,
  Save,
  Signature,
  Signpost
} from 'lucide-react'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'

import { useAppForm } from '~/client/components/form/config'
import { Button } from '~/client/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '~/client/components/ui/card'
import {
  FieldGroup,
  FieldLegend,
  FieldSeparator,
  FieldSet
} from '~/client/components/ui/field'
import { Spinner } from '~/client/components/ui/spinner'
import { ROMANIAN_COUNTIES } from '~/client/constants'
import { useTRPC } from '~/client/trpc/react'
import { BankDetailsTableValidators } from '~/shared/validation/tables'

const schema = BankDetailsTableValidators.update.omit({
  createdAt: true,
  id: true,
  updatedAt: true
})

interface BankDetailsSettingsProps {
  className?: string
}

export function BankDetailsSettings({ className }: BankDetailsSettingsProps) {
  const t = useTranslations('modules.(app).(admin).settings.bank-details')
  const trpc = useTRPC()
  const queryClient = useQueryClient()
  const getBankDetails = useQuery(
    trpc.public.settings.getBankDetails.queryOptions(undefined)
  )
  const updateBankDetails = useMutation(
    trpc.admin.settings.updateBankDetails.mutationOptions()
  )

  const form = useAppForm({
    defaultValues:
      getBankDetails.data as typeof BankDetailsTableValidators.$types.update,
    onSubmit: async ({ value, formApi }) =>
      updateBankDetails.mutate(value, {
        onError: (error) => {
          toast.error(t('response.error.title'), {
            className: '!text-destructive-foreground',
            classNames: {
              description: '!text-muted-foreground',
              icon: 'text-destructive',
              title: '!text-destructive'
            },
            description:
              error instanceof Error
                ? error.message
                : t('response.error.description')
          })
          console.error(error)
        },
        onSuccess: () => {
          queryClient.invalidateQueries({
            queryKey: trpc.public.settings.getBankDetails.queryKey()
          })
          toast.success(t('response.success.title'), {
            classNames: {
              description: '!text-muted-foreground',
              icon: 'text-primary'
            },
            description: t('response.success.description')
          })
          formApi.reset()
          updateBankDetails.reset()
        }
      }),
    validators: { onSubmit: schema }
  })

  const [isSubmitting, isDefaultValue] = useStore(form.store, (state) => [
    state.isSubmitting,
    state.isDefaultValue
  ])
  const isLoading = updateBankDetails.isPending || isSubmitting
  const canSubmit = !isDefaultValue && !isLoading

  function handleOnSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    form.handleSubmit()
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('title')}</CardTitle>
        <CardDescription>{t('description')}</CardDescription>
      </CardHeader>

      <CardContent>
        <form className={className} id={form.formId} onSubmit={handleOnSubmit}>
          <FieldGroup>
            <FieldSet>
              <FieldLegend>{t('fields.details.legend')}</FieldLegend>

              <FieldGroup>
                <form.AppField name='bank'>
                  {(field) => (
                    <field.Text
                      addons={[{ icon: Landmark }]}
                      label={t('fields.details.bank.title')}
                      placeholder={t('fields.details.bank.placeholder')}
                    />
                  )}
                </form.AppField>
                <form.AppField name='iban'>
                  {(field) => (
                    <field.Text
                      addons={[{ icon: CreditCard }]}
                      label={t('fields.details.iban.title')}
                      placeholder={t('fields.details.iban.placeholder')}
                    />
                  )}
                </form.AppField>

                <form.AppField name='bic'>
                  {(field) => (
                    <field.Text
                      addons={[{ icon: Hash }]}
                      label={t('fields.details.bic.title')}
                      placeholder={t('fields.details.bic.placeholder')}
                    />
                  )}
                </form.AppField>

                <form.AppField name='cui'>
                  {(field) => (
                    <field.Text
                      addons={[{ icon: IdCard }]}
                      label={t('fields.details.cui.title')}
                      placeholder={t('fields.details.cui.placeholder')}
                    />
                  )}
                </form.AppField>

                <form.AppField name='name'>
                  {(field) => (
                    <field.Text
                      addons={[{ icon: Signature }]}
                      label={t('fields.details.name.title')}
                      placeholder={t('fields.details.name.placeholder')}
                    />
                  )}
                </form.AppField>

                <form.AppField name='registrationNumber'>
                  {(field) => (
                    <field.Text
                      addons={[{ icon: FileDigit }]}
                      label={t('fields.details.registrationNumber.title')}
                      placeholder={t(
                        'fields.details.registrationNumber.placeholder'
                      )}
                    />
                  )}
                </form.AppField>

                <form.AppField name='representativeLegal'>
                  {(field) => (
                    <field.Text
                      addons={[{ icon: Gavel }]}
                      label={t('fields.details.representativeLegal.title')}
                      placeholder={t(
                        'fields.details.representativeLegal.placeholder'
                      )}
                    />
                  )}
                </form.AppField>
              </FieldGroup>
            </FieldSet>

            <FieldSeparator />

            <FieldSet>
              <FieldLegend>{t('fields.address.legend')}</FieldLegend>

              {/* Street and Number Row */}
              <FieldGroup className='sm:flex-row sm:items-start'>
                <form.AppField name='address.street'>
                  {(field) => (
                    <field.Text
                      addons={[{ icon: Route }]}
                      label={t('fields.address.street.title')}
                      placeholder={t('fields.address.street.placeholder')}
                    />
                  )}
                </form.AppField>

                <form.AppField name='address.streetNumber'>
                  {(field) => (
                    <field.Text
                      addons={[{ icon: Signpost }]}
                      label={t('fields.address.streetNumber.title')}
                      placeholder={t('fields.address.streetNumber.placeholder')}
                    />
                  )}
                </form.AppField>
              </FieldGroup>

              {/* Building Details Row */}
              <FieldGroup className='sm:flex-row sm:items-start'>
                <form.AppField name='address.building'>
                  {(field) => (
                    <field.Text
                      addons={[{ icon: Blocks }]}
                      label={t('fields.address.building.title')}
                      placeholder={t('fields.address.building.placeholder')}
                    />
                  )}
                </form.AppField>

                <form.AppField name='address.entrance'>
                  {(field) => (
                    <field.Text
                      addons={[{ icon: DoorOpen }]}
                      label={t('fields.address.entrance.title')}
                      placeholder={t('fields.address.entrance.placeholder')}
                    />
                  )}
                </form.AppField>

                <form.AppField name='address.floor'>
                  {(field) => (
                    <field.Text
                      addons={[{ icon: Layers }]}
                      label={t('fields.address.floor.title')}
                      placeholder={t('fields.address.floor.placeholder')}
                    />
                  )}
                </form.AppField>

                <form.AppField name='address.apartment'>
                  {(field) => (
                    <field.Text
                      addons={[{ icon: Home }]}
                      label={t('fields.address.apartment.title')}
                      placeholder={t('fields.address.apartment.placeholder')}
                    />
                  )}
                </form.AppField>
              </FieldGroup>

              {/* City and County Row */}
              <FieldGroup className='sm:flex-row sm:items-start'>
                <form.AppField name='address.city'>
                  {(field) => (
                    <field.Text
                      addons={[{ icon: Building2 }]}
                      label={t('fields.address.city.title')}
                      placeholder={t('fields.address.city.placeholder')}
                    />
                  )}
                </form.AppField>

                <form.AppField name='address.county'>
                  {(field) => (
                    <field.Select
                      label={t('fields.address.county.title')}
                      options={ROMANIAN_COUNTIES.map((county) => ({
                        label: county,
                        value: county
                      }))}
                      placeholder={t('fields.address.county.placeholder')}
                      valueKey='value'
                    />
                  )}
                </form.AppField>
              </FieldGroup>

              {/* Postal Code and Country Row */}
              <FieldGroup className='sm:flex-row sm:items-start'>
                <form.AppField name='address.postalCode'>
                  {(field) => (
                    <field.Text
                      addons={[{ icon: MapPin }]}
                      label={t('fields.address.postalCode.title')}
                      placeholder={t('fields.address.postalCode.placeholder')}
                    />
                  )}
                </form.AppField>

                <form.AppField name='address.country'>
                  {(field) => (
                    <field.Text
                      addons={[{ icon: Globe }]}
                      label={t('fields.address.country.title')}
                      placeholder={t('fields.address.country.placeholder')}
                    />
                  )}
                </form.AppField>
              </FieldGroup>
            </FieldSet>
          </FieldGroup>
        </form>
      </CardContent>

      <CardFooter className='flex items-center justify-end gap-3 md:flex-row flex-col'>
        <Button
          className='w-full md:w-fit'
          disabled={!canSubmit}
          form={form.formId}
          type='submit'
        >
          {isLoading ? <Spinner /> : <Save />}
          {isLoading
            ? t('buttons.submit.loading')
            : t('buttons.submit.default')}
        </Button>
      </CardFooter>
    </Card>
  )
}
