'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useEffect, useRef, useState, type KeyboardEvent } from 'react'

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
    image: '/mortgage-field-inspector.png',
    alt: 'Mortgage field inspector photographing the exterior of a property',
    gradient: 'from-[#F7F5F2] to-[#E7F1F2]',
  },
  {
    title: 'Insurance loss control surveyor',
    slug: 'insurance-loss-control',
    value: 'Document risk factors, measurements, and mitigations so underwriters can move faster.',
    image: '/insurance-loss-control.png',
    alt: 'Insurance loss control surveyor reviewing risks outside a building',
    gradient: 'from-[#F7F5F2] to-[#EDE6FA]',
  },
  {
    title: 'Mobile notary & signing agent',
    slug: 'mobile-notary',
    value: 'Route signings with confidence, track ID requirements, and keep borrowers at ease.',
    image: '/mobile-notary.png',
    alt: 'Mobile notary guiding a borrower through documents at their kitchen table',
    gradient: 'from-[#F7F5F2] to-[#FBEAD6]',
  },
  {
    title: 'Asset preservation / REO specialist',
    slug: 'asset-preservation',
    value: 'Combine before/after sets, vendor contacts, and material lists for REO turnarounds.',
    image: '/asset-preservation.png',
    alt: 'REO specialist inspecting a vacant property interior',
    gradient: 'from-[#F7F5F2] to-[#E8F5E9]',
  },
  {
    title: 'Gig pros adding inspections',
    slug: 'gig-pro-inspector',
    value: 'Blend rides, deliveries, and property checks with light gear and predictable rates.',
    image: '/gig-pro-inspector.png',
    alt: 'Gig worker loading inspection gear into a hatchback',
    gradient: 'from-[#F7F5F2] to-[#E7F1F2]',
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

  return (
    <section aria-labelledby="roles-heading" className="w-full">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-copper">Roles we support</p>
          <h2 id="roles-heading" className="mt-1 text-2xl font-semibold tracking-tight text-brand-dark sm:text-3xl">
            Match the hub to your daily route
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-slate-700 sm:text-base">
            Scroll through the top roles members work today. Each card shows how Nested Objects helps you run a steadier
            book of business.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label="View previous role"
            onClick={() => scrollToCard(Math.max(activeIndex - 1, 0))}
            disabled={activeIndex === 0}
            className="inline-flex h-10 w-10 items-center justify-center rounded-none border border-slate-200 bg-white text-brand-dark transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            ‹
          </button>
          <button
            type="button"
            aria-label="View next role"
            onClick={() => scrollToCard(Math.min(activeIndex + 1, roles.length - 1))}
            disabled={activeIndex === roles.length - 1}
            className="inline-flex h-10 w-10 items-center justify-center rounded-none border border-slate-200 bg-white text-brand-dark transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
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
              className={`flex min-w-[260px] snap-start flex-col border border-slate-200 bg-gradient-to-br ${role.gradient} p-5 shadow-sm transition hover:-translate-y-1`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-2">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-600">{index + 1} of {roles.length}</p>
                  <h3 className="text-lg font-semibold text-brand-dark">{role.title}</h3>
                  <p className="text-sm text-slate-700">{role.value}</p>
                </div>
              </div>

              <div className="mt-4 overflow-hidden rounded-lg border border-white/60 bg-white/70 shadow-[0_10px_30px_rgba(0,0,0,0.06)]">
                <div className="relative aspect-[4/3] w-full">
                  <Image
                    src={role.image}
                    alt={role.alt}
                    fill
                    sizes="(min-width: 1024px) 320px, (min-width: 768px) 45vw, 80vw"
                    className="object-cover"
                    priority={index === 0}
                  />
                </div>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
                <Link
                  href={`/roles/${role.slug}`}
                  className="inline-flex items-center gap-2 rounded-none border border-slate-300 bg-white px-4 py-2 font-semibold text-brand-dark transition hover:bg-slate-50"
                  aria-label={`Read more about the ${role.title} role`}
                >
                  Explore this path
                  <span aria-hidden="true">→</span>
                </Link>
                <span className="px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">/roles/{role.slug}</span>
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
              className={`h-2 rounded-none transition ${
                activeIndex === index ? 'w-8 bg-brand-copper' : 'w-2.5 bg-slate-300 hover:bg-slate-400'
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
