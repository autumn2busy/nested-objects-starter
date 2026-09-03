export type IncomeScenarioInputs = {
  assignmentsPerMonth: number
  averageFeePerAssignment: number
  averageMilesPerAssignment: number
  vehicleCostPerMile: number
  minutesPerAssignment: number
  otherMonthlyCosts: number
}

export type IncomeScenarioResults = {
  grossRevenue: number
  routeMiles: number
  vehicleCosts: number
  totalCosts: number
  estimatedNet: number
  workingHours: number
  netPerAssignment: number
  netPerHour: number
}

function nonNegative(value: number): number {
  return Number.isFinite(value) && value > 0 ? value : 0
}

export function calculateIncomeScenario(input: IncomeScenarioInputs): IncomeScenarioResults {
  const assignments = nonNegative(input.assignmentsPerMonth)
  const fee = nonNegative(input.averageFeePerAssignment)
  const milesPerAssignment = nonNegative(input.averageMilesPerAssignment)
  const vehicleCostPerMile = nonNegative(input.vehicleCostPerMile)
  const minutesPerAssignment = nonNegative(input.minutesPerAssignment)
  const otherMonthlyCosts = nonNegative(input.otherMonthlyCosts)

  const grossRevenue = assignments * fee
  const routeMiles = assignments * milesPerAssignment
  const vehicleCosts = routeMiles * vehicleCostPerMile
  const totalCosts = vehicleCosts + otherMonthlyCosts
  const estimatedNet = grossRevenue - totalCosts
  const workingHours = (assignments * minutesPerAssignment) / 60

  return {
    grossRevenue,
    routeMiles,
    vehicleCosts,
    totalCosts,
    estimatedNet,
    workingHours,
    netPerAssignment: assignments > 0 ? estimatedNet / assignments : 0,
    netPerHour: workingHours > 0 ? estimatedNet / workingHours : 0,
  }
}
