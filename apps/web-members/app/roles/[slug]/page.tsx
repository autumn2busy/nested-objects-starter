import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { SiteHeader } from '@/components/SiteHeader'

const roleContent = {
  notaries: {
    title: 'Notaries',
    valueProp:
      'Mobile and remote notaries who balance lender expectations with precise documentation standards.',
    image: {
      src: 'https://images.unsplash.com/photo-1521790361543-f645cf042ec4?auto=format&fit=crop&w=1200&q=80',
      alt: 'Notary reviewing documents at a desk',
    },
    heroCopy:
      'Concierge intel on lender packets, appointment prep, and route coordination so you can stay punctual without sacrificing accuracy.',
  },
  realtors: {
    title: 'Realtors',
    valueProp: 'Agents, coordinators, and assistants keeping transactions on time with clear expectations.',
    image: {
      src: 'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1200&q=80',
      alt: 'Realtor walking a client through a property',
    },
    heroCopy:
      'Client-ready messaging, showings checklists, and partner intel that mirrors the Nested Objects brand calm, trustworthy tone.',
  },
  'gig-workers': {
    title: 'Gig workers',
    valueProp: 'Couriers, runners, and field assistants who need clarity on SLAs and safety before heading out.',
    image: {
      src: 'https://images.unsplash.com/photo-1529429617124-aee0bdcdf852?auto=format&fit=crop&w=1200&q=80',
      alt: 'Field worker carrying a bag and walking through a neighborhood',
    },
    heroCopy:
      'Quick-hit prep flows, vetted firm expectations, and route guardrails so every drop-off or pickup stays compliant.',
  },
  inspectors: {
    title: 'Inspectors',
    valueProp: 'Home and property inspectors balancing documentation, safety, and client comms.',
    image: {
      src: 'https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1200&q=80',
      alt: 'Inspector taking notes outside a home',
    },
    heroCopy:
      'Prep guides, photo standards, and AI-assisted checklists grounded in the same intel that powers our directory.',
  },
} as const

type RoleSlug = keyof typeof roleContent
type RoleDefinition = (typeof roleContent)[RoleSlug]

function isRoleSlug(slug: string): slug is RoleSlug {
  return slug in roleContent
}

export function generateMetadata({
  params,
}: {
  params: { slug: string }
}): Metadata {
  const role = isRoleSlug(params.slug) ? roleContent[params.slug] : null

  if (!role) {
    return {
      title: 'Role not found | Nested Objects',
      description: 'The role you are looking for does not exist.',
    }
  }

  return {
    title: `${role.title} | Nested Objects roles`,
    description: role.valueProp,
    openGraph: {
      title: `${role.title} | Nested Objects roles`,
      description: role.heroCopy,
      images: [
        {
          url: role.image.src,
          width: 1200,
          height: 630,
          alt: role.image.alt,
        },
      ],
    },
  }
}

