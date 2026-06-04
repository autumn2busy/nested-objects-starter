import Image from 'next/image'
import Link from 'next/link'

type RoleCard = {
  title: string
  slug: string
  value: string
  image: string
  alt: string
  gradient: string
}

const roles: RoleCard[] = [
  {
    title: 'Mortgage field inspector',
    slug: 'mortgage-field-inspector',
    value: 'Verify occupancy, capture photo sets, and keep lenders informed without surprises.',
    image: '/mortgage-field-inspector.webp',
    alt: 'Mortgage field inspector photographing the exterior of a property',
    gradient: 'from-[#F7F5F2] via-white to-[#E7F1F2]',
  },
  {
    title: 'Insurance loss control surveyor',
    slug: 'insurance-loss-control',
    value: 'Document risk factors, measurements, and mitigations so underwriters can move faster.',
    image: '/insurance-loss-control.webp',
    alt: 'Insurance loss control surveyor reviewing risks outside a building',
    gradient: 'from-[#F7F5F2] via-white to-[#EDE6FA]',
  },
  {
    title: 'Mobile notary & signing agent',
    slug: 'mobile-notary',
    value: 'Route signings with confidence, track ID requirements, and keep borrowers at ease.',
    image: '/mobile-notary.webp',
    alt: 'Mobile notary guiding a borrower through documents at their kitchen table',
    gradient: 'from-[#F7F5F2] via-white to-[#FBEAD6]',
  },
  {
    title: 'Asset preservation / REO specialist',
    slug: 'asset-preservation',
    value: 'Combine before/after sets, vendor contacts, and material lists for REO turnarounds.',
    image: '/asset-preservation.webp',
    alt: 'REO specialist inspecting a vacant property interior',
    gradient: 'from-[#F7F5F2] via-white to-[#E8F5E9]',
  },
  {
    title: 'Gig pros adding inspections',
    slug: 'gig-pro-inspector',
    value: 'Blend rides, deliveries, and property checks with light gear and predictable rates.',
    image: '/gig-pro-inspector.webp',
    alt: 'Gig worker loading inspection gear into a hatchback',
    gradient: 'from-[#F7F5F2] via-white to-[#E7F1F2]',
  },
]

export function RoleCarousel() {
  return (
    <section aria-labelledby="roles-heading" className="w-full">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-copper">Roles we support</p>
          <h2 id="roles-heading" className="mt-1 text-2xl font-semibold tracking-tight text-brand-dark sm:text-3xl">
            Match the hub to your daily route
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-slate-700 sm:text-base">
            Scroll through the top roles members work today. Each hero card shows the tools and outcomes Nested Objects supports
            for that path.
          </p>
        </div>
        <Link
          href="/roles"
          className="inline-flex w-full items-center justify-center rounded-none border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-brand-dark transition hover:bg-slate-50 sm:w-auto"
        >
          View all role guides
        </Link>
      </div>

      <div className="relative mt-6">
        <div
          role="list"
          aria-label="Scrollable list of roles we support"
          className="flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth pb-6 pt-1 text-left focus:outline-none"
        >
          {roles.map((role, index) => (
            <article
              id={`role-${role.slug}`}
              key={role.slug}
              role="listitem"
              className={`relative min-w-full scroll-mx-4 snap-start overflow-hidden rounded-lg border border-slate-200 bg-gradient-to-r ${role.gradient} shadow-lg transition hover:-translate-y-1`}
            >
              <div className="absolute inset-y-0 right-0 w-2/5 bg-gradient-to-r from-white/30 via-white/10 to-transparent" aria-hidden="true" />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.4),transparent_55%)]" aria-hidden="true" />

              <div className="relative grid gap-8 p-5 sm:p-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-center lg:p-10">
                <div className="max-w-xl space-y-3 text-brand-dark">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-copper">{index + 1} of {roles.length}</p>
                  <h3 className="text-2xl font-semibold tracking-tight sm:text-3xl">{role.title}</h3>
                  <p className="text-sm text-slate-700 sm:text-base">{role.value}</p>

                  <div className="flex flex-col gap-3 pt-2 text-sm sm:flex-row sm:flex-wrap sm:items-center sm:text-base">
                    <Link
                      href={`/roles/${role.slug}`}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-none border border-brand-dark/10 bg-white/90 px-5 py-3 text-center font-semibold text-brand-dark shadow-sm transition hover:-translate-y-[1px] hover:bg-white sm:w-auto sm:py-2"
                      aria-label={`Read more about the ${role.title} role`}
                    >
                      Explore this path
                      <span aria-hidden="true">-&gt;</span>
                    </Link>
                    <span className="rounded-full border border-white/60 bg-white/60 px-4 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-600">
                      /roles/{role.slug}
                    </span>
                  </div>
                </div>

                <div className="relative w-full">
                  <div className="relative ml-auto h-56 w-full max-w-xl overflow-hidden rounded-lg border border-white/70 bg-white/70 shadow-[0_14px_45px_rgba(0,0,0,0.12)]">
                    <div className="absolute inset-0 bg-gradient-to-l from-white via-transparent to-transparent" aria-hidden="true" />
                    <Image
                      src={role.image}
                      alt={role.alt}
                      fill
                      sizes="(min-width: 1280px) 520px, (min-width: 1024px) 420px, (min-width: 768px) 60vw, 90vw"
                      className="object-cover"
                    />
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>

        <nav className="mt-3 flex items-center justify-center gap-2" aria-label="Jump between role cards">
          {roles.map((role, index) => (
            <a
              key={role.slug}
              href={`#role-${role.slug}`}
              aria-label={`Jump to ${role.title}`}
              className={`h-2 rounded-none transition ${index === 0 ? 'w-8 bg-brand-copper' : 'w-2.5 bg-slate-300 hover:bg-slate-400'}`}
            />
          ))}
        </nav>

        <div className="mt-10 rounded-lg border border-slate-200 bg-white/80 p-4 shadow-sm sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-copper">Choose your role</p>
              <h3 className="text-lg font-semibold text-brand-dark sm:text-xl">Jump straight to the best-fit landing page</h3>
              <p className="text-sm text-slate-700">Pick a lane to see tailored workflows, checklists, and resources.</p>
            </div>
          </div>

          <ul className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {roles.map((role) => (
              <li
                key={role.slug}
                className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm transition hover:-translate-y-[1px] hover:bg-slate-50"
              >
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">{role.slug.replaceAll('-', ' ')}</p>
                  <p className="text-sm font-semibold text-brand-dark">{role.title}</p>
                </div>
                <Link
                  href={`/roles/${role.slug}`}
                  className="inline-flex h-9 items-center justify-center rounded-none border border-brand-dark/10 bg-brand-mist px-3 text-xs font-semibold text-brand-dark transition hover:bg-white"
                  aria-label={`Visit the ${role.title} landing page`}
                >
                  View -&gt;
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}
