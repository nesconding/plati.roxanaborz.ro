import { createFormHook, createFormHookContexts } from '@tanstack/react-form'

import { DateField } from '~/client/components/form/fields/date-field'
import { NumberField } from '~/client/components/form/fields/number-field'
import { PhoneField } from '~/client/components/form/fields/phone-field'
import { SelectField } from '~/client/components/form/fields/select-field'
import { SwitchField } from '~/client/components/form/fields/switch-field'
import { TextField } from '~/client/components/form/fields/text-field'
import { TextareaField } from '~/client/components/form/fields/textarea-field'

export const { fieldContext, formContext, useFieldContext, useFormContext } =
  createFormHookContexts()

export const { useAppForm, withForm, withFieldGroup } = createFormHook({
  fieldComponents: {
    Date: DateField,
    Number: NumberField,
    Phone: PhoneField,
    Select: SelectField,
    Switch: SwitchField,
    Text: TextField,
    Textarea: TextareaField
  },
  fieldContext,
  formComponents: {},
  formContext
})
