import React, { useState, useEffect } from 'react';
import Head from 'next/head';

// SVG Icon Components (replacing lucide-react)
const BookOpenIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
  </svg>
);

const VideoIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
  </svg>
);

const HeadphonesIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
  </svg>
);

const FileTextIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

const CodeIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
  </svg>
);

const CheckCircleIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const CircleIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="10" strokeWidth={2} />
  </svg>
);

const TrophyIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
  </svg>
);

const AwardIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
  </svg>
);

const StarIcon = () => (
  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
  </svg>
);

const ChevronRightIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
  </svg>
);

const PlayCircleIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const LightbulbIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
  </svg>
);

const TargetIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm0-14c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6zm0 10c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4z" />
  </svg>
);

const BrainIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
  </svg>
);

const ClipboardCheckIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
  </svg>
);

const RefreshCwIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
  </svg>
);

const AlertCircleIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

// Types
type Role = 'Notary' | 'Existing Inspector' | 'Gig Worker' | 'Realtor';
type ExperienceLevel = 'Beginner' | 'Novice' | 'Veteran' | 'Technically Advanced';
type ContentType = 'video' | 'audio' | 'reading' | 'interactive' | 'quiz';

interface LearningModule {
  id: string;
  title: string;
  description: string;
  contentType: ContentType;
  duration: string;
  content: {
    type: ContentType;
    url?: string;
    text?: string;
    embedId?: string;
  };
  quiz?: QuizQuestion[];
  completed: boolean;
}

interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

interface TrainingTrack {
  role: Role;
  experienceLevel: ExperienceLevel;
  modules: LearningModule[];
  certificationRequired: boolean;
}

