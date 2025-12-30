import { jsPDF } from 'jspdf'

export function generateCertificate(userName: string, courseName: string, date: string) {
    const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
    })

    // Background
    doc.setFillColor(248, 250, 252) // slate-50
    doc.rect(0, 0, 297, 210, 'F')

    // Border
    doc.setLineWidth(2)
    doc.setDrawColor(180, 83, 9) // brand-copper
    doc.rect(10, 10, 277, 190)

    // Header
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(40)
    doc.setTextColor(15, 23, 42) // slate-900
    doc.text('CERTIFICATE OF COMPLETION', 148.5, 50, { align: 'center' })

    // Subheader
    doc.setFontSize(16)
    doc.setTextColor(100, 116, 139) // slate-500
    doc.setFont('helvetica', 'normal')
    doc.text('This certifies that', 148.5, 75, { align: 'center' })

    // Name
    doc.setFontSize(32)
    doc.setTextColor(180, 83, 9) // brand-copper
    doc.setFont('times', 'bolditalic')
    doc.text(userName, 148.5, 95, { align: 'center' })

    // Body
    doc.setFontSize(16)
    doc.setTextColor(100, 116, 139)
    doc.setFont('helvetica', 'normal')
    doc.text('has successfully completed the industry training track:', 148.5, 115, { align: 'center' })

    // Course Name
    doc.setFontSize(24)
    doc.setTextColor(15, 23, 42)
    doc.setFont('helvetica', 'bold')
    doc.text(courseName, 148.5, 135, { align: 'center' })

    // Date
    doc.setFontSize(14)
    doc.text(`Completed on ${date}`, 148.5, 155, { align: 'center' })

    // Signature Line
    doc.setLineWidth(0.5)
    doc.setDrawColor(15, 23, 42)
    doc.line(90, 180, 140, 180) // Left Sig
    doc.line(157, 180, 207, 180) // Right Sig

    doc.setFontSize(10)
    doc.text('Nested Objects', 115, 185, { align: 'center' })
    doc.text('Credential Verification', 182, 185, { align: 'center' })

    // Save
    doc.save(`${courseName.replace(/\s+/g, '_')}_Certificate.pdf`)
}
