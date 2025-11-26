import { PDFDocument } from 'pdf-lib'

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

export async function fillContractPdf(
  pdfBytes: Uint8Array,
  data: ContractFieldsData
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.load(pdfBytes)
  const form = pdfDoc.getForm()

  // Fill payment fields
  try {
    const paymentTotalField = form.getTextField(
      CONTRACT_FIELDS_MAP.paymentTotal
    )
    paymentTotalField.setText(data.paymentTotal)
  } catch {
    // Field may not exist in template
  }

  try {
    const paymentTypeField = form.getTextField(CONTRACT_FIELDS_MAP.paymentType)
    paymentTypeField.setText(data.paymentType)
  } catch {
    // Field may not exist in template
  }

  if (data.type === 'PERSON') {
    // Fill PF (Person) fields
    const pfFields = CONTRACT_FIELDS_MAP.PF

    try {
      const nameField = form.getTextField(pfFields.name)
      nameField.setText(`${data.name} ${data.surname}`)
    } catch {
      // Field may not exist
    }

    try {
      const cnpField = form.getTextField(pfFields.cnp)
      cnpField.setText(data.cnp)
    } catch {
      // Field may not exist
    }

    try {
      const emailField = form.getTextField(pfFields.email)
      emailField.setText(data.email)
    } catch {
      // Field may not exist
    }

    try {
      const phoneField = form.getTextField(pfFields.phoneNumber)
      phoneField.setText(data.phoneNumber)
    } catch {
      // Field may not exist
    }

    try {
      const addressField = form.getTextField(pfFields.address)
      addressField.setText(formatAddressForContract(data.address))
    } catch {
      // Field may not exist
    }
  } else {
    // Fill PJ (Company) fields
    const pjFields = CONTRACT_FIELDS_MAP.PJ

    try {
      const nameField = form.getTextField(pjFields.name)
      nameField.setText(data.name)
    } catch {
      // Field may not exist
    }

    try {
      const cuiField = form.getTextField(pjFields.cui)
      cuiField.setText(data.cui)
    } catch {
      // Field may not exist
    }

    try {
      const regNumField = form.getTextField(pjFields.registrationNumber)
      regNumField.setText(data.registrationNumber)
    } catch {
      // Field may not exist
    }

    try {
      const repLegalField = form.getTextField(pjFields.representativeLegal)
      repLegalField.setText(data.representativeLegal)
    } catch {
      // Field may not exist
    }

    try {
      const bankField = form.getTextField(pjFields.bank)
      bankField.setText(data.bank)
    } catch {
      // Field may not exist
    }

    try {
      const bankAccountField = form.getTextField(pjFields.bankAccount)
      bankAccountField.setText(data.bankAccount)
    } catch {
      // Field may not exist
    }

    try {
      const hqField = form.getTextField(pjFields.socialHeadquarters)
      hqField.setText(formatAddressForContract(data.socialHeadquarters))
    } catch {
      // Field may not exist
    }
  }

  // Flatten the form to make it non-editable
  form.flatten()

  return pdfDoc.save()
}
