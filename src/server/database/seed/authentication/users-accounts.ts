import Bun from 'bun'
import { getTableUniqueName } from 'drizzle-orm'
import path from 'path'
import { type users, users_accounts } from '~/server/database/schema'
import { formatCount } from '~/server/database/seed/utils'
import { authentication } from '~/server/services/authentication'

async function createCredentialsFile(
  credentials: {
    account: {
      userId: string
      providerId: string
      accountId: string
    } & {
      id: string
      createdAt: Date
      updatedAt: Date
      providerId: string
      accountId: string
      userId: string
      accessToken?: string | null | undefined
      refreshToken?: string | null | undefined
      idToken?: string | null | undefined
      accessTokenExpiresAt?: Date | null | undefined
      refreshTokenExpiresAt?: Date | null | undefined
      scope?: string | null | undefined
    }
    user: Pick<
      {
        id: string
        name: string
        email: string
        emailVerified: boolean
        image: string | null
        createdAt: string
        updatedAt: string
      },
      'id' | 'name' | 'email'
    >
  }[]
) {
  console.log('Writing credentials file...')
  const credentialsFilePath = path.join(
    import.meta.dirname,
    '..',
    'out',
    'credentials.json'
  )
  const file = Bun.file(credentialsFilePath)
  if (await file.exists()) await file.delete()

  const parsedCredentials = credentials.map((credential) => ({
    email: credential.user.email,
    id: credential.user.id,
    name: credential.user.name
  }))

  await Bun.write(file, JSON.stringify(parsedCredentials, null, 2))
  console.log('Credentials file written at:', credentialsFilePath)
}

export async function seedUsersAccounts(
  data: Pick<typeof users.$inferSelect, 'id' | 'name' | 'email'>[]
) {
  const tableName = getTableUniqueName(users_accounts)
  try {
    const start = Date.now()

    console.group(tableName)
    console.log(`Processing ${tableName} data...`)
    const ctx = await authentication.$context

    const result = await Promise.all(
      data.map(async (user) => {
        const account = await ctx.internalAdapter.createAccount({
          accountId: user.id,
          providerId: 'credential',
          userId: user.id
        })
        return { account, user }
      })
    )

    console.log(
      `Seeded ${formatCount(data.length)} ${tableName} in ${Date.now() - start}ms\n`
    )
    console.groupEnd()

    await createCredentialsFile(result)

    return [tableName, result] as const
  } catch (error) {
    throw new Error(`Error seeding ${tableName}`, { cause: error })
  }
}
