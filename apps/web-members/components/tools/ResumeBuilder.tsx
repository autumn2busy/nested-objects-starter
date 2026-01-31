// ... imports
import { jsPDF } from 'jspdf';

// ... (rest of imports)

// ... inside component ...

const exportToPDF = async () => {
  try {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    let yPos = 20;

    // Helper for text wrapping
    const addWrappedText = (text: string, x: number, y: number, maxWidth: number, fontSize: number, fontStyle: string = 'normal') => {
      doc.setFontSize(fontSize);
      doc.setFont('helvetica', fontStyle);
      const lines = doc.splitTextToSize(text, maxWidth);
      doc.text(lines, x, y);
      return lines.length * (fontSize * 0.5); // Approximate line height
    };

    // Header
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text(resumeData.contact.fullName, pageWidth / 2, yPos, { align: 'center' });
    yPos += 10;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const contactLine = [
      resumeData.contact.email,
      resumeData.contact.phone,
      `${resumeData.contact.city}, ${resumeData.contact.state}`
    ].filter(Boolean).join(' | ');
    doc.text(contactLine, pageWidth / 2, yPos, { align: 'center' });
    yPos += 10;

    if (resumeData.contact.linkedin) {
      doc.setTextColor(0, 0, 255);
      doc.textWithLink('LinkedIn Profile', pageWidth / 2, yPos, { url: resumeData.contact.linkedin, align: 'center' });
      doc.setTextColor(0, 0, 0);
      yPos += 15;
    } else {
      yPos += 5;
    }

    // Divider
    doc.setDrawColor(200, 200, 200);
    doc.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 10;

    // Summary
    if (resumeData.summary) {
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('PROFESSIONAL SUMMARY', margin, yPos);
      yPos += 7;

      const summaryHeight = addWrappedText(resumeData.summary, margin, yPos, pageWidth - (margin * 2), 10);
      yPos += summaryHeight + 10;
    }

    // Skills
    const allSkills = [...resumeData.fieldServicesSkills, ...resumeData.skills];
    if (allSkills.length > 0) {
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('SKILLS', margin, yPos);
      yPos += 7;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      const skillsText = allSkills.join(' • ');
      const skillsHeight = addWrappedText(skillsText, margin, yPos, pageWidth - (margin * 2), 10);
      yPos += skillsHeight + 10;
    }

    // Experience
    if (resumeData.experience.length > 0) {
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('PROFESSIONAL EXPERIENCE', margin, yPos);
      yPos += 7;

      resumeData.experience.forEach(exp => {
        // Check for page break
        if (yPos > 250) {
          doc.addPage();
          yPos = 20;
        }

        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text(exp.company, margin, yPos);

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(`${exp.startDate} - ${exp.current ? 'Present' : exp.endDate}`, pageWidth - margin, yPos, { align: 'right' });
        yPos += 5;

        doc.setFont('helvetica', 'italic');
        doc.text(`${exp.title} | ${exp.location}`, margin, yPos);
        yPos += 7;

        // Bullets
        if (exp.bullets && exp.bullets.length > 0) {
          doc.setFont('helvetica', 'normal');
          exp.bullets.forEach(bullet => {
            if (!bullet) return;
            doc.text('•', margin + 2, yPos);
            const bulletHeight = addWrappedText(bullet, margin + 7, yPos, pageWidth - (margin * 2) - 7, 10);
            yPos += bulletHeight + 2;
          });
        } else if (exp.description) {
          const descHeight = addWrappedText(exp.description, margin, yPos, pageWidth - (margin * 2), 10);
          yPos += descHeight + 2;
        }

        yPos += 5;
      });
      yPos += 5;
    }

    // Education
    if (resumeData.education.length > 0) {
      // Check for page break
      if (yPos > 250) {
        doc.addPage();
        yPos = 20;
      }

      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('EDUCATION', margin, yPos);
      yPos += 7;

      resumeData.education.forEach(edu => {
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text(edu.school, margin, yPos);

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(edu.graduationDate, pageWidth - margin, yPos, { align: 'right' });
        yPos += 5;

        doc.setFont('helvetica', 'italic');
        doc.text(`${edu.degree} in ${edu.field}`, margin, yPos);
        yPos += 8;
      });
    }

    doc.save(`${resumeData.contact.fullName.replace(/\s+/g, '_')}_Resume.pdf`);
  } catch (error) {
    console.error('PDF generation failed:', error);
    alert('Failed to generate PDF. Please try again.');
  }
};
import {
  Upload, FileText, Sparkles, Download, Save, Eye, ChevronRight,
  ChevronLeft, Check, AlertCircle, Briefcase, MapPin, Phone, Mail,
  Globe, Linkedin, Calendar, Award, Wrench, Car, Camera, Clock,
  Shield, Users, Target, Zap, RefreshCw, Copy, Trash2, Plus,
  GripVertical, X, CheckCircle2, Loader2, FileUp, Brain
} from 'lucide-react';

/**
 * NESTED OBJECTS - AI-POWERED RESUME BUILDER
 * 
 * Features:
 * - Upload existing resume (PDF/DOCX) for AI analysis
 * - AI identifies transferable skills from any background
 * - Auto-maps experience to field services terminology
 * - Multiple professional templates
 * - Real-time autosave to localStorage
 * - Export to PDF and DOCX
 * - Firm-specific resume variations
 */

// ============================================================================
// TYPES
// ============================================================================

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
  transferableSkills?: string[]; // AI-identified
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