export default function RoleDetailPage({
  params,
}: {
  params: { slug: string }
}) {
  if (!isRoleSlug(params.slug)) {
    notFound()
  }

  const role: RoleDefinition = roleContent[params.slug]

  return (
    <main className="min-h-screen bg-brand-sand text-brand-dark">
      <SiteHeader />

      <article aria-labelledby="role-heading">
        <header className="border-b border-brand-mist bg-gradient-to-br from-brand-dark via-brand-slate to-brand-black text-white">
          <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:px-8 lg:py-20">
            <div className="space-y-6">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-brand-teal">Nested Objects roles</p>
              <div className="space-y-3">
                <h1 id="role-heading" className="text-3xl font-bold leading-tight sm:text-4xl">
                  {role.title}
                </h1>
                <p className="max-w-2xl text-sm text-brand-mist">{role.valueProp}</p>
              </div>
              <p className="max-w-3xl text-base text-brand-mist">{role.heroCopy}</p>
              <div className="flex flex-wrap gap-3">
                <Link
                  href="/membership"
                  className="inline-flex items-center justify-center rounded-full bg-brand-copper px-5 py-2.5 text-sm font-semibold text-brand-dark transition hover:bg-brand-copperDark focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-teal"
                  aria-label={`Explore membership for ${role.title.toLowerCase()}`}
                >
                  Explore membership
                </Link>
                <Link
                  href="/contact"
                  className="inline-flex items-center justify-center rounded-full border border-white/30 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-teal"
                  aria-label={`Talk with the Nested Objects team about ${role.title.toLowerCase()}`}
                >
                  Talk with us
                </Link>
              </div>
              <dl className="grid gap-3 text-xs text-brand-mist sm:grid-cols-3">
                <div className="rounded-2xl border border-white/15 bg-white/5 p-3">
                  <dt className="font-semibold uppercase tracking-[0.2em] text-brand-teal">Routing</dt>
                  <dd className="mt-1 text-white">Aligned with carousel links: notaries, realtors, gig workers, inspectors.</dd>
                </div>
                <div className="rounded-2xl border border-white/15 bg-white/5 p-3">
                  <dt className="font-semibold uppercase tracking-[0.2em] text-brand-teal">Confidence</dt>
                  <dd className="mt-1 text-white">Calm palettes, readable copy, and keyboard-focusable CTAs.</dd>
                </div>
                <div className="rounded-2xl border border-white/15 bg-white/5 p-3">
                  <dt className="font-semibold uppercase tracking-[0.2em] text-brand-teal">Support</dt>
                  <dd className="mt-1 text-white">Use this page as a placeholder while we add deeper guides.</dd>
                </div>
              </dl>
            </div>

            <div className="relative h-full w-full overflow-hidden rounded-3xl border border-white/10 bg-white/5 shadow-2xl shadow-brand-black/40">
              <Image
                src={role.image.src}
                alt={role.image.alt}
                width={1200}
                height={900}
                className="h-full w-full object-cover"
                priority
              />
            </div>
          </div>
        </header>

        <section className="border-b border-brand-copper/20 bg-white">
          <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:px-8 lg:py-16">
            <div className="space-y-4">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-copper">Role snapshot</p>
              <h2 className="text-2xl font-bold sm:text-3xl">Placeholder content tailored to {role.title.toLowerCase()}</h2>
              <p className="text-sm text-slate-700">
                We will continue to add firm intel, training paths, and templates specific to this role. In the meantime, this
                page mirrors the Nested Objects brand palette so you can route from the carousel links without running into dead
                ends.
              </p>
              <ul className="space-y-2 text-sm text-slate-700" aria-label="Benefits preview">
                <li className="flex items-start gap-2">
                  <span className="mt-1 h-2 w-2 rounded-full bg-brand-copper" />
                  <span>Clear hero copy and CTAs to guide members toward membership and contact options.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1 h-2 w-2 rounded-full bg-brand-copper" />
                  <span>Accessible semantic structure using headings, lists, and meaningful alt text.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1 h-2 w-2 rounded-full bg-brand-copper" />
                  <span>Room for future embeds like carousel-driven training, intel cards, and signup forms.</span>
                </li>
              </ul>
            </div>

            <div className="space-y-4 rounded-3xl border border-brand-copper/20 bg-brand-mist p-6">
              <h3 className="text-lg font-semibold text-brand-dark">Quick actions</h3>
              <p className="text-sm text-slate-700">
                Follow the same tone and palette as the rest of the site while we finish building role-specific flows.
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                <Link
                  href="/upgrade"
                  className="inline-flex items-center justify-center rounded-full bg-brand-copper px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-copperDark focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-teal"
                >
                  View plans
                </Link>
                <Link
                  href="/directory"
                  className="inline-flex items-center justify-center rounded-full border border-brand-copper/30 bg-white px-4 py-2 text-sm font-semibold text-brand-dark transition hover:bg-brand-mist focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-teal"
                >
                  Browse firms
                </Link>
              </div>
              <div className="rounded-2xl border border-brand-copper/30 bg-white p-4 text-sm text-slate-700">
                <p className="font-semibold text-brand-dark">Coming soon</p>
                <p className="mt-1">
                  Deeper content modules for {role.title.toLowerCase()} will appear here, including carousel-driven recommendations
                  and role-aware training suggestions.
                </p>
              </div>
            </div>
          </div>
        </section>
      </article>
    </main>
  )
}