// Mock Training Data
const trainingData: Record<Role, Record<ExperienceLevel, LearningModule[]>> = {
  'Notary': {
    'Beginner': [
      {
        id: 'notary-beginner-1',
        title: 'Introduction to Property Inspections',
        description: 'Learn the basics of property inspection and your role as a notary in the process.',
        contentType: 'video',
        duration: '15 min',
        content: {
          type: 'video',
          embedId: 'dQw4w9WgXcQ',
        },
        completed: false,
      },
      {
        id: 'notary-beginner-2',
        title: 'Documentation Fundamentals',
        description: 'Understanding essential documents and proper notarization procedures.',
        contentType: 'reading',
        duration: '20 min',
        content: {
          type: 'reading',
          text: `# Documentation Fundamentals for Notaries

## Essential Documents in Property Inspection

As a notary working with property inspections, you&apos;ll encounter several key documents:

### 1. Inspection Reports
- Detailed findings from property inspectors
- Structural assessments
- Safety compliance documentation

### 2. Verification Forms
- Identity verification documents
- Property ownership records
- Authorization forms

### 3. Certification Documents
- Inspector certifications
- Compliance certificates
- Completion certificates

## Best Practices

- Always verify the identity of all parties
- Ensure documents are complete before notarization
- Maintain detailed records of all notarizations
- Follow state-specific regulations

Remember: Your role is crucial in maintaining the integrity of the inspection process.`,
        },
        completed: false,
      },
      {
        id: 'notary-beginner-3',
        title: 'Legal Requirements Overview',
        description: 'Audio lesson on legal obligations and compliance standards.',
        contentType: 'audio',
        duration: '12 min',
        content: {
          type: 'audio',
          url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
        },
        completed: false,
      },
      {
        id: 'notary-beginner-4',
        title: 'Knowledge Check: Notary Basics',
        description: 'Test your understanding of fundamental notary concepts.',
        contentType: 'quiz',
        duration: '10 min',
        content: {
          type: 'quiz',
        },
        quiz: [
          {
            question: 'What is the primary role of a notary in property inspections?',
            options: [
              'To perform the physical inspection',
              'To verify and authenticate documents',
              'To determine property value',
              'To negotiate sale prices',
            ],
            correctAnswer: 1,
            explanation: 'Notaries verify and authenticate documents, ensuring the integrity of the inspection process.',
          },
          {
            question: 'Which document requires notarization in a typical property inspection?',
            options: [
              'Marketing brochure',
              'Inspector&apos;s personal notes',
              'Verification and certification forms',
              'Buyer&apos;s wish list',
            ],
            correctAnswer: 2,
            explanation: 'Verification and certification forms require notarization to ensure legal validity.',
          },
          {
            question: 'Before notarizing a document, you must:',
            options: [
              'Check the weather forecast',
              'Verify the identity of all signers',
              'Consult with the property owner',
              'Review property tax records',
            ],
            correctAnswer: 1,
            explanation: 'Identity verification is a fundamental requirement before any notarization.',
          },
        ],
        completed: false,
      },
    ],
    'Novice': [
      {
        id: 'notary-novice-1',
        title: 'Advanced Document Authentication',
        description: 'Deep dive into complex notarization scenarios.',
        contentType: 'video',
        duration: '25 min',
        content: {
          type: 'video',
          embedId: 'jNQXAC9IVRw',
        },
        completed: false,
      },
      {
        id: 'notary-novice-2',
        title: 'Digital Notarization Tools',
        description: 'Learn to use modern e-notarization platforms.',
        contentType: 'interactive',
        duration: '30 min',
        content: {
          type: 'interactive',
          text: 'Interactive simulation of digital notarization workflow.',
        },
        completed: false,
      },
    ],
    'Veteran': [
      {
        id: 'notary-veteran-1',
        title: 'Complex Transaction Handling',
        description: 'Managing multi-party transactions and special cases.',
        contentType: 'video',
        duration: '35 min',
        content: {
          type: 'video',
          embedId: 'M7lc1UVf-VE',
        },
        completed: false,
      },
    ],
    'Technically Advanced': [
      {
        id: 'notary-advanced-1',
        title: 'Blockchain & Smart Contract Notarization',
        description: 'Future of notarization in decentralized systems.',
        contentType: 'video',
        duration: '40 min',
        content: {
          type: 'video',
          embedId: 'SSo_EIwHSd4',
        },
        completed: false,
      },
    ],
  },
  'Existing Inspector': {
    'Beginner': [
      {
        id: 'inspector-beginner-1',
        title: 'Nested Objects Platform Overview',
        description: 'Introduction to our inspection management system.',
        contentType: 'video',
        duration: '18 min',
        content: {
          type: 'video',
          embedId: 'dQw4w9WgXcQ',
        },
        completed: false,
      },
      {
        id: 'inspector-beginner-2',
        title: 'Inspection Workflow Best Practices',
        description: 'Optimize your inspection process with our tools.',
        contentType: 'reading',
        duration: '25 min',
        content: {
          type: 'reading',
          text: `# Inspection Workflow Best Practices

## Streamlining Your Process

### Pre-Inspection Phase
1. **Schedule Confirmation**
   - Verify appointment details
   - Confirm access arrangements
   - Prepare necessary equipment

2. **Documentation Review**
   - Review property history
   - Check previous inspection reports
   - Note special requirements

### During Inspection
1. **Systematic Approach**
   - Follow a consistent pattern
   - Document findings in real-time
   - Take comprehensive photos

2. **Safety First**
   - Identify hazards immediately
   - Use proper protective equipment
   - Follow safety protocols

### Post-Inspection
1. **Report Generation**
   - Complete reports within 24 hours
   - Include all required documentation
   - Provide clear recommendations

2. **Client Communication**
   - Schedule follow-up calls
   - Answer questions promptly
   - Maintain professional relationships`,
        },
        completed: false,
      },
      {
        id: 'inspector-beginner-3',
        title: 'Mobile App Training',
        description: 'Hands-on guide to using the Nested Objects mobile app.',
        contentType: 'interactive',
        duration: '20 min',
        content: {
          type: 'interactive',
          text: 'Interactive mobile app simulation.',
        },
        completed: false,
      },
    ],
    'Novice': [
      {
        id: 'inspector-novice-1',
        title: 'Advanced Reporting Techniques',
        description: 'Creating comprehensive, professional inspection reports.',
        contentType: 'video',
        duration: '30 min',
        content: {
          type: 'video',
          embedId: 'jNQXAC9IVRw',
        },
        completed: false,
      },
    ],
    'Veteran': [
      {
        id: 'inspector-veteran-1',
        title: 'Specialty Inspections Masterclass',
        description: 'Commercial properties, multi-unit dwellings, and unique structures.',
        contentType: 'video',
        duration: '45 min',
        content: {
          type: 'video',
          embedId: 'M7lc1UVf-VE',
        },
        completed: false,
      },
    ],
    'Technically Advanced': [
      {
        id: 'inspector-advanced-1',
        title: 'AI-Assisted Inspection Technology',
        description: 'Leveraging machine learning for enhanced inspections.',
        contentType: 'video',
        duration: '50 min',
        content: {
          type: 'video',
          embedId: 'SSo_EIwHSd4',
        },
        completed: false,
      },
    ],
  },
  'Gig Worker': {
    'Beginner': [
      {
        id: 'gig-beginner-1',
        title: 'Getting Started as an Inspection Assistant',
        description: 'Your first steps in the property inspection industry.',
        contentType: 'video',
        duration: '15 min',
        content: {
          type: 'video',
          embedId: 'dQw4w9WgXcQ',
        },
        completed: false,
      },
      {
        id: 'gig-beginner-2',
        title: 'Task Assignment & Job Acceptance',
        description: 'How to find and accept inspection jobs on the platform.',
        contentType: 'reading',
        duration: '10 min',
        content: {
          type: 'reading',
          text: `# Task Assignment & Job Acceptance

## Finding Available Jobs

### Dashboard Overview
- Check the "Available Jobs" section daily
- Filter by location, pay rate, and requirements
- Review job details before accepting

### Job Types
1. **Photo Documentation**
   - Exterior property photos
   - Specific feature documentation
   - Before/after comparisons

2. **Basic Measurements**
   - Room dimensions
   - Property boundaries
   - Feature measurements

3. **Condition Reports**
   - Visual damage assessment
   - Maintenance issue identification
   - Safety hazard reporting

## Acceptance Process
1. Review job requirements carefully
2. Confirm you have necessary equipment
3. Check availability for scheduled time
4. Accept job through mobile app
5. Receive confirmation and instructions

## Best Practices
- Accept jobs you can complete on time
- Communicate any issues immediately
- Follow instructions precisely
- Submit work promptly for payment`,
        },
        completed: false,
      },
      {
        id: 'gig-beginner-3',
        title: 'Photography Basics for Inspections',
        description: 'Essential photography skills for documentation.',
        contentType: 'video',
        duration: '20 min',
        content: {
          type: 'video',
          embedId: 'jNQXAC9IVRw',
        },
        completed: false,
      },
      {
        id: 'gig-beginner-4',
        title: 'Safety & Professionalism',
        description: 'Conducting yourself professionally on inspection sites.',
        contentType: 'audio',
        duration: '15 min',
        content: {
          type: 'audio',
          url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
        },
        completed: false,
      },
    ],
    'Novice': [
      {
        id: 'gig-novice-1',
        title: 'Advanced Documentation Techniques',
        description: 'Improving quality and efficiency of your submissions.',
        contentType: 'video',
        duration: '25 min',
        content: {
          type: 'video',
          embedId: 'M7lc1UVf-VE',
        },
        completed: false,
      },
    ],
    'Veteran': [
      {
        id: 'gig-veteran-1',
        title: 'Building Your Inspection Career',
        description: 'Transitioning from gig work to full-time inspector.',
        contentType: 'reading',
        duration: '30 min',
        content: {
          type: 'reading',
          text: `# Building Your Inspection Career

## Career Progression Path

### From Gig Worker to Professional Inspector

Your experience as a gig worker provides valuable foundation for a full-time inspection career.

### Skills Development
- Advanced technical knowledge
- Report writing proficiency
- Client communication
- Business management

### Certification Path
1. Complete required training hours
2. Pass certification examinations
3. Obtain necessary licenses
4. Build professional network

### Business Planning
- Develop business plan
- Secure financing if needed
- Invest in professional equipment
- Create marketing strategy

Your gig work experience demonstrates your commitment and provides practical skills that will serve you well in your inspection career.`,
        },
        completed: false,
      },
    ],
    'Technically Advanced': [
      {
        id: 'gig-advanced-1',
        title: 'Drone & Thermal Imaging Certification',
        description: 'Specialized skills for high-value inspections.',
        contentType: 'video',
        duration: '40 min',
        content: {
          type: 'video',
          embedId: 'SSo_EIwHSd4',
        },
        completed: false,
      },
    ],
  },
  'Realtor': {
    'Beginner': [
      {
        id: 'realtor-beginner-1',
        title: 'Understanding Property Inspections',
        description: 'What realtors need to know about the inspection process.',
        contentType: 'video',
        duration: '20 min',
        content: {
          type: 'video',
          embedId: 'dQw4w9WgXcQ',
        },
        completed: false,
      },
      {
        id: 'realtor-beginner-2',
        title: 'Scheduling & Coordinating Inspections',
        description: 'Best practices for smooth inspection scheduling.',
        contentType: 'reading',
        duration: '15 min',
        content: {
          type: 'reading',
          text: `# Scheduling & Coordinating Inspections

## The Realtor&apos;s Role

### Pre-Inspection Coordination

1. **Timeline Management**
   - Schedule inspections during due diligence period
   - Allow adequate time for report review
   - Coordinate with all parties

2. **Access Arrangements**
   - Ensure property access for inspector
   - Coordinate with current occupants
   - Provide necessary codes/keys

### During Inspection

- Make yourself available for questions
- Allow inspector to work independently
- Document any immediate concerns

### Post-Inspection

1. **Report Review**
   - Review findings with clients
   - Explain technical terms
   - Discuss negotiation options

2. **Follow-Up Actions**
   - Request repairs if needed
   - Schedule re-inspections
   - Document all agreements

## Communication Tips

- Keep all parties informed
- Set realistic expectations
- Maintain professional relationships
- Document all communications`,
        },
        completed: false,
      },
      {
        id: 'realtor-beginner-3',
        title: 'Reading Inspection Reports',
        description: 'How to interpret and explain inspection findings.',
        contentType: 'interactive',
        duration: '25 min',
        content: {
          type: 'interactive',
          text: 'Interactive inspection report walkthrough.',
        },
        completed: false,
      },
    ],
    'Novice': [
      {
        id: 'realtor-novice-1',
        title: 'Navigating Inspection Negotiations',
        description: 'Using inspection results in transaction negotiations.',
        contentType: 'video',
        duration: '30 min',
        content: {
          type: 'video',
          embedId: 'jNQXAC9IVRw',
        },
        completed: false,
      },
    ],
    'Veteran': [
      {
        id: 'realtor-veteran-1',
        title: 'Managing Complex Inspection Scenarios',
        description: 'Handling multi-property and commercial inspections.',
        contentType: 'video',
        duration: '35 min',
        content: {
          type: 'video',
          embedId: 'M7lc1UVf-VE',
        },
        completed: false,
      },
    ],
    'Technically Advanced': [
      {
        id: 'realtor-advanced-1',
        title: 'Predictive Analytics in Property Assessment',
        description: 'Using data to anticipate inspection issues.',
        contentType: 'video',
        duration: '45 min',
        content: {
          type: 'video',
          embedId: 'SSo_EIwHSd4',
        },
        completed: false,
      },
    ],
  },
};

