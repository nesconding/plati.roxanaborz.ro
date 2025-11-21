import { Decimal, type Numeric } from 'decimal.js-light'

class PricingServiceImpl {
  /**
   * Convert EUR to RON
   *
   * @param eurAmount - The amount in EUR
   * @param eurToRonRate - The exchange rate from EUR to RON
   * @returns The amount in RON
   */
  convertEURtoRON(eurAmount: Numeric, eurToRonRate: Numeric): Decimal {
    return new Decimal(eurAmount).mul(new Decimal(eurToRonRate))
  }

  /**
   * Multiply two numbers
   *
   * @param multiplicand - The number to multiply
   * @param multiplier - The number to multiply by
   * @returns The product of the two numbers
   */
  multiply(multiplicand: Numeric, multiplier: Numeric): Decimal {
    return new Decimal(multiplicand).mul(new Decimal(multiplier))
  }

  /**
   * Calculate the tax for a given amount
   *
   * @param amount - The amount to calculate the tax for
   * @param taxRate - The tax rate to apply
   * @returns The tax amount
   */
  calculateTax(amount: Numeric, taxRate: Numeric): Decimal {
    return new Decimal(amount).mul(new Decimal(taxRate).div(100))
  }

  /**
   * Add the tax to a given amount
   *
   * @param amount - The amount to add the tax to
   * @param taxRate - The tax rate to apply
   * @returns The amount with the tax added
   */
  addTax(amount: Numeric, taxRate: Numeric): Decimal {
    const tax = this.calculateTax(amount, taxRate)
    return new Decimal(amount).add(tax)
  }

  /**
   * Remove the tax from a given amount
   *
   * @param amountWithTax - The amount to remove the tax from
   * @param taxRate - The tax rate to apply
   * @returns The amount with the tax removed
   */
  removeTax(amountWithTax: Numeric, taxRate: Numeric): Decimal {
    return new Decimal(amountWithTax).div(new Decimal(taxRate).div(100).add(1))
  }

  /**
   * Convert an amount to cents
   *
   * @param amount - The amount to convert to cents
   * @returns The amount in cents
   */
  convertToCents(amount: Numeric): number {
    return new Decimal(amount)
      .toDecimalPlaces(2, Decimal.ROUND_HALF_UP)
      .times(100)
      .toNumber()
  }

  /**
   * Format a price to a string
   *
   * @param price - The price to format
   * @param currency - The currency to format the price in
   * @returns The formatted price
   */
  formatPrice(price: Numeric, currency: 'EUR' | 'RON'): string {
    const formattedPrice = Intl.NumberFormat('ro-RO', {
      currency,
      style: 'currency'
    }).format(new Decimal(price).toString() as `${number}`)
    if (currency === 'EUR') return formattedPrice.replace('EUR', '€')
    return formattedPrice
  }

  /**
   * Calculate the amount to pay for an integral payment
   *
   * @description totalAmountToPay = (price + (price * extra tax) + (price * TVA))
   *
   * @returns Amount to pay
   */
  calculateTotalAmountToPay(data: {
    extraTaxRate: Numeric
    price: Numeric
    tvaRate: Numeric
  }): Decimal {
    const price = new Decimal(data.price)
    const withExtraTax = this.addTax(price, data.extraTaxRate)
    const withTVA = this.addTax(withExtraTax, data.tvaRate)
    return withTVA
  }

  /**
   * Calculate the remaining amount to pay for a deposit payment
   *
   * @description totalAmountToPay = (price + (price * extra tax) + (price * TVA))
   * @description remainingAmountToPay = totalAmountToPay - deposit
   *
   * @returns Total amount to pay and remaining amount to pay
   */
  calculateDepositRemainingAmountToPay(data: {
    extraTaxRate: Numeric
    depositAmount: Numeric
    price: Numeric
    tvaRate: Numeric
  }): {
    remainingAmountToPay: Decimal
    totalAmountToPay: Decimal
  } {
    const totalAmountToPay = this.calculateTotalAmountToPay(data)
    const remainingAmountToPay = totalAmountToPay.sub(data.depositAmount)
    return { remainingAmountToPay, totalAmountToPay }
  }

  /**
   * Calculate the amount to pay for an installments payment
   *
   * @description installmentAmountToPay = (pricePerInstallment + (pricePerInstallment * extra tax) + (pricePerInstallment * TVA))
   * @description totalAmountToPay = amountPerInstallment * installmentsCount
   *
   * @returns Amount to pay per installment and total amount to pay
   */
  calculateInstallmentsAmountToPay(data: {
    extraTaxRate: Numeric
    installmentsCount: Numeric
    pricePerInstallment: Numeric
    tvaRate: Numeric
  }): {
    installmentAmountToPay: Decimal
    totalAmountToPay: Decimal
  } {
    const installmentAmountToPay = this.calculateTotalAmountToPay({
      extraTaxRate: data.extraTaxRate,
      price: data.pricePerInstallment,
      tvaRate: data.tvaRate
    })
    const totalAmountToPay = installmentAmountToPay.mul(data.installmentsCount)
    return { installmentAmountToPay, totalAmountToPay }
  }

  /**
   * Calculate the remaining amount to pay for an installments deposit payment
   *
   * @description installmentAmountToPay = (pricePerInstallment + (pricePerInstallment * extra tax) + (pricePerInstallment * TVA))
   * @description totalAmountToPay = amountPerInstallment * installmentsCount
   * @description remainingAmountToPay = totalAmountToPay - deposit
   * @description remainingInstallmentAmountToPay = remainingAmountToPay / installmentsCount
   *
   * @returns Remaining amount to pay in total, the amount to pay per installment with TVA and extra tax
   */
  calculateInstallmentsDepositRemainingAmountToPay(data: {
    extraTaxRate: Numeric
    depositAmount: Numeric
    installmentsCount: Numeric
    pricePerInstallment: Numeric
    tvaRate: Numeric
  }): {
    installmentAmountToPay: Decimal
    remainingAmountToPay: Decimal
    remainingInstallmentAmountToPay: Decimal
    totalAmountToPay: Decimal
  } {
    const { installmentAmountToPay, totalAmountToPay } =
      this.calculateInstallmentsAmountToPay({
        extraTaxRate: data.extraTaxRate,
        installmentsCount: data.installmentsCount,
        pricePerInstallment: data.pricePerInstallment,
        tvaRate: data.tvaRate
      })
    const remainingAmountToPay = totalAmountToPay.sub(data.depositAmount)
    const remainingInstallmentAmountToPay = remainingAmountToPay.div(
      data.installmentsCount
    )
    return {
      installmentAmountToPay,
      remainingAmountToPay,
      remainingInstallmentAmountToPay,
      totalAmountToPay
    }
  }
}

export const PricingService = new PricingServiceImpl()
