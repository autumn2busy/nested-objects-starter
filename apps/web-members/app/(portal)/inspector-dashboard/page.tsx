import { getOnboardingStatus } from "@/actions/onboarding";
import { DashboardView } from "@/components/dashboard/dashboard-view";

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
    const { completed } = await getOnboardingStatus();

    return (
        <DashboardView showOnboarding={!completed} />
    );
}


