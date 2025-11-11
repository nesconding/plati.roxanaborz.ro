import { useReducer } from 'react'

import type { TRPCRouterOutput } from '~/client/trpc/react'

type User = TRPCRouterOutput['admin']['authentication']['listUsers'][number]

type State = {
  BanUserDialog: {
    user?: User | null
  }
  CreateUserDialog: {
    isOpen?: boolean
  }
  DemoteUserDialog: {
    user?: User | null
  }
  EditUserDialog: {
    user?: User | null
  }
  ExportUsersDialog: {
    users?: User[] | null
  }
  ImportUsersDialog: {
    isOpen?: boolean
  }
  PromoteUserDialog: {
    user?: User | null
  }
  RemoveUsersDialog: {
    users?: User[] | null
  }
  UnbanUserDialog: {
    user?: User | null
  }
}

export enum UsersPageReducerActionType {
  OpenBanUserDialog = 'open-ban-user-dialog',
  CloseBanUserDialog = 'close-ban-user-dialog',
  OpenCreateUserDialog = 'open-create-user-dialog',
  CloseCreateUserDialog = 'close-create-user-dialog',
  OpenDemoteUserDialog = 'open-demote-user-dialog',
  CloseDemoteUserDialog = 'close-demote-user-dialog',
  OpenEditUserDialog = 'open-edit-user-dialog',
  CloseEditUserDialog = 'close-edit-user-dialog',
  OpenExportUsersDialog = 'open-export-users-dialog',
  CloseExportUsersDialog = 'close-export-users-dialog',
  OpenImportUsersDialog = 'open-import-users-dialog',
  CloseImportUsersDialog = 'close-import-users-dialog',
  OpenPromoteUserDialog = 'open-promote-user-dialog',
  ClosePromoteUserDialog = 'close-promote-user-dialog',
  OpenRemoveUsersDialog = 'open-remove-users-dialog',
  CloseRemoveUsersDialog = 'close-remove-users-dialog',
  OpenUnbanUserDialog = 'open-unban-user-dialog',
  CloseUnbanUserDialog = 'close-unban-user-dialog'
}

type OpenBanUserDialogAction = {
  type: UsersPageReducerActionType.OpenBanUserDialog
  payload: {
    user: User
  }
}
type CloseBanUserDialogAction = {
  type: UsersPageReducerActionType.CloseBanUserDialog
}

type OpenCreateUserDialogAction = {
  type: UsersPageReducerActionType.OpenCreateUserDialog
}
type CloseCreateUserDialogAction = {
  type: UsersPageReducerActionType.CloseCreateUserDialog
}

type OpenDemoteUserDialogAction = {
  type: UsersPageReducerActionType.OpenDemoteUserDialog
  payload: {
    user: User
  }
}
type CloseDemoteUserDialogAction = {
  type: UsersPageReducerActionType.CloseDemoteUserDialog
}

type OpenEditUserDialogAction = {
  type: UsersPageReducerActionType.OpenEditUserDialog
  payload: {
    user: User
  }
}
type CloseEditUserDialogAction = {
  type: UsersPageReducerActionType.CloseEditUserDialog
}
type OpenExportUsersDialogAction = {
  type: UsersPageReducerActionType.OpenExportUsersDialog
  payload: {
    users: User[]
  }
}
type CloseExportUsersDialogAction = {
  type: UsersPageReducerActionType.CloseExportUsersDialog
}
type OpenImportUsersDialogAction = {
  type: UsersPageReducerActionType.OpenImportUsersDialog
}
type CloseImportUsersDialogAction = {
  type: UsersPageReducerActionType.CloseImportUsersDialog
}
type OpenPromoteUserDialogAction = {
  type: UsersPageReducerActionType.OpenPromoteUserDialog
  payload: {
    user: User
  }
}
type ClosePromoteUserDialogAction = {
  type: UsersPageReducerActionType.ClosePromoteUserDialog
}
type OpenRemoveUsersDialogAction = {
  type: UsersPageReducerActionType.OpenRemoveUsersDialog
  payload: {
    users: User[]
  }
}
type CloseRemoveUsersDialogAction = {
  type: UsersPageReducerActionType.CloseRemoveUsersDialog
}
type OpenUnbanUserDialogAction = {
  type: UsersPageReducerActionType.OpenUnbanUserDialog
  payload: {
    user: User
  }
}
type CloseUnbanUserDialogAction = {
  type: UsersPageReducerActionType.CloseUnbanUserDialog
}

