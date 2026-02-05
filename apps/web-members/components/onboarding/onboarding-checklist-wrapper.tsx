'use server'

import { OnboardingWidget } from './onboarding-widget'

interface Props {
    completed: boolean
}

export async function OnboardingChecklist({ completed }: Props) {
    if (completed) return null;
    return <OnboardingWidget />
}

