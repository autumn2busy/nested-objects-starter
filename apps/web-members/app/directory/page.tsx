'use client'

import { useState, useEffect } from 'react'
import { Gate } from '@/components/gate'
import { supabase, Firm } from '@/lib/supabase'

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
          .select('id, name, url, description, niche, rating')
          .order('name', { ascending: true });

        if (error) throw error;
        
        setFirms(data || []);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

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
                <p>{firm.description}</p>
                <p>Rating: {firm.rating || 'N/A'} / 5</p>
                <a href={firm.url ?? '#'} target="_blank" rel="noopener noreferrer">
                  Visit Website
                </a>
              </li>
            ))}
          </ul>
        )}
      </Gate>
    </main>
  );
}