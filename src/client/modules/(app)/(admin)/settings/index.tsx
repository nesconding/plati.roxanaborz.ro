import { ContractSettings } from '~/client/modules/(app)/(admin)/settings/contract-settings'
import { EURToRONRate } from '~/client/modules/(app)/(admin)/settings/eur-to-ron-rate'
import { FirstPaymentDateAfterDepositOptions } from '~/client/modules/(app)/(admin)/settings/first-payment-date-after-deposit-options'
import { PaymentSettings } from '~/client/modules/(app)/(admin)/settings/payment-settings'

export function SettingsPageModule() {
  return (
    <div className='p-4 flex flex-col gap-4'>
      <EURToRONRate />
      <FirstPaymentDateAfterDepositOptions />
      <PaymentSettings />
      <ContractSettings />
    </div>
  )
}
