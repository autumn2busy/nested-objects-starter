// In /apps/web-members/app/page.tsx
'use client'; // This page must be a client component to use the hook/gate

import Gate from '../components/Gate';
import { useAuth } from '../lib/outseta-provider';

export default function MemberDashboard() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <h1>
        Welcome, {user ? user.FirstName : 'Guest'}
      </h1>

      {/* --- EXAMPLE 1: Basic Gating --- */}
      {/* This will only be visible to users with the "Pro" or "Elite" 
          plan that includes the "ai_job_intel" entitlement [cite: 148, 246] */}
      <Gate feature="ai_job_intel">
        <div>
          <h2>Your AI Job Intel Dashboard</h2>
          {/* ...your AI component here... */}
        </div>
      </Gate>

      {/* --- EXAMPLE 2: Gating with a Fallback --- */}
      {/* This shows a fallback component to users on the Free plan */}
      <Gate
        feature="directory_access"
        fallback={
          <div style={{ border: '1px solid orange', padding: '1rem' }}>
            Please upgrade to Pro to access the full directory.
          </div>
        }
      >
        <div>
          <h2>Full Firm Directory</h2>
          {/* ...your directory list component here... */}
        </div>
      </Gate>
    </div>
  );
}
