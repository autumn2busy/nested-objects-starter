function assertFiniteNonNegative(value, label) {
  if (!Number.isFinite(value) || value < 0) {
    throw new TypeError(`${label} must be a finite, non-negative number`)
  }
}

export function calculateAccountScenario({
  targetOperatingProfit,
  annualRevenuePerAccount,
  grossMarginRate,
  operatingExpensesExcludingFounder,
  founderCompensation,
}) {
  assertFiniteNonNegative(targetOperatingProfit, 'targetOperatingProfit')
  assertFiniteNonNegative(annualRevenuePerAccount, 'annualRevenuePerAccount')
  assertFiniteNonNegative(grossMarginRate, 'grossMarginRate')
  assertFiniteNonNegative(operatingExpensesExcludingFounder, 'operatingExpensesExcludingFounder')
  assertFiniteNonNegative(founderCompensation, 'founderCompensation')

  if (grossMarginRate > 1) {
    throw new RangeError('grossMarginRate cannot exceed 1')
  }

  const annualGrossProfitPerAccount = annualRevenuePerAccount * grossMarginRate
  if (annualGrossProfitPerAccount === 0) {
    throw new RangeError('annual gross profit per account must be greater than zero')
  }

  const requiredAnnualGrossProfit =
    targetOperatingProfit + operatingExpensesExcludingFounder + founderCompensation

  return {
    annualGrossProfitPerAccount,
    requiredAnnualGrossProfit,
    requiredAveragePayingAccounts: Math.ceil(requiredAnnualGrossProfit / annualGrossProfitPerAccount),
  }
}

export function calculatePortfolio({
  segments,
  operatingExpensesExcludingFounder,
  founderCompensation,
}) {
  assertFiniteNonNegative(operatingExpensesExcludingFounder, 'operatingExpensesExcludingFounder')
  assertFiniteNonNegative(founderCompensation, 'founderCompensation')

  const totals = segments.reduce(
    (result, segment) => {
      assertFiniteNonNegative(segment.averagePayingAccounts, 'averagePayingAccounts')
      assertFiniteNonNegative(segment.annualRevenuePerAccount, 'annualRevenuePerAccount')
      assertFiniteNonNegative(segment.grossMarginRate, 'grossMarginRate')
      if (segment.grossMarginRate > 1) {
        throw new RangeError('grossMarginRate cannot exceed 1')
      }

      const revenue = segment.averagePayingAccounts * segment.annualRevenuePerAccount
      const grossProfit = revenue * segment.grossMarginRate
      result.revenue += revenue
      result.grossProfit += grossProfit
      return result
    },
    { revenue: 0, grossProfit: 0 },
  )

  return {
    ...totals,
    variableCosts: totals.revenue - totals.grossProfit,
    grossMarginRate: totals.revenue === 0 ? 0 : totals.grossProfit / totals.revenue,
    operatingExpensesExcludingFounder,
    founderCompensation,
    operatingProfit:
      totals.grossProfit - operatingExpensesExcludingFounder - founderCompensation,
  }
}
