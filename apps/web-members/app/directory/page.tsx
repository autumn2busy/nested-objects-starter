'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/components/auth-provider'
import { Gate } from '@/components/Gate'

type Firm = {
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

type Bookmark = {
  id: string
  user_id: string
  firm_id: string
  created_at: string
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export default function DirectoryPage() {
  const auth = useAuth() as any
  const userEmail = auth?.user?.email || null

  const [firms, setFirms] = useState<Firm[]>([])
  const [bookmarks, setBookmarks] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [bookmarkingFirm, setBookmarkingFirm] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterNiche, setFilterNiche] = useState<string>('all')

  // Fetch firms and bookmarks
  useEffect(() => {
    const fetchData = async () => {
      if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
        setError('Directory service temporarily unavailable')
        setLoading(false)
        return
      }

      try {
        setLoading(true)

        // Fetch firms
        const firmsRes = await fetch(`${SUPABASE_URL}/rest/v1/firms?select=*&order=name.asc`, {
          headers: {
            apikey: SUPABASE_ANON_KEY,
            Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          },
        })

        if (!firmsRes.ok) {
          throw new Error(`Failed to fetch firms: ${firmsRes.statusText}`)
        }

        const firmsData = await firmsRes.json()
        setFirms(firmsData || [])

        // Fetch user's bookmarks if logged in
        if (userEmail) {
          const encodedEmail = encodeURIComponent(userEmail)
          const bookmarksRes = await fetch(
            `${SUPABASE_URL}/rest/v1/bookmarks?user_id=eq.${encodedEmail}&select=*`,
            {
              headers: {
                apikey: SUPABASE_ANON_KEY,
                Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
              },
            }
          )

          if (bookmarksRes.ok) {
            const bookmarksData = (await bookmarksRes.json()) as Bookmark[]
            setBookmarks(new Set(bookmarksData.map((b) => b.firm_id)))
          }
        }
      } catch (err: any) {
        console.error('Error fetching data:', err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [userEmail])

  const toggleBookmark = async (firmId: string) => {
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !userEmail) {
      return
    }

    setBookmarkingFirm(firmId)

    try {
      const isBookmarked = bookmarks.has(firmId)

      if (isBookmarked) {
        // Remove bookmark
        const encodedEmail = encodeURIComponent(userEmail)
        const res = await fetch(
          `${SUPABASE_URL}/rest/v1/bookmarks?user_id=eq.${encodedEmail}&firm_id=eq.${firmId}`,
          {
            method: 'DELETE',
            headers: {
              apikey: SUPABASE_ANON_KEY,
              Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
            },
          }
        )

        if (res.ok) {
          setBookmarks((prev) => {
            const next = new Set(prev)
            next.delete(firmId)
            return next
          })
        }
      } else {
        // Add bookmark
        const res = await fetch(`${SUPABASE_URL}/rest/v1/bookmarks`, {
          method: 'POST',
          headers: {
            apikey: SUPABASE_ANON_KEY,
            Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
            Prefer: 'return=representation',
          },
          body: JSON.stringify({
            user_id: userEmail,
            firm_id: firmId,
          }),
        })

        if (res.ok) {
          setBookmarks((prev) => new Set(prev).add(firmId))
        }
      }
    } catch (err) {
      console.error('Error toggling bookmark:', err)
    } finally {
      setBookmarkingFirm(null)
    }
  }

  // Filter firms
  const filteredFirms = firms.filter((firm) => {
    const matchesSearch =
      searchQuery === '' ||
      firm.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      firm.niche?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      firm.location?.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesNiche = filterNiche === 'all' || firm.niche === filterNiche

    return matchesSearch && matchesNiche
  })

  // Get unique niches for filter
  const niches = Array.from(new Set(firms.map((f) => f.niche).filter(Boolean)))

  return (
    <main
      style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '2rem 1.5rem',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}
    >
      {/* Header */}
      <header style={{ marginBottom: '2rem' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1rem',
          }}
        >
          <div>
            <h1
              style={{
                fontSize: '2.5rem',
                fontWeight: 700,
                margin: '0 0 0.5rem 0',
                color: '#050505',
              }}
            >
              Firm Directory
            </h1>
            <p style={{ fontSize: '1rem', color: '#65676b', margin: 0 }}>
              Connect with top field service companies hiring inspectors, notaries, and
              contractors
            </p>
          </div>
        </div>

        <Gate feature="directory_access">
          {/* Search and Filters */}
          <div
            style={{
              display: 'flex',
              gap: '1rem',
              marginTop: '1.5rem',
              flexWrap: 'wrap',
            }}
          >
            <input
              type="search"
              placeholder="Search firms by name, niche, or location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                flex: '1 1 300px',
                padding: '0.75rem 1rem',
                borderRadius: '8px',
                border: '1px solid #ccd0d5',
                fontSize: '0.95rem',
              }}
            />

            <select
              value={filterNiche}
              onChange={(e) => setFilterNiche(e.target.value)}
              style={{
                padding: '0.75rem 1rem',
                borderRadius: '8px',
                border: '1px solid #ccd0d5',
                fontSize: '0.95rem',
                backgroundColor: 'white',
                cursor: 'pointer',
              }}
            >
              <option value="all">All Niches</option>
              {niches.map((niche) => (
                <option key={niche} value={niche}>
                  {niche}
                </option>
              ))}
            </select>
          </div>
        </Gate>
      </header>

      {/* Directory Content */}
      <Gate feature="directory_access">
        {loading && (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#65676b' }}>
            Loading directory...
          </div>
        )}

        {error && (
          <div
            style={{
              padding: '1rem',
              backgroundColor: '#ffebe9',
              color: '#c41c00',
              borderRadius: '8px',
              border: '1px solid #ffc9c2',
            }}
          >
            {error}
          </div>
        )}

        {!loading && !error && filteredFirms.length === 0 && (
          <div
            style={{
              textAlign: 'center',
              padding: '3rem',
              color: '#65676b',
              backgroundColor: 'white',
              borderRadius: '8px',
              border: '1px solid #d0d5dd',
            }}
          >
            <p style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>
              No firms found matching your criteria
            </p>
            <p style={{ fontSize: '0.9rem' }}>
              Try adjusting your search or filters
            </p>
          </div>
        )}

        {!loading && !error && filteredFirms.length > 0 && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))',
              gap: '1.25rem',
            }}
          >
            {filteredFirms.map((firm) => {
              const isBookmarked = bookmarks.has(firm.id)
              const isBookmarking = bookmarkingFirm === firm.id

              return (
                <article
                  key={firm.id}
                  style={{
                    backgroundColor: 'white',
                    border: '1px solid #d0d5dd',
                    borderRadius: '12px',
                    padding: '1.5rem',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                    transition: 'all 0.2s',
                    position: 'relative',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.12)'
                    e.currentTarget.style.transform = 'translateY(-2px)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.08)'
                    e.currentTarget.style.transform = 'translateY(0)'
                  }}
                >
                  {/* Bookmark Button */}
                  <button
                    onClick={() => toggleBookmark(firm.id)}
                    disabled={isBookmarking}
                    style={{
                      position: 'absolute',
                      top: '1rem',
                      right: '1rem',
                      background: 'none',
                      border: 'none',
                      fontSize: '1.5rem',
                      cursor: isBookmarking ? 'default' : 'pointer',
                      opacity: isBookmarking ? 0.5 : 1,
                      transition: 'transform 0.2s',
                    }}
                    onMouseEnter={(e) => {
                      if (!isBookmarking) {
                        e.currentTarget.style.transform = 'scale(1.1)'
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'scale(1)'
                    }}
                    title={isBookmarked ? 'Remove bookmark' : 'Save firm'}
                  >
                    {isBookmarked ? '🔖' : '📑'}
                  </button>

                  {/* Firm Header */}
                  <div style={{ marginBottom: '1rem' }}>
                    <h2
                      style={{
                        fontSize: '1.4rem',
                        fontWeight: 700,
                        margin: '0 0 0.5rem 0',
                        color: '#050505',
                        paddingRight: '2rem',
                      }}
                    >
                      {firm.name}
                    </h2>

                    {firm.niche && (
                      <span
                        style={{
                          display: 'inline-block',
                          padding: '0.25rem 0.75rem',
                          backgroundColor: '#e7f3ff',
                          color: '#0866ff',
                          borderRadius: '999px',
                          fontSize: '0.85rem',
                          fontWeight: 600,
                        }}
                      >
                        {firm.niche}
                      </span>
                    )}
                  </div>

                  {/* Firm Details */}
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.75rem',
                      marginBottom: '1.25rem',
                    }}
                  >
                    {firm.location && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontSize: '1.1rem' }}>📍</span>
                        <span style={{ fontSize: '0.9rem', color: '#65676b' }}>
                          {firm.location}
                        </span>
                      </div>
                    )}

                    {firm.pay_range && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontSize: '1.1rem' }}>💰</span>
                        <span style={{ fontSize: '0.9rem', color: '#65676b' }}>
                          {firm.pay_range}
                        </span>
                      </div>
                    )}

                    {firm.phone && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontSize: '1.1rem' }}>📞</span>
                        <a
                          href={`tel:${firm.phone}`}
                          style={{
                            fontSize: '0.9rem',
                            color: '#0866ff',
                            textDecoration: 'none',
                          }}
                        >
                          {firm.phone}
                        </a>
                      </div>
                    )}

                    {firm.email && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontSize: '1.1rem' }}>✉️</span>
                        <a
                          href={`mailto:${firm.email}`}
                          style={{
                            fontSize: '0.9rem',
                            color: '#0866ff',
                            textDecoration: 'none',
                          }}
                        >
                          {firm.email}
                        </a>
                      </div>
                    )}
                  </div>

                  {/* Requirements */}
                  {firm.requirements && (
                    <div
                      style={{
                        padding: '0.75rem',
                        backgroundColor: '#f0f2f5',
                        borderRadius: '6px',
                        marginBottom: '1rem',
                      }}
                    >
                      <div
                        style={{
                          fontSize: '0.8rem',
                          fontWeight: 600,
                          color: '#65676b',
                          marginBottom: '0.25rem',
                        }}
                      >
                        Requirements
                      </div>
                      <p
                        style={{
                          fontSize: '0.85rem',
                          color: '#050505',
                          margin: 0,
                          lineHeight: 1.4,
                        }}
                      >
                        {firm.requirements}
                      </p>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div style={{ display: 'flex', gap: '0.75rem', marginTop: 'auto' }}>
                    {firm.website && (
                      <a
                        href={firm.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          flex: 1,
                          padding: '0.65rem 1rem',
                          borderRadius: '6px',
                          backgroundColor: '#0866ff',
                          color: 'white',
                          fontSize: '0.9rem',
                          fontWeight: 600,
                          textDecoration: 'none',
                          textAlign: 'center',
                          transition: 'background-color 0.2s',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#0552cc'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = '#0866ff'
                        }}
                      >
                        Visit Website
                      </a>
                    )}

                    <button
                      style={{
                        flex: 1,
                        padding: '0.65rem 1rem',
                        borderRadius: '6px',
                        border: '1px solid #0866ff',
                        backgroundColor: 'white',
                        color: '#0866ff',
                        fontSize: '0.9rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#e7f3ff'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'white'
                      }}
                    >
                      Learn More
                    </button>
                  </div>
                </article>
              )
            })}
          </div>
        )}

        {/* Results Summary */}
        {!loading && !error && (
          <div
            style={{
              marginTop: '2rem',
              padding: '1rem',
              textAlign: 'center',
              color: '#65676b',
              fontSize: '0.9rem',
            }}
          >
            Showing {filteredFirms.length} of {firms.length} firms
            {bookmarks.size > 0 && ` · ${bookmarks.size} saved`}
          </div>
        )}
      </Gate>
    </main>
  )
}
