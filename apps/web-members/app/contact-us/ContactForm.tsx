'use client'

import React, { useState } from 'react'

const UNCONFIRMED_RECEIPT = 'We could not confirm that your message was saved. Your details are still here.'
const REJECTED_RECEIPT_MESSAGES: Record<number, string> = {
  400: 'Please check your email address and the form fields. Your details are still here.',
  413: 'Your message is too large. Please shorten it. Your details are still here.',
  429: 'Too many messages were submitted. Please wait one minute before trying again. Your details are still here.',
  503: 'We could not save your message. Please try again shortly. Your details are still here.',
}

export default function ContactForm() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [receipt, setReceipt] = useState<{ notificationAccepted: boolean } | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = e.currentTarget
    setIsSubmitting(true)
    setReceipt(null)
    setError(null)

    const formData = new FormData(form)
    const data = {
      name: formData.get('name'),
      email: formData.get('email'),
      topic: formData.get('topic'),
      message: formData.get('message'),
    }

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      const result = await res.json()

      if (res.ok && result?.success === true && result?.stored === true) {
        setReceipt({ notificationAccepted: result.notification === 'provider_accepted' })
        form.reset()
      } else if (!res.ok && result?.success === false && result?.stored === false) {
        // Only a confirmed rejected receipt can offer retry guidance. A proxy
        // failure or malformed response might follow a successful database write.
        setError(REJECTED_RECEIPT_MESSAGES[res.status] ?? UNCONFIRMED_RECEIPT)
      } else {
        setError(UNCONFIRMED_RECEIPT)
      }
    } catch {
      setError(UNCONFIRMED_RECEIPT)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="rounded-3xl border border-brand-copper/20 bg-white p-6 shadow-lg shadow-brand-copper/10">
      <h2 className="text-lg font-semibold text-brand-dark">Send us a quick note</h2>
      <p className="mt-1 text-sm text-slate-700">Share a few details so our team can help.</p>
      
      {receipt ? (
        <div role="status" aria-live="polite" className="mt-6 p-4 bg-green-50 border border-green-200 rounded-xl text-green-800 animate-in fade-in zoom-in duration-300">
          <p className="font-semibold text-sm">Thank you for reaching out. Your message has been saved.</p>
          {receipt.notificationAccepted ? (
            <p className="mt-2 text-sm">The email notification was accepted for delivery. Inbox delivery is not yet confirmed.</p>
          ) : (
            <>
              <p className="mt-2 text-sm">We could not confirm an email notification. You do not need to submit this form again.</p>
              <p className="mt-2 text-sm">
                For a direct follow-up, email{' '}
                <a className="font-semibold underline" href="mailto:info@nestedobjects.com">info@nestedobjects.com</a>.
              </p>
            </>
          )}
        </div>
      ) : (
        <form method="POST" onSubmit={handleSubmit} aria-busy={isSubmitting} className="mt-4 space-y-4">
          <div>
            <label className="text-sm font-semibold text-brand-dark" htmlFor="name">
              Name
            </label>
            <input
              id="name"
              name="name"
              maxLength={120}
              required
              className="mt-1 w-full rounded-lg border border-brand-copper/30 bg-brand-mist px-3 py-2 text-sm text-brand-dark placeholder:text-brand-steel focus:border-brand-copper focus:outline-none focus:ring-2 focus:ring-brand-copper/40"
              placeholder="Your name"
              type="text"
            />
          </div>
          <div>
            <label className="text-sm font-semibold text-brand-dark" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              name="email"
              maxLength={254}
              required
              className="mt-1 w-full rounded-lg border border-brand-copper/30 bg-brand-mist px-3 py-2 text-sm text-brand-dark placeholder:text-brand-steel focus:border-brand-copper focus:outline-none focus:ring-2 focus:ring-brand-copper/40"
              placeholder="name@email.com"
              type="email"
            />
          </div>
          <div>
            <label className="text-sm font-semibold text-brand-dark" htmlFor="topic">
              Topic
            </label>
            <select
              id="topic"
              name="topic"
              required
              className="mt-1 w-full rounded-lg border border-brand-copper/30 bg-brand-mist px-3 py-2 text-sm text-brand-dark focus:border-brand-copper focus:outline-none focus:ring-2 focus:ring-brand-copper/40"
            >
              <option value="Plan comparison">Plan comparison</option>
              <option value="Billing question">Billing question</option>
              <option value="Partnership opportunity">Partnership opportunity</option>
              <option value="Training or resources">Training or resources</option>
              <option value="Something else">Something else</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-semibold text-brand-dark" htmlFor="message">
              Message
            </label>
            <textarea
              id="message"
              name="message"
              maxLength={5000}
              required
              rows={4}
              className="mt-1 w-full rounded-lg border border-brand-copper/30 bg-brand-mist px-3 py-2 text-sm text-brand-dark placeholder:text-brand-steel focus:border-brand-copper focus:outline-none focus:ring-2 focus:ring-brand-copper/40"
              placeholder="Share how we can help or which plan you are on."
            />
          </div>
          
          {error && (
            <p role="alert" className="text-xs text-red-600 animate-in fade-in slide-in-from-top-1">
              {error}{' '}
              You can also email{' '}
              <a className="font-semibold underline" href="mailto:info@nestedobjects.com">info@nestedobjects.com</a>.
            </p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-full bg-brand-copper px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-copperDark disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Sending...' : 'Send Message'}
          </button>
          <p className="text-xs text-brand-steel">Please include enough detail for the support team to follow up.</p>
        </form>
      )}
    </div>
  )
}
