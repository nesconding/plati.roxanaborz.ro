import { createAccessControl } from 'better-auth/plugins/access'
import {
  adminAc,
  defaultStatements,
  userAc
} from 'better-auth/plugins/admin/access'

import { UserRoles } from '~/shared/enums/user-roles'

const statement = {
  ...defaultStatements
} as const

const ac = createAccessControl(statement)

const user = ac.newRole({
  ...userAc.statements
})

const admin = ac.newRole({
  ...adminAc.statements
})

const superAdmin = ac.newRole({
  ...adminAc.statements
})

export const permissions = {
  ac,
  roles: {
    [UserRoles.USER]: user,
    [UserRoles.ADMIN]: admin,
    [UserRoles.SUPER_ADMIN]: superAdmin
  }
}
