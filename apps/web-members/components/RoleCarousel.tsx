'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useRef, useState, type KeyboardEvent } from 'react'

type RoleCard = {
  title: string
  slug: string
  value: string
  image: string
  alt: string
}

const roles: RoleCard[] = [
  {
    title: 'Mortgage field inspector',
    slug: 'mortgage-field-inspector',
    value: 'Verify occupancy, capture photo sets, and keep lenders informed without surprises.',
    image:
      'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=80',
    alt: 'Inspector photographing a front porch during a mortgage field visit',
  },
  {
    title: 'Insurance loss control surveyor',
    slug: 'insurance-loss-control',
    value: 'Document risk factors, measurements, and mitigations so underwriters can move faster.',
    image:
      'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80',
    alt: 'Surveyor reviewing insurance paperwork on the hood of a car',
  },
  {
    title: 'Mobile notary & signing agent',
    slug: 'mobile-notary',
    value: 'Route signings with confidence, track ID requirements, and keep borrowers at ease.',
    image:
      'https://images.unsplash.com/photo-1556740749-887f6717d7e4?auto=format&fit=crop&w=1200&q=80',
    alt: 'Notary presenting documents to a client at a kitchen table',
  },
  {
    title: 'Asset preservation / REO specialist',
    slug: 'asset-preservation',
    value: 'Combine before/after sets, vendor contacts, and material lists for REO turnarounds.',
    image:
      'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80',
    alt: 'Contractor walking through a vacant property with a flashlight',
  },
  {
    title: 'Gig pros adding inspections',
    slug: 'gig-pro-inspector',
    value: 'Blend rides, deliveries, and property checks with light gear and predictable rates.',
    image:
      'https://images.unsplash.com/photo-1520607162513-77705c0f0d4a?auto=format&fit=crop&w=1200&q=80',
    alt: 'Driver loading a small ladder and tablet into a hatchback',
  },
]

export function RoleCarousel() {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [activeIndex, setActiveIndex] = useState(0)

  useEffect(() => {
    const container = scrollRef.current
    if (!container) return

    const handleScroll = () => {
      const children = Array.from(container.children) as HTMLElement[]
      const center = container.scrollLeft + container.clientWidth / 2

      const closestIndex = children.reduce((closest, child, index) => {
        const childCenter = child.offsetLeft + child.clientWidth / 2
        const distance = Math.abs(center - childCenter)
        if (distance < closest.distance) {
          return { index, distance }
        }
        return closest
      }, { index: 0, distance: Number.POSITIVE_INFINITY })

      setActiveIndex(closestIndex.index)
    }

    handleScroll()
    container.addEventListener('scroll', handleScroll, { passive: true })
    return () => container.removeEventListener('scroll', handleScroll)
  }, [])

  const scrollToCard = (index: number) => {
    const container = scrollRef.current
    const target = container?.children[index] as HTMLElement | undefined
    if (container && target) {
      container.scrollTo({ left: target.offsetLeft - container.offsetLeft, behavior: 'smooth' })
    }
  }

  const handleArrowKey = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'ArrowRight') {
      event.preventDefault()
      scrollToCard(Math.min(activeIndex + 1, roles.length - 1))
    }
    if (event.key === 'ArrowLeft') {
      event.preventDefault()
      scrollToCard(Math.max(activeIndex - 1, 0))
    }
  }

  return (
    <section
      aria-labelledby="roles-heading"
      className="border-b border-brand-copper/15 bg-gradient-to-b from-white via-brand-sand to-brand-mist"
    >
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8 lg:py-14">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-copper">Role spotlight</p>
            <h2 id="roles-heading" className="mt-1 text-xl font-bold tracking-tight text-brand-dark sm:text-2xl">
              Swipe through the roles the hub supports
            </h2>
            <p className="mt-2 max-w-2xl text-sm text-slate-700">
              Compare what each path looks like before you commit. Every card links to onboarding tips,
              gear, rates, and firms that actively work the lane.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-label="View previous role"
              onClick={() => scrollToCard(Math.max(activeIndex - 1, 0))}
              disabled={activeIndex === 0}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-brand-copper/30 bg-white text-brand-dark shadow-sm transition hover:-translate-y-0.5 hover:bg-brand-mist disabled:cursor-not-allowed disabled:opacity-40"
            >
              ‹
            </button>
            <button
              type="button"
              aria-label="View next role"
              onClick={() => scrollToCard(Math.min(activeIndex + 1, roles.length - 1))}
              disabled={activeIndex === roles.length - 1}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-brand-copper/30 bg-white text-brand-dark shadow-sm transition hover:-translate-y-0.5 hover:bg-brand-mist disabled:cursor-not-allowed disabled:opacity-40"
            >
              ›
            </button>
          </div>
        </div>

        <div className="relative mt-6">
          <div
            ref={scrollRef}
            role="list"
            aria-label="Scrollable list of roles we support"
            tabIndex={0}
            onKeyDown={handleArrowKey}
            className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-4 pt-1 text-left focus:outline-none"
          >
            {roles.map((role, index) => (
              <article
                key={role.slug}
                role="listitem"
                className="group relative min-w-[270px] max-w-sm flex-1 snap-start rounded-3xl border border-brand-copper/20 bg-white/90 shadow-lg shadow-slate-200 transition duration-200 hover:-translate-y-1 hover:shadow-xl sm:min-w-[320px]"
              >
                <div className="relative h-44 overflow-hidden rounded-t-3xl">
                  <Image
                    src={role.image}
                    alt={role.alt}
                    fill
                    sizes="(min-width: 1024px) 360px, (min-width: 640px) 320px, 90vw"
                    className="object-cover transition duration-300 group-hover:scale-105"
                    priority={index === 0}
                  />
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-black/20 to-black/50" />
                  <div className="absolute left-3 top-3 inline-flex rounded-full bg-brand-teal/90 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-white">
                    {index + 1} of {roles.length}
                  </div>
                </div>

                <div className="relative space-y-3 p-5">
                  <div className="pointer-events-none absolute -right-1 top-3 h-16 w-16 opacity-10 sm:h-20 sm:w-20">
                    <Image
                      src="/logo-light.svg"
                      alt="Nested Objects watermark"
                      fill
                      className="object-contain"
                      sizes="80px"
                    />
                  </div>

                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-steel">Role</p>
                      <h3 className="text-lg font-semibold text-brand-dark">{role.title}</h3>
                    </div>
                    <span className="rounded-full bg-brand-dark px-3 py-1 text-[11px] font-semibold text-white shadow-sm">
                      Route ready
                    </span>
                  </div>

                  <p className="text-sm text-slate-700">{role.value}</p>

                  <Link
                    href={`/roles/${role.slug}`}
                    className="inline-flex items-center gap-1 text-sm font-semibold text-brand-copper transition hover:text-brand-copperDark"
                    aria-label={`Read more about the ${role.title} role`}
                  >
                    Explore this path
                    <span aria-hidden="true">→</span>
                  </Link>
                </div>
              </article>
            ))}
          </div>

          <div className="mt-3 flex items-center justify-center gap-2">
            {roles.map((role, index) => (
              <button
                key={role.slug}
                type="button"
                aria-label={`Jump to ${role.title}`}
                onClick={() => scrollToCard(index)}
                className={`h-2.5 rounded-full transition ${
                  activeIndex === index
                    ? 'w-8 bg-brand-copper shadow-sm'
                    : 'w-2.5 bg-brand-steel/40 hover:bg-brand-steel/70'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
