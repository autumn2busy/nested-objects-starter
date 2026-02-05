import { test } from 'node:test'
import assert from 'node:assert'

// Mock state
let db_onboarding_completed_at: string | null = null

function mockGetOnboardingStatus() {
    return { completed: !!db_onboarding_completed_at }
}

function mockCompleteOnboarding() {
    db_onboarding_completed_at = new Date().toISOString()
    return { success: true }
}

test('Onboarding Flow Logic', async (t) => {
    await t.test('Initial state is incomplete', () => {
        db_onboarding_completed_at = null
        const status = mockGetOnboardingStatus()
        assert.strictEqual(status.completed, false)
    })

    await t.test('completing onboarding updates state', () => {
        mockCompleteOnboarding()
        const status = mockGetOnboardingStatus()
        assert.strictEqual(status.completed, true)
    })
})
