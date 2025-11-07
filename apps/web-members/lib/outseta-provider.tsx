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
    Outseta: any;
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
    if (!outseta) return;

    outseta.auth.session.change(handleAuthChange);
    outseta
      .auth.getSession()
      .then((session: any) => {
        handleAuthChange(session);
      })
      .catch(() => {
        setIsLoading(false);
      });

    return () => {
      outseta.auth.session.change(handleAuthChange, 'unsubscribe');
    };
  }, [handleAuthChange]);

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
