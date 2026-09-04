import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import test from 'node:test'
import vm from 'node:vm'

const require = createRequire(import.meta.url)
const ts = require('typescript')

function load(relativePath) {
  const source = readFileSync(new URL(relativePath, import.meta.url), 'utf8')
  const code = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText
  const exports = {}
  vm.runInNewContext(code, { exports, require })
  return exports
}

const income = load('../app/tools/income-calculator/calculations.ts')
const route = load('../app/tools/notary-route-calculator/calculations.ts')
const plain = (value) => JSON.parse(JSON.stringify(value))

test('income scenario uses only the six entered assumptions', () => {
  const result = plain(income.calculateIncomeScenario({
    assignmentsPerMonth: 20,
    averageFeePerAssignment: 75,
    averageMilesPerAssignment: 12.5,
    vehicleCostPerMile: 0.5,
    minutesPerAssignment: 90,
    otherMonthlyCosts: 100,
  }))

  assert.deepEqual(result, {
    grossRevenue: 1500,
    routeMiles: 250,
    vehicleCosts: 125,
    totalCosts: 225,
    estimatedNet: 1275,
    workingHours: 30,
    netPerAssignment: 63.75,
    netPerHour: 42.5,
  })
})

test('income scenario adds no default earnings or costs and rejects invalid negative assumptions', () => {
  const result = plain(income.calculateIncomeScenario({
    assignmentsPerMonth: -5,
    averageFeePerAssignment: Number.NaN,
    averageMilesPerAssignment: Number.POSITIVE_INFINITY,
    vehicleCostPerMile: -1,
    minutesPerAssignment: -30,
    otherMonthlyCosts: -20,
  }))
  assert.deepEqual(result, {
    grossRevenue: 0,
    routeMiles: 0,
    vehicleCosts: 0,
    totalCosts: 0,
    estimatedNet: 0,
    workingHours: 0,
    netPerAssignment: 0,
    netPerHour: 0,
  })
})

test('route economics accounts for every visible cost and time input', () => {
  const result = plain(route.calculateRouteEconomics({
    assignmentFee: 100,
    scheduledAssignmentsPerWeek: 10,
    cancellationRatePercent: 20,
    vehicleMilesPerScheduledAssignment: 15,
    vehicleCostPerMile: 0.5,
    supplyCostPerCompletedAssignment: 10,
    driveMinutesPerScheduledAssignment: 30,
    workMinutesPerCompletedAssignment: 45,
    fixedWeeklyCosts: 45,
    addOnFee: 30,
    addOnsPerWeek: 2,
    addOnMiles: 5,
    addOnMinutes: 20,
  }))

  assert.equal(result.completedAssignments, 8)
  assert.equal(result.grossRevenue, 860)
  assert.equal(result.totalMiles, 160)
  assert.equal(result.vehicleCosts, 80)
  assert.equal(result.supplyCosts, 80)
  assert.equal(result.totalCosts, 205)
  assert.equal(result.estimatedNet, 655)
  assert.ok(Math.abs(result.totalHours - (700 / 60)) < 1e-10)
  assert.ok(Math.abs(result.netPerHour - (655 / (700 / 60))) < 1e-10)
  assert.equal(result.netPerMile, 4.09375)
})

test('route economics adds no hidden add-on time and caps cancellation at one hundred percent', () => {
  const result = plain(route.calculateRouteEconomics({
    assignmentFee: 100,
    scheduledAssignmentsPerWeek: 4,
    cancellationRatePercent: 150,
    vehicleMilesPerScheduledAssignment: 0,
    vehicleCostPerMile: 0,
    supplyCostPerCompletedAssignment: 0,
    driveMinutesPerScheduledAssignment: 0,
    workMinutesPerCompletedAssignment: 0,
    fixedWeeklyCosts: 0,
    addOnFee: 20,
    addOnsPerWeek: 3,
    addOnMiles: 0,
    addOnMinutes: 0,
  }))

  assert.equal(result.completedAssignments, 0)
  assert.equal(result.grossRevenue, 60)
  assert.equal(result.totalHours, 0)
  assert.equal(result.netPerHour, 0)
})
