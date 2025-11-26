'use client'

import { FileText, X } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useCallback } from 'react'
import { useDropzone } from 'react-dropzone'

import { Button } from '~/client/components/ui/button'
import { cn } from '~/client/lib/utils'

const accept = {
  'application/pdf': ['.pdf']
}

interface PDFDropzoneProps {
  className?: string
  disabled?: boolean
  file?: File | null
  maxSize?: number
  onFileSelect?: (file: File | null) => void
}

const MAX_SIZE_MB = 10

export function PDFDropzone({
  className,
  disabled,
  file,
  maxSize = MAX_SIZE_MB * 1024 * 1024,
  onFileSelect
}: PDFDropzoneProps) {
  const t = useTranslations()

  const onDrop = useCallback(
    (files: File[]) => {
      const droppedFile = files[0]
      if (droppedFile) {
        onFileSelect?.(droppedFile)
      }
    },
    [onFileSelect]
  )

  const handleClear = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      onFileSelect?.(null)
    },
    [onFileSelect]
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
        'aria-invalid:border-destructive aria-invalid:bg-destructive/5 aria-invalid:text-destructive aria-invalid:hover:bg-destructive/10',
        'aria-busy:border-muted-foreground aria-busy:bg-muted/50 aria-busy:text-foreground',
        'aria-disabled:border-muted-foreground/25 aria-disabled:text-muted-foreground aria-disabled:cursor-not-allowed aria-disabled:bg-transparent! aria-disabled:opacity-50',
        className
      )}
    >
      <input {...getInputProps()} />

      <div className='flex size-full h-80 flex-col items-center justify-center'>
        {file ? (
          <div className='relative flex size-full flex-col items-center justify-center gap-4 p-4'>
            <FileText className='size-12' />

            <div className='flex items-center gap-2'>
              <p className='max-w-xs truncate text-center text-sm font-medium'>
                {file.name}
              </p>
              <Button
                disabled={disabled}
                onClick={handleClear}
                size='icon-sm'
                type='button'
                variant='ghost'
              >
                <X className='size-4' />
              </Button>
            </div>

            <p className='text-muted-foreground absolute bottom-4 text-center text-xs'>
              {t('components.pdf-dropzone.file-selected')}
            </p>
          </div>
        ) : (
          <div
            className={cn(
              'relative flex size-full flex-col items-center justify-center gap-4 p-4'
            )}
          >
            <FileText className='size-12' />

            <p className='text-center text-sm font-medium'>
              {isDragReject
                ? t('components.pdf-dropzone.invalid-file', {
                    maxSize: MAX_SIZE_MB
                  })
                : isDragActive
                  ? t('components.pdf-dropzone.release-file')
                  : t('components.pdf-dropzone.drop-file')}
            </p>

            <p className='text-muted-foreground absolute bottom-4 text-center text-xs'>
              {t('components.pdf-dropzone.max-size', { maxSize: MAX_SIZE_MB })}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
