import z from 'zod'

import {
  SessionsTableValidators,
  UsersTableValidators
} from '~/shared/validation/tables'

export const SessionSchema = z
  .object({
    session: SessionsTableValidators.select,
    user: UsersTableValidators.select
  })
  .nullable()
