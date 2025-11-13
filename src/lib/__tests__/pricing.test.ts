import { describe, expect, it } from 'vitest'
import { Decimal } from 'decimal.js-light'
import { PricingService } from '~/lib/pricing'
import { expectDecimalToEqual } from '#test/helpers/assertion-helpers'

describe('PricingService', () => {
  describe('convertEURtoRON', () => {
    it('should convert EUR to RON correctly', () => {
      const result = PricingService.convertEURtoRON(100, 5)
      expectDecimalToEqual(result, '500')
    })

    it('should handle decimal amounts', () => {
      const result = PricingService.convertEURtoRON(99.99, 4.9756)
      expectDecimalToEqual(result, '497.510244')
    })

    it('should handle string inputs', () => {
      const result = PricingService.convertEURtoRON('100', '5')
      expectDecimalToEqual(result, '500')
    })

    it('should handle zero values', () => {
      const result = PricingService.convertEURtoRON(0, 5)
      expectDecimalToEqual(result, '0')
    })
  })

  describe('convertRONtoEUR', () => {
    it('should convert RON to EUR correctly', () => {
      const result = PricingService.convertRONtoEUR(500, 5)
      expectDecimalToEqual(result, '100')
    })

    it('should handle decimal amounts', () => {
      const result = PricingService.convertRONtoEUR(497.56, 4.9756)
      expectDecimalToEqual(result, '100')
    })

    it('should handle string inputs', () => {
      const result = PricingService.convertRONtoEUR('500', '5')
      expectDecimalToEqual(result, '100')
    })

    it('should handle zero values', () => {
      const result = PricingService.convertRONtoEUR(0, 5)
      expectDecimalToEqual(result, '0')
    })
  })

  describe('multiply', () => {
    it('should multiply two numbers correctly', () => {
      const result = PricingService.multiply(100, 2)
      expectDecimalToEqual(result, '200')
    })

    it('should handle decimal multiplication', () => {
      const result = PricingService.multiply(99.99, 1.5)
      expectDecimalToEqual(result, '149.985')
    })

    it('should handle string inputs', () => {
      const result = PricingService.multiply('100', '2')
      expectDecimalToEqual(result, '200')
    })

    it('should handle zero multiplication', () => {
      const result = PricingService.multiply(100, 0)
      expectDecimalToEqual(result, '0')
    })
  })

  describe('calculateTax', () => {
    it('should calculate tax correctly', () => {
      const result = PricingService.calculateTax(100, 19)
      expectDecimalToEqual(result, '19')
    })

    it('should handle decimal tax rates', () => {
      const result = PricingService.calculateTax(1000, 19.5)
      expectDecimalToEqual(result, '195')
    })

    it('should handle decimal amounts', () => {
      const result = PricingService.calculateTax(99.99, 19)
      expectDecimalToEqual(result, '18.9981')
    })

    it('should handle zero tax rate', () => {
      const result = PricingService.calculateTax(100, 0)
      expectDecimalToEqual(result, '0')
    })

    it('should handle string inputs', () => {
      const result = PricingService.calculateTax('100', '19')
      expectDecimalToEqual(result, '19')
    })
  })

  describe('addTax', () => {
    it('should add tax to amount correctly', () => {
      const result = PricingService.addTax(100, 19)
      expectDecimalToEqual(result, '119')
    })

    it('should handle decimal tax rates', () => {
      const result = PricingService.addTax(1000, 19.5)
      expectDecimalToEqual(result, '1195')
    })

    it('should handle decimal amounts', () => {
      const result = PricingService.addTax(99.99, 19)
      expectDecimalToEqual(result, '118.9881')
    })

    it('should handle zero tax rate', () => {
      const result = PricingService.addTax(100, 0)
      expectDecimalToEqual(result, '100')
    })

    it('should handle string inputs', () => {
      const result = PricingService.addTax('100', '19')
      expectDecimalToEqual(result, '119')
    })
  })

  describe('removeTax', () => {
    it('should remove tax from amount correctly', () => {
      const result = PricingService.removeTax(119, 19)
      expectDecimalToEqual(result, '100')
    })

    it('should handle decimal tax rates', () => {
      const result = PricingService.removeTax(1195, 19.5)
      expectDecimalToEqual(result, '1000')
    })

    it('should handle decimal amounts', () => {
      const amountWithTax = new Decimal(100).mul(1.19)
      const result = PricingService.removeTax(amountWithTax, 19)
      expectDecimalToEqual(result, '100')
    })

    it('should handle zero tax rate', () => {
      const result = PricingService.removeTax(100, 0)
      expectDecimalToEqual(result, '100')
    })

    it('should handle string inputs', () => {
      const result = PricingService.removeTax('119', '19')
      expectDecimalToEqual(result, '100')
    })

    it('should be inverse of addTax', () => {
      const original = 100
      const taxRate = 19
      const withTax = PricingService.addTax(original, taxRate)
      const withoutTax = PricingService.removeTax(withTax, taxRate)
      expectDecimalToEqual(withoutTax, original.toString())
    })
  })

  describe('convertToCents', () => {
    it('should convert amount to cents', () => {
      const result = PricingService.convertToCents(100)
      expect(result).toBe(10000)
    })

    it('should handle decimal amounts', () => {
      const result = PricingService.convertToCents(99.99)
      expect(result).toBe(9999)
    })

    it('should round to 2 decimal places', () => {
      const result = PricingService.convertToCents(99.999)
      expect(result).toBe(10000)
    })

    it('should round half up', () => {
      const result = PricingService.convertToCents(99.995)
      expect(result).toBe(10000)
    })

    it('should handle string inputs', () => {
      const result = PricingService.convertToCents('100')
      expect(result).toBe(10000)
    })

    it('should handle zero values', () => {
      const result = PricingService.convertToCents(0)
      expect(result).toBe(0)
    })
  })

  describe('formatPrice', () => {
    it('should format price in RON', () => {
      const result = PricingService.formatPrice(100, 'RON')
      expect(result).toContain('100')
      expect(result).toContain('RON')
    })

    it('should format price in EUR with euro symbol', () => {
      const result = PricingService.formatPrice(100, 'EUR')
      expect(result).toContain('100')
      expect(result).toContain('€')
      expect(result).not.toContain('EUR')
    })

    it('should handle decimal amounts', () => {
      const result = PricingService.formatPrice(99.99, 'RON')
      expect(result).toContain('99,99')
    })

    it('should handle string inputs', () => {
      const result = PricingService.formatPrice('100', 'RON')
      expect(result).toContain('100')
    })
  })

  describe('calculateTotalAmountToPay', () => {
    it('should calculate total amount with extra tax and TVA', () => {
      const result = PricingService.calculateTotalAmountToPay({
        price: 1000,
        extraTaxRate: 10,
        tvaRate: 19
      })
      // 1000 + 10% = 1100
      // 1100 + 19% = 1309
      expectDecimalToEqual(result, '1309')
    })

    it('should handle zero extra tax', () => {
      const result = PricingService.calculateTotalAmountToPay({
        price: 1000,
        extraTaxRate: 0,
        tvaRate: 19
      })
      // 1000 + 0% = 1000
      // 1000 + 19% = 1190
      expectDecimalToEqual(result, '1190')
    })

    it('should handle zero TVA', () => {
      const result = PricingService.calculateTotalAmountToPay({
        price: 1000,
        extraTaxRate: 10,
        tvaRate: 0
      })
      // 1000 + 10% = 1100
      // 1100 + 0% = 1100
      expectDecimalToEqual(result, '1100')
    })

    it('should handle decimal amounts', () => {
      const result = PricingService.calculateTotalAmountToPay({
        price: 99.99,
        extraTaxRate: 10,
        tvaRate: 19
      })
      expectDecimalToEqual(result, '130.88691')
    })

    it('should handle string inputs', () => {
      const result = PricingService.calculateTotalAmountToPay({
        price: '1000',
        extraTaxRate: '10',
        tvaRate: '19'
      })
      expectDecimalToEqual(result, '1309')
    })
  })

  describe('calculateDepositRemainingAmountToPay', () => {
    it('should calculate deposit and remaining amount', () => {
      const result = PricingService.calculateDepositRemainingAmountToPay({
        price: 1000,
        extraTaxRate: 10,
        tvaRate: 19,
        depositAmount: 500
      })
      // Total: 1000 + 10% + 19% = 1309
      // Remaining: 1309 - 500 = 809
      expectDecimalToEqual(result.totalAmountToPay, '1309')
      expectDecimalToEqual(result.remainingAmountToPay, '809')
    })

    it('should handle deposit equal to total', () => {
      const result = PricingService.calculateDepositRemainingAmountToPay({
        price: 1000,
        extraTaxRate: 10,
        tvaRate: 19,
        depositAmount: 1309
      })
      expectDecimalToEqual(result.totalAmountToPay, '1309')
      expectDecimalToEqual(result.remainingAmountToPay, '0')
    })

    it('should handle small deposit', () => {
      const result = PricingService.calculateDepositRemainingAmountToPay({
        price: 1000,
        extraTaxRate: 10,
        tvaRate: 19,
        depositAmount: 100
      })
      expectDecimalToEqual(result.totalAmountToPay, '1309')
      expectDecimalToEqual(result.remainingAmountToPay, '1209')
    })

    it('should handle string inputs', () => {
      const result = PricingService.calculateDepositRemainingAmountToPay({
        price: '1000',
        extraTaxRate: '10',
        tvaRate: '19',
        depositAmount: '500'
      })
      expectDecimalToEqual(result.totalAmountToPay, '1309')
      expectDecimalToEqual(result.remainingAmountToPay, '809')
    })
  })

  describe('calculateInstallmentsAmountToPay', () => {
    it('should calculate installment amounts correctly', () => {
      const result = PricingService.calculateInstallmentsAmountToPay({
        pricePerInstallment: 100,
        installmentsCount: 12,
        extraTaxRate: 10,
        tvaRate: 19
      })
      // Per installment: 100 + 10% + 19% = 130.9
      // Total: 130.9 * 12 = 1570.8
      expectDecimalToEqual(result.installmentAmountToPay, '130.9')
      expectDecimalToEqual(result.totalAmountToPay, '1570.8')
    })

    it('should handle single installment', () => {
      const result = PricingService.calculateInstallmentsAmountToPay({
        pricePerInstallment: 1000,
        installmentsCount: 1,
        extraTaxRate: 10,
        tvaRate: 19
      })
      expectDecimalToEqual(result.installmentAmountToPay, '1309')
      expectDecimalToEqual(result.totalAmountToPay, '1309')
    })

    it('should handle many installments', () => {
      const result = PricingService.calculateInstallmentsAmountToPay({
        pricePerInstallment: 50,
        installmentsCount: 24,
        extraTaxRate: 10,
        tvaRate: 19
      })
      // Per installment: 50 + 10% + 19% = 65.45
      // Total: 65.45 * 24 = 1570.8
      expectDecimalToEqual(result.installmentAmountToPay, '65.45')
      expectDecimalToEqual(result.totalAmountToPay, '1570.8')
    })

    it('should handle zero taxes', () => {
      const result = PricingService.calculateInstallmentsAmountToPay({
        pricePerInstallment: 100,
        installmentsCount: 12,
        extraTaxRate: 0,
        tvaRate: 0
      })
      expectDecimalToEqual(result.installmentAmountToPay, '100')
      expectDecimalToEqual(result.totalAmountToPay, '1200')
    })

    it('should handle string inputs', () => {
      const result = PricingService.calculateInstallmentsAmountToPay({
        pricePerInstallment: '100',
        installmentsCount: '12',
        extraTaxRate: '10',
        tvaRate: '19'
      })
      expectDecimalToEqual(result.installmentAmountToPay, '130.9')
      expectDecimalToEqual(result.totalAmountToPay, '1570.8')
    })
  })

  describe('calculateInstallmentsDepositRemainingAmountToPay', () => {
    it('should calculate deposit installment amounts correctly', () => {
      const result =
        PricingService.calculateInstallmentsDepositRemainingAmountToPay({
          pricePerInstallment: 100,
          installmentsCount: 12,
          extraTaxRate: 10,
          tvaRate: 19,
          depositAmount: 500
        })
      // Per installment: 100 + 10% + 19% = 130.9
      // Total: 130.9 * 12 = 1570.8
      // Remaining: 1570.8 - 500 = 1070.8
      // Remaining per installment: 1070.8 / 12 = 89.23333...
      expectDecimalToEqual(result.installmentAmountToPay, '130.9')
      expectDecimalToEqual(result.totalAmountToPay, '1570.8')
      expectDecimalToEqual(result.remainingAmountToPay, '1070.8')
      expectDecimalToEqual(
        result.remainingInstallmentAmountToPay,
        '89.233333333333333333'
      )
    })

    it('should handle large deposit', () => {
      const result =
        PricingService.calculateInstallmentsDepositRemainingAmountToPay({
          pricePerInstallment: 100,
          installmentsCount: 12,
          extraTaxRate: 10,
          tvaRate: 19,
          depositAmount: 1500
        })
      expectDecimalToEqual(result.totalAmountToPay, '1570.8')
      expectDecimalToEqual(result.remainingAmountToPay, '70.8')
      expectDecimalToEqual(result.remainingInstallmentAmountToPay, '5.9')
    })

    it('should handle small deposit', () => {
      const result =
        PricingService.calculateInstallmentsDepositRemainingAmountToPay({
          pricePerInstallment: 100,
          installmentsCount: 12,
          extraTaxRate: 10,
          tvaRate: 19,
          depositAmount: 100
        })
      expectDecimalToEqual(result.totalAmountToPay, '1570.8')
      expectDecimalToEqual(result.remainingAmountToPay, '1470.8')
      expectDecimalToEqual(
        result.remainingInstallmentAmountToPay,
        '122.56666666666666666'
      )
    })

    it('should handle deposit equal to total', () => {
      const result =
        PricingService.calculateInstallmentsDepositRemainingAmountToPay({
          pricePerInstallment: 100,
          installmentsCount: 12,
          extraTaxRate: 10,
          tvaRate: 19,
          depositAmount: 1570.8
        })
      expectDecimalToEqual(result.totalAmountToPay, '1570.8')
      expectDecimalToEqual(result.remainingAmountToPay, '0')
      expectDecimalToEqual(result.remainingInstallmentAmountToPay, '0')
    })

    it('should handle string inputs', () => {
      const result =
        PricingService.calculateInstallmentsDepositRemainingAmountToPay({
          pricePerInstallment: '100',
          installmentsCount: '12',
          extraTaxRate: '10',
          tvaRate: '19',
          depositAmount: '500'
        })
      expectDecimalToEqual(result.installmentAmountToPay, '130.9')
      expectDecimalToEqual(result.totalAmountToPay, '1570.8')
      expectDecimalToEqual(result.remainingAmountToPay, '1070.8')
    })

    it('should maintain consistency across calculations', () => {
      const params = {
        pricePerInstallment: 100,
        installmentsCount: 12,
        extraTaxRate: 10,
        tvaRate: 19,
        depositAmount: 500
      }

      const result =
        PricingService.calculateInstallmentsDepositRemainingAmountToPay(params)

      // Verify remaining amount = total - deposit
      const expectedRemaining = result.totalAmountToPay.sub(params.depositAmount)
      expectDecimalToEqual(result.remainingAmountToPay, expectedRemaining.toString())

      // Verify remaining installment = remaining / count
      const expectedRemainingInstallment = result.remainingAmountToPay.div(
        params.installmentsCount
      )
      expectDecimalToEqual(
        result.remainingInstallmentAmountToPay,
        expectedRemainingInstallment.toString()
      )
    })
  })
})
