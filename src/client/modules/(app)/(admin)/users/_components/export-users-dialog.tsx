'use client'

import { useState } from 'react'

import { DateArg, format } from 'date-fns'
import { ro } from 'date-fns/locale'
import { parsePhoneNumberFromString } from 'libphonenumber-js'
import { CircleX, Download, FilePenLine } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'

import { Button } from '~/client/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '~/client/components/ui/dialog'
import { Field, FieldGroup, FieldLabel } from '~/client/components/ui/field'
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput
} from '~/client/components/ui/input-group'
import { Spinner } from '~/client/components/ui/spinner'
import { createXLSXFile } from '~/client/lib/xlsx'
import { TRPCRouterOutput } from '~/client/trpc/react'

type User = TRPCRouterOutput['admin']['authentication']['listUsers'][number]

interface ExportUsersDialogProps {
  users?: User[] | null
  onCloseDialog?: () => void
}

const formatDate = (date: DateArg<Date> & {}) =>
  format(date, 'PPP - HH:mm', { locale: ro })

export function ExportUsersDialog({
  users,
  onCloseDialog
}: ExportUsersDialogProps) {
  const t = useTranslations()
  const [isPending, setIsPending] = useState(false)
  const [fileName, setFileName] = useState(
    `Utilizatori - ${format(new Date(), 'PPPpp', { locale: ro })}`
  )
  if (!users) return null

  async function handleOnClick() {
    if (!users) return

    try {
      setIsPending(true)

      const data = users.map((user) => ({
        [t(
          'modules.(app).(admin).users._components.export-users-dialog.columns.id'
        )]: user.id,
        [t(
          'modules.(app).(admin).users._components.export-users-dialog.columns.lastName'
        )]: user.lastName,
        [t(
          'modules.(app).(admin).users._components.export-users-dialog.columns.firstName'
        )]: user.firstName,
        [t(
          'modules.(app).(admin).users._components.export-users-dialog.columns.name'
        )]: user.name,
        [t(
          'modules.(app).(admin).users._components.export-users-dialog.columns.email'
        )]: user.email,
        [t(
          'modules.(app).(admin).users._components.export-users-dialog.columns.emailVerified'
        )]: user.emailVerified
          ? t(
              'modules.(app).(admin).users._components.users-table.row.emailVerified.values.true'
            )
          : t(
              'modules.(app).(admin).users._components.users-table.row.emailVerified.values.false'
            ),
        [t(
          'modules.(app).(admin).users._components.export-users-dialog.columns.phoneNumber'
        )]: user.phoneNumber
          ? parsePhoneNumberFromString(user.phoneNumber)?.formatInternational()
          : undefined,
        [t(
          'modules.(app).(admin).users._components.export-users-dialog.columns.role'
        )]: t(
          `modules.(app).(admin).users._components.users-table.row.role.values.${user.role}`
        ),
        [t(
          'modules.(app).(admin).users._components.export-users-dialog.columns.banned'
        )]: user.banned
          ? t(
              'modules.(app).(admin).users._components.users-table.row.banned.values.banned'
            )
          : t(
              'modules.(app).(admin).users._components.users-table.row.banned.values.not-banned'
            ),
        [t(
          'modules.(app).(admin).users._components.export-users-dialog.columns.banExpires'
        )]: user.banExpires ? formatDate(user.banExpires) : undefined,
        [t(
          'modules.(app).(admin).users._components.export-users-dialog.columns.banExpiresValue'
        )]: user.banExpires ? user.banExpires : undefined,
        [t(
          'modules.(app).(admin).users._components.export-users-dialog.columns.invitedBy_name'
        )]: user.invitedBy?.name,
        [t(
          'modules.(app).(admin).users._components.export-users-dialog.columns.createdAt'
        )]: formatDate(user.createdAt),
        [t(
          'modules.(app).(admin).users._components.export-users-dialog.columns.createdAtValue'
        )]: user.createdAt,
        [t(
          'modules.(app).(admin).users._components.export-users-dialog.columns.updatedAt'
        )]: formatDate(user.updatedAt),
        [t(
          'modules.(app).(admin).users._components.export-users-dialog.columns.updatedAtValue'
        )]: user.updatedAt
      }))

      await createXLSXFile(data, fileName)

      toast.success(
        t(
          'modules.(app).(admin).users._components.export-users-dialog.response.success.title'
        ),
        {
          description: t(
            'modules.(app).(admin).users._components.export-users-dialog.response.success.description'
          ),
          classNames: {
            icon: 'text-primary',
            description: '!text-muted-foreground'
          }
        }
      )
      handleOnOpenChange(false)
    } catch (error) {
      console.error(error)
      toast.error(
        t(
          'modules.(app).(admin).users._components.export-users-dialog.response.error.title'
        ),
        {
          description:
            error instanceof Error
              ? error.message
              : t(
                  'modules.(app).(admin).users._components.export-users-dialog.response.error.description'
                ),
          className: '!text-destructive-foreground',
          classNames: {
            icon: 'text-destructive',
            title: '!text-destructive',
            description: '!text-muted-foreground'
          }
        }
      )
    } finally {
      setIsPending(false)
    }
  }

  function handleOnOpenChange(open: boolean) {
    if (isPending) return
    if (!open) onCloseDialog?.()
  }

  return (
    <Dialog open={!!users} onOpenChange={handleOnOpenChange}>
      <DialogContent>
        <FieldGroup>
          <DialogHeader>
            <DialogTitle>
              {t(
                'modules.(app).(admin).users._components.export-users-dialog.title'
              )}
            </DialogTitle>
            <DialogDescription>
              {t(
                'modules.(app).(admin).users._components.export-users-dialog.description'
              )}
            </DialogDescription>
          </DialogHeader>

          <Field>
            <FieldLabel htmlFor='filename-input'>
              {t(
                'modules.(app).(admin).users._components.export-users-dialog.filename.title'
              )}
            </FieldLabel>

            <InputGroup>
              <InputGroupInput
                id='filename-input'
                name='filename-input'
                value={fileName}
                className='overflow-ellipsis'
                onChange={(e) => setFileName(e.target.value)}
                placeholder={t(
                  'modules.(app).(admin).users._components.export-users-dialog.filename.placeholder'
                )}
              />

              <InputGroupAddon align='inline-start'>
                <FilePenLine />
              </InputGroupAddon>
            </InputGroup>
          </Field>

          <DialogFooter>
            <DialogClose asChild>
              <Button variant='outline' disabled={isPending}>
                <CircleX />
                {t(
                  'modules.(app).(admin).users._components.export-users-dialog.buttons.cancel'
                )}
              </Button>
            </DialogClose>

            <Button disabled={isPending} onClick={handleOnClick}>
              {isPending ? <Spinner /> : <Download />}
              {isPending
                ? t(
                    'modules.(app).(admin).users._components.export-users-dialog.buttons.confirm.loading'
                  )
                : t(
                    'modules.(app).(admin).users._components.export-users-dialog.buttons.confirm.default'
                  )}
            </Button>
          </DialogFooter>
        </FieldGroup>
      </DialogContent>
    </Dialog>
  )
}
