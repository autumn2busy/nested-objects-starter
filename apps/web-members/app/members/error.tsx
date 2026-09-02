'use client'

export default function MemberProfileError({ reset }: { reset: () => void }) {
  return (
    <main className="mx-auto max-w-lg px-6 py-16 text-center">
      <h1 className="text-2xl font-semibold text-slate-900">Unable to load this profile view</h1>
      <p className="mt-3 text-slate-600">Please try again. No profile information is shown while access or data is unavailable.</p>
      <button onClick={reset} className="mt-6 rounded-full bg-slate-900 px-5 py-2.5 font-medium text-white">Try again</button>
    </main>
  )
}
