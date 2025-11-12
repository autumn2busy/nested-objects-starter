'use client'

import { ReactNode } from 'react'
import { useAuth } from '@/components/auth-provider'

interface GateProps {
  feature: string; // e.g., "directory_access"
  children: ReactNode;
}

export const Gate = ({ feature, children }: GateProps) => {
  const { user, account, loading, outseta } = useAuth();

  if (loading) {
    return <div>Loading session...</div>;
  }

  if (!user) {
    // User is not logged in
    return (
      <div>
        <h2>Access Denied</h2>
        <p>You must be logged in to view this content.</p>
        <button onClick={() => outseta.login({ mode: 'login' })}>
          Log In
        </button>
      </div>
    );
  }

  // Check for the specific feature/entitlement from the Outseta plan
  const hasFeature = account?.Subscription?.Plan?.Features
    .some(f => f.Name.toLowerCase() === feature.toLowerCase());

  if (hasFeature) {
    // User has the feature, show the content
    return <>{children}</>;
  }

  // User is logged in but does not have the feature
  return (
    <div>
      <h2>Upgrade Required</h2>
      <p>Your current plan does not include access to this feature.</p>
      {/* This link opens the Outseta checkout/upgrade modal */}
      <a href="/?o_checkout=true">Upgrade Your Plan</a>
    </div>
  );
};