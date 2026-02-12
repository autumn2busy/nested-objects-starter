'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Upload, FileText, Sparkles, Download, Save, Eye, ChevronRight,
  ChevronLeft, Check, AlertCircle, Briefcase, MapPin, Phone, Mail,
  Globe, Linkedin, Calendar, Award, Wrench, Car, Camera, Clock,
  Shield, Users, Target, Zap, RefreshCw, Copy, Trash2, Plus,
  GripVertical, X, CheckCircle2, Loader2, FileUp, Brain, RotateCcw
} from 'lucide-react';
import { useAuth } from '@/components/auth-provider';

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

interface ResumeData {
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

const INITIAL_RESUME_DATA: ResumeData = {
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
};

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

export default function ResumeBuilder() {
  // Auth hook
  const { accessToken, login } = useAuth();

  // State
  const [currentStep, setCurrentStep] = useState<BuilderStep>('upload');
  const [resumeData, setResumeData] = useState<ResumeData>(INITIAL_RESUME_DATA);
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<'professional' | 'modern' | 'minimal'>('professional');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);

  // ============================================================================
  // RESET FUNCTION
  // ============================================================================

  const resetAllData = () => {
    // Clear localStorage
    localStorage.removeItem('nestedObjects_resumeData');
    localStorage.removeItem('nestedObjects_resumeTemplate');

    // Reset state
    setResumeData(INITIAL_RESUME_DATA);
    setAiAnalysis(null);
    setUploadedFile(null);
    setCurrentStep('upload');
    setSelectedTemplate('professional');
    setLastSaved(null);
    setShowResetConfirm(false);

    // Clear file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

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
        const parsed = JSON.parse(savedData);
        setResumeData(parsed);
        // Skip upload step if we have saved data with a name
        if (parsed.contact?.fullName) {
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
      if (!accessToken) {
        // Attempt to login if missing token
        login();
        throw new Error('Please log in again to use the AI Resume Builder.');
      }

      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/ai/resume/parse', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to parse resume');
      }

      // Map backend response to frontend state structure
      const mappedContact = {
        fullName: data.contact?.name || data.contact?.fullName || '',
        email: data.contact?.email || '',
        phone: data.contact?.phone || '',
        // Attempt to parse city/state from location if provided
        city: String(data.contact?.location || '').split(',')[0]?.trim() || '',
        state: String(data.contact?.location || '').split(',')[1]?.trim() || '',
        linkedin: data.contact?.linkedIn || data.contact?.linkedin || '',
        website: data.contact?.website || ''
      };

      const mappedExperience = (Array.isArray(data.experience) ? data.experience : []).map((exp: any) => {
        // Parse dates "Jul 2023 - Present" -> startDate, endDate, current
        let startDate = '';
        let endDate = '';
        let current = false;

        if (exp.dates) {
          const dateStr = String(exp.dates); // Ensure it's a string
          if (dateStr.includes('-') || dateStr.includes('–')) {
            const parts = dateStr.split(/[-–]/).map((s: string) => s.trim());
            if (parts.length > 0) startDate = parts[0];
            if (parts.length > 1) {
              if (parts[1].toLowerCase().includes('present')) {
                current = true;
                endDate = '';
              } else {
                endDate = parts[1];
              }
            }
          } else {
            // If it's just a single date string (e.g. "2020")
            startDate = dateStr;
          }
        }

        return {
          id: generateId(),
          company: exp.company || '',
          title: exp.jobTitle || exp.title || '',
          location: exp.location || '',
          startDate,
          endDate,
          current,
          description: exp.description || '',
          bullets: Array.isArray(exp.responsibilities) ? exp.responsibilities : [exp.responsibilities || ''],
          transferableSkills: Array.isArray(exp.transferableSkills) ? exp.transferableSkills : []
        };
      });

