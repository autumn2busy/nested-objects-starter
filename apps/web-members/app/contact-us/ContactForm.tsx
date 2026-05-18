'use client'

import React, { useState } from 'react'

export default function ContactForm() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [success, setSuccess] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)
    setSuccess(null)
    setError(null)

    const formData = new FormData(e.currentTarget)
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

      if (res.ok) {
        setSuccess(result.message || 'Message sent! We will get back to you soon.')
        e.currentTarget.reset()
      } else {
        setError(result.error || 'Something went wrong. Please try again.')
      }
    } catch (err) {
      setError('Unexpected error. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="rounded-3xl border border-brand-copper/20 bg-white p-6 shadow-lg shadow-brand-copper/10">
      <h2 className="text-lg font-semibold text-brand-dark">Send us a quick note</h2>
      <p className="mt-1 text-sm text-slate-700">Share a few details and we will route it to the right teammate.</p>
      
      {success ? (
        <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-xl text-green-800 animate-in fade-in zoom-in duration-300">
          <p className="font-semibold text-sm">{success}</p>
        </div>
      ) : (
        <form method="POST" onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="text-sm font-semibold text-brand-dark" htmlFor="name">
              Name
            </label>
            <input
              id="name"
              name="name"
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
              required
              rows={4}
              className="mt-1 w-full rounded-lg border border-brand-copper/30 bg-brand-mist px-3 py-2 text-sm text-brand-dark placeholder:text-brand-steel focus:border-brand-copper focus:outline-none focus:ring-2 focus:ring-brand-copper/40"
              placeholder="Share how we can help or which plan you are on."
            />
          </div>
          
          {error && (
            <p className="text-xs text-red-600 animate-in fade-in slide-in-from-top-1">{error}</p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-full bg-brand-copper px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-copperDark disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Sending...' : 'Send Message'}
          </button>
          <p className="text-xs text-brand-steel">We reply within one business day. Priority routing for Pro, Elite, and Agency members.</p>
        </form>
      )}
    </div>
  )
}
