'use client'

import { BanUserDialog } from '~/client/modules/(app)/(admin)/users/_components/ban-user-dialog'
import { CreateUserDialog } from '~/client/modules/(app)/(admin)/users/_components/create-user-dialog'
import { DemoteUserDialog } from '~/client/modules/(app)/(admin)/users/_components/demote-user-dialog'
import { EditUserDialog } from '~/client/modules/(app)/(admin)/users/_components/edit-user-dialog'
import { ExportUsersDialog } from '~/client/modules/(app)/(admin)/users/_components/export-users-dialog'
import { ImportUsersDialog } from '~/client/modules/(app)/(admin)/users/_components/import-users-dialog'
import { PromoteUserDialog } from '~/client/modules/(app)/(admin)/users/_components/promote-user-dialog'
import { RemoveUsersDialog } from '~/client/modules/(app)/(admin)/users/_components/remove-users-dialog'
import { UnbanUserDialog } from '~/client/modules/(app)/(admin)/users/_components/unban-user-dialog'
import { UsersTable } from '~/client/modules/(app)/(admin)/users/_components/users-table'
import {
  UsersPageReducerActionType,
  useUsersPageReducer
} from '~/client/modules/(app)/(admin)/users/reducer'

interface UsersPageModuleProps {
  search?: string
}

export function UsersPageModule({ search }: UsersPageModuleProps) {
  const [state, dispatch] = useUsersPageReducer()

  return (
    <div className='p-4'>
      <UsersTable
        onBanUser={(user) =>
          dispatch({
            payload: { user },
            type: UsersPageReducerActionType.OpenBanUserDialog
          })
        }
        onCreateUser={() =>
          dispatch({ type: UsersPageReducerActionType.OpenCreateUserDialog })
        }
        onDemoteUser={(user) =>
          dispatch({
            payload: { user },
            type: UsersPageReducerActionType.OpenDemoteUserDialog
          })
        }
        onEditUser={(user) =>
          dispatch({
            payload: { user },
            type: UsersPageReducerActionType.OpenEditUserDialog
          })
        }
        onExportUsers={(users) =>
          dispatch({
            payload: { users },
            type: UsersPageReducerActionType.OpenExportUsersDialog
          })
        }
        onImportUsers={() =>
          dispatch({ type: UsersPageReducerActionType.OpenImportUsersDialog })
        }
        onPromoteUser={(user) =>
          dispatch({
            payload: { user },
            type: UsersPageReducerActionType.OpenPromoteUserDialog
          })
        }
        onRemoveUsers={(users) =>
          dispatch({
            payload: { users },
            type: UsersPageReducerActionType.OpenRemoveUsersDialog
          })
        }
        onUnbanUser={(user) =>
          dispatch({
            payload: { user },
            type: UsersPageReducerActionType.OpenUnbanUserDialog
          })
        }
        search={search}
      />
      <BanUserDialog
        onCloseDialog={() =>
          dispatch({ type: UsersPageReducerActionType.CloseBanUserDialog })
        }
        user={state.BanUserDialog.user}
      />
      <CreateUserDialog
        isOpen={state.CreateUserDialog.isOpen}
        onCloseDialog={() =>
          dispatch({ type: UsersPageReducerActionType.CloseCreateUserDialog })
        }
      />
      <EditUserDialog
        onCloseDialog={() =>
          dispatch({ type: UsersPageReducerActionType.CloseEditUserDialog })
        }
        user={state.EditUserDialog.user}
      />
      <ExportUsersDialog
        onCloseDialog={() =>
          dispatch({ type: UsersPageReducerActionType.CloseExportUsersDialog })
        }
        users={state.ExportUsersDialog.users}
      />
      <ImportUsersDialog
        isOpen={state.ImportUsersDialog.isOpen}
        onCloseDialog={() =>
          dispatch({ type: UsersPageReducerActionType.CloseImportUsersDialog })
        }
      />
      <PromoteUserDialog
        onCloseDialog={() =>
          dispatch({ type: UsersPageReducerActionType.ClosePromoteUserDialog })
        }
        user={state.PromoteUserDialog.user}
      />
      <DemoteUserDialog
        onCloseDialog={() =>
          dispatch({ type: UsersPageReducerActionType.CloseDemoteUserDialog })
        }
        user={state.DemoteUserDialog.user}
      />
      <RemoveUsersDialog
        onCloseDialog={() =>
          dispatch({ type: UsersPageReducerActionType.CloseRemoveUsersDialog })
        }
        users={state.RemoveUsersDialog.users}
      />
      <UnbanUserDialog
        onCloseDialog={() =>
          dispatch({ type: UsersPageReducerActionType.CloseUnbanUserDialog })
        }
        user={state.UnbanUserDialog.user}
      />
    </div>
  )
}
