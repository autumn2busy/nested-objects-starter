type HandoffRow = { event_name: string; occurred_at: string; event_data: Record<string, unknown> | null }

export function summarizePricingHandoffs<T extends HandoffRow>(cohorts: T[][], isPaid: (row: T) => boolean) {
  const summary = { selectedPlanMembers: 0, selectedPlanWithoutHandoff: 0,
    generalUpgradeOnlyMembers: 0, attempts: 0, visible: 0, failed: 0,
    unobserved: 0, hostedRedirects: 0, closed: 0, recoveryRedirects: 0 }
  for (const rows of cohorts) {
    const selections = rows.filter(row => row.event_name === 'pricing_cta_click' && isPaid(row))
    const selected = selections.length > 0
    const general = rows.some(row => row.event_name === 'upgrade_clicked' && isPaid(row))
    if (selected) summary.selectedPlanMembers++
    if (general && !selected) summary.generalUpgradeOnlyMembers++
    const attempts = new Map<string, HandoffRow[]>()
    for (const row of rows) {
      const data = row.event_data
      if (row.event_name !== 'checkout_handoff' || !isPaid(row)
        || data?.handoffContract !== 'pricing-handoff-v1'
        || typeof data.handoffId !== 'string' || !/^handoff:[a-zA-Z0-9_-]{1,100}$/.test(data.handoffId)
        || !['register', 'profile_plan_change'].includes(String(data.mode))) continue
      const group = attempts.get(data.handoffId) || []
      group.push(row)
      attempts.set(data.handoffId, group)
    }
    let correlatedSelection = false
    for (const group of attempts.values()) {
      const request = group.filter(row => row.event_data?.handoffStatus === 'requested')
        .sort((a, b) => Date.parse(a.occurred_at) - Date.parse(b.occurred_at))[0]
      if (!request) continue
      const requestData = request.event_data!
      correlatedSelection ||= selections.some(row => row.event_data?.handoffId === requestData.handoffId
        && row.event_data?.targetPlanUid === requestData.targetPlanUid
        && row.event_data?.targetPlan === requestData.targetPlan)
      const statuses = new Set(group.filter(row => Date.parse(row.occurred_at) >= Date.parse(request.occurred_at)
        && row.event_data?.mode === requestData.mode
        && row.event_data?.targetPlanUid === requestData.targetPlanUid
        && row.event_data?.targetPlan === requestData.targetPlan).map(row => row.event_data?.handoffStatus))
      summary.attempts++
      if (statuses.has('widget_visible')) summary.visible++
      if (statuses.has('open_failed') || statuses.has('hosted_redirect_failed')) summary.failed++
      if (statuses.has('unobserved_timeout') || (!statuses.has('widget_visible')
        && !statuses.has('open_failed') && !statuses.has('hosted_redirect_requested')
        && !statuses.has('hosted_redirect_failed'))) summary.unobserved++
      if (statuses.has('hosted_redirect_requested')) summary.hostedRedirects++
      if (statuses.has('widget_visible') && statuses.has('closed')) summary.closed++
      if (statuses.has('recovery_redirect_requested')) summary.recoveryRedirects++
    }
    if (selected && !correlatedSelection) summary.selectedPlanWithoutHandoff++
  }
  return summary
}
