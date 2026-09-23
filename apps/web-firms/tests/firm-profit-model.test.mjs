import assert from 'node:assert/strict'
import test from 'node:test'

import { calculateAccountScenario, calculatePortfolio } from '../lib/profit-model.mjs'

const annualTarget = 1_000_000

test('required-account scenarios use operating profit after founder compensation and before tax', () => {
  const managedFirm = calculateAccountScenario({
    targetOperatingProfit: annualTarget,
    annualRevenuePerAccount: 3_000 * 12,
    grossMarginRate: 0.45,
    operatingExpensesExcludingFounder: 750_000,
    founderCompensation: 150_000,
  })

  assert.deepEqual(managedFirm, {
    annualGrossProfitPerAccount: 16_200,
    requiredAnnualGrossProfit: 1_900_000,
    requiredAveragePayingAccounts: 118,
  })
})

test('proposed mixed portfolio crosses the annual operating-profit scenario without implying taxes or cash', () => {
  const portfolio = calculatePortfolio({
    segments: [
      {
        averagePayingAccounts: 1_500,
        annualRevenuePerAccount: 49 * 12,
        grossMarginRate: 0.82,
      },
      {
        averagePayingAccounts: 75,
        annualRevenuePerAccount: 3_000 * 12,
        grossMarginRate: 0.45,
      },
    ],
    operatingExpensesExcludingFounder: 750_000,
    founderCompensation: 150_000,
  })

  assert.equal(portfolio.revenue, 3_582_000)
  assert.equal(portfolio.grossProfit, 1_938_240)
  assert.equal(portfolio.variableCosts, 1_643_760)
  assert.equal(portfolio.operatingProfit, 1_038_240)
  assert.ok(Math.abs(portfolio.grossMarginRate - 0.541105527638191) < Number.EPSILON)
})

test('invalid economics fail instead of producing a persuasive but meaningless count', () => {
  assert.throws(
    () =>
      calculateAccountScenario({
        targetOperatingProfit: annualTarget,
        annualRevenuePerAccount: 1_500,
        grossMarginRate: 0,
        operatingExpensesExcludingFounder: 450_000,
        founderCompensation: 150_000,
      }),
    /must be greater than zero/,
  )
})
