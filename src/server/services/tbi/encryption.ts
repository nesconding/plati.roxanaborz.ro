/**
 * TBI Bank RSA Encryption/Decryption Utilities
 *
 * Based on TBI eCommerce API Documentation:
 * - Encryption: Block size = (key_size / 8) - 11
 * - Decryption: Block size = (key_size / 8)
 * - Uses PKCS1 padding
 *
 * Note: Uses node-forge for decryption due to Node.js v22+ blocking
 * RSA_PKCS1_PADDING for privateDecrypt (CVE-2024-PEND security fix).
 * TBI Bank uses PKCS#1 padding which we cannot change.
 */

import crypto from 'node:crypto'
import forge from 'node-forge'

/**
 * Get the key size in bits from a PEM-encoded public key
 */
function getPublicKeySize(publicKeyPem: string): number {
  const publicKey = crypto.createPublicKey(publicKeyPem)
  const keyDetails = publicKey.export({ type: 'spki', format: 'der' })
  // RSA keys are typically 2048 bits (256 bytes)
  // The actual size can be determined from the key
  return (
    crypto.createPublicKey(publicKeyPem).asymmetricKeyDetails?.modulusLength ??
    2048
  )
}

/**
 * Get the key size in bits from a PEM-encoded private key
 */
function getPrivateKeySize(privateKeyPem: string): number {
  return (
    crypto.createPrivateKey(privateKeyPem).asymmetricKeyDetails
      ?.modulusLength ?? 2048
  )
}

/**
 * Encrypt data using RSA public key with chunking
 *
 * Algorithm:
 * 1. Calculate block size: (key_size / 8) - 11
 * 2. Split plaintext into chunks of block size
 * 3. Encrypt each chunk separately
 * 4. Concatenate all encrypted chunks
 * 5. Encode result as base64
 */
export function encryptData(plaintext: string, publicKeyPem: string): string {
  const keySize = getPublicKeySize(publicKeyPem)
  const chunkSize = Math.floor(keySize / 8) - 11
  const plaintextBuffer = Buffer.from(plaintext, 'utf8')

  const encryptedChunks: Buffer[] = []

  for (let i = 0; i < plaintextBuffer.length; i += chunkSize) {
    const chunk = plaintextBuffer.subarray(i, i + chunkSize)
    const encryptedChunk = crypto.publicEncrypt(
      {
        key: publicKeyPem,
        padding: crypto.constants.RSA_PKCS1_PADDING
      },
      chunk
    )
    encryptedChunks.push(encryptedChunk)
  }

  const concatenated = Buffer.concat(encryptedChunks)
  return concatenated.toString('base64')
}

/**
 * Decrypt data using RSA private key with chunking
 *
 * Algorithm:
 * 1. Decode from base64
 * 2. Calculate block size: (key_size / 8)
 * 3. Split ciphertext into chunks of block size
 * 4. Decrypt each chunk separately using node-forge (PKCS#1 padding)
 * 5. Concatenate all decrypted chunks
 *
 * Note: Uses node-forge instead of Node.js crypto.privateDecrypt because
 * Node.js v22+ blocks RSA_PKCS1_PADDING for private decryption.
 * TBI Bank encrypts webhook data with PKCS#1 padding, which we cannot change.
 */
export function decryptData(
  encryptedBase64: string,
  privateKeyPem: string
): string {
  const keySize = getPrivateKeySize(privateKeyPem)
  const chunkSize = Math.floor(keySize / 8)
  const encryptedBuffer = Buffer.from(encryptedBase64, 'base64')

  // Convert PEM to forge private key
  const privateKey = forge.pki.privateKeyFromPem(privateKeyPem)

  const decryptedChunks: string[] = []

  for (let i = 0; i < encryptedBuffer.length; i += chunkSize) {
    const chunk = encryptedBuffer.subarray(i, i + chunkSize)

    // Convert chunk to forge bytes format (binary string)
    const chunkBinary = forge.util.createBuffer(chunk).getBytes()

    // Decrypt using forge with PKCS#1 v1.5 padding
    // Using 'RSAES-PKCS1-V1_5' scheme (correct node-forge scheme name)
    const decryptedChunk = privateKey.decrypt(chunkBinary, 'RSAES-PKCS1-V1_5')

    decryptedChunks.push(decryptedChunk)
  }

  // Concatenate all decrypted chunks
  const concatenated = decryptedChunks.join('')
  return concatenated
}

/**
 * Encrypt order data for TBI API
 */
export function encryptOrderData<T extends object>(
  data: T,
  publicKeyPem: string
): string {
  const jsonString = JSON.stringify(data)
  return encryptData(jsonString, publicKeyPem)
}

/**
 * Decrypt status update from TBI webhook
 */
export function decryptStatusUpdate<T>(
  encryptedData: string,
  privateKeyPem: string
): T {
  const jsonString = decryptData(encryptedData, privateKeyPem)
  return JSON.parse(jsonString) as T
}
