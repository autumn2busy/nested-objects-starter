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
      <div className="p-6 border rounded-lg bg-gray-50 text-center">
        <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
        <p className="mb-4">You must be logged in to view this content.</p>
        <button 
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          onClick={() => outseta.login({ mode: 'login' })}
        >
          Log In
        </button>
      </div>
    );
  }

  // Check for the specific feature/entitlement from the Outseta plan
  // We use optional chaining (?.) just in case the subscription data isn't fully loaded
  const hasFeature = account?.Subscription?.Plan?.Features
    .some(f => f.Name.toLowerCase() === feature.toLowerCase());

  if (hasFeature) {
    // User has the feature, show the content
    return <>{children}</>;
  }

  // User is logged in but does not have the feature
  return (
    <div className="p-6 border rounded-lg bg-yellow-50 text-center">
      <h2 className="text-xl font-semibold mb-2">Upgrade Required</h2>
      <p className="mb-4">Your current plan does not include access to this feature.</p>
      {/* This link opens the Outseta checkout/upgrade modal via query param */}
      <a 
        href="/?o_checkout=true"
        className="inline-block bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
      >
        Upgrade Your Plan
      </a>
    </div>
  );
};