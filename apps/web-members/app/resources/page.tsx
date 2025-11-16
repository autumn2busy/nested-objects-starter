import Link from 'next/link'

export default function ResourcesIndexPage() {
  return (
    <main style={{ maxWidth: '960px', margin: '0 auto', padding: '2rem' }}>
      <header
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: '1rem',
          marginBottom: '1.75rem',
        }}
      >
        <div>
          <h1
            style={{
              fontSize: '2rem',
              fontWeight: 700,
              margin: 0,
            }}
          >
            Resources for field inspectors
          </h1>
          <p
            style={{
              marginTop: '0.4rem',
              fontSize: '0.95rem',
              color: '#6b7280',
            }}
          >
            Learn about firms, inspection types, and best practices so you can move like a vet, not
            a rookie.
          </p>
        </div>

        <nav
          style={{
            display: 'flex',
            gap: '0.75rem',
            fontSize: '0.9rem',
            flexWrap: 'wrap',
          }}
        >
          <Link href="/" style={{ textDecoration: 'none', color: '#111827' }}>
            Home
          </Link>
          <Link
            href="/dashboard"
            style={{ textDecoration: 'none', color: '#111827' }}
          >
            Dashboard
          </Link>
          <Link
            href="/directory"
            style={{ textDecoration: 'none', color: '#111827' }}
          >
            Directory
          </Link>
          <Link
            href="/membership"
            style={{ textDecoration: 'none', color: '#111827' }}
          >
            Membership
          </Link>
        </nav>
      </header>

      <section
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: '1.5rem',
        }}
      >
        <div
          style={{
            padding: '1.75rem',
            borderRadius: '12px',
            border: '1px solid #e5e7eb',
            backgroundColor: 'white',
          }}
        >
          <h2 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>📊 Firm intel</h2>
          <p style={{ fontSize: '0.95rem', color: '#4b5563', marginBottom: '0.75rem' }}>
            Real world notes on major mortgage field service firms, pay bands, and expectations.
          </p>
          <Link
            href="/resources/firm-intel"
            style={{ fontSize: '0.9rem', color: '#2563eb', textDecoration: 'underline' }}
          >
            View firm intel →
          </Link>
        </div>

        {/* Future. add links for training guides, FAQs, glossary, etc. */}
      </section>
    </main>
  )
}
