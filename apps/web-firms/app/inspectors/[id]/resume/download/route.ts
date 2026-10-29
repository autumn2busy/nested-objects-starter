import { demoInspectors } from '../../../../../lib/demo-inspectors'
import { createSampleResumeDownload, getSampleResumeState } from '../../../../../lib/demo-profile-details'

export const dynamicParams = false

export function generateStaticParams() {
  return demoInspectors.filter(person => getSampleResumeState(person.id) === 'shared').map(({ id }) => ({ id }))
}

export function GET(_request: Request, { params }: { params: { id: string } }) {
  const person = demoInspectors.find(item => item.id === params.id)
  const headers = {
    'Content-Type': 'text/plain; charset=utf-8',
    'X-Content-Type-Options': 'nosniff',
    'X-Robots-Tag': 'noindex, nofollow',
  }
  if (!person || getSampleResumeState(person.id) !== 'shared') return new Response('Sample résumé not found.', { status: 404, headers })

  const resume = createSampleResumeDownload(person)
  return new Response(resume.text, {
    headers: { ...headers, 'Content-Disposition': `attachment; filename="${resume.filename}"` },
  })
}
