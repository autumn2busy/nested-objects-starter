import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

interface ContactInfo {
  fullName: string;
  email: string;
  phone: string;
  city: string;
  state: string;
  zipCode: string;
  linkedin?: string;
  website?: string;
}

interface WorkExperience {
  id: string;
  company: string;
  title: string;
  location: string;
  startDate: string;
  endDate: string;
  current: boolean;
  description: string;
  bullets: string[];
  transferableSkills?: string[];
}

interface Education {
  id: string;
  school: string;
  degree: string;
  field: string;
  graduationDate: string;
  gpa?: string;
}

interface Certification {
  id: string;
  name: string;
  issuer: string;
  date: string;
  expirationDate?: string;
}

export interface ResumeData {
  contact: ContactInfo;
  summary: string;
  experience: WorkExperience[];
  education: Education[];
  certifications: Certification[];
  skills: string[];
  fieldServicesSkills: string[];
  equipment: string[];
  coverage: {
    counties: string[];
    radius: number;
    hasReliableVehicle: boolean;
    vehicleType: string;
  };
  availability: {
    fullTime: boolean;
    partTime: boolean;
    weekends: boolean;
    evenings: boolean;
    sameDay: boolean;
  };
  targetRoles: string[];
}

const formatDate = (dateStr: string) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
};

