/**
 * Member testimonials extracted from:
 * - Wix imported reviews (5-star ratings)
 * - Direct member emails
 * - In-app chat messages
 * - YouTube comments (to be added when available)
 *
 * IMPORTANT: All quotes used with implicit consent from published reviews
 * or direct member communication. Names shortened for privacy where needed.
 */

export interface Testimonial {
  id: string
  name: string
  quote: string
  role?: string
  location?: string
  rating: number // 1-5
  source: 'review' | 'email' | 'chat' | 'youtube'
  date: string // ISO date
  /** Whether to feature prominently (homepage hero, pricing page) */
  featured: boolean
}

export const TESTIMONIALS: Testimonial[] = [
  // ── Wix imported reviews (all 5-star) ──────────────────────────
  {
    id: 'mike-review',
    name: 'Michael "Mike"',
    quote:
      'Excellent resource for finding field inspection jobs and gigs.',
    role: 'Field Inspector',
    rating: 5,
    source: 'review',
    date: '2025-10-20',
    featured: true,
  },
  {
    id: 'jonathan-review',
    name: 'Jonathan K.',
    quote:
      'I was on the fence about purchasing another list, so I listened to the webinar and decided to give it a try. Worth it.',
    role: 'Inspector',
    rating: 5,
    source: 'review',
    date: '2026-02-23',
    featured: false,
  },
  {
    id: 'alex-review',
    name: 'Alex P. Louis',
    quote:
      'I was very skeptical about the information and the resources, but it turned out to be legit.',
    role: 'New Inspector',
    rating: 5,
    source: 'review',
    date: '2025-10-21',
    featured: true,
  },
  {
    id: 'gerald-review',
    name: 'Gerald R.',
    quote:
      'If you want to get into the field of property inspections and build a real business, this is where you start.',
    role: 'Property Inspector',
    rating: 5,
    source: 'review',
    date: '2025-10-20',
    featured: true,
  },
  {
    id: 'raquel-review',
    name: 'Raquel M. W.',
    quote:
      'The webinar provided a wealth of good information and was well worth the time.',
    rating: 5,
    source: 'review',
    date: '2025-04-30',
    featured: false,
  },

  // ── Direct member emails ───────────────────────────────────────
  {
    id: 'michael-t-email',
    name: 'Michael T.',
    quote:
      'The data you found and the website resources are amazing. I signed up and I\'m ready to become an inspector.',
    role: 'Claims Adjuster → Inspector',
    location: 'Atlanta, GA',
    rating: 5,
    source: 'email',
    date: '2025-08-20',
    featured: true,
  },
  {
    id: 'member-shield-email',
    name: 'Member',
    quote:
      'Thank you for this awesome directory and resource. I\'m using it to assess firm credibility before I sign up.',
    role: 'Inspector',
    rating: 5,
    source: 'email',
    date: '2025-10-15',
    featured: false,
  },
  {
    id: 'lenny-email',
    name: 'Lenny S.',
    quote:
      'I appreciate your response. I ordered your program — it has companies servicing my region.',
    location: 'Michigan',
    rating: 5,
    source: 'email',
    date: '2025-10-16',
    featured: false,
  },

  // ── In-app chat / messages ─────────────────────────────────────
  {
    id: 'ai-chat-msg',
    name: 'Member',
    quote:
      'Thank you so much for responding. I love what you\'re doing and I admire your perspective — to use AI to move forward.',
    rating: 5,
    source: 'chat',
    date: '2025-10-16',
    featured: false,
  },
  {
    id: 'sofi-chat-msg',
    name: 'Member',
    quote:
      'I appreciate your work. I like what I am seeing. Those I got through SOFI in the past paid peanuts.',
    role: 'Experienced Inspector',
    rating: 5,
    source: 'chat',
    date: '2025-10-16',
    featured: true,
  },

  // ── YouTube comments ───────────────────────────────────────────
  {
    id: 'yt-stm820',
    name: '@Stm820',
    quote:
      'After watching the videos and reviewing your website I see that your platform is truly a level up. A new member to the community and will purchase the directory.',
    role: 'New Member',
    rating: 5,
    source: 'youtube',
    date: '2025-09-24',
    featured: true,
  },
  {
    id: 'yt-stm820-thankyou',
    name: '@Stm820',
    quote:
      'THANK YOU for all what you\'ve done and continue to do for this industry cause we know it\'s definitely NEEDED!',
    role: 'Member',
    rating: 5,
    source: 'youtube',
    date: '2025-10-24',
    featured: true,
  },
  {
    id: 'yt-krich4251',
    name: '@krich4251',
    quote:
      'New sub here. Love your content! I am a notary, and have been doing business and home inspections for about four years. This video nudged me to dust off my old Asteroom account and get busier.',
    role: 'Notary & Inspector',
    rating: 5,
    source: 'youtube',
    date: '2025-09-24',
    featured: true,
  },
  {
    id: 'yt-ngripp2172',
    name: '@ngripp2172',
    quote:
      'Very informative and correct. Your time and effort is HIGHLY respected.',
    rating: 5,
    source: 'youtube',
    date: '2025-07-24',
    featured: false,
  },
  {
    id: 'yt-ngripp2172-program',
    name: '@ngripp2172',
    quote:
      'Digital is connected to everything now and going forward. Your program is exceptional.',
    rating: 5,
    source: 'youtube',
    date: '2025-07-24',
    featured: true,
  },
  {
    id: 'yt-dvdeeee',
    name: '@DVDeeee',
    quote:
      'Purchasing my equipment this week and so excited to see where it takes me this year!',
    role: 'New Inspector',
    rating: 5,
    source: 'youtube',
    date: '2026-01-24',
    featured: false,
  },
  {
    id: 'yt-growcook',
    name: '@GrowCookWithPnine',
    quote:
      'I have just started and so far I like it. I like your idea of branching out when Asteroom is slow.',
    role: 'New Inspector',
    location: 'Cincinnati, OH',
    rating: 5,
    source: 'youtube',
    date: '2026-02-24',
    featured: false,
  },
  {
    id: 'yt-sajid',
    name: '@sajidabbassi444',
    quote:
      'Thank you for sharing the information. It\'s really helpful. Good luck on your venture.',
    rating: 5,
    source: 'youtube',
    date: '2025-08-24',
    featured: false,
  },
  {
    id: 'yt-marieisventing',
    name: '@MarieIsVenting',
    quote:
      'Thank you, this was very informative. I\'m in the process of getting on board with Asteroom.',
    rating: 5,
    source: 'youtube',
    date: '2025-08-24',
    featured: false,
  },
]

/** Get featured testimonials for homepage / pricing hero */
export function getFeaturedTestimonials(): Testimonial[] {
  return TESTIMONIALS.filter((t) => t.featured)
}

/** Get all testimonials sorted by date (newest first) */
export function getAllTestimonials(): Testimonial[] {
  return [...TESTIMONIALS].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  )
}

/** Average rating across all testimonials */
export function getAverageRating(): number {
  const sum = TESTIMONIALS.reduce((acc, t) => acc + t.rating, 0)
  return Math.round((sum / TESTIMONIALS.length) * 10) / 10
}