interface ResumeData {
  contact: ContactInfo;
  summary: string;
  experience: WorkExperience[];
  education: Education[];
  certifications: Certification[];
  skills: string[];
  fieldServicesSkills: string[]; // Industry-specific
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

interface AIAnalysis {
  transferableSkills: string[];
  suggestedSummary: string;
  industryTermMappings: { original: string; fieldServices: string }[];
  strengthAreas: string[];
  improvementSuggestions: string[];
}

type BuilderStep = 'upload' | 'contact' | 'experience' | 'skills' | 'coverage' | 'preview';

// ============================================================================
// CONSTANTS
// ============================================================================

const FIELD_SERVICES_SKILLS = [
  'Property Condition Reports (PCR)',
  'Occupancy Verification',
  'Photo Documentation',
  'GPS Navigation & Route Planning',
  'Mobile App Proficiency',
  'Data Entry & Reporting',
  'Customer Interaction',
  'Time Management',
  'Regulatory Compliance',
  'SLA Adherence',
  'REO Inspections',
  'Loss Mitigation Inspections',
  'Insurance Inspections',
  'Property Preservation',
  'Winterization',
  'Lock Changes & Securing',
  'Debris Removal Coordination',
  'Lawn Maintenance Assessment',
  'Interior Inspections',
  'Exterior Inspections',
  'Construction Draw Inspections',
  'BPO Support',
  'Quality Control',
  'FDCPA Compliance',
  'HUD Guidelines',
  'FHA Requirements'
];

const EQUIPMENT_OPTIONS = [
  'Smartphone with Camera',
  'Digital Camera (12MP+)',
  'GPS Device',
  'Measuring Tape (100ft)',
  'Laser Measure',
  'Flashlight',
  'Non-Contact Voltage Tester',
  'Ladder (6ft)',
  'Extension Ladder',
  'Safety Vest',
  'Hard Hat',
  'Steel-Toe Boots',
  'Clipboard & Forms',
  'Tablet/iPad',
  'Mobile Printer',
  'Locksmith Tools',
  'Basic Hand Tools',
  'First Aid Kit',
  'PPE Kit',
  'Vehicle with Cargo Space'
];

const TARGET_ROLES = [
  'Mortgage Field Inspector',
  'Property Preservation Specialist',
  'REO Inspector',
  'Insurance Loss Control Inspector',
  'Construction Draw Inspector',
  'BPO Inspector',
  'Occupancy Verification Specialist',
  'Property Condition Reporter',
  'Mobile Notary (with inspections)',
  'Asset Preservation Contractor'
];

const TRANSFERABLE_SKILL_MAP: Record<string, string[]> = {
  'real estate': ['Property assessment', 'Market analysis', 'Client communication', 'Documentation'],
  'notary': ['Document verification', 'Client interaction', 'Compliance adherence', 'Mobile service delivery'],
  'delivery': ['Route optimization', 'Time management', 'GPS navigation', 'Same-day service'],
  'rideshare': ['Customer service', 'Navigation', 'Schedule flexibility', 'Vehicle maintenance'],
  'construction': ['Property assessment', 'Safety protocols', 'Tool proficiency', 'Quality inspection'],
  'photography': ['Photo documentation', 'Attention to detail', 'Equipment handling', 'Digital file management'],
  'retail': ['Customer service', 'Inventory assessment', 'Attention to detail', 'Time management'],
  'healthcare': ['Documentation', 'Compliance', 'Attention to detail', 'Professional demeanor'],
  'military': ['Discipline', 'Protocol adherence', 'Documentation', 'Physical stamina', 'Leadership'],
  'law enforcement': ['Investigation skills', 'Documentation', 'Observation', 'Report writing'],
  'insurance': ['Risk assessment', 'Documentation', 'Compliance', 'Client communication'],
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

const generateId = () => Math.random().toString(36).substring(2, 9);

const formatDate = (dateStr: string) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
};

// ============================================================================
// COMPONENT
// ============================================================================
import React, { useState, useEffect, useCallback, useRef } from 'react';

export default function ResumeBuilder() {
  // State
  const [currentStep, setCurrentStep] = useState<BuilderStep>('upload');
  const [resumeData, setResumeData] = useState<ResumeData>({
    contact: {
      fullName: '',
      email: '',
      phone: '',
      city: '',
      state: '',
      zipCode: '',
      linkedin: '',
      website: ''
    },
    summary: '',
    experience: [],
    education: [],
    certifications: [],
    skills: [],
    fieldServicesSkills: [],
    equipment: [],
    coverage: {
      counties: [],
      radius: 50,
      hasReliableVehicle: true,
      vehicleType: ''
    },
    availability: {
      fullTime: false,
      partTime: true,
      weekends: true,
      evenings: false,
      sameDay: true
    },
    targetRoles: []
  });

  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<'professional' | 'modern' | 'minimal'>('professional');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);

  // ============================================================================
  // AUTOSAVE
  // ============================================================================

  const saveToLocalStorage = useCallback(() => {
    setIsSaving(true);
    try {
      localStorage.setItem('nestedObjects_resumeData', JSON.stringify(resumeData));
      localStorage.setItem('nestedObjects_resumeTemplate', selectedTemplate);
      setLastSaved(new Date());
    } catch (error) {
      console.error('Failed to save resume:', error);
    } finally {
      setIsSaving(false);
    }
  }, [resumeData, selectedTemplate]);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const savedData = localStorage.getItem('nestedObjects_resumeData');
      const savedTemplate = localStorage.getItem('nestedObjects_resumeTemplate');