export const generateResumePDF = (data: ResumeData, template: string) => {
  try {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    let yPos = 20;

    const isModern = template === 'modern';
    const isMinimal = template === 'minimal';
    const primaryColor: [number, number, number] = isModern ? [16, 185, 129] : [0, 0, 0];
    const headerFont = isModern || isMinimal ? 'helvetica' : 'times';
    const bodyFont = isModern || isMinimal ? 'helvetica' : 'times';

    doc.setFont(headerFont, 'bold');
    doc.setFontSize(isModern ? 28 : 24);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text(data.contact.fullName || 'Resume', pageWidth / 2, yPos, { align: 'center' });
    yPos += 10;

    doc.setFont(bodyFont, 'normal');
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);

    const contactParts = [
      data.contact.email,
      data.contact.phone,
      data.contact.city && data.contact.state ? `${data.contact.city}, ${data.contact.state}` : ''
    ].filter(Boolean);

    doc.text(contactParts.join('  |  '), pageWidth / 2, yPos, { align: 'center' });
    yPos += 6;

    if (data.contact.linkedin || data.contact.website) {
      const links = [data.contact.linkedin, data.contact.website].filter(Boolean).join('  |  ');
      doc.setTextColor(0, 0, 255);
      doc.text(links, pageWidth / 2, yPos, { align: 'center' });
      doc.setTextColor(0, 0, 0);
      yPos += 8;
    } else {
      yPos += 4;
    }

    if (data.targetRoles.length > 0) {
      doc.setFont(headerFont, 'italic');
      doc.setFontSize(11);
      doc.setTextColor(80, 80, 80);
      doc.text(`Targeting: ${data.targetRoles.join(', ')}`, pageWidth / 2, yPos, { align: 'center' });
      yPos += 12;
    }

    doc.setDrawColor(200, 200, 200);
    doc.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 10;

    if (data.summary) {
      doc.setFont(headerFont, 'bold');
      doc.setFontSize(12);
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.text('PROFESSIONAL SUMMARY', margin, yPos);
      yPos += 6;

      doc.setFont(bodyFont, 'normal');
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      const lines = doc.splitTextToSize(data.summary, pageWidth - (margin * 2));
      doc.text(lines, margin, yPos);
      yPos += (lines.length * 5) + 8;
    }

    const allSkills = [...data.fieldServicesSkills, ...data.skills];
    if (allSkills.length > 0 || data.equipment.length > 0) {
      doc.setFont(headerFont, 'bold');
      doc.setFontSize(12);
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.text('SKILLS & EQUIPMENT', margin, yPos);
      yPos += 6;

      doc.setFont(bodyFont, 'normal');
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);

      if (allSkills.length > 0) {
        const skillsTitle = 'Skills: ';
        doc.setFont(bodyFont, 'bold');
        doc.text(skillsTitle, margin, yPos);
        const skillsWidth = doc.getTextWidth(skillsTitle);

        doc.setFont(bodyFont, 'normal');
        const skillLines = doc.splitTextToSize(allSkills.join(' • '), pageWidth - (margin * 2) - skillsWidth);
        doc.text(skillLines, margin + skillsWidth, yPos);
        yPos += (skillLines.length * 5) + 4;
      }

      if (data.equipment.length > 0) {
        const equipTitle = 'Equipment: ';
        doc.setFont(bodyFont, 'bold');
        doc.text(equipTitle, margin, yPos);
        const equipWidth = doc.getTextWidth(equipTitle);

        doc.setFont(bodyFont, 'normal');
        const equipLines = doc.splitTextToSize(data.equipment.join(', '), pageWidth - (margin * 2) - equipWidth);
        doc.text(equipLines, margin + equipWidth, yPos);
        yPos += (equipLines.length * 5) + 4;
      }
      yPos += 4;
    }

    if (data.coverage.radius > 0 || data.coverage.hasReliableVehicle) {
      doc.setFont(headerFont, 'bold');
      doc.setFontSize(12);
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.text('LOGISTICS & COVERAGE', margin, yPos);
      yPos += 6;

      doc.setFont(bodyFont, 'normal');
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);

      let logisticsText = '';
      if (data.coverage.hasReliableVehicle) {
        logisticsText += `Vehicle: Reliable Personal Vehicle (${data.coverage.vehicleType || 'Standard'}). `;
      }
      if (data.coverage.radius) {
        logisticsText += `Coverage Radius: ${data.coverage.radius} miles. `;
      }
      if (data.coverage.counties.length > 0) {
        logisticsText += `Counties: ${data.coverage.counties.join(', ')}.`;
      }

      const logLines = doc.splitTextToSize(logisticsText, pageWidth - (margin * 2));
      doc.text(logLines, margin, yPos);
      yPos += (logLines.length * 5) + 8;
    }

    if (data.experience.length > 0) {
      doc.setFont(headerFont, 'bold');
      doc.setFontSize(12);
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.text('PROFESSIONAL EXPERIENCE', margin, yPos);
      yPos += 4;

      autoTable(doc, {
        startY: yPos,
        theme: 'plain',
        styles: {
          font: bodyFont,
          fontSize: 10,
          cellPadding: { top: 1.5, right: 0, bottom: 1.5, left: 0 },
          textColor: [0, 0, 0],
          overflow: 'linebreak'
        },
        body: data.experience.map((exp) => {
          const dateStr = `${formatDate(exp.startDate)} - ${exp.current ? 'Present' : formatDate(exp.endDate)}`;
          const titleAndLocation = `${exp.title}${exp.location ? ` | ${exp.location}` : ''}`;
          const bullets = exp.bullets?.filter(Boolean).map((bullet) => `• ${bullet}`).join('\n') || exp.description;

          return [
            `${exp.company}\n${titleAndLocation}`,
            `${dateStr}${bullets ? `\n${bullets}` : ''}`
          ];
        }),
        columnStyles: {
          0: { cellWidth: (pageWidth - margin * 2) * 0.35, fontStyle: 'bold' },
          1: { cellWidth: (pageWidth - margin * 2) * 0.65 }
        },
        margin: { left: margin, right: margin }
      });

      yPos = (doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY
        ? ((doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? yPos) + 8
        : yPos + 8;
    }

    if (data.education.length > 0) {
      doc.setFont(headerFont, 'bold');
      doc.setFontSize(12);
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.text('EDUCATION', margin, yPos);
      yPos += 4;

      autoTable(doc, {
        startY: yPos,
        theme: 'plain',
        styles: {
          font: bodyFont,
          fontSize: 10,
          cellPadding: { top: 1.5, right: 0, bottom: 1.5, left: 0 },
          textColor: [0, 0, 0],
          overflow: 'linebreak'
        },
        body: data.education.map((edu) => {
          const degreeText = edu.field ? `${edu.degree} in ${edu.field}` : edu.degree;
          return [`${edu.school}\n${degreeText}`, edu.graduationDate || ''];
        }),
        columnStyles: {
          0: { cellWidth: (pageWidth - margin * 2) * 0.75, fontStyle: 'bold' },
          1: { cellWidth: (pageWidth - margin * 2) * 0.25, halign: 'right' }
        },
        margin: { left: margin, right: margin }
      });

      yPos = (doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY
        ? ((doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? yPos) + 8
        : yPos + 8;
    }

    if (data.certifications.length > 0) {
      doc.setFont(headerFont, 'bold');
      doc.setFontSize(12);
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.text('CERTIFICATIONS', margin, yPos);
      yPos += 6;

      data.certifications.forEach((cert) => {
        doc.setFont(headerFont, 'bold');
        doc.setFontSize(11);
        doc.setTextColor(0, 0, 0);
        doc.text(cert.name, margin, yPos);

        doc.setFont(bodyFont, 'normal');
        doc.setFontSize(10);
        const dateStr = cert.date ? formatDate(cert.date) : '';
        doc.text(dateStr, pageWidth - margin, yPos, { align: 'right' });
        yPos += 5;

        if (cert.issuer) {
          doc.setFont(bodyFont, 'italic');
          doc.text(cert.issuer, margin, yPos);
          yPos += 8;
        } else {
          yPos += 3;
        }
      });
    }

    const fileName = `${(data.contact.fullName || 'Resume').replace(/\s+/g, '_')}_Resume.pdf`;
    doc.save(fileName);
  } catch (error) {
    console.error('PDF generation failed:', error);
    alert('Failed to generate PDF. Please try again.');
  }
};
