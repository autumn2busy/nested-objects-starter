'use client'

import { useState, useEffect } from 'react'
import { Gate } from '@/components/gate'
import { createClient } from '@supabase/supabase-js'

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface Firm {
  id: string
  name: string
  niche?: string
  website?: string
  phone?: string
  email?: string
  location?: string
  pay_range?: string
  requirements?: string
  notes?: string
  created_at: string
  updated_at: string
}

export default function DirectoryPage() {
  const [firms, setFirms] = useState<Firm[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFirms = async () => {
      try {
        setLoading(true);
        // This query only succeeds if the user is authenticated,
        // thanks to our RLS policy in Supabase.
        const { data, error } = await supabase
          .from('firms')
          .select('*') // Select all columns
          .order('name', { ascending: true });

        if (error) throw error;
        
        setFirms(data || []);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    // We can fetch immediately. The <Gate> component will handle
    // the auth check, and RLS will protect the data.
    fetchFirms();
  }, []);

  return (
    <main style={{ padding: '2rem' }}>
      <h1>Firm Directory</h1>

      {/* This Gate component handles all auth and entitlement logic.
        The content inside will only render if the user is logged in
        AND has the "directory_access" entitlement.
      */}
      <Gate feature="directory_access">
        <h2>Welcome, valued member. Here is the directory.</h2>
        
        {loading && <p>Loading firms...</p>}
        {error && <p style={{ color: 'red' }}>Error: {error}</p>}

        {firms.length > 0 && (
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {firms.map((firm) => (
              <li key={firm.id} style={{ 
                margin: '1.5rem 0', 
                padding: '1rem', 
                border: '1px solid #ccc', 
                borderRadius: '8px' 
              }}>
                <strong style={{ fontSize: '1.25rem' }}>{firm.name}</strong> 
                {firm.niche && (
                  <span style={{ 
                    marginLeft: '10px', 
                    background: '#eee', 
                    padding: '2px 6px', 
                    borderRadius: '4px',
                    fontSize: '0.9rem'
                  }}>
                    {firm.niche}
                  </span>
                )}
                {firm.location && <p><strong>Location:</strong> {firm.location}</p>}
                {firm.pay_range && <p><strong>Pay Range:</strong> {firm.pay_range}</p>}
                {firm.phone && <p><strong>Phone:</strong> {firm.phone}</p>}
                {firm.email && <p><strong>Email:</strong> {firm.email}</p>}
                {firm.website && (
                  <a href={firm.website} target="_blank" rel="noopener noreferrer">
                    Visit Website
                  </a>
                )}
              </li>
            ))}
          </ul>
        )}

        {!loading && firms.length === 0 && (
          <p>No firms found in the directory.</p>
        )}
      </Gate>
    </main>
  );
}