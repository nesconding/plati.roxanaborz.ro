import { fakerRO } from '@faker-js/faker'
import { eq, getTableUniqueName, inArray, not } from 'drizzle-orm'
import { database } from '~/server/database/drizzle'
import { users } from '~/server/database/schema'
import { formatCount } from '~/server/database/seed/utils'
import { authentication } from '~/server/services/authentication'
import { UserRoles } from '~/shared/enums/user-roles'

type Person = {
  firstName: string
  lastName: string
  email: string
  role?: UserRoles
  phoneNumber?: string
}

function generatePerson(): Person {
  const sex = fakerRO.person.sexType()
  const firstName = fakerRO.person.firstName(sex)
  const lastName = fakerRO.person.lastName(sex)
  const email = fakerRO.internet.email({ firstName, lastName })
  const phoneNumber = fakerRO.phone.number({ style: 'international' })

  return { email, firstName, lastName, phoneNumber }
}

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
  }
]

function createUserData(): Omit<
  typeof users.$inferInsert,
  'createdAt' | 'updatedAt'
>[] {
  const emails = new Set<string>()

  const data: Person[] = [superAdminData, ...adminData]

  for (let i = 0; i < fakerRO.number.int({ max: 50, min: 25 }); i++) {
    let person = generatePerson()

    while (emails.has(person.email)) {
      person = generatePerson()
    }

    emails.add(person.email)
    data.push(person)
  }

  return data.map(
    ({
      firstName,
      lastName,
      email,
      phoneNumber
    }): typeof users.$inferInsert => ({
      email,
      emailVerified: true,
      firstName,
      lastName,
      name: `${firstName} ${lastName}`,
      phoneNumber
    })
  )
}

export async function seedUsers() {
  const tableName = getTableUniqueName(users)
  try {
    const start = Date.now()

    console.group(tableName)
    console.log(`Processing ${tableName} data...`)
    const ctx = await authentication.$context

    const data = createUserData()
    const result = await Promise.all(
      data.map(
        (user): Promise<typeof users.$inferSelect> =>
          ctx.internalAdapter.createUser(user)
      )
    )

    const [superAdminUser] = await database
      .update(users)
      .set({
        role: UserRoles.SUPER_ADMIN
      })
      .where(eq(users.email, superAdminData.email))
      .returning()
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

    await database
      .update(users)
      .set({
        invitedById: superAdminUser.id
      })
      .where(not(eq(users.email, superAdminUser.email)))

    console.log(
      `Seeded ${formatCount(data.length)} ${tableName} in ${Date.now() - start}ms\n`
    )
    console.groupEnd()
    return [tableName, result] as const
  } catch (error) {
    throw new Error(`Error seeding ${tableName}`, { cause: error })
  }
}
