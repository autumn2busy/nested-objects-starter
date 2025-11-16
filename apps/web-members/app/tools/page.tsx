import Link from 'next/link'

export default function ToolsIndexPage() {
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
            Inspector tools
          </h1>
          <p
            style={{
              marginTop: '0.4rem',
              fontSize: '0.95rem',
              color: '#6b7280',
            }}
          >
            AI powered tools to help you plan routes, watch the weather, and present yourself like
            the pro you are.
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
          <h2 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>🤖 AI concierge</h2>
          <p style={{ fontSize: '0.95rem', color: '#4b5563', marginBottom: '0.75rem' }}>
            Ask questions about firms, requirements, and inspection workflows in plain language.
          </p>
          <Link
            href="/tools/ai-chatbot"
            style={{ fontSize: '0.9rem', color: '#2563eb', textDecoration: 'underline' }}
          >
            Open AI concierge →
          </Link>
        </div>

        <div
          style={{
            padding: '1.75rem',
            borderRadius: '12px',
            border: '1px solid #e5e7eb',
            backgroundColor: 'white',
          }}
        >
          <h2 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>📝 AI resume builder</h2>
          <p style={{ fontSize: '0.95rem', color: '#4b5563', marginBottom: '0.75rem' }}>
            Turn your experience, routes, and gear into a clean resume for field service firms.
          </p>
          <Link
            href="/tools/ai-resume"
            style={{ fontSize: '0.9rem', color: '#2563eb', textDecoration: 'underline' }}
          >
            Build my resume →
          </Link>
        </div>

        <div
          style={{
            padding: '1.75rem',
            borderRadius: '12px',
            border: '1px solid #e5e7eb',
            backgroundColor: 'white',
          }}
        >
          <h2 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>📍 Job tracking</h2>
          <p style={{ fontSize: '0.95rem', color: '#4b5563', marginBottom: '0.75rem' }}>
            Track inspections, due dates, and pay so nothing slips through the cracks.
          </p>
          <Link
            href="/tools/job-tracking"
            style={{ fontSize: '0.9rem', color: '#2563eb', textDecoration: 'underline' }}
          >
            Go to job tracker →
          </Link>
        </div>

        <div
          style={{
            padding: '1.75rem',
            borderRadius: '12px',
            border: '1px solid #e5e7eb',
            backgroundColor: 'white',
          }}
        >
          <h2 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>🌤 Weather</h2>
          <p style={{ fontSize: '0.95rem', color: '#4b5563', marginBottom: '0.75rem' }}>
            Plan around storms and daylight so your routes are safer and more profitable.
          </p>
          <Link
            href="/tools/weather"
            style={{ fontSize: '0.9rem', color: '#2563eb', textDecoration: 'underline' }}
          >
            Open weather tool →
          </Link>
        </div>

        <div
          style={{
            padding: '1.75rem',
            borderRadius: '12px',
            border: '1px solid #e5e7eb',
            backgroundColor: 'white',
          }}
        >
          <h2 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>🗺 Route planning</h2>
          <p style={{ fontSize: '0.95rem', color: '#4b5563', marginBottom: '0.75rem' }}>
            Stack inspections into efficient routes so you burn less gas and make more per mile.
          </p>
          <Link
            href="/tools/routing"
            style={{ fontSize: '0.9rem', color: '#2563eb', textDecoration: 'underline' }}
          >
            Plan my routes →
          </Link>
        </div>
      </section>
    </main>
  )
}
