'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useRef, useState, type KeyboardEvent, type TouchEvent } from 'react'

type RoleCard = {
  title: string
  slug: string
  value: string
  image: string
  alt: string
}

const fallbackRoles: RoleCard[] = [
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

type RoleCarouselProps = {
  roles?: RoleCard[]
}

export function RoleCarousel({ roles = fallbackRoles }: RoleCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [activeIndex, setActiveIndex] = useState(0)
  const touchStartX = useRef<number | null>(null)

  useEffect(() => {
    const container = scrollRef.current
    if (!container) return

    const handleScroll = () => {
      const children = Array.from(container.children) as HTMLElement[]
      const center = container.scrollLeft + container.clientWidth / 2

      const closestIndex = children.reduce(
        (closest, child, index) => {
          const childCenter = child.offsetLeft + child.clientWidth / 2
          const distance = Math.abs(center - childCenter)
          if (distance < closest.distance) {
            return { index, distance }
          }
          return closest
        },
        { index: 0, distance: Number.POSITIVE_INFINITY },
      )

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

  const handleTouchStart = (event: TouchEvent<HTMLDivElement>) => {
    touchStartX.current = event.touches[0]?.clientX ?? null
  }

  const handleTouchEnd = (event: TouchEvent<HTMLDivElement>) => {
    if (touchStartX.current === null) return

    const delta = (event.changedTouches[0]?.clientX ?? 0) - touchStartX.current
    const threshold = 32

    if (delta > threshold) {
      scrollToCard(Math.max(activeIndex - 1, 0))
    } else if (delta < -threshold) {
      scrollToCard(Math.min(activeIndex + 1, roles.length - 1))
    }

    touchStartX.current = null
  }

  return (
    <section
      aria-labelledby="roles-heading"
      className="relative isolate overflow-hidden border-b border-brand-copper/15 bg-gradient-to-b from-brand-night via-brand-dark to-brand-steel/40"
    >
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.18),transparent_45%),radial-gradient(circle_at_bottom_right,rgba(207,148,98,0.25),transparent_35%)]" />
        <div className="absolute -left-16 top-10 h-64 w-64 rounded-full bg-brand-copper/30 blur-[120px] sm:h-96 sm:w-96" />
        <div className="absolute -right-24 bottom-0 h-80 w-80 rounded-full bg-brand-teal/25 blur-[110px] sm:h-[420px] sm:w-[420px]" />
      </div>
      <div className="relative mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-14 lg:max-w-7xl lg:px-8 lg:py-16">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-copper">Role spotlight</p>
            <h1 id="roles-heading" className="mt-1 text-3xl font-bold tracking-tight text-white sm:text-4xl">
              See how the hub adapts to your path
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-brand-sand sm:text-base">
              Swipe through the top roles our members work today. Each card shows what the hub unlocks and links to the
              dedicated lane page.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-label="View previous role"
              onClick={() => scrollToCard(Math.max(activeIndex - 1, 0))}
              disabled={activeIndex === 0}
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-brand-copper/30 bg-white text-brand-dark shadow-sm transition hover:-translate-y-0.5 hover:bg-brand-mist disabled:cursor-not-allowed disabled:opacity-40"
            >
              ‹
            </button>
            <button
              type="button"
              aria-label="View next role"
              onClick={() => scrollToCard(Math.min(activeIndex + 1, roles.length - 1))}
              disabled={activeIndex === roles.length - 1}
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-brand-copper/30 bg-white text-brand-dark shadow-sm transition hover:-translate-y-0.5 hover:bg-brand-mist disabled:cursor-not-allowed disabled:opacity-40"
            >
              ›
            </button>
          </div>
        </div>

        <div className="relative mt-8">
          <div className="pointer-events-none absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-brand-night via-brand-night/70 to-transparent sm:w-24" />
          <div className="pointer-events-none absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-brand-night via-brand-night/70 to-transparent sm:w-24" />
          <div
            ref={scrollRef}
            role="list"
            aria-label="Scrollable list of roles we support"
            tabIndex={0}
            onKeyDown={handleArrowKey}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-8 pt-1 text-left focus:outline-none"
          >
            {roles.map((role, index) => (
              <Link
                key={role.slug}
                href={`/roles/${role.slug}`}
                role="listitem"
                aria-label={`Read more about the ${role.title} role`}
                className="group relative block min-w-full snap-center overflow-hidden rounded-[28px] border border-white/10 bg-brand-dark text-white shadow-2xl shadow-brand-steel/30 transition duration-500 ease-out sm:min-w-[min(100%,760px)] lg:min-w-[min(100%,880px)] hover:-translate-y-1 hover:shadow-brand-copper/25 focus:outline-none focus-visible:ring-4 focus-visible:ring-brand-copper/60"
              >
                <div className="absolute inset-0">
                  <Image
                    src={role.image}
                    alt={role.alt}
                    fill
                    sizes="(min-width: 1024px) 900px, 100vw"
                    className="object-cover transition duration-700 ease-out group-hover:scale-105"
                    priority={index === 0}
                  />
                  <div className="absolute inset-0 bg-gradient-to-br from-black/70 via-black/55 to-brand-copper/35" />
                  <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/40 via-black/30 to-transparent" />
                </div>

                <article className="relative grid gap-4 p-6 sm:p-10 lg:p-12">
                  <div className="flex flex-wrap items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-sand">
                    <span className="rounded-full bg-white/10 px-3 py-1 text-white">{index + 1} of {roles.length}</span>
                    <span className="rounded-full bg-brand-teal/80 px-3 py-1 text-white shadow-sm shadow-brand-dark/25">Route ready</span>
                  </div>

                  <div className="max-w-2xl space-y-3">
                    <h3 className="text-2xl font-semibold leading-tight sm:text-3xl lg:text-4xl">{role.title}</h3>
                    <p className="text-base text-brand-sand sm:text-lg">{role.value}</p>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-sm">
                    <span className="inline-flex items-center gap-2 rounded-full bg-brand-copper px-5 py-2 font-semibold text-white shadow-md shadow-brand-dark/40 transition group-hover:-translate-y-0.5 group-hover:bg-brand-copperDark">
                      Explore this path
                      <span aria-hidden="true">→</span>
                    </span>
                    <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-brand-sand">
                      /roles/{role.slug}
                    </span>
                  </div>
                </article>
              </Link>
            ))}
          </div>

          <div className="mt-4 flex items-center justify-center gap-2">
            {roles.map((role, index) => (
              <button
                key={role.slug}
                type="button"
                aria-label={`Jump to ${role.title}`}
                onClick={() => scrollToCard(index)}
                className={`h-2.5 rounded-full transition ${
                  activeIndex === index
                    ? 'w-10 bg-brand-copper shadow-sm'
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