      const mappedEducation = (Array.isArray(data.education) ? data.education : []).map((edu: any) => ({
        id: generateId(),
        school: edu.institution || edu.school || '',
        degree: edu.degree || '',
        field: edu.fieldOfStudy || edu.field || '', // Map fieldOfStudy if present
        graduationDate: edu.dates || edu.graduationDate || edu.date || '' // Add edu.date check
      }));

      // Update resume data with parsed and mapped content
      setResumeData(prev => ({
        ...prev,
        contact: {
          ...prev.contact,
          ...mappedContact
        },
        summary: data.summary || data.professionalSummary || prev.summary, // Check professionalSummary
        experience: mappedExperience.length > 0 ? mappedExperience : prev.experience,
        education: mappedEducation.length > 0 ? mappedEducation : prev.education,
        certifications: Array.isArray(data.certifications) ? data.certifications.map((cert: any) => ({ ...cert, id: generateId() })) : prev.certifications,
        skills: [...new Set([...prev.skills, ...(Array.isArray(data.skills) ? data.skills : [])])],
      }));

      // Map real AI analysis data
      // Ensure we attempt to pull from root or nested structures if n8n varies
      const analysis: AIAnalysis = {
        transferableSkills: Array.isArray(data.transferableSkills) ? data.transferableSkills : (Array.isArray(data.skills) ? data.skills.slice(0, 6) : []),
        suggestedSummary: data.summary || data.professionalSummary || '',
        industryTermMappings: data.industryTermMappings || [],
        strengthAreas: data.strengthAreas || [],
        improvementSuggestions: data.improvementSuggestions || []
      };

