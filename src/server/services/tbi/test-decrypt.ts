/**
 * Test script to verify TBI webhook decryption using node-forge
 *
 * This tests the node-forge implementation that bypasses the Node.js v22 restriction
 * on RSA_PKCS1_PADDING for private decryption operations.
 *
 * Run with: bun run src/server/services/tbi/test-decrypt.ts
 */

import { decryptData } from './encryption'

// Test data from TBI documentation (5. Decripting status Update Code Example.php)
const TEST_ENCRYPTED_DATA =
  'ljlPFYJnPM1QLZvkgjO+zq29ktIwSDNNDmM8tkgrrq92a5GMFRtdgagDuPfPZLXtY/jbzNSQ1i0VJRbwXlCQJi8ril5pey6QHIL4kotNwhpC8mNed7s1jDi3yKRAK/17dA9XmJADt2Ck0Kjh3C94yrvemG12gFpDwhDPC1qPJhVce+VUUbLNjrHMWU4y2aK/Dg/kyJXAuBE/SheRE5vyvcFTBaVh3qfH/ycvoe83VWfwHBaLePD7E3+BwfGe/kufTcgiaCCu1eKAPuAM5lAdC2JRKCD93xIYa/gc3YWcUFirCOnKe0IE0VTUqbRpRmdVsZeTGhsSVlAImGLN76fgWA=='

// Test private key from TBI documentation (same as our merchant private key)
const TEST_PRIVATE_KEY = `-----BEGIN PRIVATE KEY-----
MIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQDtEwOLvJj26z7+
1QTyGs3fb+Yi1SwEOl4DE2BboM9E6S4CohORsKetwiUFX0Cs6stuVJIHBuSt//v6
KYSj/RhWUtC34+lxqaFOnXrdXGHl5ka3KGHKlAh+9Qi1YNrpaIq6qDTWHOof38zQ
hRGj57dbheM92RnAt7GHjGs7AIfkAvFE9hYOk7psnIfR3oU3C07VO4peyu9F1x4U
tfL9TFa39g9rm4imU30w6ypuIPvejZ8zO4spuBBuumiU69zjlRmKrnjQEtRQW1U7
m0eJ84l1MV/MSUoO0tC1p8jztmRHqy3sxlBhcmJrvRRJ+evoIBIozOGHNTSLq7kE
+99FO5bdAgMBAAECggEBANSLa25oU6tsFTpauOhl55UeuXEZNTFFMuwG/yim76yU
cc+ih3DitDIwEQjT8SQWDPSJlbH/GB53le0eM/DiBGPAM6fqCW0B68CTp4e2P37i
CRxEdAgu178a6AfVIe6I73eRPm2H1s9k0jdQVhRgth6z1puofFIvXlZsKebn/u0H
jJBHapAwNO6pfYoj9eVsC3vg7jQHwhPROIMPVMtEWNoxJxyrFB1otO40T2m20vzY
+ei7vPhdlPEaP4If86mRpxEJR3Ze1vc6ZEYl0C0x5WkELHm9V3MEKKa2Y6eVOa85
qlUpt3QonMtdJRtMdZ1L8I/4RKKaNzROf9u9FZMnbPECgYEA9/f38czCHjR43aSw
gE9Rl0ipLdHJsbYMtKEElqCUnhorpMiDpFZhzXl9paDuD+TUiPdjVsyrK9qrRwsp
KXg/xSjPhoQ7RqAIZ8UOQ3bSZqtLOEO4D6f7V1JfvYzahFGFW45ghrkaQ46qQrTm
FaGJ4DQJ0rycRA91Bt64wddsFz8CgYEA9MC2/PVrdbVU4WzEnUomf6hnBsQWEz+S
lq0nVOREiffMMENDvL+i+KhP9CzVhaPAM/DqFAi4+KlBTbdsnbtxsxv3ND7QMWp3
cQHg8Gcfl0PIm4IuREgnFjW/CFxYkRSUcq05adAUbRAp+nvjHytf83oihpiwSPlA
jzbHob3IhuMCgYBRAvdDTRUCTzxJlTuAv+k1Fq0G5ioR4BsojA52s4G6YWxuyn+P
mhUbzxxIl1oPYUA6ezA+NGGb0zXv4OqSvNGAtUOPe/XtrezxEgUF73Tvy/ioKh+h
Jc1MiwHyaGkfn46FCe/pM+IrvhlL79PXr03fLMEk0y/uYGpoUy1jTuDmewKBgGvd
nwfe1Ww77VuoBwLXEh6Cxl0aACydgOo9B6+HJpmzht7iVjESOC3kZ9BSDgxmvadm
jpMjwPl+BpTMuObPHG32bj0tTa3poRhB3rO0jxyoN/opJmDbd7Z3G2kA4duWuVHM
/BehJ89lJ0sIXHF5OUFh22N8WXzftM8pMlQbAwxHAoGBAOOsAYi0aW2upfNX7xs9
2ZBjEq0XMIDEULHX/Hs4yC+NIMocicCibbWlt9bGDmhdUJUEVzYN9UlYLfBXSY0Y
5y3zWlj0hMQm1tEGHVH+RqSS/rbcJ6gzBLmjIHcV0UjohloWB+RaiA1cfC+I2eMP
BKYQfzWywckxS/S9gYopfqqK
-----END PRIVATE KEY-----`

function testDecryption() {
  console.log('='.repeat(70))
  console.log('TBI Webhook Decryption Test (using node-forge)')
  console.log('='.repeat(70))
  console.log('')

  try {
    console.log('[TEST] Runtime environment:', process.version)
    console.log(
      '[TEST] Bun version:',
      process.versions.bun || 'Not running on Bun'
    )
    console.log('')

    // Decode base64 to check data size
    const encryptedBuffer = Buffer.from(TEST_ENCRYPTED_DATA, 'base64')
    console.log(`[TEST] Encrypted data length: ${encryptedBuffer.length} bytes`)
    console.log('')

    console.log('[TEST] Starting decryption using node-forge...')

    // Use our actual decryptData function
    const result = decryptData(TEST_ENCRYPTED_DATA, TEST_PRIVATE_KEY)

    console.log('')
    console.log('='.repeat(70))
    console.log('[TEST] ✅ SUCCESS! Decryption worked with node-forge!')
    console.log('='.repeat(70))
    console.log('')
    console.log('[TEST] Decrypted result:')
    console.log(result)
    console.log('')
    console.log('[TEST] Result length:', result.length, 'characters')
    console.log('')
    console.log('='.repeat(70))
    console.log(
      '[CONCLUSION] node-forge successfully bypasses Node.js v22 restriction!'
    )
    console.log('[CONCLUSION] TBI webhook decryption will work correctly.')
    console.log('='.repeat(70))

    return true
  } catch (error) {
    console.log('')
    console.log('='.repeat(70))
    console.log('[TEST] ❌ FAILED! Decryption error!')
    console.log('='.repeat(70))
    console.log('')
    console.error('[TEST] Error:', error)
    console.log('')
    console.log('='.repeat(70))
    console.log('[CONCLUSION] node-forge implementation has issues.')
    console.log('[CONCLUSION] Need to debug the decryption logic.')
    console.log('='.repeat(70))

    return false
  }
}

// Run the test
testDecryption()
