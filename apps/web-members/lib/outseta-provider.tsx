// In /apps/web-members/lib/outseta-provider.tsx

'use client'; // This component MUST be a client component

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from 'react';
// Corrected import path based on your file structure
import {
  AuthContextType,
  OutsetaUser,
  OutsetaSubscription,
} from '../../../packages/types';

// Declare Outseta on the window object for TypeScript
declare global {
  interface Window {
    Outseta?: any;
  }
}

// 1. Create the React Context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// 2. Define the Provider component
export function OutsetaProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<OutsetaUser | null>(null);
  const [subscription, setSubscription] = useState<OutsetaSubscription | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);

  const hasEntitlement = useCallback(
    (key: string): boolean => {
      if (!subscription) return false;
      return (
        subscription.Account?.AccountSubscriptionEntitlements?.some(
          (ent) => ent.Entitlement.Key === key
        ) || false
      );
    },
    [subscription]
  );

  const handleAuthChange = useCallback(async (session: any) => {
    setIsLoading(true);
    if (!session || !session.user) {
      setUser(null);
      setSubscription(null);
      setIsLoading(false);
      return;
    }

    try {
      const outseta = window.Outseta;
      const userData: OutsetaUser = await outseta.getUser();
      const subscriptionData: OutsetaSubscription =
        await outseta.getSubscription();

      setUser(userData);
      setSubscription(subscriptionData);
    } catch (error) {
      console.error('Error fetching Outseta user/subscription:', error);
      setUser(null);
      setSubscription(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

useEffect(() => {
    const outseta = window.Outseta;

    // SAFER GUARD:
    // Check for Outseta, the auth module, AND the session object.
    if (!outseta || !outseta.auth || !outseta.auth.session) {
      // If any part is missing, we can't subscribe.
      // This can happen on initial load.
      // We'll set loading to false and let the hook re-run.
      console.warn('Outseta auth module not ready, retrying...');
      setIsLoading(false);
      return;
    }

    // If we're here, outseta.auth.session exists.
    
    // Subscribe to session changes
    outseta.auth.session.change(handleAuthChange);

    // Check initial session on load
    outseta
      .auth.getSession()
      .then((session: any) => {
        handleAuthChange(session);
      })
      .catch(() => {
        // No session found
        setIsLoading(false);
      });

    // Cleanup subscription on unmount
    return () => {
      // Also check here for safety during unmount
      if (outseta && outseta.auth && outseta.auth.session) {
        outseta.auth.session.change(handleAuthChange, 'unsubscribe');
      }
    };
  }, [handleAuthChange, isLoading]); // <-- Add isLoading as a dependency

  const value: AuthContextType = {
    user,
    subscription,
    isLoading,
    hasEntitlement,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * 4. Create the custom hook for easy data access
 */
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an OutsetaProvider');
  }
  return context;
};