      setAiAnalysis(analysis);
      setCurrentStep('contact');
    } catch (error: any) {
      console.error('Error parsing resume:', error);
      alert(error.message || 'Could not parse resume. Please try again or enter details manually.');
      setUploadedFile(null);
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
        return true;
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

  const handleExport = async () => {
    const { generateResumePDF } = await import('@/lib/pdf-generator');
    generateResumePDF(resumeData, selectedTemplate);
  };

  const exportToDOCX = async () => {
    try {
      const { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } = await import('docx');
      const { saveAs } = await import('file-saver');

      if (!Document || !Packer || !Paragraph) {
        throw new Error('Failed to load DOCX library');
      }

      const sections = [];

      // HELPER: Create standard paragraph
      const createPara = (text: string, bold = false, size = 24, alignment = AlignmentType.LEFT) => {
        return new Paragraph({
          alignment: alignment,
          children: [
            new TextRun({
              text: text,
              bold: bold,
              size: size, // 24 = 12pt
              font: "Calibri"
            }),
          ],
          spacing: { after: 120 }, // 120 = 6pt
        });
      };

      // HELPER: Create heading
      const createHeading = (text: string, level = HeadingLevel.HEADING_2) => {
        return new Paragraph({
          text: text.toUpperCase(),
          heading: level,
          spacing: { before: 240, after: 120 },
          border: {
            bottom: { color: "auto", space: 1, style: "single", size: 6 }
          }
        });
      };

      // 1. HEADER
      sections.push(
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new TextRun({
              text: resumeData.contact.fullName,
              bold: true,
              size: 48, // 24pt
              font: "Calibri",
              color: "10B981" // Emerald
            }),
          ],
          spacing: { after: 120 }
        })
      );

      const contactInfo = [
        resumeData.contact.email,
        resumeData.contact.phone,
        `${resumeData.contact.city}, ${resumeData.contact.state}`
      ].filter(Boolean).join(" | ");

      sections.push(
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [new TextRun({ text: contactInfo, size: 20 })],
          spacing: { after: 240 }
        })
      );

      if (resumeData.contact.linkedin || resumeData.contact.website) {
        const links = [resumeData.contact.linkedin, resumeData.contact.website].filter(Boolean).join(" | ");
        sections.push(
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: links, size: 20, color: "0000FF" })],
            spacing: { after: 240 }
          })
        );
      }

      // 2. TARGET ROLES
      if (resumeData.targetRoles.length > 0) {
        sections.push(
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: `Targeting: ${resumeData.targetRoles.join(', ')}`,
                italics: true,
                size: 22,
                color: "505050"
              })
            ],
            spacing: { after: 240 }
          })
        );
      }

      // 3. SUMMARY
      if (resumeData.summary) {
        sections.push(createHeading("Professional Summary"));
        sections.push(createPara(resumeData.summary));
      }

      // 4. SKILLS
      const allSkills = [...resumeData.fieldServicesSkills, ...resumeData.skills];
      if (allSkills.length > 0 || resumeData.equipment.length > 0) {
        sections.push(createHeading("Skills & Equipment"));

        if (allSkills.length > 0) {
          sections.push(
            new Paragraph({
              children: [
                new TextRun({ text: "Skills: ", bold: true }),
                new TextRun({ text: allSkills.join(" • ") })
              ],
              spacing: { after: 120 }
            })
          );
        }

        if (resumeData.equipment.length > 0) {
          sections.push(
            new Paragraph({
              children: [
                new TextRun({ text: "Equipment: ", bold: true }),
                new TextRun({ text: resumeData.equipment.join(", ") })
              ],
              spacing: { after: 120 }
            })
          );
        }
      }

      // 5. COVERAGE
      if (resumeData.coverage.radius > 0 || resumeData.coverage.hasReliableVehicle) {
        sections.push(createHeading("Logistics & Coverage"));
        let logisticsText = "";
        if (resumeData.coverage.hasReliableVehicle) logisticsText += `Vehicle: Reliable Personal Vehicle (${resumeData.coverage.vehicleType || 'Standard'}). `;
        if (resumeData.coverage.radius) logisticsText += `Coverage Radius: ${resumeData.coverage.radius} miles. `;
        if (resumeData.coverage.counties.length > 0) logisticsText += `Counties: ${resumeData.coverage.counties.join(', ')}.`;

        sections.push(createPara(logisticsText));
      }

      // 6. EXPERIENCE
      if (resumeData.experience.length > 0) {
        sections.push(createHeading("Professional Experience"));

        resumeData.experience.forEach(exp => {
          // Company and Date
          sections.push(
            new Paragraph({
              children: [
                new TextRun({ text: exp.company, bold: true, size: 22 }),
                new TextRun({
                  text: `\t${formatDate(exp.startDate)} - ${exp.current ? 'Present' : formatDate(exp.endDate)}`,
                  size: 20
                })
              ],
              tabStops: [
                { type: "right", position: 9000 } // Right align date
              ],
              spacing: { before: 120 }
            })
          );

          // Title and Location
          sections.push(
            new Paragraph({
              children: [
                new TextRun({ text: exp.title, italics: true, size: 22 }),
                new TextRun({ text: exp.location ? ` | ${exp.location}` : "", italics: true, size: 20 })
              ],
              spacing: { after: 120 }
            })
          );

          // Bullets
          if (exp.bullets && exp.bullets.length > 0) {
            exp.bullets.forEach(bullet => {
              if (!bullet) return;
              sections.push(
                new Paragraph({
                  text: bullet,
                  bullet: { level: 0 },
                  spacing: { after: 60 }
                })
              );
            });
          } else if (exp.description) {
            sections.push(createPara(exp.description));
          }
        });
      }

      // 7. EDUCATION
      if (resumeData.education.length > 0) {
        sections.push(createHeading("Education"));
        resumeData.education.forEach(edu => {
          sections.push(
            new Paragraph({
              children: [
                new TextRun({ text: edu.school, bold: true, size: 22 }),
                new TextRun({ text: `\t${edu.graduationDate || ''}`, size: 20 })
              ],
              tabStops: [{ type: "right", position: 9000 }],
              spacing: { before: 120 }
            })
          );

          const degreeText = edu.field ? `${edu.degree} in ${edu.field}` : edu.degree;
          sections.push(
            new Paragraph({
              children: [new TextRun({ text: degreeText, italics: true, size: 22 })],
              spacing: { after: 120 }
            })
          );
        });
      }

      // 8. CERTIFICATIONS
      if (resumeData.certifications.length > 0) {
        sections.push(createHeading("Certifications"));
        resumeData.certifications.forEach(cert => {
          sections.push(
            new Paragraph({
              children: [
                new TextRun({ text: cert.name, bold: true, size: 22 }),
                new TextRun({ text: `\t${cert.date ? formatDate(cert.date) : ''}`, size: 20 })
              ],
              tabStops: [{ type: "right", position: 9000 }],
              spacing: { before: 120 }
            })
          );
          if (cert.issuer) {
            sections.push(
              new Paragraph({
                children: [new TextRun({ text: cert.issuer, italics: true, size: 20 })],
                spacing: { after: 120 }
              })
            );
          }
        });
      }

      const doc = new Document({
        sections: [{
          properties: {},
          children: sections
        }]
      });

      const blob = await Packer.toBlob(doc);
      saveAs(blob, `${resumeData.contact.fullName.replace(/\s+/g, '_')}_Resume.docx`);

    } catch (error) {
      console.error('DOCX generation failed:', error);
      alert('Failed to generate DOCX. Please try again or check console for details.');
    }
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
          accept=".pdf,.doc,.docx,.txt"
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
        ) : uploadedFile && aiAnalysis ? (
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
                Supports PDF, DOC, DOCX, and TXT files
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

          {aiAnalysis.industryTermMappings.length > 0 && (
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
          )}
        </div>
      )}

      <div className="mt-8 flex items-center justify-center gap-4">
        <button
          onClick={handleSkipUpload}
          className="px-6 py-3 text-slate-600 hover:text-slate-900 font-medium"
        >
          Start Fresh
        </button>
        {aiAnalysis && (
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
                    type="text"
                    value={exp.startDate}
                    onChange={(e) => updateExperience(exp.id, 'startDate', e.target.value)}
                    placeholder="e.g. Sep 2022"
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    End Date
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={exp.endDate}
                      onChange={(e) => updateExperience(exp.id, 'endDate', e.target.value)}
                      disabled={exp.current}
                      placeholder="e.g. Present"
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
                  placeholder="Describe your responsibilities and achievements..."
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
                    type="text"
                    value={edu.graduationDate}
                    onChange={(e) => updateEducation(edu.id, 'graduationDate', e.target.value)}
                    placeholder="Graduation Date (e.g. May 2023)"
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

      {/* AI-Identified Skills */}
      {aiAnalysis && aiAnalysis.transferableSkills.length > 0 && (
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

  const renderPreviewStep = () => {
    // Template Styles
    const isModern = selectedTemplate === 'modern';
    const isMinimal = selectedTemplate === 'minimal';

    // Fonts & Colors
    const fontFamily = isModern || isMinimal ? 'Helvetica, Arial, sans-serif' : 'Georgia, serif';
    const primaryColor = isModern ? '#10b981' : '#000000'; // Emerald or Black
    const headerClass = isModern
      ? "text-3xl font-bold text-emerald-600 mb-2 uppercase tracking-wide"
      : isMinimal
        ? "text-3xl font-normal text-slate-900 mb-2 tracking-tight"
        : "text-3xl font-bold text-slate-900 mb-2";

    const sectionTitleClass = isModern
      ? "text-lg font-bold text-emerald-600 mb-3 uppercase tracking-wider border-b-2 border-emerald-100 pb-1"
      : isMinimal
        ? "text-lg font-semibold text-slate-900 mb-3 uppercase tracking-widest"
        : "text-lg font-bold text-slate-900 mb-3 uppercase tracking-wide border-b border-slate-200 pb-1";

    return (
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
            <span className="text-sm font-medium text-slate-600">Resume Preview ({selectedTemplate})</span>
            <div className="flex items-center gap-2">
              <button
                onClick={handleExport}
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

          {/* Resume Content Preview */}
          <div className="p-12 bg-white min-h-[800px] shadow-inner text-slate-900" style={{ fontFamily }}>
            {/* Header */}
            <div className={`text-center mb-8 ${!isMinimal ? 'pb-6 border-b-2 border-slate-100' : ''}`}>
              <h1 className={headerClass} style={{ color: isModern ? primaryColor : undefined }}>
                {resumeData.contact.fullName || 'Your Name'}
              </h1>
              <div className="flex items-center justify-center flex-wrap gap-x-4 gap-y-2 text-sm text-slate-600">
                {[
                  resumeData.contact.email,
                  resumeData.contact.phone,
                  [resumeData.contact.city, resumeData.contact.state].filter(Boolean).join(', ')
                ].filter(Boolean).map((item, i) => (
                  <React.Fragment key={i}>
                    {i > 0 && <span className="text-slate-300">|</span>}
                    <span>{item}</span>
                  </React.Fragment>
                ))}
              </div>
              {(resumeData.contact.linkedin || resumeData.contact.website) && (
                <div className="flex items-center justify-center gap-4 mt-2 text-sm">
                  {resumeData.contact.linkedin && (
                    <a href={resumeData.contact.linkedin} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">LinkedIn</a>
                  )}
                  {resumeData.contact.website && (
                    <a href={resumeData.contact.website} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">Portfolio</a>
                  )}
                </div>
              )}
            </div>

            {/* Target Roles */}
            {resumeData.targetRoles.length > 0 && (
              <div className="mb-8 text-center bg-slate-50 py-3 rounded-lg border border-slate-100">
                <span className="font-semibold text-slate-700 mr-2">Targeting:</span>
                <span className="text-slate-600">{resumeData.targetRoles.join(' • ')}</span>
              </div>
            )}

            {/* Summary */}
            {resumeData.summary && (
              <div className="mb-8">
                <h2 className={sectionTitleClass}>Professional Summary</h2>
                <p className="text-slate-700 leading-relaxed text-base">{resumeData.summary}</p>
              </div>
            )}

            {/* Skills & Equipment */}
            {(resumeData.fieldServicesSkills.length > 0 || resumeData.skills.length > 0 || resumeData.equipment.length > 0) && (
              <div className="mb-8">
                <h2 className={sectionTitleClass}>Skills & Equipment</h2>

                {(resumeData.fieldServicesSkills.length > 0 || resumeData.skills.length > 0) && (
                  <div className="mb-3">
                    <span className="font-bold text-slate-800 mr-2">Skills:</span>
                    <span className="text-slate-700 leading-relaxed">
                      {[...resumeData.fieldServicesSkills, ...resumeData.skills].join(' • ')}
                    </span>
                  </div>
                )}

                {resumeData.equipment.length > 0 && (
                  <div>
                    <span className="font-bold text-slate-800 mr-2">Equipment:</span>
                    <span className="text-slate-700 leading-relaxed">
                      {resumeData.equipment.join(', ')}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Coverage & Logistics */}
            {(resumeData.coverage.hasReliableVehicle || resumeData.coverage.radius > 0) && (
              <div className="mb-8">
                <h2 className={sectionTitleClass}>Logistics & Coverage</h2>
                <div className="text-slate-700 grid md:grid-cols-2 gap-4">
                  {resumeData.coverage.hasReliableVehicle && (
                    <div>
                      <span className="font-bold mr-1">Vehicle:</span>
                      Reliable Personal Vehicle ({resumeData.coverage.vehicleType || 'Standard'})
                    </div>
                  )}
                  {resumeData.coverage.radius > 0 && (
                    <div>
                      <span className="font-bold mr-1">Coverage Radius:</span>
                      {resumeData.coverage.radius} miles from home base
                    </div>
                  )}
                  {resumeData.coverage.counties.length > 0 && (
                    <div className="md:col-span-2">
                      <span className="font-bold mr-1">Counties:</span>
                      {resumeData.coverage.counties.join(', ')}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Experience */}
            {resumeData.experience.length > 0 && (
              <div className="mb-8">
                <h2 className={sectionTitleClass}>Professional Experience</h2>
                <div className="space-y-6">
                  {resumeData.experience.map(exp => (
                    <div key={exp.id}>
                      <div className="flex justify-between items-baseline mb-1">
                        <h3 className="text-lg font-bold text-slate-900">{exp.company}</h3>
                        <span className="text-sm font-medium text-slate-500 whitespace-nowrap ml-4">
                          {exp.startDate} - {exp.current ? 'Present' : exp.endDate}
                        </span>
                      </div>
                      <div className="flex justify-between items-center mb-2 italic text-slate-600">
                        <span>{exp.title}</span>
                        <span className="text-sm">{exp.location}</span>
                      </div>

                      {exp.bullets && exp.bullets.length > 0 ? (
                        <ul className="list-disc leading-relaxed text-slate-700 ml-4 space-y-1">
                          {exp.bullets.map((bullet, i) => (
                            bullet && <li key={i} className="pl-1">{bullet}</li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-slate-700 leading-relaxed">{exp.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Education */}
            {resumeData.education.length > 0 && (
              <div className="mb-8">
                <h2 className={sectionTitleClass}>Education</h2>
                <div className="space-y-4">
                  {resumeData.education.map(edu => (
                    <div key={edu.id}>
                      <div className="flex justify-between items-baseline">
                        <h3 className="font-bold text-slate-900">{edu.school}</h3>
                        <span className="text-sm text-slate-500">{edu.graduationDate}</span>
                      </div>
                      <div className="text-slate-700 italic">
                        {edu.degree} {edu.field && `in ${edu.field}`}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Certifications */}
            {resumeData.certifications.length > 0 && (
              <div className="mb-8">
                <h2 className={sectionTitleClass}>Certifications</h2>
                <div className="space-y-3">
                  {resumeData.certifications.map(cert => (
                    <div key={cert.id} className="flex justify-between items-baseline">
                      <div>
                        <span className="font-bold text-slate-900">{cert.name}</span>
                        {cert.issuer && <span className="text-slate-600 ml-2 text-sm">- {cert.issuer}</span>}
                      </div>
                      <span className="text-sm text-slate-500">{cert.date}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

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
              </p>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleExport}
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
  };

  // ============================================================================
  // MAIN RENDER
  // ============================================================================

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Reset Confirmation Modal */}
      {showResetConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md mx-4 shadow-xl">
            <h3 className="text-lg font-bold text-slate-900 mb-2">Reset All Data?</h3>
            <p className="text-slate-600 mb-6">
              This will clear all saved resume data and start fresh. This action cannot be undone.
            </p>
            <div className="flex items-center gap-3 justify-end">
              <button
                onClick={() => setShowResetConfirm(false)}
                className="px-4 py-2 text-slate-600 hover:text-slate-900 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={resetAllData}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white font-medium rounded-lg transition flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Reset All Data
              </button>
            </div>
          </div>
        </div>
      )}

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

              {/* Reset Button */}
              <button
                onClick={() => setShowResetConfirm(true)}
                className="px-3 py-2 text-slate-500 hover:text-red-600 hover:bg-red-50 font-medium rounded-lg transition flex items-center gap-2"
                title="Reset all data"
              >
                <RotateCcw className="w-4 h-4" />
                <span className="hidden sm:inline">Reset</span>
              </button>

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
        {renderStepIndicator()}

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
                onClick={handleExport}
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