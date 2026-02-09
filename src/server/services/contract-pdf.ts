import fontkit from '@pdf-lib/fontkit'
import { readFile } from 'fs/promises'
import { join } from 'path'
import { PDFDocument, type PDFFont, type PDFForm } from 'pdf-lib'

import { CONTRACT_FIELDS_MAP } from '~/shared/validation/schemas/contract-fields'

export interface ContractAddressData {
  apartment?: string
  building?: string
  city: string
  country: string
  county: string
  entrance?: string
  floor?: string
  postalCode: string
  street: string
  streetNumber: string
}

export interface ContractPersonData {
  address: ContractAddressData
  cnp: string
  email: string
  name: string
  phoneNumber: string
  surname: string
  type: 'PERSON'
}

export interface ContractCompanyData {
  bank: string
  bankAccount: string
  cui: string
  name: string
  registrationNumber: string
  representativeLegal: string
  socialHeadquarters: ContractAddressData
  type: 'COMPANY'
}

export type ContractBillingData = ContractPersonData | ContractCompanyData

export interface ContractPaymentData {
  paymentTotal: string
  paymentType: string
  programName: string
}

export type ContractFieldsData = ContractBillingData & ContractPaymentData

export async function fetchContractPdf(pathname: string): Promise<Uint8Array> {
  const response = await fetch(pathname)
  if (!response.ok) {
    throw new Error(`Failed to fetch contract PDF: ${response.statusText}`)
  }
  const arrayBuffer = await response.arrayBuffer()
  return new Uint8Array(arrayBuffer)
}

export function formatAddressForContract(address: ContractAddressData): string {
  const parts: string[] = []

  if (address.street) {
    parts.push(`Str. ${address.street}`)
  }
  if (address.streetNumber) {
    parts.push(`Nr. ${address.streetNumber}`)
  }
  if (address.building) {
    parts.push(`Bl. ${address.building}`)
  }
  if (address.entrance) {
    parts.push(`Sc. ${address.entrance}`)
  }
  if (address.floor) {
    parts.push(`Et. ${address.floor}`)
  }
  if (address.apartment) {
    parts.push(`Ap. ${address.apartment}`)
  }
  if (address.city) {
    parts.push(address.city)
  }
  if (address.county) {
    parts.push(`Jud. ${address.county}`)
  }
  if (address.postalCode) {
    parts.push(`Cod ${address.postalCode}`)
  }
  if (address.country) {
    parts.push(address.country)
  }

  return parts.join(', ')
}

function setTextFieldWithFont(
  form: PDFForm,
  fieldName: string,
  value: string,
  font: PDFFont
): void {
  try {
    const field = form.getTextField(fieldName)
    field.setText(value)
    field.updateAppearances(font)
  } catch {
    // Field may not exist in template
  }
}

export async function fillContractPdf(
  pdfBytes: Uint8Array,
  data: ContractFieldsData
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.load(pdfBytes)

  // Register fontkit to enable custom font embedding
  pdfDoc.registerFontkit(fontkit)

  // Load and embed Montserrat font with Romanian character support
  const fontPath = join(
    process.cwd(),
    'src/client/assets/font/Roboto-VariableFont_wdth,wght.ttf'
  )
  const fontBytes = await readFile(fontPath)
  const customFont = await pdfDoc.embedFont(fontBytes)

  const form = pdfDoc.getForm()

  // Fill payment fields
  setTextFieldWithFont(
    form,
    CONTRACT_FIELDS_MAP.paymentTotal,
    data.paymentTotal,
    customFont
  )
  setTextFieldWithFont(
    form,
    CONTRACT_FIELDS_MAP.paymentType,
    data.paymentType,
    customFont
  )
  setTextFieldWithFont(
    form,
    CONTRACT_FIELDS_MAP.programName,
    data.programName,
    customFont
  )

  if (data.type === 'PERSON') {
    // Fill PF (Person) fields
    const pfFields = CONTRACT_FIELDS_MAP.PF

    setTextFieldWithFont(
      form,
      pfFields.name,
      `${data.name} ${data.surname}`,
      customFont
    )
    setTextFieldWithFont(form, pfFields.cnp, data.cnp, customFont)
    setTextFieldWithFont(form, pfFields.email, data.email, customFont)
    setTextFieldWithFont(
      form,
      pfFields.phoneNumber,
      data.phoneNumber,
      customFont
    )
    setTextFieldWithFont(
      form,
      pfFields.address,
      formatAddressForContract(data.address),
      customFont
    )
  } else {
    // Fill PJ (Company) fields
    const pjFields = CONTRACT_FIELDS_MAP.PJ

    setTextFieldWithFont(form, pjFields.name, data.name, customFont)
    setTextFieldWithFont(form, pjFields.cui, data.cui, customFont)
    setTextFieldWithFont(
      form,
      pjFields.registrationNumber,
      data.registrationNumber,
      customFont
    )
    setTextFieldWithFont(
      form,
      pjFields.representativeLegal,
      data.representativeLegal,
      customFont
    )
    setTextFieldWithFont(form, pjFields.bank, data.bank, customFont)
    setTextFieldWithFont(
      form,
      pjFields.bankAccount,
      data.bankAccount,
      customFont
    )
    setTextFieldWithFont(
      form,
      pjFields.socialHeadquarters,
      formatAddressForContract(data.socialHeadquarters),
      customFont
    )
  }

  // Flatten the form to make it non-editable
  form.flatten()

  return pdfDoc.save()
}
