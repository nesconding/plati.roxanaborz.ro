'use client'

import type { RowValues } from 'exceljs'
import { FileSpreadsheet } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'

import { Spinner } from '~/client/components/ui/spinner'
import { cn } from '~/client/lib/utils'
import { importXLSXFile } from '~/client/lib/xlsx'

const accept = {
  'application/vnd.ms-excel': ['.xls'],
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx']
}

interface FileUploadDropzoneProps {
  className?: string
  disabled?: boolean
  isPending?: boolean
  maxSize?: number
  onProcess?: (fileName: string, data: RowValues[]) => void
}

const MAX_SIZE_MB = 10

export function FileUploadDropzone({
  className,
  isPending,
  disabled,
  maxSize = MAX_SIZE_MB * 1024 * 1024,
  onProcess
}: FileUploadDropzoneProps) {
  const [isProcessing, setIsProcessing] = useState(false)
  const t = useTranslations()

  const onDrop = useCallback(
    async (files: File[]) => {
      const file = files[0]
      if (!file) return
      setIsProcessing(true)

      try {
        const data = await importXLSXFile(file)
        onProcess?.(file.name, data)
      } catch (error) {
        console.error(error)
      }

      setIsProcessing(false)
    },
    [onProcess]
  )

  const { getRootProps, getInputProps, isDragActive, isDragReject } =
    useDropzone({
      accept,
      disabled,
      maxSize,
      multiple: false,
      onDrop
    })

  return (
    <div
      {...getRootProps()}
      aria-busy={isDragActive}
      aria-disabled={disabled}
      aria-invalid={isDragReject}
      className={cn(
        'group',
        'border-muted-foreground/25 text-muted-foreground hover:text-foreground hover:bg-muted/50 hover:border-muted-foreground flex w-full flex-1 cursor-pointer items-center justify-center overflow-hidden rounded-lg border-2 border-dashed',
        'aria-invalid:border-destructive aria-invalid:bg-destructive/5 aria-invalid:text-destructive aria-invalid:hover:bg-destructive/10', // isDragReject
        'aria-busy:border-muted-foreground aria-busy:bg-muted/50 aria-busy:text-foreground', // isDragActive
        'aria-disabled:border-muted-foreground/25 aria-disabled:text-muted-foreground aria-disabled:cursor-not-allowed aria-disabled:bg-transparent! aria-disabled:opacity-50', // disabled
        className
      )}
    >
      <input {...getInputProps()} />

      <div className='flex size-full h-80 flex-col items-center justify-center'>
        {isProcessing ? (
          <div className='flex flex-col items-center justify-center gap-1'>
            <Spinner className='size-8 animate-spin' />
            {isProcessing ? (
              <p className='text-center text-sm'>
                {t('components.file-dropzone.loading-file')}
              </p>
            ) : null}
            {isPending ? (
              <p className='text-center text-sm'>
                {t('components.file-dropzone.processing-file')}
              </p>
            ) : null}
          </div>
        ) : (
          <div
            className={cn(
              'relative flex size-full flex-col items-center justify-center gap-4 p-4'
            )}
          >
            <FileSpreadsheet className='size-12' />

            <p className='text-center text-sm font-medium'>
              {isDragReject
                ? t('components.file-dropzone.invalid-file', {
                    maxSize: MAX_SIZE_MB
                  })
                : isDragActive
                  ? t('components.file-dropzone.release-file')
                  : t('components.file-dropzone.drop-file')}
            </p>

            <p className='text-muted-foreground absolute bottom-4 text-center text-xs'>
              {t('components.file-dropzone.max-size', { maxSize: MAX_SIZE_MB })}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
