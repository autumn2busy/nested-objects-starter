export function MembershipAccessNotice({ expired = false }: { expired?: boolean }) {
  return (
    <section role="status" className="mx-auto my-10 max-w-xl rounded-xl border border-slate-200 bg-white p-6 text-slate-900">
      <h1 className="text-xl font-semibold">Check your membership</h1>
      <p className="mt-3 text-sm leading-6 text-slate-600">
        {expired
          ? 'Your current subscription has ended. Check your account before continuing to the directory.'
          : 'We could not confirm your current membership. Please try again in a moment. You are still signed in.'}
      </p>
      <div className="mt-4 flex flex-wrap gap-4">
        <a href="/hiring-firms" className="font-medium underline">Check again</a>
        <a href="/profile" className="font-medium underline">View my account</a>
      </div>
    </section>
  )
}
