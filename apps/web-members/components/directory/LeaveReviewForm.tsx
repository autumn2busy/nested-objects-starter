'use client'

import { useState } from 'react'
import { Star, Loader2, CheckCircle2 } from 'lucide-react'
import { submitReview } from '@/app/actions/reviews'

export function LeaveReviewForm({ firmId }: { firmId: string }) {
    const [rating, setRating] = useState(0)
    const [hoverRating, setHoverRating] = useState(0)
    const [comment, setComment] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [isSuccess, setIsSuccess] = useState(false)

    if (isSuccess) {
        return (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-6 text-center">
                <CheckCircle2 className="mx-auto h-8 w-8 text-emerald-500 mb-3" />
                <h3 className="text-lg font-semibold text-emerald-900">Review Submitted</h3>
                <p className="text-sm text-emerald-700 mt-2">Thank you for sharing your experience and helping other field inspectors.</p>
            </div>
        )
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (rating === 0) {
            setError('Please select a star rating.')
            return
        }

        if (comment.trim().length < 10) {
            setError('Please write a bit more detail (at least 10 characters).')
            return
        }

        setIsSubmitting(true)
        setError(null)

        const res = await submitReview(firmId, rating, comment)

        if (res.success) {
            setIsSuccess(true)
        } else {
            setError(res.error || 'Something went wrong.')
        }

        setIsSubmitting(false)
    }

    return (
        <form onSubmit={handleSubmit} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Leave a Contractor Review</h3>
            <p className="text-sm text-slate-500 mb-6">
                Did you work a route for this firm? Share your honest feedback on onboarding, pay timeliness, and support.
            </p>

            {error && (
                <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600 border border-red-100">
                    {error}
                </div>
            )}

            <div className="mb-6">
                <label className="block text-sm font-medium text-slate-700 mb-2">Your Rating</label>
                <div className="flex gap-1" onMouseLeave={() => setHoverRating(0)}>
                    {[1, 2, 3, 4, 5].map((star) => (
                        <button
                            key={star}
                            type="button"
                            className="p-1 transition focus:outline-none"
                            onClick={() => setRating(star)}
                            onMouseEnter={() => setHoverRating(star)}
                        >
                            <Star
                                className={`h-7 w-7 transition-colors ${(hoverRating || rating) >= star
                                        ? 'fill-amber-400 text-amber-400'
                                        : 'text-slate-200 fill-slate-100'
                                    }`}
                            />
                        </button>
                    ))}
                </div>
            </div>

            <div className="mb-6">
                <label htmlFor="review-comment" className="block text-sm font-medium text-slate-700 mb-2">
                    Review Details
                </label>
                <textarea
                    id="review-comment"
                    rows={4}
                    disabled={isSubmitting}
                    className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm focus:border-brand-copper focus:outline-none focus:ring-1 focus:ring-brand-copper disabled:opacity-50"
                    placeholder="How was the communication? Do they pay on time? Was the route worth it?"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                />
            </div>

            <button
                type="submit"
                disabled={isSubmitting || rating === 0 || comment.length < 10}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand-copper px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-copperDark disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {isSubmitting ? (
                    <>
                        <Loader2 className="h-4 w-4 animate-spin" /> Submitting...
                    </>
                ) : (
                    'Publish Review'
                )}
            </button>
        </form>
    )
}
