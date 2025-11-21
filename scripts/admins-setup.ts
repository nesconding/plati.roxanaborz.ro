import { eq, getTableUniqueName, inArray, not } from 'drizzle-orm'
import { database } from '~/server/database/drizzle'
import { users } from '~/server/database/schema'
import { formatCount } from '~/server/database/seed/utils'
import { authentication } from '~/server/services/authentication'
import { UserRoles } from '~/shared/enums/user-roles'

const superAdminData = {
  email: 'alex@nescodigital.com',
  firstName: 'Alex',
  lastName: 'Constantinescu',
  role: UserRoles.SUPER_ADMIN
}
const adminData = [
  {
    email: 'andrei.varut@nescodigital.com',
    firstName: 'Andrei',
    lastName: 'Vǎruț',
    role: UserRoles.ADMIN
  },
  {
    email: 'varut.andrei@gmail.com',
    firstName: 'Andrei',
    lastName: 'Vǎruț',
    role: UserRoles.ADMIN
  },
  {
    email: 'roxana@roxanaborz.ro',
    firstName: 'Roxana',
    lastName: 'Borz',
    role: UserRoles.ADMIN
  }
]

function createUserData(): Omit<
  typeof users.$inferInsert,
  'createdAt' | 'updatedAt'
>[] {
  const data = [superAdminData, ...adminData]

  return data.map(
    ({ firstName, lastName, email }): typeof users.$inferInsert => ({
      email,
      emailVerified: true,
      firstName,
      lastName,
      name: `${firstName} ${lastName}`
    })
  )
}

async function main() {
  const tableName = getTableUniqueName(users)
  try {
    const start = Date.now()

    console.group(tableName)
    console.log(`Processing ${tableName} data...`)
    const ctx = await authentication.$context

    const data = createUserData()

    const [[superAdminUser]] = await Promise.all([
      await database
        .update(users)
        .set({
          role: UserRoles.SUPER_ADMIN
        })
        .where(eq(users.email, superAdminData.email))
        .returning(),
      await database
        .update(users)
        .set({
          role: UserRoles.ADMIN
        })
        .where(
          inArray(
            users.email,
            adminData.map((admin) => admin.email)
          )
        )
        .returning()
    ])

    await database
      .update(users)
      .set({
        invitedById: superAdminUser.id
      })
      .where(not(eq(users.email, superAdminUser.email)))

    const usersData = await Promise.all(
      data.map(
        (user): Promise<typeof users.$inferSelect> =>
          ctx.internalAdapter.createUser(user)
      )
    )
    await Promise.all(
      usersData.map(
        async (user) =>
          await ctx.internalAdapter.createAccount({
            accountId: user.id,
            providerId: 'credential',
            userId: user.id
          })
      )
    )

    console.log(
      `Seeded ${formatCount(data.length)} ${tableName} in ${Date.now() - start}ms\n`
    )
    console.groupEnd()
    process.exit(0)
  } catch (error) {
    console.error(`Error seeding ${tableName}`, { cause: error })
    process.exit(1)
  }
}

main()
