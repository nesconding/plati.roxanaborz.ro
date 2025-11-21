import type { User } from 'better-auth'

import { Resend } from 'resend'
import { ChangeEmailVerificationEmail } from '../../emails/change-email-verification'
import { MagicLinkEmail } from '../../emails/magic-link'

const resend = new Resend(process.env.RESEND_TOKEN)
class EmailServiceImpl {
  async sendMagicLink(data: { email: string; token: string; url: string }) {
    if (process.env.NODE_ENV === 'development') {
      console.log(data)
      return
    }
    try {
      await resend.emails.send({
        from: process.env.RESEND_SENDER_EMAIL!,
        react: MagicLinkEmail({
          baseUrl: process.env.BASE_URL!,
          url: data.url
        }),
        subject: 'Link-ul de autentificare - Plați RB',
        to: data.email
      })
    } catch (error) {
      console.error(error)
      throw error
    }
  }

  async sendChangeEmailVerification(data: {
    token: string
    url: string
    user: User
    newEmail: string
  }) {
    if (process.env.NODE_ENV === 'development') {
      console.log(data)
      return
    }
    try {
      await resend.emails.send({
        from: process.env.RESEND_SENDER_EMAIL!,
        react: ChangeEmailVerificationEmail({
          baseUrl: process.env.BASE_URL!,
          url: data.url
        }),
        subject: 'Solicitare de actualizare a email-ului - Plați RB',
        to: data.newEmail
      })
    } catch (error) {
      console.error(error)
      throw error
    }
  }
}

export const EmailService = new EmailServiceImpl()
