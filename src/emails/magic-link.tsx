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

interface MagicLinkEmailProps {
  url: string
}

const baseUrl = process.env.VERCEL_URL ?? process.env.NEXT_PUBLIC_URL ?? ''

export const MagicLinkEmail = ({ url }: MagicLinkEmailProps) => {
  const previewText =
    'Link-ul dumneavoastră de autentificare pentru a vă conecta în platforma Plați RB'

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
                foreground: 'oklch(0.2707 0.0378 336.77)',
                muted: {
                  DEFAULT: 'oklch(0.9889 0.0063 337.02)',
                  foreground: 'oklch(0.4405 0.0479 336.69)'
                },
                primary: {
                  DEFAULT: 'oklch(0.5787 0.1955 343.4)',
                  foreground: '#FFFFFF'
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
              <strong>Link-ul de autentificare</strong>
            </Heading>

            <Text className='text-[14px] text-foreground text-center leading-[24px]'>
              Ați solicitat un link de autentificare pentru a vă conecta la
              platforma pentru <strong>Plați RB</strong>.
            </Text>

            <Section className='my-[32px] text-center'>
              <Link
                className='text-center rounded-[8px] bg-primary mx-auto text-sm font-medium text-primary-foreground px-4 py-3'
                href={url}
              >
                Accesează platforma
              </Link>
            </Section>

            <Text className='text-[14px] text-center text-foreground leading-[24px]'>
              sau copiați și lipiți acest URL în browserul dumneavoastră:
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

MagicLinkEmail.PreviewProps = {
  url: 'https://vercel.com/teams/invite/foo'
} as MagicLinkEmailProps

export default MagicLinkEmail
