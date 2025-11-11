import { authentication } from '~/server/database/schema/schemas'
import { UserRoles } from '~/shared/enums/user-roles'

export const user_roles = authentication.enum('user_roles', [
  UserRoles.SUPER_ADMIN,
  UserRoles.ADMIN,
  UserRoles.USER
])
