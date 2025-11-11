'use client'

import { useStore } from '@tanstack/react-form'
import { CircleX, Mail, Save, UserRoundPen, UserRoundPlus } from 'lucide-react'
import { useTranslations } from 'next-intl'

import { useAppForm } from '~/client/components/form/config'
import { Button } from '~/client/components/ui/button'
import { Field, FieldGroup, FieldSet } from '~/client/components/ui/field'
import { Spinner } from '~/client/components/ui/spinner'
import { CreateUserSchema } from '~/shared/validation/schemas/user/create-user'

const formId = 'create-user-form'

interface CreateUserFormProps {
  className?: string
  isPending?: boolean
  onSubmit?: (value: CreateUserSchema) => void | Promise<void>
  onCancel?: () => void
}

export function CreateUserForm({
  className,
  isPending,
  onSubmit,
  onCancel
}: CreateUserFormProps) {
  const t = useTranslations()

  const defaultValues: CreateUserSchema = {
    email: '',
    firstName: '',
    lastName: '',
    phoneNumber: ''
  }

  const form = useAppForm({
    defaultValues,
    onSubmit: async ({ value, formApi }) => {
      await onSubmit?.(value)
      // formApi.reset()
    },
    validators: {
      onSubmit: CreateUserSchema
    }
  })

  const isSubmitting = useStore(form.store, (state) => state.isSubmitting)
  const isLoading = isPending || isSubmitting

  const handleOnSubmit: React.FormEventHandler<HTMLFormElement> = (e) => {
    e.preventDefault()
    form.handleSubmit()
  }

  function handleOnCancel() {
    onCancel?.()
    form.reset()
  }

  return (
    <form className={className} id={formId} onSubmit={handleOnSubmit}>
      <FieldGroup>
        <FieldSet>
          <FieldGroup>
            <form.AppField name='email'>
              {(field) => (
                <field.Text
                  addons={[{ icon: Mail }]}
                  isLoading={isLoading}
                  label={t(
                    'modules.(app).(admin).users._components.create-user-dialog.create-user-form.fields.email.title'
                  )}
                  placeholder={t(
                    'modules.(app).(admin).users._components.create-user-dialog.create-user-form.fields.email.placeholder'
                  )}
                />
              )}
            </form.AppField>

            <form.AppField name='lastName'>
              {(field) => (
                <field.Text
                  addons={[{ icon: UserRoundPen }]}
                  isLoading={isLoading}
                  label={t(
                    'modules.(app).(admin).users._components.create-user-dialog.create-user-form.fields.lastName.title'
                  )}
                  placeholder={t(
                    'modules.(app).(admin).users._components.create-user-dialog.create-user-form.fields.lastName.placeholder'
                  )}
                />
              )}
            </form.AppField>

            <form.AppField name='firstName'>
              {(field) => (
                <field.Text
                  addons={[{ icon: UserRoundPen }]}
                  isLoading={isLoading}
                  label={t(
                    'modules.(app).(admin).users._components.create-user-dialog.create-user-form.fields.firstName.title'
                  )}
                  placeholder={t(
                    'modules.(app).(admin).users._components.create-user-dialog.create-user-form.fields.firstName.placeholder'
                  )}
                />
              )}
            </form.AppField>

            <form.AppField name='phoneNumber'>
              {(field) => (
                <field.Phone
                  isLoading={isLoading}
                  label={t(
                    'modules.(app).(admin).users._components.create-user-dialog.create-user-form.fields.phoneNumber.title'
                  )}
                  placeholder={t(
                    'modules.(app).(admin).users._components.create-user-dialog.create-user-form.fields.phoneNumber.placeholder'
                  )}
                />
              )}
            </form.AppField>
          </FieldGroup>
        </FieldSet>

        <FieldGroup className='md:flex-row md:justify-end'>
          <Field className='md:w-fit'>
            <Button
              disabled={isLoading}
              onClick={handleOnCancel}
              variant='outline'
            >
              <CircleX />
              {t(
                'modules.(app).(admin).users._components.create-user-dialog.create-user-form.buttons.cancel'
              )}
            </Button>
          </Field>

          <Field className='md:w-fit'>
            <Button disabled={isLoading} type='submit'>
              {isLoading ? <Spinner /> : <UserRoundPlus />}
              {isLoading
                ? t(
                    'modules.(app).(admin).users._components.create-user-dialog.create-user-form.buttons.submit.loading'
                  )
                : t(
                    'modules.(app).(admin).users._components.create-user-dialog.create-user-form.buttons.submit.default'
                  )}
            </Button>
          </Field>
        </FieldGroup>
      </FieldGroup>
    </form>
  )
}
