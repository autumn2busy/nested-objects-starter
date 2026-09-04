export type RouteEconomicsInputs = {
  assignmentFee: number
  scheduledAssignmentsPerWeek: number
  cancellationRatePercent: number
  vehicleMilesPerScheduledAssignment: number
  vehicleCostPerMile: number
  supplyCostPerCompletedAssignment: number
  driveMinutesPerScheduledAssignment: number
  workMinutesPerCompletedAssignment: number
  fixedWeeklyCosts: number
  addOnFee: number
  addOnsPerWeek: number
  addOnMiles: number
  addOnMinutes: number
}

export type RouteEconomicsResults = {
  completedAssignments: number
  grossRevenue: number
  totalMiles: number
  vehicleCosts: number
  supplyCosts: number
  totalCosts: number
  totalHours: number
  estimatedNet: number
  netPerHour: number
  netPerMile: number
}

function nonNegative(value: number): number {
  return Number.isFinite(value) && value > 0 ? value : 0
}

function percentage(value: number): number {
  return Math.min(100, nonNegative(value))
}

export function calculateRouteEconomics(input: RouteEconomicsInputs): RouteEconomicsResults {
  const scheduledAssignments = nonNegative(input.scheduledAssignmentsPerWeek)
  const completedAssignments = scheduledAssignments * (1 - percentage(input.cancellationRatePercent) / 100)
  const addOns = nonNegative(input.addOnsPerWeek)

  const assignmentGross = completedAssignments * nonNegative(input.assignmentFee)
  const addOnGross = addOns * nonNegative(input.addOnFee)
  const grossRevenue = assignmentGross + addOnGross

  const assignmentMiles = scheduledAssignments * nonNegative(input.vehicleMilesPerScheduledAssignment)
  const addOnMiles = addOns * nonNegative(input.addOnMiles)
  const totalMiles = assignmentMiles + addOnMiles
  const vehicleCosts = totalMiles * nonNegative(input.vehicleCostPerMile)
  const supplyCosts = completedAssignments * nonNegative(input.supplyCostPerCompletedAssignment)
  const totalCosts = vehicleCosts + supplyCosts + nonNegative(input.fixedWeeklyCosts)

  const driveMinutes = scheduledAssignments * nonNegative(input.driveMinutesPerScheduledAssignment)
  const workMinutes = completedAssignments * nonNegative(input.workMinutesPerCompletedAssignment)
  const addOnMinutes = addOns * nonNegative(input.addOnMinutes)
  const totalHours = (driveMinutes + workMinutes + addOnMinutes) / 60
  const estimatedNet = grossRevenue - totalCosts

  return {
    completedAssignments,
    grossRevenue,
    totalMiles,
    vehicleCosts,
    supplyCosts,
    totalCosts,
    totalHours,
    estimatedNet,
    netPerHour: totalHours > 0 ? estimatedNet / totalHours : 0,
    netPerMile: totalMiles > 0 ? estimatedNet / totalMiles : 0,
  }
}
