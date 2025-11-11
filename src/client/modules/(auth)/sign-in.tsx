'use client'

import { useForm, useStore } from '@tanstack/react-form'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { LogIn, Mail } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'
import z from 'zod'

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
  Field,
  FieldError,
  FieldGroup,
  FieldLabel
} from '~/client/components/ui/field'
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput
} from '~/client/components/ui/input-group'
import { Spinner } from '~/client/components/ui/spinner'
import { useTRPC } from '~/client/trpc/react'

const formId = 'sign-in-form'
const defaultValues = {
  email: ''
}

export function SignInModule() {
  const t = useTranslations()
  const queryClient = useQueryClient()
  const router = useRouter()
  const trpc = useTRPC()
  const signIn = useMutation(
    trpc.public.authentication.signIn.mutationOptions()
  )

  const form = useForm({
    defaultValues,
    onSubmit: async ({ value, formApi }) =>
      signIn.mutate(value, {
        onError: (error) => {
          console.error(error)
          toast.error(t('modules.(auth).sign-in.form.response.error.title'), {
            className: '!text-destructive-foreground',
            classNames: {
              description: '!text-muted-foreground',
              icon: 'text-destructive',
              title: '!text-destructive'
            },
            description:
              error instanceof Error
                ? error.message
                : t('modules.(auth).sign-in.form.response.error.description')
          })
        },
        onSuccess: async () => {
          await queryClient.invalidateQueries({
            queryKey: trpc.public.authentication.getSession.queryKey()
          })
          toast.success(
            t('modules.(auth).sign-in.form.response.success.title'),
            {
              classNames: {
                description: '!text-muted-foreground',
                icon: 'text-primary'
              },
              description: t(
                'modules.(auth).sign-in.form.response.success.description'
              )
            }
          )
          router.push(`/sent-email?email=${value.email}`)
          formApi.reset()
        }
      }),
    validators: {
      onSubmit: z.object({
        email: z.email()
      })
    }
  })

  const isSubmitting = useStore(form.store, (state) => state.isSubmitting)
  const isPristine = useStore(form.store, (state) => state.isPristine)
  const isDefaultValue = useStore(form.store, (state) => state.isDefaultValue)

  const isLoading = signIn.isPending || isSubmitting
  const isDisabled = isPristine || isDefaultValue || isLoading

  const handleOnSubmit: React.FormEventHandler<HTMLFormElement> = (e) => {
    e.preventDefault()
    form.handleSubmit()
  }

  return (
    <Card className='w-full gap-7 sm:max-w-md'>
      <CardHeader>
        <CardTitle>{t('modules.(auth).sign-in.title')}</CardTitle>
        <CardDescription>
          {t('modules.(auth).sign-in.description')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form id={formId} onSubmit={handleOnSubmit}>
          <FieldGroup>
            <form.Field name='email'>
              {(field) => {
                const isInvalid =
                  field.state.meta.isTouched && !field.state.meta.isValid
                return (
                  <Field data-disabled={isLoading} data-invalid={isInvalid}>
                    <FieldLabel htmlFor={field.name}>
                      {t('modules.(auth).sign-in.form.fields.email.title')}
                    </FieldLabel>

                    <InputGroup
                      aria-invalid={isInvalid}
                      data-disabled={isLoading}
                    >
                      <InputGroupInput
                        aria-invalid={isInvalid}
                        autoComplete='email'
                        disabled={isLoading}
                        id={field.name}
                        name={field.name}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        placeholder={t(
                          'modules.(auth).sign-in.form.fields.email.placeholder'
                        )}
                        value={field.state.value}
                      />
                      <InputGroupAddon>
                        <Mail className='group-has-aria-invalid/input-group:text-destructive' />
                      </InputGroupAddon>
                    </InputGroup>

                    {isInvalid && (
                      <FieldError
                        errors={field.state.meta.errors.map((error) => ({
                          ...error,
                          message: t(error?.message ?? '')
                        }))}
                      />
                    )}
                  </Field>
                )
              }}
            </form.Field>
          </FieldGroup>
        </form>
      </CardContent>
      <CardFooter>
        <Field orientation='horizontal'>
          <Button
            className='w-full'
            disabled={isDisabled}
            form={formId}
            type='submit'
          >
            {isLoading ? <Spinner /> : <LogIn />}
            {isLoading
              ? t('modules.(auth).sign-in.form.buttons.submit.loading')
              : t('modules.(auth).sign-in.form.buttons.submit.default')}
          </Button>
        </Field>
      </CardFooter>
    </Card>
  )
}
