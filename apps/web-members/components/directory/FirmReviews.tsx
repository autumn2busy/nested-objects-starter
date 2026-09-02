import { createClient } from '@supabase/supabase-js'
import { Star } from 'lucide-react'
import { getReviewSchema } from '@/lib/seo'
import Script from 'next/script'
import { LeaveReviewForm } from './LeaveReviewForm'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

function getSupabase() {
    return createClient(supabaseUrl, supabaseAnonKey)
}

export async function FirmReviews({ firmId }: { firmId: string }) {
    const { data: reviews, error } = await getSupabase()
        .from('firm_reviews')
        .select('rating, comment, created_at')
        .eq('firm_id', firmId)
        .eq('status', 'approved')
        .order('created_at', { ascending: false })

    if (error || !reviews || reviews.length === 0) {
        return (
            <div className="rounded-2xl border border-border-subtle bg-white p-6 sm:p-8 shadow-sm">
                <h3 className="text-lg font-semibold text-text-primary mb-2">Contractor Reviews</h3>
                <p className="text-sm text-text-secondary mb-6">No reviews yet. Be the first to share your experience with this firm!</p>
                <LeaveReviewForm firmId={firmId} />
            </div>
        )
    }

    const reviewSchema = getReviewSchema(
        reviews.map((r: any) => ({
            author: 'Member',
            rating: r.rating,
            body: r.comment,
            datePublished: r.created_at
        }))
    )

    return (
        <div className="rounded-2xl border border-border-subtle bg-white shadow-sm overflow-hidden">
            <Script id={`review-ld-${firmId}`} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(reviewSchema) }} />

            <div className="p-6 sm:p-8 border-b border-border-subtle">
                <h3 className="text-lg font-semibold text-text-primary mb-1">Contractor Reviews ({reviews.length})</h3>
                <p className="text-sm text-text-secondary">Real feedback from verified field inspectors running routes.</p>
            </div>

            <div className="p-6 sm:p-8 space-y-8">
                {reviews.map((r: any, i: number) => {
                    return (
                        <div key={i} className="border-b border-border-subtle pb-8 last:border-0 last:pb-0">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-sm font-bold text-slate-500 ring-1 ring-border-subtle" aria-hidden="true">
                                    M
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-text-primary">Member</p>
                                    <div className="flex items-center gap-2 mt-0.5">
                                        <div className="flex gap-0.5">
                                            {[1, 2, 3, 4, 5].map(star => (
                                                <Star key={star} className={`h-3 w-3 ${star <= r.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200 fill-slate-100'}`} />
                                            ))}
                                        </div>
                                        <span className="text-xs text-text-muted">
                                            {new Date(r.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <p className="text-sm leading-relaxed text-text-secondary">{r.comment}</p>
                        </div>
                    )
                })}
            </div>

            <div className="bg-surface-muted p-6 sm:p-8 border-t border-border-subtle">
                <h4 className="font-semibold text-text-primary mb-4 text-sm uppercase tracking-wide">Add your review</h4>
                <LeaveReviewForm firmId={firmId} />
            </div>
        </div>
    )
}
