import Link from 'next/link'

export default function ToolsIndexPage() {
  return (
    <main className="min-h-screen bg-brand-sand text-brand-dark">
      <section className="border-b border-brand-copper/15 bg-gradient-to-b from-brand-sand via-white to-brand-mist">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-copper">Tools</p>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Inspector tools</h1>
          <p className="max-w-3xl text-base text-slate-700">
            AI powered tools to help you plan routes, watch the weather, and present yourself like the pro you are.
          </p>
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto grid max-w-6xl gap-6 px-4 py-12 sm:px-6 md:grid-cols-2 lg:grid-cols-3 lg:px-8 lg:py-16">
          <div className="flex h-full flex-col gap-3 rounded-2xl border border-brand-copper/20 bg-white p-6 shadow-sm">
            <div>
              <h2 className="text-xl font-semibold text-brand-dark">🤖 AI concierge</h2>
              <p className="mt-2 text-sm text-slate-700">
                Ask questions about firms, requirements, and inspection workflows in plain language.
              </p>
            </div>
            <Link
              href="/tools/ai-chatbot"
              className="text-sm font-semibold text-brand-copper decoration-brand-copper/70 underline underline-offset-4 transition hover:text-brand-copperDark hover:decoration-brand-copper"
            >
              Open AI concierge →
            </Link>
          </div>

          <div className="flex h-full flex-col gap-3 rounded-2xl border border-brand-copper/20 bg-white p-6 shadow-sm">
            <div>
              <h2 className="text-xl font-semibold text-brand-dark">📝 AI resume builder</h2>
              <p className="mt-2 text-sm text-slate-700">
                Turn your experience, routes, and gear into a clean resume for field service firms.
              </p>
            </div>
            <Link
              href="/tools/ai-resume"
              className="text-sm font-semibold text-brand-copper decoration-brand-copper/70 underline underline-offset-4 transition hover:text-brand-copperDark hover:decoration-brand-copper"
            >
              Build my resume →
            </Link>
          </div>

          <div className="flex h-full flex-col gap-3 rounded-2xl border border-brand-copper/20 bg-white p-6 shadow-sm">
            <div>
              <h2 className="text-xl font-semibold text-brand-dark">📍 Job tracking</h2>
              <p className="mt-2 text-sm text-slate-700">
                Track inspections, due dates, and pay so nothing slips through the cracks.
              </p>
            </div>
            <Link
              href="/tools/job-tracking"
              className="text-sm font-semibold text-brand-copper decoration-brand-copper/70 underline underline-offset-4 transition hover:text-brand-copperDark hover:decoration-brand-copper"
            >
              Go to job tracker →
            </Link>
          </div>

          <div className="flex h-full flex-col gap-3 rounded-2xl border border-brand-copper/20 bg-white p-6 shadow-sm">
            <div>
              <h2 className="text-xl font-semibold text-brand-dark">🌤 Weather</h2>
              <p className="mt-2 text-sm text-slate-700">
                Plan around storms and daylight so your routes are safer and more profitable.
              </p>
            </div>
            <Link
              href="/tools/weather"
              className="text-sm font-semibold text-brand-copper decoration-brand-copper/70 underline underline-offset-4 transition hover:text-brand-copperDark hover:decoration-brand-copper"
            >
              Open weather tool →
            </Link>
          </div>

          <div className="flex h-full flex-col gap-3 rounded-2xl border border-brand-copper/20 bg-white p-6 shadow-sm">
            <div>
              <h2 className="text-xl font-semibold text-brand-dark">🗺 Route planning</h2>
              <p className="mt-2 text-sm text-slate-700">
                Stack inspections into efficient routes so you burn less gas and make more per mile.
              </p>
            </div>
            <Link
              href="/tools/routing"
              className="text-sm font-semibold text-brand-copper decoration-brand-copper/70 underline underline-offset-4 transition hover:text-brand-copperDark hover:decoration-brand-copper"
            >
              Plan my routes →
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}
