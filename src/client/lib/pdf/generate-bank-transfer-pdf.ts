import { jsPDF } from 'jspdf'
import type { PaymentScheduleItem } from '~/lib/payment-schedule'

interface BankDetails {
  bank: string
  bic: string
  cui: string
  iban: string
  name: string
  registrationNumber: string
}

interface GenerateBankTransferPdfParams {
  bankDetails: BankDetails
  formattedAmount: string
  orderId: string
  paymentSchedule?: PaymentScheduleItem[]
  productName: string
}

export function generateBankTransferPdf({
  bankDetails,
  formattedAmount,
  orderId,
  paymentSchedule,
  productName
}: GenerateBankTransferPdfParams): void {
  const doc = new jsPDF()

  const pageWidth = doc.internal.pageSize.getWidth()
  let yPosition = 20

  // Title
  doc.setFontSize(20)
  doc.setFont('helvetica', 'bold')
  doc.text('Detalii Transfer Bancar', pageWidth / 2, yPosition, {
    align: 'center'
  })
  yPosition += 15

  // Subtitle
  doc.setFontSize(11)
  doc.setFont('helvetica', 'normal')
  doc.text(
    'Folositi informatiile de mai jos pentru a efectua transferul bancar.',
    pageWidth / 2,
    yPosition,
    { align: 'center' }
  )
  yPosition += 20

  // Bank Details Section
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text('Detalii Bancare', 20, yPosition)
  yPosition += 10

  doc.setFontSize(11)
  doc.setFont('helvetica', 'normal')

  const bankDetailsRows = [
    { label: 'Beneficiar', value: bankDetails.name },
    { label: 'IBAN', value: bankDetails.iban },
    { label: 'Banca', value: bankDetails.bank },
    { label: 'BIC/SWIFT', value: bankDetails.bic },
    { label: 'CUI', value: bankDetails.cui },
    { label: 'Nr. Reg. Com.', value: bankDetails.registrationNumber }
  ]

  for (const row of bankDetailsRows) {
    doc.setFont('helvetica', 'bold')
    doc.text(`${row.label}:`, 20, yPosition)
    doc.setFont('helvetica', 'normal')
    doc.text(row.value, 70, yPosition)
    yPosition += 8
  }

  yPosition += 10

  // Payment Details Section
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text('Detalii Plata', 20, yPosition)
  yPosition += 10

  doc.setFontSize(11)

  const paymentDetailsRows = [
    { label: 'Referinta Plata', value: orderId },
    { label: 'Produs', value: productName },
    { label: 'Suma totala', value: formattedAmount }
  ]

  for (const row of paymentDetailsRows) {
    doc.setFont('helvetica', 'bold')
    doc.text(`${row.label}:`, 20, yPosition)
    doc.setFont('helvetica', 'normal')
    doc.text(row.value, 70, yPosition)
    yPosition += 8
  }

  // Payment Schedule Section (only for non-integral payments)
  if (paymentSchedule && paymentSchedule.length > 1) {
    yPosition += 10

    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text('Grafic de Plati', 20, yPosition)
    yPosition += 10

    // Table headers
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.text('#', 20, yPosition)
    doc.text('Descriere', 30, yPosition)
    doc.text('Data', 85, yPosition)
    doc.text('Suma', 125, yPosition)
    doc.text('Status', 165, yPosition)
    yPosition += 2

    // Header underline
    doc.setDrawColor(200)
    doc.line(20, yPosition, 190, yPosition)
    yPosition += 6

    // Table rows
    doc.setFont('helvetica', 'normal')
    paymentSchedule.forEach((item, index) => {
      const status = item.isPaid
        ? 'Platit'
        : index === 0
          ? 'De platit'
          : 'In asteptare'

      doc.text(`${index + 1}`, 20, yPosition)
      doc.text(item.description, 30, yPosition)
      doc.text(item.date ?? 'Acum', 85, yPosition)
      doc.text(item.amount, 125, yPosition)
      doc.text(status, 165, yPosition)
      yPosition += 7
    })

    // Total row
    yPosition += 2
    doc.line(20, yPosition, 190, yPosition)
    yPosition += 6
    doc.setFont('helvetica', 'bold')
    doc.text('TOTAL', 30, yPosition)
    doc.text(formattedAmount, 125, yPosition)
  }

  yPosition += 15

  // Instructions Section
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(0, 0, 0)
  doc.text('Instructiuni', 20, yPosition)
  yPosition += 10

  doc.setFontSize(11)
  doc.setFont('helvetica', 'normal')

  const instructions = [
    '1. Efectuati transferul bancar catre contul de mai sus',
    '2. Includeti referinta de plata in descrierea transferului',
    '3. Comanda va fi procesata dupa confirmarea platii'
  ]

  for (const instruction of instructions) {
    doc.text(instruction, 20, yPosition)
    yPosition += 8
  }

  yPosition += 15

  // Footer
  doc.setFontSize(10)
  doc.setTextColor(128, 128, 128)
  doc.text(
    'Document generat automat. Va rugam sa pastrati acest document pentru referinta.',
    pageWidth / 2,
    yPosition,
    { align: 'center' }
  )

  // Download the PDF
  doc.save(`Transfer_Bancar_${orderId}.pdf`)
}
