<<<<<<< HEAD
'use client'

import { ReactNode } from 'react'
import { useAuth } from '@/components/auth-provider'

interface GateProps {
  feature: string; // e.g., "directory_access"
  children: ReactNode;
=======
// In /apps/web-members/components/Gate.tsx

'use client'; // This must be a client component

import React from 'react';
import { useAuth } from '../lib/outseta-provider';

interface GateProps {
  /**
   * The child components to render if the user has access.
   */
  children: React.ReactNode;
  
  /**
   * The entitlement key from Outseta, e.g., "ai_job_intel" or "directory_access"
   * [cite: 246]
   */
  feature: string;
  
  /**
   * Optional: A component or element to show if the user does NOT have access.
   * Defaults to showing nothing.
   */
  fallback?: React.ReactNode;
}

/**
 * A client-side component that wraps protected features.
 * It checks the user's Outseta entitlements and only renders
 * its children if the required 'feature' key is present.
 */
export default function Gate({ children, feature, fallback = null }: GateProps) {
  const { isLoading, hasEntitlement } = useAuth();

  // While checking auth, render nothing to prevent content flash
  if (isLoading) {
    return null;
  }

  // If the user has the entitlement, show the children
  if (hasEntitlement(feature)) {
    return <>{children}</>;
  }

  // Otherwise, show the fallback (which is null by default)
  return <>{fallback}</>;
>>>>>>> d9932ac4b5050e05a243ab7556b7c622bf2ba5b0
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