type ConversionEventReceipt = {
  recorded?: unknown
}

export async function recordIncomeScenarioCompletion(): Promise<boolean> {
  try {
    const response = await fetch('/api/conversion-events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event: 'income_scenario_completed' }),
      credentials: 'same-origin',
    })

    if (response.status !== 200) return false

    const receipt: unknown = await response.json()
    return typeof receipt === 'object'
      && receipt !== null
      && (receipt as ConversionEventReceipt).recorded === true
  } catch {
    return false
  }
}
