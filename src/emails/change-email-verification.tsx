import {
  Body,
  Container,
  Font,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  pixelBasedPreset,
  Section,
  Tailwind,
  Text
} from '@react-email/components'

interface ChangeEmailVerificationEmail {
  url: string
}

const baseUrl = process.env.VERCEL_URL ?? process.env.NEXT_PUBLIC_URL ?? ''

export const ChangeEmailVerificationEmail = ({
  url
}: ChangeEmailVerificationEmail) => {
  const previewText = 'Link de autentificare pentru Plați RB'

  return (
    <Html>
      <Head>
        <Font
          fallbackFontFamily='Verdana'
          fontFamily='Roboto'
          fontStyle='normal'
          fontWeight={400}
          webFont={{
            format: 'truetype',
            url: 'https://fonts.googleapis.com/css2?family=Montserrat:ital,wght@0,100..900;1,100..900&display=swap'
          }}
        />
      </Head>
      <Preview>{previewText}</Preview>
      <Tailwind
        config={{
          presets: [pixelBasedPreset],
          theme: {
            extend: {
              colors: {
                foreground: 'oklch(0.3651 0.0325 287.0807)',
                muted: {
                  DEFAULT: 'oklch(0.8906 0.0139 299.7754)',
                  foreground: 'oklch(0.5288 0.0375 290.7895)'
                },
                primary: {
                  DEFAULT: 'oklch(0.6104 0.0767 299.7335)',
                  foreground: 'oklch(0.9777 0.0041 301.4256)'
                }
              },
              fontFamily: {
                mono: ['"Fira Code"', '"Courier New"', 'monospace'],
                sans: ['Montserrat'],
                serif: ['Esteban', 'ui-serif', 'serif']
              }
            }
          }
        }}
      >
        <Body className='mx-auto my-auto bg-white p-4 font-sans'>
          <Container className='mx-auto my-[16px] max-w-[448px] p-[16px]'>
            <Section>
              <Img
                alt='Plați RB'
                className='mx-auto my-0 w-40'
                src={`${baseUrl}/static/logo.webp`}
              />
            </Section>

            <Heading className='mx-0 my-[32px] p-0 text-center font-normal text-[18px] text-foreground'>
              <strong>Actualizați email-ului dumneavoastră</strong>
            </Heading>

            <Text className='text-[14px] text-foreground text-center leading-[24px]'>
              Ați solicitat actualizarea email-ului dumneavoastră pentru
              platforma <strong>Plați RB</strong>.
            </Text>

            <Section className='my-[32px] text-center'>
              <Link
                className='text-center rounded-[8px] bg-primary mx-auto text-sm font-medium text-primary-foreground px-4 py-3'
                href={url}
              >
                Confirmă email-ul nou
              </Link>
            </Section>

            <Text className='text-[14px] text-center text-foreground leading-[24px]'>
              sau copiați și lipiți acest link în browserul dumneavoastră:
            </Text>

            <Section className='text-center'>
              <Link className='text-[14px]' href={url}>
                {url}
              </Link>
            </Section>

            <Hr className='mx-0 my-[32px] w-full border border-border border-solid' />

            <Text className='text-muted-foreground text-center text-[12px] leading-[24px]'>
              Dacă nu ați solicitat dumneavoastră, puteți ignora acest email.
            </Text>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  )
}

ChangeEmailVerificationEmail.PreviewProps = {
  url: 'https://vercel.com/teams/invite/foo'
} as ChangeEmailVerificationEmail

export default ChangeEmailVerificationEmail
