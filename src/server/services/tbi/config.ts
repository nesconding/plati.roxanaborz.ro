/**
 * TBI Bank API Configuration
 */

export type TbiEnvironment = 'uat' | 'production'

const TBI_ENDPOINTS = {
  production: {
    cancel:
      'https://ecommerce.tbibank.ro/Api/LoanApplication/CanceledByCustomer',
    finalize: 'https://ecommerce.tbibank.ro/Api/LoanApplication/Finalize'
  },
  uat: {
    cancel:
      'https://vmrouatftos01.westeurope.cloudapp.azure.com/LoanApplication/CanceledByCustomer',
    finalize:
      'https://vmrouatftos01.westeurope.cloudapp.azure.com/LoanApplication/Finalize'
  }
} as const

function getRequiredEnvVar(name: string): string {
  const value = process.env[name]
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`)
  }
  return value
}

function getOptionalEnvVar(name: string, defaultValue: string): string {
  return process.env[name] ?? defaultValue
}

export function getTbiConfig() {
  const environment = getOptionalEnvVar(
    'TBI_ENVIRONMENT',
    'uat'
  ) as TbiEnvironment

  return {
    defaultCategory: getOptionalEnvVar('TBI_DEFAULT_CATEGORY', '2'),
    endpoints: TBI_ENDPOINTS[environment],
    environment,
    merchantPrivateKey: getRequiredEnvVar('TBI_MERCHANT_PRIVATE_KEY'),
    password: getRequiredEnvVar('TBI_PASSWORD'),
    providerCode: getRequiredEnvVar('TBI_PROVIDER_CODE'),
    sftlPublicKey: getRequiredEnvVar('TBI_SFTL_PUBLIC_KEY'),
    storeId: getRequiredEnvVar('TBI_STORE_ID'),
    username: getRequiredEnvVar('TBI_USERNAME')
  }
}

export type TbiConfig = ReturnType<typeof getTbiConfig>
