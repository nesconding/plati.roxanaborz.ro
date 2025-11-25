'use client'

import { useQuery } from '@tanstack/react-query'
import { FileText, Pen, Plus, Trash } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useState } from 'react'

import { Button } from '~/client/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '~/client/components/ui/card'
import { FieldGroup, FieldSeparator } from '~/client/components/ui/field'
import { Spinner } from '~/client/components/ui/spinner'
import { cn } from '~/client/lib/utils'
import { AddContractDialog } from '~/client/modules/(app)/(admin)/settings/_components/add-contract-dialog'
import { DeleteContractDialog } from '~/client/modules/(app)/(admin)/settings/_components/delete-contract-dialog'
import { EditContractDialog } from '~/client/modules/(app)/(admin)/settings/_components/edit-contract-dialog'
import { type TRPCRouterOutput, useTRPC } from '~/client/trpc/react'

type Contract = TRPCRouterOutput['protected']['contracts']['findAll'][number]

interface ContractSettingsProps {
  className?: string
}

export function ContractSettings({ className }: ContractSettingsProps) {
  const t = useTranslations('modules.(app).(admin).settings.contract-settings')
  const trpc = useTRPC()

  const findAllContracts = useQuery(
    trpc.protected.contracts.findAll.queryOptions(undefined, {
      initialData: []
    })
  )

  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [editContract, setEditContract] = useState<Contract | null>(null)
  const [deleteContract, setDeleteContract] = useState<Contract | null>(null)

  const isLoading = findAllContracts.isLoading

  return (
    <>
      <Card className={cn(className)}>
        <CardHeader>
          <CardTitle>{t('title')}</CardTitle>
          <CardDescription>{t('description')}</CardDescription>
        </CardHeader>

        <CardContent>
          {isLoading ? (
            <div className='flex items-center justify-center py-8'>
              <Spinner className='size-8' />
            </div>
          ) : findAllContracts.data.length === 0 ? (
            <div className='text-muted-foreground flex flex-col items-center justify-center gap-2 py-8'>
              <FileText className='size-12 opacity-50' />
              <p className='text-center text-sm'>{t('empty')}</p>
            </div>
          ) : (
            <FieldGroup>
              {findAllContracts.data.map((contract, index) => (
                <div key={contract.id}>
                  <div className='flex items-center justify-between gap-4'>
                    <div className='flex min-w-0 flex-1 items-center gap-3'>
                      <FileText className='text-muted-foreground size-5 shrink-0' />
                      <span className='truncate text-sm font-medium'>
                        {contract.name}
                      </span>
                    </div>

                    <div className='flex shrink-0 items-center gap-2'>
                      <Button
                        onClick={() => setEditContract(contract)}
                        size='icon-sm'
                        type='button'
                        variant='outline'
                      >
                        <Pen className='size-4' />
                      </Button>
                      <Button
                        onClick={() => setDeleteContract(contract)}
                        size='icon-sm'
                        type='button'
                        variant='destructive'
                      >
                        <Trash className='size-4' />
                      </Button>
                    </div>
                  </div>

                  {index < findAllContracts.data.length - 1 && (
                    <FieldSeparator className='mt-4' />
                  )}
                </div>
              ))}
            </FieldGroup>
          )}
        </CardContent>

        <CardFooter>
          <Button
            className='w-full md:w-fit'
            onClick={() => setAddDialogOpen(true)}
            type='button'
            variant='outline'
          >
            <Plus />
            {t('buttons.add')}
          </Button>
        </CardFooter>
      </Card>

      <AddContractDialog
        isOpen={addDialogOpen}
        onClose={() => setAddDialogOpen(false)}
      />

      <EditContractDialog
        contract={editContract}
        isOpen={!!editContract}
        onClose={() => setEditContract(null)}
      />

      <DeleteContractDialog
        contract={deleteContract}
        isOpen={!!deleteContract}
        onClose={() => setDeleteContract(null)}
      />
    </>
  )
}
