'use client'

import React, { 
  createContext, 
  useContext, 
  useState, 
  useEffect, 
  ReactNode 
} from 'react'

// Define the Outseta config object
const outsetaOptions = {
  domain: process.env.NEXT_PUBLIC_OUTSETA_URL,
  monitorDom: true,
  load: 'auth,profile'
};

// --- Types (no changes here) ---
interface OutsetaUser {
  Uid: string;
  Email: string;
  FirstName: string;
  LastName: string;
}
interface OutsetaAccount {
  Name: string;
  Subscription: {
    Plan: {
      Name: string;
      Features: {
        Name: string;
      }[];
    };
  };
  Uid: string; // Add Uid for a more reliable check
}
interface AuthContextType {
  user: OutsetaUser | null;
  account: OutsetaAccount | null;
  loading: boolean;
  outseta: any;
}

// Create the context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Define the Provider component
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<OutsetaUser | null>(null);
  const [account, setAccount] = useState<OutsetaAccount | null>(null);
  const [loading, setLoading] = useState(true);
  const [outseta, setOutseta] = useState<any>(null);

  useEffect(() => {
    // This effect runs once on mount to initialize Outseta
    if (typeof window !== 'undefined') {
      const Outseta = (window as any).Outseta;
      if (!Outseta) {
        console.error('Outseta script not loaded');
        setLoading(false);
        return;
      }

      const outsetaApi = Outseta.init(outsetaOptions);
      setOutseta(outsetaApi);

      // --- THIS IS THE UPDATED LOGIC ---

      // This function fetches the user and account data
      const fetchUserData = async () => {
        try {
          setLoading(true);
          const acc = await outsetaApi.getAccount();
          
          if (acc && acc.Uid) {
            // User has a valid session
            setAccount(acc);
            const u = await outsetaApi.getUser();
            setUser(u);
          } else {
            // No session found
            setAccount(null);
            setUser(null);
          }
        } catch (e) {
          console.error('Error fetching Outseta data', e);
          setAccount(null);
          setUser(null);
        } finally {
          setLoading(false);
        }
      };

      // Use the 'accessToken.set' event. This fires reliably
      // when a user logs in OR a session is loaded from a cookie.
      outsetaApi.on('accessToken.set', () => {
        console.log('Outseta session detected. Fetching user data...');
        fetchUserData();
      });

      // Handle logout
      outsetaApi.on('auth:logout', () => {
        console.log('Outseta logout event fired.');
        setAccount(null);
        setUser(null);
      });

      // Run an initial check on load, in case the event
      // has already fired before this listener was attached.
      fetchUserData();

      // --- END OF UPDATED LOGIC ---
    }
  }, []);

  const value = { user, account, loading, outseta };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook (no changes here)
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};