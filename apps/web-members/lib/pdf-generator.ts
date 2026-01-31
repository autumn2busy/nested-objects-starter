import { jsPDF } from 'jspdf';

export async function generateResumePDF(content: string, name: string): Promise<void> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  // Configure fonts and styling
  doc.setFont('helvetica');
  
  // Parse resume content and render
  const lines = content.split('\n');
  let y = 20; // Starting Y position
  const pageHeight = doc.internal.pageSize.height;
  const margin = 20;
  const maxWidth = doc.internal.pageSize.width - (margin * 2);

  for (const line of lines) {
    // Check if we need a new page
    if (y > pageHeight - margin) {
      doc.addPage();
      y = margin;
    }

    // Detect section headers (all caps or starts with [)
    if (line.match(/^\[.*\]$/) || line === line.toUpperCase() && line.length > 0) {
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(44, 95, 123); // Brand blue
      doc.text(line.replace(/[\[\]]/g, ''), margin, y);
      y += 8;
    }
    // Bullet points
    else if (line.trim().startsWith('•')) {
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(0, 0, 0);
      const wrappedText = doc.splitTextToSize(line, maxWidth - 5);
      doc.text(wrappedText, margin + 5, y);
      y += (wrappedText.length * 5) + 2;
    }
    // Regular text
    else if (line.trim().length > 0) {
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(0, 0, 0);
      const wrappedText = doc.splitTextToSize(line, maxWidth);
      doc.text(wrappedText, margin, y);
      y += (wrappedText.length * 5) + 2;
    }
    // Empty line
    else {
      y += 4;
    }
  }

  // Download
  const filename = `${name.replace(/\s+/g, '_')}_Resume.pdf`;
  doc.save(filename);
}
