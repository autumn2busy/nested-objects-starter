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
}