      if (savedData) {
        setResumeData(JSON.parse(savedData));
        // Skip upload step if we have saved data
        if (JSON.parse(savedData).contact.fullName) {
          setCurrentStep('contact');
        }
      }
      if (savedTemplate) {
        setSelectedTemplate(savedTemplate as typeof selectedTemplate);
      }
    } catch (error) {
      console.error('Failed to load saved resume:', error);
    }
  }, []);

  // Autosave with debounce
  useEffect(() => {
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }

    autoSaveTimerRef.current = setTimeout(() => {
      if (resumeData.contact.fullName) {
        saveToLocalStorage();
      }
    }, 2000);

    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [resumeData, saveToLocalStorage]);

  // ============================================================================
  // FILE UPLOAD & AI ANALYSIS
  // ============================================================================

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadedFile(file);
    setIsAnalyzing(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/ai-resume/parse', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        let errorMessage = 'Failed to parse resume';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch (e) {
          errorMessage = `Server error: ${response.status}`;
        }
        throw new Error(errorMessage);
      }

      const parsedData = await response.json();

      setResumeData(prev => ({
        ...prev,
        contact: { ...prev.contact, ...parsedData.contact },
        summary: parsedData.summary || prev.summary,
        experience: parsedData.experience?.map((exp: any) => ({ ...exp, id: generateId() })) || [],
        education: parsedData.education?.map((edu: any) => ({ ...edu, id: generateId() })) || [],
        certifications: parsedData.certifications?.map((cert: any) => ({ ...cert, id: generateId() })) || [],
        skills: [...new Set([...prev.skills, ...(parsedData.skills || [])])],
      }));

      // Mock analysis for now (or could be returned from API too if we expand it)
      // Keeping this consistent with previous behavior for transferable skills
      const mockAnalysis: AIAnalysis = {
        transferableSkills: parsedData.skills?.slice(0, 6) || ['Detail Oriented', 'Communication'],
        suggestedSummary: parsedData.summary || 'Summary derived from your resume.',
        industryTermMappings: [],
        strengthAreas: ['Resume parsed successfully'],
        improvementSuggestions: ['Review parsed data for accuracy']
      };

      setAiAnalysis(mockAnalysis);
      setCurrentStep('contact');
    } catch (error: any) {
      console.error('Error parsing resume:', error);
      alert(error.message || 'Could not parse resume. Please try again or enter details manually.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSkipUpload = () => {
    setCurrentStep('contact');
  };

  // ============================================================================
  // DATA HANDLERS
  // ============================================================================

  const updateContact = (field: keyof ContactInfo, value: string) => {
    setResumeData(prev => ({
      ...prev,
      contact: { ...prev.contact, [field]: value }
    }));
  };

  const addExperience = () => {
    const newExp: WorkExperience = {
      id: generateId(),
      company: '',
      title: '',
      location: '',
      startDate: '',
      endDate: '',
      current: false,
      description: '',
      bullets: ['']
    };
    setResumeData(prev => ({
      ...prev,
      experience: [...prev.experience, newExp]
    }));
  };

  const updateExperience = (id: string, field: keyof WorkExperience, value: unknown) => {
    setResumeData(prev => ({
      ...prev,
      experience: prev.experience.map(exp =>
        exp.id === id ? { ...exp, [field]: value } : exp
      )
    }));
  };

  const removeExperience = (id: string) => {
    setResumeData(prev => ({
      ...prev,
      experience: prev.experience.filter(exp => exp.id !== id)
    }));
  };

  const addEducation = () => {
    const newEdu: Education = {
      id: generateId(),
      school: '',
      degree: '',
      field: '',
      graduationDate: ''
    };
    setResumeData(prev => ({
      ...prev,
      education: [...prev.education, newEdu]
    }));
  };

  const updateEducation = (id: string, field: keyof Education, value: string) => {
    setResumeData(prev => ({
      ...prev,
      education: prev.education.map(edu =>
        edu.id === id ? { ...edu, [field]: value } : edu
      )
    }));
  };

  const removeEducation = (id: string) => {
    setResumeData(prev => ({
      ...prev,
      education: prev.education.filter(edu => edu.id !== id)
    }));
  };

  const addCertification = () => {
    const newCert: Certification = {
      id: generateId(),
      name: '',
      issuer: '',
      date: ''
    };
    setResumeData(prev => ({
      ...prev,
      certifications: [...prev.certifications, newCert]
    }));
  };

  const updateCertification = (id: string, field: keyof Certification, value: string) => {
    setResumeData(prev => ({
      ...prev,
      certifications: prev.certifications.map(cert =>
        cert.id === id ? { ...cert, [field]: value } : cert
      )
    }));
  };

  const removeCertification = (id: string) => {
    setResumeData(prev => ({
      ...prev,
      certifications: prev.certifications.filter(cert => cert.id !== id)
    }));
  };

  const toggleSkill = (skill: string, type: 'skills' | 'fieldServicesSkills' | 'equipment') => {
    setResumeData(prev => {
      const current = prev[type] as string[];
      const updated = current.includes(skill)
        ? current.filter(s => s !== skill)
        : [...current, skill];
      return { ...prev, [type]: updated };
    });
  };

  const toggleTargetRole = (role: string) => {
    setResumeData(prev => {
      const updated = prev.targetRoles.includes(role)
        ? prev.targetRoles.filter(r => r !== role)
        : [...prev.targetRoles, role];
      return { ...prev, targetRoles: updated };
    });
  };

  // ============================================================================
  // NAVIGATION
  // ============================================================================

  const steps: BuilderStep[] = ['upload', 'contact', 'experience', 'skills', 'coverage', 'preview'];

  const stepLabels: Record<BuilderStep, string> = {
    upload: 'Import',
    contact: 'Contact',
    experience: 'Experience',
    skills: 'Skills',
    coverage: 'Coverage',
    preview: 'Preview'
  };

  const currentStepIndex = steps.indexOf(currentStep);

  const goToNextStep = () => {
    const nextIndex = currentStepIndex + 1;
    if (nextIndex < steps.length) {
      setCurrentStep(steps[nextIndex]);
    }
  };

  const goToPreviousStep = () => {
    const prevIndex = currentStepIndex - 1;
    if (prevIndex >= 0) {
      setCurrentStep(steps[prevIndex]);
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 'upload':
        return true;
      case 'contact':
        return resumeData.contact.fullName && resumeData.contact.email && resumeData.contact.phone;
      case 'experience':
        return true; // Experience is optional for new inspectors
      case 'skills':
        return resumeData.fieldServicesSkills.length > 0 || resumeData.skills.length > 0;
      case 'coverage':
        return resumeData.coverage.radius > 0;
      default:
        return true;
    }
  };

  // ============================================================================
  // EXPORT FUNCTIONS
  // ============================================================================

  const exportToPDF = async () => {
    try {
      // Lazy load jsPDF to avoid server-side issues
      const { jsPDF } = await import('jspdf');
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 20;
      let yPos = 20;

      // Helper for text wrapping
      const addWrappedText = (text: string, x: number, y: number, maxWidth: number, fontSize: number, fontStyle: string = 'normal') => {
        doc.setFontSize(fontSize);
        doc.setFont('helvetica', fontStyle);
        const lines = doc.splitTextToSize(text, maxWidth);
        doc.text(lines, x, y);
        // Calculate height: lines specific height logic for jsPDF
        // default line height factor is 1.15
        const lineHeight = fontSize * 1.15 * 0.3527777778; // px to mm approx conversion for unit
        return lines.length * 5; // simplified mm estimate
      };

      // Header
      doc.setFontSize(24);
      doc.setFont('helvetica', 'bold');
      doc.text(resumeData.contact.fullName, pageWidth / 2, yPos, { align: 'center' });
      yPos += 10;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      const contactLine = [
        resumeData.contact.email,
        resumeData.contact.phone,
        resumeData.contact.city && resumeData.contact.state ? `${resumeData.contact.city}, ${resumeData.contact.state}` : ''
      ].filter(Boolean).join(' | ');
      doc.text(contactLine, pageWidth / 2, yPos, { align: 'center' });
      yPos += 10;

      if (resumeData.contact.linkedin) {
        doc.setTextColor(0, 0, 255);
        doc.textWithLink('LinkedIn Profile', pageWidth / 2, yPos, { url: resumeData.contact.linkedin, align: 'center' });
        doc.setTextColor(0, 0, 0);
        yPos += 15;
      } else {
        yPos += 5;
      }

      // Divider
      doc.setDrawColor(200, 200, 200);
      doc.line(margin, yPos, pageWidth - margin, yPos);
      yPos += 10;

      // Summary
      if (resumeData.summary) {
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('PROFESSIONAL SUMMARY', margin, yPos);
        yPos += 7;

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        const lines = doc.splitTextToSize(resumeData.summary, pageWidth - (margin * 2));
        doc.text(lines, margin, yPos);
        yPos += (lines.length * 5) + 10;
      }

      // Skills
      const allSkills = [...resumeData.fieldServicesSkills, ...resumeData.skills];
      if (allSkills.length > 0) {
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('SKILLS', margin, yPos);
        yPos += 7;

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        const skillsText = allSkills.join(' • ');
        const lines = doc.splitTextToSize(skillsText, pageWidth - (margin * 2));
        doc.text(lines, margin, yPos);
        yPos += (lines.length * 5) + 10;
      }

      // Experience
      if (resumeData.experience.length > 0) {
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('PROFESSIONAL EXPERIENCE', margin, yPos);
        yPos += 7;

        resumeData.experience.forEach(exp => {
          // Check for page break
          if (yPos > 250) {
            doc.addPage();
            yPos = 20;
          }

          doc.setFontSize(12);
          doc.setFont('helvetica', 'bold');
          doc.text(exp.company, margin, yPos);

          doc.setFontSize(10);
          doc.setFont('helvetica', 'normal');
          doc.text(`${exp.startDate} - ${exp.current ? 'Present' : exp.endDate}`, pageWidth - margin, yPos, { align: 'right' });
          yPos += 5;

          doc.setFont('helvetica', 'italic');
          doc.text(`${exp.title} | ${exp.location}`, margin, yPos);
          yPos += 7;

          // Bullets
          if (exp.bullets && exp.bullets.length > 0) {
            doc.setFont('helvetica', 'normal');
            exp.bullets.forEach(bullet => {
              if (!bullet) return;
              doc.text('•', margin + 2, yPos);
              const lines = doc.splitTextToSize(bullet, pageWidth - (margin * 2) - 7);
              doc.text(lines, margin + 7, yPos);
              yPos += (lines.length * 5) + 2;
            });
          } else if (exp.description) {
            const lines = doc.splitTextToSize(exp.description, pageWidth - (margin * 2));
            doc.text(lines, margin, yPos);
            yPos += (lines.length * 5) + 2;
          }

          yPos += 5;
        });
        yPos += 5;
      }

      // Education
      if (resumeData.education.length > 0) {
        // Check for page break
        if (yPos > 250) {
          doc.addPage();
          yPos = 20;
        }

        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('EDUCATION', margin, yPos);
        yPos += 7;

        resumeData.education.forEach(edu => {
          doc.setFontSize(12);
          doc.setFont('helvetica', 'bold');
          doc.text(edu.school, margin, yPos);

          doc.setFontSize(10);
          doc.setFont('helvetica', 'normal');
          doc.text(edu.graduationDate, pageWidth - margin, yPos, { align: 'right' });
          yPos += 5;

          doc.setFont('helvetica', 'italic');
          doc.text(`${edu.degree} in ${edu.field}`, margin, yPos);
          yPos += 8;
        });
      }

      doc.save(`${resumeData.contact.fullName.replace(/\s+/g, '_')}_Resume.pdf`);
    } catch (error) {
      console.error('PDF generation failed:', error);
      alert('Failed to generate PDF. Please try again.');
    }
  };

  const exportToDOCX = async () => {
    // In production, this would generate a DOCX using the API
    alert('DOCX export coming soon! Your resume data has been saved.');
  };

  // ============================================================================
  // RENDER FUNCTIONS
  // ============================================================================

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center gap-2 mb-8">
      {steps.map((step, index) => {
        const isActive = step === currentStep;
        const isCompleted = index < currentStepIndex;

        return (
          <React.Fragment key={step}>
            <button
              onClick={() => index <= currentStepIndex && setCurrentStep(step)}
              disabled={index > currentStepIndex}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${isActive
                ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30'
                : isCompleted
                  ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                  : 'bg-slate-100 text-slate-400'
                }`}
            >
              {isCompleted ? (
                <Check className="w-4 h-4" />
              ) : (
                <span className="w-5 h-5 rounded-full border-2 flex items-center justify-center text-xs">
                  {index + 1}
                </span>
              )}
              <span className="hidden sm:inline">{stepLabels[step]}</span>
            </button>
            {index < steps.length - 1 && (
              <ChevronRight className={`w-4 h-4 ${isCompleted ? 'text-emerald-500' : 'text-slate-300'}`} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );

  const renderUploadStep = () => (
    <div className="max-w-2xl mx-auto text-center">
      <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center mb-6 shadow-xl shadow-emerald-500/30">
        <Brain className="w-10 h-10 text-white" />
      </div>

      <h2 className="text-2xl font-bold text-slate-900 mb-3">
        AI-Powered Resume Builder
      </h2>
      <p className="text-slate-600 mb-8 max-w-md mx-auto">
        Upload your existing resume and our AI will identify transferable skills
        and translate your experience into field services language.
      </p>

      <div
        onClick={() => fileInputRef.current?.click()}
        className="border-2 border-dashed border-slate-300 hover:border-emerald-500 rounded-2xl p-12 cursor-pointer transition-all hover:bg-emerald-50/50 group"
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.doc,.docx"
          onChange={handleFileUpload}
          className="hidden"
        />

        {isAnalyzing ? (
          <div className="space-y-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-emerald-100 flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
            </div>
            <div>
              <p className="font-semibold text-slate-900">Analyzing your resume...</p>
              <p className="text-sm text-slate-500 mt-1">
                Identifying transferable skills and industry mappings
              </p>
            </div>
          </div>
        ) : uploadedFile ? (
          <div className="space-y-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-emerald-100 flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8 text-emerald-600" />
            </div>
            <div>
              <p className="font-semibold text-slate-900">{uploadedFile.name}</p>
              <p className="text-sm text-emerald-600 mt-1">Analysis complete!</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-slate-100 group-hover:bg-emerald-100 flex items-center justify-center transition-colors">
              <FileUp className="w-8 h-8 text-slate-400 group-hover:text-emerald-600 transition-colors" />
            </div>
            <div>
              <p className="font-semibold text-slate-900">
                Drop your resume here or click to browse
              </p>
              <p className="text-sm text-slate-500 mt-1">
                Supports PDF, DOC, and DOCX files
              </p>
            </div>
          </div>
        )}
      </div>

      {aiAnalysis && (
        <div className="mt-8 text-left bg-emerald-50 border border-emerald-200 rounded-xl p-6">
          <div className="flex items-start gap-3 mb-4">
            <Sparkles className="w-5 h-5 text-emerald-600 mt-0.5" />
            <div>
              <h3 className="font-semibold text-emerald-900">AI Analysis Results</h3>
              <p className="text-sm text-emerald-700 mt-1">
                We found {aiAnalysis.transferableSkills.length} transferable skills
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mb-4">
            {aiAnalysis.transferableSkills.map(skill => (
              <span
                key={skill}
                className="px-3 py-1 bg-white border border-emerald-200 rounded-full text-sm text-emerald-700"
              >
                {skill}
              </span>
            ))}
          </div>

          <div className="pt-4 border-t border-emerald-200">
            <h4 className="text-sm font-semibold text-emerald-900 mb-2">
              Industry Term Mappings
            </h4>
            <div className="space-y-2">
              {aiAnalysis.industryTermMappings.slice(0, 3).map((mapping, i) => (
                <div key={i} className="flex items-center gap-2 text-sm">
                  <span className="text-slate-600">{mapping.original}</span>
                  <ChevronRight className="w-4 h-4 text-emerald-500" />
                  <span className="font-medium text-emerald-700">{mapping.fieldServices}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="mt-8 flex items-center justify-center gap-4">
        <button
          onClick={handleSkipUpload}
          className="px-6 py-3 text-slate-600 hover:text-slate-900 font-medium"
        >
          Start Fresh
        </button>
        {(uploadedFile || aiAnalysis) && (
          <button
            onClick={goToNextStep}
            className="px-8 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-xl transition-colors flex items-center gap-2"
          >
            Continue
            <ChevronRight className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  );

  const renderContactStep = () => (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold text-slate-900 mb-2">Contact Information</h2>
      <p className="text-slate-600 mb-8">
        How should firms reach you? This appears at the top of your resume.
      </p>

      <div className="space-y-6">
        {/* Full Name */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Full Name *
          </label>
          <input
            type="text"
            value={resumeData.contact.fullName}
            onChange={(e) => updateContact('fullName', e.target.value)}
            placeholder="John Smith"
            className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition"
          />
        </div>

        {/* Email & Phone */}
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              <Mail className="w-4 h-4 inline mr-1" /> Email *
            </label>
            <input
              type="email"
              value={resumeData.contact.email}
              onChange={(e) => updateContact('email', e.target.value)}
              placeholder="john@example.com"
              className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              <Phone className="w-4 h-4 inline mr-1" /> Phone *
            </label>
            <input
              type="tel"
              value={resumeData.contact.phone}
              onChange={(e) => updateContact('phone', e.target.value)}
              placeholder="(555) 123-4567"
              className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition"
            />
          </div>
        </div>

        {/* Location */}
        <div className="grid md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              <MapPin className="w-4 h-4 inline mr-1" /> City
            </label>
            <input
              type="text"
              value={resumeData.contact.city}
              onChange={(e) => updateContact('city', e.target.value)}
              placeholder="Atlanta"
              className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              State
            </label>
            <input
              type="text"
              value={resumeData.contact.state}
              onChange={(e) => updateContact('state', e.target.value)}
              placeholder="GA"
              className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              ZIP Code
            </label>
            <input
              type="text"
              value={resumeData.contact.zipCode}
              onChange={(e) => updateContact('zipCode', e.target.value)}
              placeholder="30301"
              className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition"
            />
          </div>
        </div>

        {/* Optional Links */}
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              <Linkedin className="w-4 h-4 inline mr-1" /> LinkedIn (optional)
            </label>
            <input
              type="url"
              value={resumeData.contact.linkedin || ''}
              onChange={(e) => updateContact('linkedin', e.target.value)}
              placeholder="linkedin.com/in/yourprofile"
              className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              <Globe className="w-4 h-4 inline mr-1" /> Website (optional)
            </label>
            <input
              type="url"
              value={resumeData.contact.website || ''}
              onChange={(e) => updateContact('website', e.target.value)}
              placeholder="yourwebsite.com"
              className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition"
            />
          </div>
        </div>

        {/* Professional Summary */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Professional Summary
          </label>
          {aiAnalysis && (
            <div className="mb-2 flex items-center gap-2 text-sm text-emerald-600">
              <Sparkles className="w-4 h-4" />
              AI-generated summary based on your uploaded resume
            </div>
          )}
          <textarea
            value={resumeData.summary}
            onChange={(e) => setResumeData(prev => ({ ...prev, summary: e.target.value }))}
            placeholder="Write a brief 2-3 sentence summary highlighting your relevant experience and what you bring to field services..."
            rows={4}
            className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition resize-none"
          />
        </div>
      </div>
    </div>
  );

  const renderExperienceStep = () => (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Work Experience</h2>
          <p className="text-slate-600 mt-1">
            Add relevant work history. We&apos;ll help translate it to field services language.
          </p>
        </div>
        <button
          onClick={addExperience}
          className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-lg transition flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Position
        </button>
      </div>

      {resumeData.experience.length === 0 ? (
        <div className="text-center py-12 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200">
          <Briefcase className="w-12 h-12 mx-auto text-slate-300 mb-4" />
          <p className="text-slate-500 mb-4">No work experience added yet</p>
          <button
            onClick={addExperience}
            className="px-4 py-2 bg-white border border-slate-300 hover:border-emerald-500 text-slate-700 rounded-lg transition"
          >
            Add Your First Position
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {resumeData.experience.map((exp, index) => (
            <div
              key={exp.id}
              className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
                    <GripVertical className="w-5 h-5 text-slate-400" />
                  </div>
                  <span className="text-sm font-medium text-slate-500">
                    Position {index + 1}
                  </span>
                </div>
                <button
                  onClick={() => removeExperience(exp.id)}
                  className="p-2 text-slate-400 hover:text-red-500 transition"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>

              <div className="grid md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Job Title
                  </label>
                  <input
                    type="text"
                    value={exp.title}
                    onChange={(e) => updateExperience(exp.id, 'title', e.target.value)}
                    placeholder="e.g., Delivery Driver, Real Estate Agent"
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Company
                  </label>
                  <input
                    type="text"
                    value={exp.company}
                    onChange={(e) => updateExperience(exp.id, 'company', e.target.value)}
                    placeholder="Company Name"
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Location
                  </label>
                  <input
                    type="text"
                    value={exp.location}
                    onChange={(e) => updateExperience(exp.id, 'location', e.target.value)}
                    placeholder="City, State"
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Start Date
                  </label>
                  <input
                    type="month"
                    value={exp.startDate}
                    onChange={(e) => updateExperience(exp.id, 'startDate', e.target.value)}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    End Date
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="month"
                      value={exp.endDate}
                      onChange={(e) => updateExperience(exp.id, 'endDate', e.target.value)}
                      disabled={exp.current}
                      className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition disabled:bg-slate-100"
                    />
                  </div>
                  <label className="flex items-center gap-2 mt-2 text-sm text-slate-600">
                    <input
                      type="checkbox"
                      checked={exp.current}
                      onChange={(e) => updateExperience(exp.id, 'current', e.target.checked)}
                      className="rounded border-slate-300 text-emerald-500 focus:ring-emerald-500"
                    />
                    Currently working here
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Description & Key Achievements
                </label>
                <textarea
                  value={exp.description}
                  onChange={(e) => updateExperience(exp.id, 'description', e.target.value)}
                  placeholder="Describe your responsibilities and achievements. We'll help translate these to field services terminology..."
                  rows={4}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition resize-none"
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Education Section */}
      <div className="mt-12">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-bold text-slate-900">Education</h3>
            <p className="text-slate-600 mt-1">Add your educational background</p>
          </div>
          <button
            onClick={addEducation}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg transition flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Education
          </button>
        </div>

        {resumeData.education.length === 0 ? (
          <div className="text-center py-8 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200">
            <p className="text-slate-500">No education added (optional for most field services roles)</p>
          </div>
        ) : (
          <div className="space-y-4">
            {resumeData.education.map((edu) => (
              <div key={edu.id} className="bg-white border border-slate-200 rounded-lg p-4 flex items-start gap-4">
                <div className="flex-1 grid md:grid-cols-4 gap-4">
                  <input
                    type="text"
                    value={edu.school}
                    onChange={(e) => updateEducation(edu.id, 'school', e.target.value)}
                    placeholder="School Name"
                    className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition"
                  />
                  <input
                    type="text"
                    value={edu.degree}
                    onChange={(e) => updateEducation(edu.id, 'degree', e.target.value)}
                    placeholder="Degree"
                    className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition"
                  />
                  <input
                    type="text"
                    value={edu.field}
                    onChange={(e) => updateEducation(edu.id, 'field', e.target.value)}
                    placeholder="Field of Study"
                    className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition"
                  />
                  <input
                    type="month"
                    value={edu.graduationDate}
                    onChange={(e) => updateEducation(edu.id, 'graduationDate', e.target.value)}
                    className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition"
                  />
                </div>
                <button
                  onClick={() => removeEducation(edu.id)}
                  className="p-2 text-slate-400 hover:text-red-500 transition"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Certifications Section */}
      <div className="mt-12">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-bold text-slate-900">Certifications</h3>
            <p className="text-slate-600 mt-1">Industry certifications and training</p>
          </div>
          <button
            onClick={addCertification}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg transition flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Certification
          </button>
        </div>

        {resumeData.certifications.length === 0 ? (
          <div className="text-center py-8 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200">
            <Award className="w-8 h-8 mx-auto text-slate-300 mb-2" />
            <p className="text-slate-500">No certifications added yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {resumeData.certifications.map((cert) => (
              <div key={cert.id} className="bg-white border border-slate-200 rounded-lg p-4 flex items-start gap-4">
                <div className="flex-1 grid md:grid-cols-3 gap-4">
                  <input
                    type="text"
                    value={cert.name}
                    onChange={(e) => updateCertification(cert.id, 'name', e.target.value)}
                    placeholder="Certification Name"
                    className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition"
                  />
                  <input
                    type="text"
                    value={cert.issuer}
                    onChange={(e) => updateCertification(cert.id, 'issuer', e.target.value)}
                    placeholder="Issuing Organization"
                    className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition"
                  />
                  <input
                    type="month"
                    value={cert.date}
                    onChange={(e) => updateCertification(cert.id, 'date', e.target.value)}
                    className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition"
                  />
                </div>
                <button
                  onClick={() => removeCertification(cert.id)}
                  className="p-2 text-slate-400 hover:text-red-500 transition"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const renderSkillsStep = () => (
    <div className="max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold text-slate-900 mb-2">Skills & Equipment</h2>
      <p className="text-slate-600 mb-8">
        Select the skills you have and equipment you own. This helps firms match you to the right work.
      </p>

      {/* Target Roles */}
      <div className="mb-10">
        <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <Target className="w-5 h-5 text-emerald-500" />
          Target Roles
        </h3>
        <p className="text-sm text-slate-600 mb-4">
          What type of field services work are you seeking?
        </p>
        <div className="flex flex-wrap gap-2">
          {TARGET_ROLES.map(role => (
            <button
              key={role}
              onClick={() => toggleTargetRole(role)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition ${resumeData.targetRoles.includes(role)
                ? 'bg-emerald-500 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
            >
              {role}
            </button>
          ))}
        </div>
      </div>

      {/* Field Services Skills */}
      <div className="mb-10">
        <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <Zap className="w-5 h-5 text-amber-500" />
          Field Services Skills
        </h3>
        <p className="text-sm text-slate-600 mb-4">
          Select skills specific to field inspection and property services work.
        </p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {FIELD_SERVICES_SKILLS.map(skill => (
            <button
              key={skill}
              onClick={() => toggleSkill(skill, 'fieldServicesSkills')}
              className={`px-4 py-3 rounded-lg text-sm text-left transition flex items-center gap-2 ${resumeData.fieldServicesSkills.includes(skill)
                ? 'bg-amber-100 text-amber-800 border-2 border-amber-300'
                : 'bg-white border border-slate-200 text-slate-700 hover:border-slate-300'
                }`}
            >
              {resumeData.fieldServicesSkills.includes(skill) && (
                <Check className="w-4 h-4 text-amber-600 flex-shrink-0" />
              )}
              <span>{skill}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Equipment */}
      <div className="mb-10">
        <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <Wrench className="w-5 h-5 text-blue-500" />
          Equipment You Own
        </h3>
        <p className="text-sm text-slate-600 mb-4">
          What tools and equipment do you currently have available?
        </p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {EQUIPMENT_OPTIONS.map(item => (
            <button
              key={item}
              onClick={() => toggleSkill(item, 'equipment')}
              className={`px-4 py-3 rounded-lg text-sm text-left transition flex items-center gap-2 ${resumeData.equipment.includes(item)
                ? 'bg-blue-100 text-blue-800 border-2 border-blue-300'
                : 'bg-white border border-slate-200 text-slate-700 hover:border-slate-300'
                }`}
            >
              {resumeData.equipment.includes(item) && (
                <Check className="w-4 h-4 text-blue-600 flex-shrink-0" />
              )}
              <span>{item}</span>
            </button>
          ))}
        </div>
      </div>

      {/* General/Transferable Skills */}
      {aiAnalysis && (
        <div className="mb-10">
          <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-500" />
            AI-Identified Transferable Skills
          </h3>
          <div className="flex flex-wrap gap-2">
            {aiAnalysis.transferableSkills.map(skill => (
              <button
                key={skill}
                onClick={() => toggleSkill(skill, 'skills')}
                className={`px-4 py-2 rounded-full text-sm font-medium transition ${resumeData.skills.includes(skill)
                  ? 'bg-purple-500 text-white'
                  : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                  }`}
              >
                {resumeData.skills.includes(skill) && <Check className="w-3 h-3 inline mr-1" />}
                {skill}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const renderCoverageStep = () => (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold text-slate-900 mb-2">Coverage & Availability</h2>
      <p className="text-slate-600 mb-8">
        Tell firms where you can work and when you&apos;re available.
      </p>

      {/* Vehicle */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 mb-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <Car className="w-5 h-5 text-slate-600" />
          Transportation
        </h3>

        <label className="flex items-center gap-3 mb-4">
          <input
            type="checkbox"
            checked={resumeData.coverage.hasReliableVehicle}
            onChange={(e) => setResumeData(prev => ({
              ...prev,
              coverage: { ...prev.coverage, hasReliableVehicle: e.target.checked }
            }))}
            className="w-5 h-5 rounded border-slate-300 text-emerald-500 focus:ring-emerald-500"
          />
          <span className="text-slate-700">I have a reliable personal vehicle</span>
        </label>

        {resumeData.coverage.hasReliableVehicle && (
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Vehicle Type (optional)
            </label>
            <input
              type="text"
              value={resumeData.coverage.vehicleType}
              onChange={(e) => setResumeData(prev => ({
                ...prev,
                coverage: { ...prev.coverage, vehicleType: e.target.value }
              }))}
              placeholder="e.g., 2020 Honda CR-V, SUV with cargo space"
              className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition"
            />
          </div>
        )}
      </div>

      {/* Coverage Radius */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 mb-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <MapPin className="w-5 h-5 text-slate-600" />
          Service Area
        </h3>

        <div className="mb-6">
          <label className="block text-sm font-medium text-slate-700 mb-2">
            How far are you willing to travel from home base?
          </label>
          <div className="flex items-center gap-4">
            <input
              type="range"
              min="10"
              max="150"
              step="10"
              value={resumeData.coverage.radius}
              onChange={(e) => setResumeData(prev => ({
                ...prev,
                coverage: { ...prev.coverage, radius: parseInt(e.target.value) }
              }))}
              className="flex-1 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-500"
            />
            <span className="w-24 text-center py-2 bg-emerald-100 text-emerald-700 font-semibold rounded-lg">
              {resumeData.coverage.radius} miles
            </span>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Counties You Cover (optional)
          </label>
          <input
            type="text"
            value={resumeData.coverage.counties.join(', ')}
            onChange={(e) => setResumeData(prev => ({
              ...prev,
              coverage: {
                ...prev.coverage,
                counties: e.target.value.split(',').map(c => c.trim()).filter(Boolean)
              }
            }))}
            placeholder="e.g., Fulton, DeKalb, Gwinnett, Cobb"
            className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition"
          />
          <p className="text-xs text-slate-500 mt-1">Separate multiple counties with commas</p>
        </div>
      </div>

      {/* Availability */}
      <div className="bg-white border border-slate-200 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5 text-slate-600" />
          Availability
        </h3>

        <div className="grid sm:grid-cols-2 gap-4">
          {[
            { key: 'fullTime', label: 'Full-Time (40+ hrs/week)', icon: Briefcase },
            { key: 'partTime', label: 'Part-Time (10-30 hrs/week)', icon: Clock },
            { key: 'weekends', label: 'Weekends Available', icon: Calendar },
            { key: 'evenings', label: 'Evenings Available', icon: Clock },
            { key: 'sameDay', label: 'Same-Day Service Capable', icon: Zap },
          ].map(({ key, label, icon: Icon }) => (
            <label
              key={key}
              className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition ${resumeData.availability[key as keyof typeof resumeData.availability]
                ? 'border-emerald-500 bg-emerald-50'
                : 'border-slate-200 hover:border-slate-300'
                }`}
            >
              <input
                type="checkbox"
                checked={resumeData.availability[key as keyof typeof resumeData.availability]}
                onChange={(e) => setResumeData(prev => ({
                  ...prev,
                  availability: { ...prev.availability, [key]: e.target.checked }
                }))}
                className="sr-only"
              />
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${resumeData.availability[key as keyof typeof resumeData.availability]
                ? 'bg-emerald-500 text-white'
                : 'bg-slate-100 text-slate-400'
                }`}>
                <Icon className="w-5 h-5" />
              </div>
              <span className={`font-medium ${resumeData.availability[key as keyof typeof resumeData.availability]
                ? 'text-emerald-700'
                : 'text-slate-700'
                }`}>
                {label}
              </span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );

  const renderPreviewStep = () => (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Preview & Export</h2>
          <p className="text-slate-600 mt-1">
            Review your resume and download in your preferred format.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={selectedTemplate}
            onChange={(e) => setSelectedTemplate(e.target.value as typeof selectedTemplate)}
            className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          >
            <option value="professional">Professional Template</option>
            <option value="modern">Modern Template</option>
            <option value="minimal">Minimal Template</option>
          </select>
        </div>
      </div>

      {/* Resume Preview */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden mb-6">
        <div className="bg-slate-50 border-b border-slate-200 px-6 py-3 flex items-center justify-between">
          <span className="text-sm font-medium text-slate-600">Resume Preview</span>
          <div className="flex items-center gap-2">
            <button
              onClick={exportToPDF}
              className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-sm font-medium rounded-lg transition flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              PDF
            </button>
            <button
              onClick={exportToDOCX}
              className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-lg transition flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Word
            </button>
          </div>
        </div>

        {/* Actual Resume Preview */}
        <div className="p-8 bg-white min-h-[800px]" style={{ fontFamily: 'Georgia, serif' }}>
          {/* Header */}
          <div className="text-center mb-6 pb-6 border-b-2 border-slate-200">
            <h1 className="text-3xl font-bold text-slate-900 mb-2">
              {resumeData.contact.fullName || 'Your Name'}
            </h1>
            <div className="flex items-center justify-center flex-wrap gap-4 text-sm text-slate-600">
              {resumeData.contact.email && (
                <span className="flex items-center gap-1">
                  <Mail className="w-4 h-4" />
                  {resumeData.contact.email}
                </span>
              )}
              {resumeData.contact.phone && (
                <span className="flex items-center gap-1">
                  <Phone className="w-4 h-4" />
                  {resumeData.contact.phone}
                </span>
              )}
              {(resumeData.contact.city || resumeData.contact.state) && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  {[resumeData.contact.city, resumeData.contact.state].filter(Boolean).join(', ')}
                </span>
              )}
            </div>
            {resumeData.coverage.radius > 0 && (
              <div className="mt-2 text-sm text-emerald-600 font-medium">
                Service Area: {resumeData.coverage.radius} mile radius
                {resumeData.coverage.counties.length > 0 && (
                  <span> • {resumeData.coverage.counties.join(', ')}</span>
                )}
              </div>
            )}
          </div>

          {/* Summary */}
          {resumeData.summary && (
            <div className="mb-6">
              <h2 className="text-lg font-bold text-slate-900 mb-2 uppercase tracking-wide">
                Professional Summary
              </h2>
              <p className="text-slate-700 leading-relaxed">{resumeData.summary}</p>
            </div>
          )}

          {/* Target Roles */}
          {resumeData.targetRoles.length > 0 && (
            <div className="mb-6">
              <h2 className="text-lg font-bold text-slate-900 mb-2 uppercase tracking-wide">
                Target Roles
              </h2>
              <div className="flex flex-wrap gap-2">
                {resumeData.targetRoles.map(role => (
                  <span key={role} className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-sm">
                    {role}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Field Services Skills */}
          {resumeData.fieldServicesSkills.length > 0 && (
            <div className="mb-6">
              <h2 className="text-lg font-bold text-slate-900 mb-2 uppercase tracking-wide">
                Field Services Skills
              </h2>
              <div className="grid grid-cols-2 gap-1 text-sm text-slate-700">
                {resumeData.fieldServicesSkills.map(skill => (
                  <div key={skill} className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-500" />
                    {skill}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Equipment */}
          {resumeData.equipment.length > 0 && (
            <div className="mb-6">
              <h2 className="text-lg font-bold text-slate-900 mb-2 uppercase tracking-wide">
                Equipment & Tools
              </h2>
              <p className="text-sm text-slate-700">
                {resumeData.equipment.join(' • ')}
              </p>
            </div>
          )}

          {/* Experience */}
          {resumeData.experience.length > 0 && (
            <div className="mb-6">
              <h2 className="text-lg font-bold text-slate-900 mb-3 uppercase tracking-wide">
                Work Experience
              </h2>
              {resumeData.experience.map(exp => (
                <div key={exp.id} className="mb-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-slate-900">{exp.title || 'Position Title'}</h3>
                      <p className="text-slate-600">{exp.company}{exp.location && ` • ${exp.location}`}</p>
                    </div>
                    <span className="text-sm text-slate-500">
                      {formatDate(exp.startDate)} - {exp.current ? 'Present' : formatDate(exp.endDate)}
                    </span>
                  </div>
                  {exp.description && (
                    <p className="mt-2 text-sm text-slate-700">{exp.description}</p>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Education */}
          {resumeData.education.length > 0 && (
            <div className="mb-6">
              <h2 className="text-lg font-bold text-slate-900 mb-3 uppercase tracking-wide">
                Education
              </h2>
              {resumeData.education.map(edu => (
                <div key={edu.id} className="mb-2">
                  <div className="flex justify-between">
                    <div>
                      <span className="font-semibold">{edu.degree}</span>
                      {edu.field && <span className="text-slate-600"> in {edu.field}</span>}
                    </div>
                    <span className="text-sm text-slate-500">{formatDate(edu.graduationDate)}</span>
                  </div>
                  <p className="text-slate-600">{edu.school}</p>
                </div>
              ))}
            </div>
          )}

          {/* Certifications */}
          {resumeData.certifications.length > 0 && (
            <div className="mb-6">
              <h2 className="text-lg font-bold text-slate-900 mb-3 uppercase tracking-wide">
                Certifications
              </h2>
              {resumeData.certifications.map(cert => (
                <div key={cert.id} className="flex justify-between mb-1">
                  <span>
                    <span className="font-medium">{cert.name}</span>
                    {cert.issuer && <span className="text-slate-600"> - {cert.issuer}</span>}
                  </span>
                  <span className="text-sm text-slate-500">{formatDate(cert.date)}</span>
                </div>
              ))}
            </div>
          )}

          {/* Availability */}
          <div className="mt-6 pt-4 border-t border-slate-200">
            <h2 className="text-lg font-bold text-slate-900 mb-2 uppercase tracking-wide">
              Availability
            </h2>
            <div className="flex flex-wrap gap-2 text-sm">
              {resumeData.availability.fullTime && (
                <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full">Full-Time</span>
              )}
              {resumeData.availability.partTime && (
                <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full">Part-Time</span>
              )}
              {resumeData.availability.weekends && (
                <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full">Weekends</span>
              )}
              {resumeData.availability.evenings && (
                <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full">Evenings</span>
              )}
              {resumeData.availability.sameDay && (
                <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full">Same-Day Service</span>
              )}
              {resumeData.coverage.hasReliableVehicle && (
                <span className="px-3 py-1 bg-slate-100 text-slate-700 rounded-full">
                  Reliable Vehicle{resumeData.coverage.vehicleType && `: ${resumeData.coverage.vehicleType}`}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Final Actions */}
      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
            <CheckCircle2 className="w-6 h-6 text-emerald-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-emerald-900 mb-1">Your resume is ready!</h3>
            <p className="text-sm text-emerald-700 mb-4">
              Download your resume and start applying to firms in the directory.
              Your data is automatically saved and you can come back to edit anytime.
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={exportToPDF}
                className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-xl transition flex items-center gap-2"
              >
                <Download className="w-5 h-5" />
                Download PDF
              </button>
              <button
                onClick={() => setCurrentStep('contact')}
                className="px-6 py-3 bg-white border border-emerald-300 text-emerald-700 font-semibold rounded-xl hover:bg-emerald-50 transition"
              >
                Edit Resume
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // ============================================================================
  // MAIN RENDER
  // ============================================================================

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="font-bold text-slate-900">Resume Builder</h1>
                <p className="text-xs text-slate-500">AI-Powered for Field Services</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* Autosave Indicator */}
              <div className="flex items-center gap-2 text-sm text-slate-500">
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : lastSaved ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    <span>Saved {lastSaved.toLocaleTimeString()}</span>
                  </>
                ) : null}
              </div>

              <button
                onClick={() => setShowPreview(!showPreview)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg transition flex items-center gap-2"
              >
                <Eye className="w-4 h-4" />
                Preview
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Step Indicator */}
        {renderStepIndicator()}

        {/* Step Content */}
        <div className="mb-8">
          {currentStep === 'upload' && renderUploadStep()}
          {currentStep === 'contact' && renderContactStep()}
          {currentStep === 'experience' && renderExperienceStep()}
          {currentStep === 'skills' && renderSkillsStep()}
          {currentStep === 'coverage' && renderCoverageStep()}
          {currentStep === 'preview' && renderPreviewStep()}
        </div>

        {/* Navigation Buttons */}
        {currentStep !== 'upload' && (
          <div className="flex items-center justify-between pt-6 border-t border-slate-200">
            <button
              onClick={goToPreviousStep}
              className="px-6 py-3 text-slate-600 hover:text-slate-900 font-medium flex items-center gap-2"
            >
              <ChevronLeft className="w-5 h-5" />
              Back
            </button>

            {currentStep !== 'preview' ? (
              <button
                onClick={goToNextStep}
                disabled={!canProceed()}
                className={`px-8 py-3 font-semibold rounded-xl transition flex items-center gap-2 ${canProceed()
                  ? 'bg-emerald-500 hover:bg-emerald-600 text-white'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  }`}
              >
                Continue
                <ChevronRight className="w-5 h-5" />
              </button>
            ) : (
              <button
                onClick={exportToPDF}
                className="px-8 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-xl transition flex items-center gap-2"
              >
                <Download className="w-5 h-5" />
                Download Resume
              </button>
            )}
          </div>
        )}
      </main>
    </div>
  );
}