type Action =
  | OpenBanUserDialogAction
  | CloseBanUserDialogAction
  | OpenCreateUserDialogAction
  | CloseCreateUserDialogAction
  | OpenDemoteUserDialogAction
  | CloseDemoteUserDialogAction
  | OpenEditUserDialogAction
  | CloseEditUserDialogAction
  | OpenExportUsersDialogAction
  | CloseExportUsersDialogAction
  | OpenImportUsersDialogAction
  | CloseImportUsersDialogAction
  | OpenPromoteUserDialogAction
  | ClosePromoteUserDialogAction
  | OpenRemoveUsersDialogAction
  | CloseRemoveUsersDialogAction
  | OpenUnbanUserDialogAction
  | CloseUnbanUserDialogAction

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case UsersPageReducerActionType.OpenBanUserDialog:
      return { ...state, BanUserDialog: { user: action.payload.user } }
    case UsersPageReducerActionType.CloseBanUserDialog:
      return { ...state, BanUserDialog: { user: null } }
    case UsersPageReducerActionType.OpenCreateUserDialog:
      return { ...state, CreateUserDialog: { isOpen: true } }
    case UsersPageReducerActionType.CloseCreateUserDialog:
      return { ...state, CreateUserDialog: { isOpen: false } }
    case UsersPageReducerActionType.OpenDemoteUserDialog:
      return { ...state, DemoteUserDialog: { user: action.payload.user } }
    case UsersPageReducerActionType.CloseDemoteUserDialog:
      return { ...state, DemoteUserDialog: { user: null } }
    case UsersPageReducerActionType.OpenEditUserDialog:
      return { ...state, EditUserDialog: { user: action.payload.user } }
    case UsersPageReducerActionType.CloseEditUserDialog:
      return { ...state, EditUserDialog: { user: null } }
    case UsersPageReducerActionType.OpenExportUsersDialog:
      return { ...state, ExportUsersDialog: { users: action.payload.users } }
    case UsersPageReducerActionType.CloseExportUsersDialog:
      return { ...state, ExportUsersDialog: { users: null } }
    case UsersPageReducerActionType.OpenImportUsersDialog:
      return { ...state, ImportUsersDialog: { isOpen: true } }
    case UsersPageReducerActionType.CloseImportUsersDialog:
      return { ...state, ImportUsersDialog: { isOpen: false } }
    case UsersPageReducerActionType.OpenPromoteUserDialog:
      return { ...state, PromoteUserDialog: { user: action.payload.user } }
    case UsersPageReducerActionType.ClosePromoteUserDialog:
      return { ...state, PromoteUserDialog: { user: null } }
    case UsersPageReducerActionType.OpenRemoveUsersDialog:
      return { ...state, RemoveUsersDialog: { users: action.payload.users } }
    case UsersPageReducerActionType.CloseRemoveUsersDialog:
      return { ...state, RemoveUsersDialog: { users: null } }
    case UsersPageReducerActionType.OpenUnbanUserDialog:
      return { ...state, UnbanUserDialog: { user: action.payload.user } }
    case UsersPageReducerActionType.CloseUnbanUserDialog:
      return { ...state, UnbanUserDialog: { user: null } }
  }
}

const initialState: State = {
  BanUserDialog: {
    user: null
  },
  CreateUserDialog: {
    isOpen: false
  },
  DemoteUserDialog: {
    user: null
  },
  EditUserDialog: {
    user: null
  },
  ExportUsersDialog: {
    users: null
  },
  ImportUsersDialog: {
    isOpen: false
  },
  PromoteUserDialog: {
    user: null
  },
  RemoveUsersDialog: {
    users: null
  },
  UnbanUserDialog: {
    user: null
  }
}

export function useUsersPageReducer() {
  return useReducer(reducer, initialState)
}
