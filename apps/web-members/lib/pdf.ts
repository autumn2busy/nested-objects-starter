const PDF_HEADER = '%PDF-1.4\n'

function escapePdfText(text: string) {
  return text.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)')
}

function buildPdfFromText(textContent: string) {
  const escaped = escapePdfText(textContent)

  const objects: string[] = []
  objects.push('1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n')
  objects.push('2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n')

  const contentStream = `BT\n/F1 12 Tf\n72 720 Td\n(${escaped}) Tj\nET`
  objects.push(
    `3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>\nendobj\n`
  )
  objects.push(`4 0 obj\n<< /Length ${contentStream.length} >>\nstream\n${contentStream}\nendstream\nendobj\n`)
  objects.push('5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n')

  let body = ''
  const offsets: number[] = []
  let position = PDF_HEADER.length

  for (const obj of objects) {
    offsets.push(position)
    body += obj
    position += obj.length
  }

  let xref = `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`
  offsets.forEach((offset) => {
    xref += `${String(offset).padStart(10, '0')} 00000 n \n`
  })

  const trailer = `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${PDF_HEADER.length + body.length}\n%%EOF`

  return new TextEncoder().encode(PDF_HEADER + body + xref + trailer)
}

function htmlToText(html: string) {
  return html
    .replace(/\n+/g, ' ')
    .replace(/<\s*br\s*\/?\s*>/gi, '\n')
    .replace(/<\/(p|div|h[1-6])>/gi, '\n\n')
    .replace(/<li>/gi, '\n• ')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

export function htmlToPdfBuffer(html: string) {
  const textContent = htmlToText(html)
  return buildPdfFromText(textContent)
}

export function textToPdfBuffer(text: string) {
  return buildPdfFromText(text)
}
