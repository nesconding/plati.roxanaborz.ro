import { getTranslations } from 'next-intl/server'

export async function SentEmailModule({ email }: { email: string }) {
  const t = await getTranslations()

  return (
    <div className='space-y-4 text-center'>
      <h3 className='text-foreground text-2xl font-bold md:text-3xl'>
        {t('pages.sent-email.header')}
      </h3>

      <p className='text-accent-foreground text-lg'>
        <span>{`${t('pages.sent-email.description')}: `}</span>
        <span className='text-foreground text-xl font-medium'>{email}</span>
      </p>

      <p className='text-muted-foreground'>{t('pages.sent-email.paragraph')}</p>
    </div>
  )
}
