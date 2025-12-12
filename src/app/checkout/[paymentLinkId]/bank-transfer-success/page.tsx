import { BankTransferSuccessModule } from '~/client/modules/checkout/bank-transfer-success'

interface BankTransferSuccessPageProps {
  params: Promise<{
    paymentLinkId: string
  }>
}

export default async function BankTransferSuccessPage({
  params
}: BankTransferSuccessPageProps) {
  const paramsData = await params

  return <BankTransferSuccessModule paymentLinkId={paramsData.paymentLinkId} />
}
