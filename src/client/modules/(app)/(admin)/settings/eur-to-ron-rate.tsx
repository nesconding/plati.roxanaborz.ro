'use client'

import { useStore } from '@tanstack/react-form'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { BadgeEuro, Euro, Save } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'
import z from 'zod'
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
import { Spinner } from '~/client/components/ui/spinner'
import { useTRPC } from '~/client/trpc/react'
import { NumericString } from '~/shared/validation/utils'

const schema = z.object({
  data: NumericString()
})

interface EURToRONRateProps {
  className?: string
}

export function EURToRONRate({ className }: EURToRONRateProps) {
  const t = useTranslations('modules.(app).(admin).settings.eur-to-ron-rate')
  const trpc = useTRPC()
  const queryClient = useQueryClient()
  const getEURToRONRate = useQuery(
    trpc.protected.settings.getEURToRONRate.queryOptions(undefined, {
      initialData: ''
    })
  )
  const updateEURToRONRate = useMutation(
    trpc.admin.settings.updateEURToRONRate.mutationOptions()
  )

  const form = useAppForm({
    defaultValues: { data: getEURToRONRate.data },
    onSubmit: async ({ value, formApi }) =>
      updateEURToRONRate.mutate(value.data, {
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
            queryKey: trpc.protected.settings.getEURToRONRate.queryKey()
          })
          toast.success(t('response.success.title'), {
            classNames: {
              description: '!text-muted-foreground',
              icon: 'text-primary'
            },
            description: t('response.success.description')
          })
          formApi.reset()
          updateEURToRONRate.reset()
        }
      }),
    validators: { onSubmit: schema }
  })

  const [isSubmitting, isDefaultValue] = useStore(form.store, (state) => [
    state.isSubmitting,
    state.isDefaultValue
  ])
  const isLoading = updateEURToRONRate.isPending || isSubmitting
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
          <form.AppField name='data'>
            {(field) => (
              <field.Number
                addons={[
                  { align: 'inline-start', icon: BadgeEuro },
                  { align: 'inline-end', icon: Euro }
                ]}
                isLoading={isLoading}
                min={0}
                placeholder={t('placeholder')}
                step={0.01}
              />
            )}
          </form.AppField>
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
