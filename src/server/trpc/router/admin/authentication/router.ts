import { createTRPCRouter } from '~/server/trpc/config'
import { banUserProcedure } from '~/server/trpc/router/admin/authentication/procedures/ban-user'
import { createUserProcedure } from '~/server/trpc/router/admin/authentication/procedures/create-user'
import { demoteUserProcedure } from '~/server/trpc/router/admin/authentication/procedures/demote-user'
import { editUserProcedure } from '~/server/trpc/router/admin/authentication/procedures/edit-user'
import { importUsersProcedure } from '~/server/trpc/router/admin/authentication/procedures/import-users'
import { listUsersProcedure } from '~/server/trpc/router/admin/authentication/procedures/list-users'
import { promoteUserProcedure } from '~/server/trpc/router/admin/authentication/procedures/promote-user'
import { removeUsersProcedure } from '~/server/trpc/router/admin/authentication/procedures/remove-users'
import { unbanUserProcedure } from '~/server/trpc/router/admin/authentication/procedures/unban-user'

export const authenticationRouter = createTRPCRouter({
  banUser: banUserProcedure,
  createUser: createUserProcedure,
  demoteUser: demoteUserProcedure,
  editUser: editUserProcedure,
  importUsers: importUsersProcedure,
  listUsers: listUsersProcedure,
  promoteUser: promoteUserProcedure,
  removeUsers: removeUsersProcedure,
  unbanUser: unbanUserProcedure
})