// AI Avatar responses based on performance
const avatarResponses = {
  excellent: [
    "Outstanding work! You&apos;ve demonstrated exceptional understanding of the material. 🌟",
    "Perfect score! Your mastery of this topic is impressive. Keep up the excellent work! 🎯",
    "Exceptional performance! You&apos;re well on your way to becoming an expert. 🏆",
  ],
  good: [
    "Great job! You&apos;ve got a solid grasp of the concepts. A bit more practice and you&apos;ll be perfect! 👍",
    "Well done! Your understanding is strong. Review the areas you missed for even better results. ✨",
    "Nice work! You&apos;re making excellent progress. Keep studying! 📚",
  ],
  needsImprovement: [
    "You&apos;re on the right track, but let&apos;s review some key concepts. Don&apos;t give up! 💪",
    "This is a learning opportunity. Review the material and try again - you&apos;ve got this! 🎓",
    "Let&apos;s work on strengthening your understanding. Consider revisiting the training material. 📖",
  ],
};

export default function TrainingPortal() {
  const [selectedRole, setSelectedRole] = useState<Role>('Notary');
  const [experienceLevel, setExperienceLevel] = useState<ExperienceLevel>('Beginner');
  const [currentModuleId, setCurrentModuleId] = useState<string>('');
  const [moduleProgress, setModuleProgress] = useState<Record<string, boolean>>({});
  const [quizAnswers, setQuizAnswers] = useState<Record<string, number>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizScore, setQuizScore] = useState(0);
  const [showAvatarFeedback, setShowAvatarFeedback] = useState(false);

  const currentModules = trainingData[selectedRole][experienceLevel];
  const currentModule = currentModules.find(m => m.id === currentModuleId);

  const totalModules = currentModules.length;
  const completedModules = Object.values(moduleProgress).filter(Boolean).length;
  const progressPercentage = totalModules > 0 ? (completedModules / totalModules) * 100 : 0;

  // Load first module when role/level changes
  useEffect(() => {
    if (currentModules.length > 0 && !currentModuleId) {
      setCurrentModuleId(currentModules[0].id);
    }
  }, [selectedRole, experienceLevel, currentModules, currentModuleId]);

  const handleModuleComplete = (moduleId: string) => {
    setModuleProgress(prev => ({ ...prev, [moduleId]: true }));
    
    // Auto-advance to next module
    const currentIndex = currentModules.findIndex(m => m.id === moduleId);
    if (currentIndex < currentModules.length - 1) {
      setTimeout(() => {
        setCurrentModuleId(currentModules[currentIndex + 1].id);
      }, 1000);
    }
  };

  const handleQuizSubmit = () => {
    if (!currentModule?.quiz) return;

    let correct = 0;
    currentModule.quiz.forEach((q, idx) => {
      if (quizAnswers[idx] === q.correctAnswer) {
        correct++;
      }
    });

    const score = (correct / currentModule.quiz.length) * 100;
    setQuizScore(score);
    setQuizSubmitted(true);
    setShowAvatarFeedback(true);

    if (score >= 70) {
      handleModuleComplete(currentModule.id);
    }
  };

  const resetQuiz = () => {
    setQuizAnswers({});
    setQuizSubmitted(false);
    setQuizScore(0);
    setShowAvatarFeedback(false);
  };

  const getAvatarResponse = (score: number): string => {
    if (score >= 90) return avatarResponses.excellent[Math.floor(Math.random() * avatarResponses.excellent.length)];
    if (score >= 70) return avatarResponses.good[Math.floor(Math.random() * avatarResponses.good.length)];
    return avatarResponses.needsImprovement[Math.floor(Math.random() * avatarResponses.needsImprovement.length)];
  };

  const renderModuleContent = () => {
    if (!currentModule) return null;

    switch (currentModule.contentType) {
      case 'video':
        return (
          <div className="space-y-4">
            <div className="aspect-video bg-gray-900 rounded-lg overflow-hidden">
              {currentModule.content.embedId ? (
                <iframe
                  width="100%"
                  height="100%"
                  src={`https://www.youtube.com/embed/${currentModule.content.embedId}`}
                  title={currentModule.title}
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                ></iframe>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400">
                  <PlayCircleIcon />
                  <span className="ml-2">Video Player</span>
                </div>
              )}
            </div>
            <button
              onClick={() => handleModuleComplete(currentModule.id)}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
            >
              Mark as Complete
            </button>
          </div>
        );

      case 'audio':
        return (
          <div className="space-y-4">
            <div className="bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg p-8 text-white">
              <div className="flex items-center justify-center mb-4">
                <HeadphonesIcon />
              </div>
              <h3 className="text-xl font-semibold text-center mb-4">{currentModule.title}</h3>
              {currentModule.content.url && (
                <audio controls className="w-full">
                  <source src={currentModule.content.url} type="audio/mpeg" />
                  Your browser does not support the audio element.
                </audio>
              )}
            </div>
            <button
              onClick={() => handleModuleComplete(currentModule.id)}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
            >
              Mark as Complete
            </button>
          </div>
        );

      case 'reading':
        return (
          <div className="space-y-4">
            <div className="bg-white rounded-lg p-8 prose max-w-none">
              <div className="whitespace-pre-wrap">{currentModule.content.text}</div>
            </div>
            <button
              onClick={() => handleModuleComplete(currentModule.id)}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
            >
              Mark as Complete
            </button>
          </div>
        );

      case 'interactive':
        return (
          <div className="space-y-4">
            <div className="bg-gradient-to-br from-green-400 to-blue-500 rounded-lg p-12 text-white text-center">
              <CodeIcon />
              <h3 className="text-2xl font-bold mb-4">Interactive Demo</h3>
              <p className="text-lg mb-6">{currentModule.content.text}</p>
              <div className="bg-white/10 backdrop-blur rounded-lg p-6 mb-4">
                <p className="text-sm">🎮 Interactive simulation would load here</p>
                <p className="text-xs mt-2">Click through the workflow steps to learn</p>
              </div>
            </div>
            <button
              onClick={() => handleModuleComplete(currentModule.id)}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
            >
              Mark as Complete
            </button>
          </div>
        );

      case 'quiz':
        return (
          <div className="space-y-6">
            {!quizSubmitted ? (
              <>
                {currentModule.quiz?.map((question, qIdx) => (
                  <div key={qIdx} className="bg-white rounded-lg p-6 shadow-md">
                    <h4 className="font-semibold text-lg mb-4">
                      {qIdx + 1}. {question.question}
                    </h4>
                    <div className="space-y-2">
                      {question.options.map((option, oIdx) => (
                        <label
                          key={oIdx}
                          className={`flex items-center p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                            quizAnswers[qIdx] === oIdx
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <input
                            type="radio"
                            name={`question-${qIdx}`}
                            value={oIdx}
                            checked={quizAnswers[qIdx] === oIdx}
                            onChange={() =>
                              setQuizAnswers(prev => ({ ...prev, [qIdx]: oIdx }))
                            }
                            className="mr-3"
                          />
                          <span>{option}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
                <button
                  onClick={handleQuizSubmit}
                  disabled={Object.keys(quizAnswers).length !== currentModule.quiz?.length}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg font-semibold transition-colors"
                >
                  Submit Quiz
                </button>
              </>
            ) : (
              <div className="space-y-6">
                <div className={`rounded-lg p-6 ${quizScore >= 70 ? 'bg-green-50 border-2 border-green-500' : 'bg-red-50 border-2 border-red-500'}`}>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold">Quiz Results</h3>
                    <span className="text-3xl font-bold">{quizScore.toFixed(0)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-4 mb-4">
                    <div
                      className={`h-4 rounded-full transition-all ${quizScore >= 70 ? 'bg-green-500' : 'bg-red-500'}`}
                      style={{ width: `${quizScore}%` }}
                    ></div>
                  </div>
                  <p className="text-sm">
                    {quizScore >= 70
                      ? '✅ Congratulations! You passed this module.'
                      : '❌ You need 70% to pass. Review the material and try again.'}
                  </p>
                </div>

                {showAvatarFeedback && (
                  <div className="bg-gradient-to-r from-purple-500 to-indigo-600 rounded-lg p-6 text-white">
                    <div className="flex items-start space-x-4">
                      <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-3xl flex-shrink-0">
                        🤖
                      </div>
                      <div>
                        <h4 className="font-semibold mb-2">AI Learning Coach</h4>
                        <p className="text-sm">{getAvatarResponse(quizScore)}</p>
                      </div>
                    </div>
                  </div>
                )}

                {currentModule.quiz?.map((question, qIdx) => (
                  <div key={qIdx} className="bg-white rounded-lg p-6 shadow-md">
                    <h4 className="font-semibold text-lg mb-4">
                      {qIdx + 1}. {question.question}
                    </h4>
                    <div className="space-y-2 mb-4">
                      {question.options.map((option, oIdx) => {
                        const isCorrect = oIdx === question.correctAnswer;
                        const isSelected = quizAnswers[qIdx] === oIdx;
                        return (
                          <div
                            key={oIdx}
                            className={`flex items-center p-3 rounded-lg border-2 ${
                              isCorrect
                                ? 'border-green-500 bg-green-50'
                                : isSelected
                                ? 'border-red-500 bg-red-50'
                                : 'border-gray-200'
                            }`}
                          >
                            {isCorrect && <CheckCircleIcon />}
                            {isSelected && !isCorrect && <AlertCircleIcon />}
                            <span className="ml-2">{option}</span>
                          </div>
                        );
                      })}
                    </div>
                    <div className="bg-blue-50 border-l-4 border-blue-500 p-4">
                      <p className="text-sm">
                        <strong>Explanation:</strong> {question.explanation}
                      </p>
                    </div>
                  </div>
                ))}

                <button
                  onClick={resetQuiz}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors flex items-center justify-center"
                >
                  <RefreshCwIcon />
                  <span className="ml-2">Retake Quiz</span>
                </button>
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  const getModuleIcon = (type: ContentType) => {
    switch (type) {
      case 'video':
        return <VideoIcon />;
      case 'audio':
        return <HeadphonesIcon />;
      case 'reading':
        return <FileTextIcon />;
      case 'interactive':
        return <CodeIcon />;
      case 'quiz':
        return <ClipboardCheckIcon />;
      default:
        return <BookOpenIcon />;
    }
  };

  return (
    <>
      <Head>
        <title>Training Portal - Nested Objects</title>
        <meta name="description" content="Dynamic training portal for property inspection professionals" />
      </Head>

      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Nested Objects Training Portal</h1>
                <p className="text-sm text-gray-600 mt-1">
                  Personalized learning for {selectedRole} - {experienceLevel} Level
                </p>
              </div>
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-700">Progress</p>
                  <p className="text-2xl font-bold text-blue-600">{progressPercentage.toFixed(0)}%</p>
                </div>
                <div className="w-20 h-20">
                  <svg className="transform -rotate-90" viewBox="0 0 100 100">
                    <circle
                      cx="50"
                      cy="50"
                      r="45"
                      fill="none"
                      stroke="#e5e7eb"
                      strokeWidth="10"
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r="45"
                      fill="none"
                      stroke="#3b82f6"
                      strokeWidth="10"
                      strokeDasharray={`${progressPercentage * 2.827} 282.7`}
                      strokeLinecap="round"
                    />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </header>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-12 gap-6">
            {/* Sidebar */}
            <aside className="col-span-12 lg:col-span-3 space-y-6">
              {/* Role Selection */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="font-semibold text-lg mb-4 flex items-center">
                  <TargetIcon />
                  <span className="ml-2">Select Role</span>
                </h3>
                <div className="space-y-2">
                  {(['Notary', 'Existing Inspector', 'Gig Worker', 'Realtor'] as Role[]).map(role => (
                    <button
                      key={role}
                      onClick={() => {
                        setSelectedRole(role);
                        setCurrentModuleId('');
                        setModuleProgress({});
                      }}
                      className={`w-full text-left px-4 py-3 rounded-lg font-medium transition-colors ${
                        selectedRole === role
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                      }`}
                    >
                      {role}
                    </button>
                  ))}
                </div>
              </div>

              {/* Experience Level */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="font-semibold text-lg mb-4 flex items-center">
                  <BrainIcon />
                  <span className="ml-2">Experience Level</span>
                </h3>
                <div className="space-y-2">
                  {(['Beginner', 'Novice', 'Veteran', 'Technically Advanced'] as ExperienceLevel[]).map(level => (
                    <button
                      key={level}
                      onClick={() => {
                        setExperienceLevel(level);
                        setCurrentModuleId('');
                        setModuleProgress({});
                      }}
                      className={`w-full text-left px-4 py-3 rounded-lg font-medium transition-colors text-sm ${
                        experienceLevel === level
                          ? 'bg-green-600 text-white'
                          : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                      }`}
                    >
                      {level}
                    </button>
                  ))}
                </div>
              </div>

              {/* Module Checklist */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="font-semibold text-lg mb-4 flex items-center">
                  <ClipboardCheckIcon />
                  <span className="ml-2">Modules</span>
                </h3>
                <div className="space-y-2">
                  {currentModules.map(module => (
                    <button
                      key={module.id}
                      onClick={() => {
                        setCurrentModuleId(module.id);
                        setQuizSubmitted(false);
                        setQuizAnswers({});
                        setShowAvatarFeedback(false);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-lg transition-colors flex items-center text-sm ${
                        currentModuleId === module.id
                          ? 'bg-blue-50 border-2 border-blue-500'
                          : 'bg-gray-50 hover:bg-gray-100'
                      }`}
                    >
                      <span className="mr-2">
                        {moduleProgress[module.id] ? (
                          <CheckCircleIcon />
                        ) : (
                          <CircleIcon />
                        )}
                      </span>
                      <span className="flex-1 truncate">{module.title}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Stats */}
              <div className="bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg shadow-md p-6 text-white">
                <h3 className="font-semibold text-lg mb-4 flex items-center">
                  <TrophyIcon />
                  <span className="ml-2">Your Stats</span>
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Modules Completed</span>
                    <span className="font-bold text-xl">{completedModules}/{totalModules}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Achievements</span>
                    <span className="font-bold text-xl">{completedModules >= 3 ? '🏆' : '🎯'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Streak</span>
                    <span className="font-bold text-xl flex items-center">
                      <StarIcon />
                      <span className="ml-1">5 days</span>
                    </span>
                  </div>
                </div>
              </div>
            </aside>

            {/* Main Content */}
            <main className="col-span-12 lg:col-span-9">
              {currentModule ? (
                <div className="bg-white rounded-lg shadow-md overflow-hidden">
                  {/* Module Header */}
                  <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center mb-2">
                          {getModuleIcon(currentModule.contentType)}
                          <span className="ml-2 text-sm font-medium uppercase tracking-wide opacity-90">
                            {currentModule.contentType}
                          </span>
                        </div>
                        <h2 className="text-2xl font-bold mb-2">{currentModule.title}</h2>
                        <p className="text-blue-100">{currentModule.description}</p>
                      </div>
                      <div className="ml-4 text-right">
                        <div className="bg-white/20 backdrop-blur rounded-lg px-4 py-2">
                          <LightbulbIcon />
                          <p className="text-sm font-medium mt-1">{currentModule.duration}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Module Content */}
                  <div className="p-6">{renderModuleContent()}</div>

                  {/* Module Navigation */}
                  <div className="border-t bg-gray-50 px-6 py-4 flex justify-between items-center">
                    <button
                      onClick={() => {
                        const currentIndex = currentModules.findIndex(m => m.id === currentModuleId);
                        if (currentIndex > 0) {
                          setCurrentModuleId(currentModules[currentIndex - 1].id);
                          setQuizSubmitted(false);
                          setQuizAnswers({});
                        }
                      }}
                      disabled={currentModules.findIndex(m => m.id === currentModuleId) === 0}
                      className="px-6 py-2 bg-gray-200 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-medium transition-colors"
                    >
                      ← Previous
                    </button>
                    <span className="text-sm text-gray-600">
                      Module {currentModules.findIndex(m => m.id === currentModuleId) + 1} of {totalModules}
                    </span>
                    <button
                      onClick={() => {
                        const currentIndex = currentModules.findIndex(m => m.id === currentModuleId);
                        if (currentIndex < currentModules.length - 1) {
                          setCurrentModuleId(currentModules[currentIndex + 1].id);
                          setQuizSubmitted(false);
                          setQuizAnswers({});
                        }
                      }}
                      disabled={
                        currentModules.findIndex(m => m.id === currentModuleId) ===
                        currentModules.length - 1
                      }
                      className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors flex items-center"
                    >
                      Next
                      <ChevronRightIcon />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-lg shadow-md p-12 text-center">
                  <BookOpenIcon />
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome to Your Training Portal</h2>
                  <p className="text-gray-600 mb-6">
                    Select a role and experience level to begin your personalized learning journey.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-6 border-2 border-blue-200">
                      <AwardIcon />
                      <h3 className="font-semibold text-lg mt-2 mb-1">Adaptive Learning</h3>
                      <p className="text-sm text-gray-600">
                        Curriculum adjusts based on your performance and progress
                      </p>
                    </div>
                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-6 border-2 border-green-200">
                      <TrophyIcon />
                      <h3 className="font-semibold text-lg mt-2 mb-1">Track Progress</h3>
                      <p className="text-sm text-gray-600">
                        Earn achievements and certifications as you complete modules
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Completion Badge */}
              {progressPercentage === 100 && (
                <div className="mt-6 bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 rounded-lg shadow-lg p-8 text-white text-center">
                  <div className="text-6xl mb-4">🎉</div>
                  <h2 className="text-3xl font-bold mb-2">Congratulations!</h2>
                  <p className="text-xl mb-4">
                    You&apos;ve completed all modules for {selectedRole} - {experienceLevel}
                  </p>
                  <div className="flex justify-center space-x-2 text-4xl">
                    <TrophyIcon />
                    <AwardIcon />
                    <StarIcon />
                  </div>
                </div>
              )}
            </main>
          </div>
        </div>
      </div>
    </>
  );
}
