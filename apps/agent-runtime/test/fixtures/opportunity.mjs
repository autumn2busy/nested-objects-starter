const now = '2026-09-07T17:00:00.000Z'
const correlation = { correlationId: 'opportunity-test', causationId: null, traceId: null }
const checksum = 'a'.repeat(64)
export function fixture() {
  return {
    observedAt: now, correlation,
    sourcePolicy: { mailboxKey: 'test-mailbox', sender: 'source@example.test', subject: 'Experienced vendors needed (50 States)',
      applicationHosts: ['example.test'], applicationEmails: ['source@example.test'] },
    envelope: { mailboxKey: 'test-mailbox', gmailMessageId: 'synthetic-358', sender: 'source@example.test',
      subject: 'Experienced vendors needed (50 States)', internalDateMs: Date.parse('2026-09-07T16:51:35Z'),
      receiverAuthentication: { receiver: 'gmail', spf: 'pass', alignedDkim: 'pass', dmarc: 'pass' },
      extraction: { state: 'reviewed', reviewedAt: now, sourceSha256: checksum, facts: {
        company: 'Example Inspection Services', work: 'mortgage field inspections', coverage: ['All 50 states'],
        immediateNeed: ['North Carolina', 'Pennsylvania'], requirements: 'Experienced inspection vendors or companies',
        advertisedRate: '$15 per inspection for both interior and exterior inspections',
        paymentTerms: 'Net 30 initially, then weekly direct deposit after the first 30 days',
        applicationInstructions: 'Submit your complete coverage list, including counties or ZIP codes.',
        applicationUrl: 'mailto:source@example.test', expiresAt: null, withdrawn: false,
      } },
    },
    audienceCoverageComplete: true,
    members: [{ memberId: 'member-1', link: { personId: 'person-1', accountId: 'account-1', contactId: 'contact-1', state: 'verified' },
      audienceTraits: { source: 'activecampaign_classification', observedAt: now, responseChecksum: checksum,
        internal: false, coworker: false, test: false, hiringFirm: false },
      outseta: { source: 'outseta_api', personId: 'person-1', accountId: 'account-1', subscriptionId: 'subscription-1',
        livemode: true, isDemo: false,
        planId: 'NmdnNO90', status: 'active', access: true, startsAt: '2026-01-01T00:00:00Z', endsAt: null,
        observedAt: now, responseChecksum: checksum },
      activeCampaign: { source: 'activecampaign_api', contactId: 'contact-1', observedAt: now, responseChecksum: checksum,
        inspectorsListStatus: 'active', consent: 'affirmative', suppressed: false },
    }],
    history: { complete: true, observedAt: now, receipts: [], deliveries: [] },
  }
}
