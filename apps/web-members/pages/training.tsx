import React, { useState, useEffect } from 'react';
import Head from 'next/head';

// Types
type Role = 'Notary' | 'Existing Inspector' | 'Gig Worker' | 'Realtor';
type ExperienceLevel = 'Beginner' | 'Novice' | 'Veteran' | 'Technically Advanced';

interface Module {
  id: string;
  title: string;
  description: string;
  type: 'video' | 'audio' | 'quiz' | 'interactive' | 'reading';
  content: {
    videoUrl?: string;
    audioUrl?: string;
    youtubeId?: string;
    text?: string;
    infographic?: string;
  };
  duration: number; // in minutes
  completed: boolean;
  score?: number;
}

interface Quiz {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

interface TrainingTrack {
  role: Role;
  experienceLevel: ExperienceLevel;
  modules: Module[];
  quizzes: Quiz[];
}

// Mock Data
const trainingData: Record<string, Record<string, TrainingTrack>> = {
  Notary: {
    Beginner: {
      role: 'Notary',
      experienceLevel: 'Beginner',
      modules: [
        {
          id: 'n-b-1',
          title: 'Introduction to Nested Objects Platform',
          description: 'Learn the basics of the Nested Objects platform and how notaries fit into the property inspection ecosystem.',
          type: 'video',
          content: {
            youtubeId: 'dQw4w9WgXcQ',
            text: 'Welcome to Nested Objects! As a notary, you play a crucial role in verifying and authenticating property inspection documents.'
          },
          duration: 15,
          completed: false
        },
        {
          id: 'n-b-2',
          title: 'Notary Responsibilities & Legal Requirements',
          description: 'Understanding your legal obligations and responsibilities in the property inspection process.',
          type: 'reading',
          content: {
            text: 'As a certified notary working with Nested Objects, you must ensure all documents are properly executed, signed, and sealed according to state regulations.',
            infographic: '/images/notary-workflow.png'
          },
          duration: 20,
          completed: false
        },
        {
          id: 'n-b-3',
          title: 'Document Verification Process',
          description: 'Step-by-step guide to verifying inspection reports and client signatures.',
          type: 'interactive',
          content: {
            text: 'Interactive walkthrough of the document verification workflow in the Nested Objects platform.'
          },
          duration: 25,
          completed: false
        },
        {
          id: 'n-b-4',
          title: 'Platform Navigation Quiz',
          description: 'Test your knowledge of the Nested Objects platform basics.',
          type: 'quiz',
          content: {},
          duration: 10,
          completed: false
        }
      ],
      quizzes: [
        {
          question: 'What is the primary role of a notary in the Nested Objects platform?',
          options: [
            'Conduct property inspections',
            'Verify and authenticate inspection documents',
            'Market properties to buyers',
            'Repair property defects'
          ],
          correctAnswer: 1,
          explanation: 'Notaries verify and authenticate inspection documents to ensure legal compliance and document integrity.'
        },
        {
          question: 'Before notarizing a document, you must:',
          options: [
            'Check the weather forecast',
            'Verify the identity of all signers',
            'Inspect the property yourself',
            'Contact the realtor'
          ],
          correctAnswer: 1,
          explanation: 'Verifying the identity of all signers is a fundamental notary responsibility to prevent fraud.'
        },
        {
          question: 'How long should you retain copies of notarized inspection documents?',
          options: [
            '30 days',
            '6 months',
            '1 year',
            'According to state regulations (typically 5-10 years)'
          ],
          correctAnswer: 3,
          explanation: 'Document retention requirements vary by state, but typically range from 5-10 years for notarized documents.'
        }
      ]
    },
    Veteran: {
      role: 'Notary',
      experienceLevel: 'Veteran',
      modules: [
        {
          id: 'n-v-1',
          title: 'Advanced Document Authentication Techniques',
          description: 'Learn advanced methods for detecting fraud and ensuring document integrity.',
          type: 'video',
          content: {
            youtubeId: 'dQw4w9WgXcQ',
            text: 'Advanced techniques for veteran notaries including digital notarization and fraud detection.'
          },
          duration: 30,
          completed: false
        },
        {
          id: 'n-v-2',
          title: 'Multi-State Compliance & Remote Notarization',
          description: 'Navigate complex multi-state regulations and remote online notarization (RON).',
          type: 'reading',
          content: {
            text: 'Understanding interstate commerce regulations and RON technology requirements.',
            infographic: '/images/ron-compliance.png'
          },
          duration: 25,
          completed: false
        },
        {
          id: 'n-v-3',
          title: 'Integration with Third-Party Systems',
          description: 'Connect Nested Objects with other legal and document management systems.',
          type: 'interactive',
          content: {
            text: 'API integration and workflow automation for experienced notaries.'
          },
          duration: 35,
          completed: false
        }
      ],
      quizzes: [
        {
          question: 'Which technology is required for Remote Online Notarization (RON)?',
          options: [
            'Only a smartphone',
            'Audio-video communication, identity verification, and tamper-evident technology',
            'Just a scanner',
            'Only email capability'
          ],
          correctAnswer: 1,
          explanation: 'RON requires secure audio-video communication, identity verification technology, and tamper-evident electronic seals.'
        }
      ]
    }
  },
  'Existing Inspector': {
    Beginner: {
      role: 'Existing Inspector',
      experienceLevel: 'Beginner',
      modules: [
        {
          id: 'i-b-1',
          title: 'Nested Objects Platform for Inspectors',
          description: 'Introduction to the platform features designed specifically for property inspectors.',
          type: 'video',
          content: {
            youtubeId: 'dQw4w9WgXcQ',
            text: 'Welcome inspectors! Learn how to streamline your workflow with Nested Objects.'
          },
          duration: 20,
          completed: false
        },
        {
          id: 'i-b-2',
          title: 'Creating Your First Inspection Report',
          description: 'Step-by-step guide to creating comprehensive inspection reports in the platform.',
          type: 'interactive',
          content: {
            text: 'Interactive tutorial on using the inspection report builder with templates and auto-population features.'
          },
          duration: 30,
          completed: false
        },
        {
          id: 'i-b-3',
          title: 'Photo Documentation Best Practices',
          description: 'Learn how to capture, organize, and annotate inspection photos effectively.',
          type: 'video',
          content: {
            youtubeId: 'dQw4w9WgXcQ',
            text: 'Professional photo documentation techniques for property inspections.'
          },
          duration: 25,
          completed: false
        },
        {
          id: 'i-b-4',
          title: 'Client Communication Tools',
          description: 'Master the built-in communication features for seamless client interactions.',
          type: 'reading',
          content: {
            text: 'Use messaging, notifications, and scheduling tools to maintain professional client relationships.',
            infographic: '/images/inspector-communication.png'
          },
          duration: 15,
          completed: false
        }
      ],
      quizzes: [
        {
          question: 'What is the recommended format for uploading inspection photos?',
          options: [
            'Low resolution to save space',
            'High resolution JPEG with proper labeling and timestamps',
            'Black and white only',
            'Screenshots from video'
          ],
          correctAnswer: 1,
          explanation: 'High-resolution JPEG images with proper labeling and timestamps ensure professional documentation and legal compliance.'
        },
        {
          question: 'When should you send the inspection report to the client?',
          options: [
            'Within 24-48 hours of inspection',
            'After 2 weeks',
            'Only when they ask for it',
            'Before the inspection'
          ],
          correctAnswer: 0,
          explanation: 'Industry standard is to deliver comprehensive inspection reports within 24-48 hours for timely decision-making.'
        }
      ]
    },
    'Technically Advanced': {
      role: 'Existing Inspector',
      experienceLevel: 'Technically Advanced',
      modules: [
        {
          id: 'i-ta-1',
          title: 'API Integration for Custom Workflows',
          description: 'Integrate Nested Objects API with your existing tools and automation scripts.',
          type: 'interactive',
          content: {
            text: 'Learn REST API endpoints, authentication, and webhook configuration for advanced integrations.'
          },
          duration: 45,
          completed: false
        },
        {
          id: 'i-ta-2',
          title: 'Thermal Imaging & IoT Sensor Integration',
          description: 'Connect thermal cameras, moisture meters, and IoT devices to auto-populate reports.',
          type: 'video',
          content: {
            youtubeId: 'dQw4w9WgXcQ',
            text: 'Advanced IoT integration for modern inspection technology.'
          },
          duration: 40,
          completed: false
        },
        {
          id: 'i-ta-3',
          title: 'AI-Powered Defect Detection',
          description: 'Leverage machine learning models to identify common property defects automatically.',
          type: 'interactive',
          content: {
            text: 'Upload photos and let AI assist in identifying potential issues with structural, electrical, and plumbing systems.'
          },
          duration: 35,
          completed: false
        }
      ],
      quizzes: [
        {
          question: 'What authentication method does the Nested Objects API use?',
          options: [
            'No authentication required',
            'Basic username/password',
            'OAuth 2.0 with bearer tokens',
            'Only IP whitelisting'
          ],
          correctAnswer: 2,
          explanation: 'The API uses OAuth 2.0 with bearer tokens for secure, modern authentication and authorization.'
        }
      ]
    }
  },
  'Gig Worker': {
    Beginner: {
      role: 'Gig Worker',
      experienceLevel: 'Beginner',
      modules: [
        {
          id: 'g-b-1',
          title: 'Getting Started as a Gig Inspector',
          description: 'Learn how to find jobs, set your availability, and get paid through the platform.',
          type: 'video',
          content: {
            youtubeId: 'dQw4w9WgXcQ',
            text: 'Welcome to the gig economy! Start earning as a property inspector on Nested Objects.'
          },
          duration: 18,
          completed: false
        },
        {
          id: 'g-b-2',
          title: 'Basic Inspection Skills Training',
          description: 'Fundamental property inspection techniques you need to know before your first job.',
          type: 'reading',
          content: {
            text: 'Learn to identify common issues: roof damage, foundation cracks, plumbing leaks, electrical hazards, and HVAC problems.',
            infographic: '/images/inspection-basics.png'
          },
          duration: 35,
          completed: false
        },
        {
          id: 'g-b-3',
          title: 'Safety First: PPE and Hazard Awareness',
          description: 'Essential safety protocols for property inspections.',
          type: 'video',
          content: {
            youtubeId: 'dQw4w9WgXcQ',
            text: 'Personal protective equipment, hazard identification, and emergency procedures.'
          },
          duration: 22,
          completed: false
        },
        {
          id: 'g-b-4',
          title: 'Mobile App Tutorial',
          description: 'Master the Nested Objects mobile app for on-site inspections.',
          type: 'interactive',
          content: {
            text: 'Hands-on walkthrough of the mobile app: accepting jobs, navigation, photo capture, and report submission.'
          },
          duration: 20,
          completed: false
        }
      ],
      quizzes: [
        {
          question: 'Before accepting an inspection job, you should:',
          options: [
            'Just show up at the property',
            'Review job details, location, and ensure you have the required tools and certifications',
            'Only check the payment amount',
            'Ignore the job description'
          ],
          correctAnswer: 1,
          explanation: 'Always review job requirements, verify you have necessary tools and certifications, and understand the scope before accepting.'
        },
        {
          question: 'What should you do if you discover a potential safety hazard during inspection?',
          options: [
            'Ignore it and continue',
            'Document it thoroughly, inform the client immediately, and follow safety protocols',
            'Fix it yourself without permission',
            'Leave the property without reporting'
          ],
          correctAnswer: 1,
          explanation: 'Safety hazards must be documented, reported to clients immediately, and handled according to established safety protocols.'
        }
      ]
    },
    Novice: {
      role: 'Gig Worker',
      experienceLevel: 'Novice',
      modules: [
        {
          id: 'g-n-1',
          title: 'Building Your Reputation Score',
          description: 'Learn how ratings work and how to consistently deliver 5-star service.',
          type: 'reading',
          content: {
            text: 'Your reputation score affects job availability and pay rates. Focus on professionalism, thoroughness, and timely delivery.',
            infographic: '/images/reputation-score.png'
          },
          duration: 15,
          completed: false
        },
        {
          id: 'g-n-2',
          title: 'Specialized Inspection Certifications',
          description: 'Unlock higher-paying jobs with specialized certifications (radon, mold, pool/spa).',
          type: 'video',
          content: {
            youtubeId: 'dQw4w9WgXcQ',
            text: 'Expand your skills and earning potential with specialized inspection certifications.'
          },
          duration: 28,
          completed: false
        },
        {
          id: 'g-n-3',
          title: 'Time Management & Route Optimization',
          description: 'Maximize earnings by efficiently scheduling and routing multiple inspections.',
          type: 'interactive',
          content: {
            text: 'Use our route optimization tools to schedule multiple jobs in a geographic cluster and reduce travel time.'
          },
          duration: 20,
          completed: false
        }
      ],
      quizzes: [
        {
          question: 'What factors contribute to your reputation score?',
          options: [
            'Only the number of jobs completed',
            'Client ratings, report quality, timeliness, professionalism, and completion rate',
            'Just how fast you finish inspections',
            'Only your response time'
          ],
          correctAnswer: 1,
          explanation: 'Reputation scores are multi-dimensional, including ratings, quality, timeliness, professionalism, and reliability.'
        }
      ]
    }
  },
  Realtor: {
    Beginner: {
      role: 'Realtor',
      experienceLevel: 'Beginner',
      modules: [
        {
          id: 'r-b-1',
          title: 'Nested Objects for Real Estate Professionals',
          description: 'How property inspection integration streamlines your transaction workflow.',
          type: 'video',
          content: {
            youtubeId: 'dQw4w9WgXcQ',
            text: 'Seamlessly integrate property inspections into your real estate transactions with Nested Objects.'
          },
          duration: 16,
          completed: false
        },
        {
          id: 'r-b-2',
          title: 'Ordering Inspections for Your Clients',
          description: 'Step-by-step guide to requesting and managing inspections through the platform.',
          type: 'interactive',
          content: {
            text: 'Learn to order inspections, track progress, and access reports for your buyers and sellers.'
          },
          duration: 22,
          completed: false
        },
        {
          id: 'r-b-3',
          title: 'Understanding Inspection Reports',
          description: 'Learn to interpret inspection findings and advise clients effectively.',
          type: 'reading',
          content: {
            text: 'Decode inspection terminology, understand severity levels, and communicate findings to your clients clearly.',
            infographic: '/images/report-guide.png'
          },
          duration: 25,
          completed: false
        },
        {
          id: 'r-b-4',
          title: 'Inspection Contingencies & Negotiations',
          description: 'Navigate inspection contingencies and use findings in negotiations.',
          type: 'video',
          content: {
            youtubeId: 'dQw4w9WgXcQ',
            text: 'Master the art of negotiating repairs and price adjustments based on inspection results.'
          },
          duration: 30,
          completed: false
        }
      ],
      quizzes: [
        {
          question: 'When should you typically order a home inspection?',
          options: [
            'After closing',
            'During the inspection contingency period after offer acceptance',
            'Before listing the property',
            'Never - inspections are optional'
          ],
          correctAnswer: 1,
          explanation: 'Home inspections are typically ordered during the inspection contingency period after an offer is accepted to protect the buyer.'
        },
        {
          question: 'Who typically pays for the home inspection?',
          options: [
            'Always the seller',
            'The realtor',
            'Typically the buyer, but it can be negotiated',
            'The mortgage company'
          ],
          correctAnswer: 2,
          explanation: 'Buyers typically pay for inspections, but this can be negotiated as part of the purchase agreement.'
        }
      ]
    },
    Veteran: {
      role: 'Realtor',
      experienceLevel: 'Veteran',
      modules: [
        {
          id: 'r-v-1',
          title: 'Pre-Listing Inspections & Market Strategy',
          description: 'Use pre-listing inspections to identify issues early and command higher prices.',
          type: 'reading',
          content: {
            text: 'Proactive pre-listing inspections help sellers address issues before listing, reducing negotiation surprises and accelerating sales.',
            infographic: '/images/pre-listing-strategy.png'
          },
          duration: 20,
          completed: false
        },
        {
          id: 'r-v-2',
          title: 'Commercial Property Inspections',
          description: 'Navigate complex commercial inspection requirements and specialized assessments.',
          type: 'video',
          content: {
            youtubeId: 'dQw4w9WgXcQ',
            text: 'Commercial inspections involve environmental assessments, ADA compliance, and complex building systems.'
          },
          duration: 35,
          completed: false
        },
        {
          id: 'r-v-3',
          title: 'Inspection Data Analytics for Market Insights',
          description: 'Leverage aggregated inspection data to advise clients on market conditions and pricing.',
          type: 'interactive',
          content: {
            text: 'Access neighborhood inspection trends, common defect patterns, and age-related maintenance data for competitive advantage.'
          },
          duration: 25,
          completed: false
        },
        {
          id: 'r-v-4',
          title: 'Building Your Inspector Network',
          description: 'Cultivate relationships with trusted inspectors for faster turnaround and better service.',
          type: 'reading',
          content: {
            text: 'Create a preferred inspector list, set up automated scheduling, and receive priority service for your clients.'
          },
          duration: 18,
          completed: false
        }
      ],
      quizzes: [
        {
          question: 'What is a key benefit of pre-listing inspections for sellers?',
          options: [
            'They are not useful',
            'Identify and address issues proactively, reducing negotiation surprises and building buyer confidence',
            'They only benefit the buyer',
            'They delay the listing process'
          ],
          correctAnswer: 1,
          explanation: 'Pre-listing inspections allow sellers to address issues upfront, command higher prices, and reduce negotiation obstacles.'
        }
      ]
    }
  }
};

// AI Avatar feedback messages
const avatarFeedback = {
  excellent: [
    "Outstanding work! 🌟 You're mastering this material quickly!",
    "Perfect score! Your understanding is impressive! 🎯",
    "Exceptional! You're ready to move to advanced topics! 🚀"
  ],
  good: [
    "Great job! 👍 You're making solid progress!",
    "Well done! Keep up the good work! ✨",
    "Nice work! You're on the right track! 💪"
  ],
  needsWork: [
    "Good effort! Review the material and try again. 📚",
    "Not quite there yet. Let's revisit this topic. 🔄",
    "Keep practicing! You'll get it with a bit more review. 💡"
  ]
};

export default function Training() {
  const [selectedRole, setSelectedRole] = useState<Role>('Notary');
  const [selectedLevel, setSelectedLevel] = useState<ExperienceLevel>('Beginner');
  const [currentModuleIndex, setCurrentModuleIndex] = useState(0);
  const [completedModules, setCompletedModules] = useState<Set<string>>(new Set());
  const [quizAnswers, setQuizAnswers] = useState<Record<string, number>>({});
  const [showQuizResults, setShowQuizResults] = useState(false);
  const [quizScore, setQuizScore] = useState(0);
  const [avatarMessage, setAvatarMessage] = useState('');
  const [showAvatarMessage, setShowAvatarMessage] = useState(false);
  const [overallProgress, setOverallProgress] = useState(0);
  const [adaptiveMode, setAdaptiveMode] = useState(false);

  // Get current training track
  const currentTrack = trainingData[selectedRole]?.[selectedLevel];
  const currentModule = currentTrack?.modules[currentModuleIndex];

  // Calculate progress
  useEffect(() => {
    if (currentTrack) {
      const totalModules = currentTrack.modules.length;
      const completed = completedModules.size;
      setOverallProgress((completed / totalModules) * 100);
    }
  }, [completedModules, currentTrack]);

  // Handle module completion
  const handleCompleteModule = () => {
    if (currentModule) {
      const newCompleted = new Set(completedModules);
      newCompleted.add(currentModule.id);
      setCompletedModules(newCompleted);

      // Show avatar feedback
      setAvatarMessage(avatarFeedback.good[Math.floor(Math.random() * avatarFeedback.good.length)]);
      setShowAvatarMessage(true);
      setTimeout(() => setShowAvatarMessage(false), 4000);

      // Move to next module
      if (currentModuleIndex < currentTrack.modules.length - 1) {
        setTimeout(() => setCurrentModuleIndex(currentModuleIndex + 1), 1000);
      }
    }
  };

  // Handle quiz submission
  const handleSubmitQuiz = () => {
    if (!currentTrack) return;

    let correct = 0;
    currentTrack.quizzes.forEach((quiz, index) => {
      if (quizAnswers[index] === quiz.correctAnswer) {
        correct++;
      }
    });

    const score = (correct / currentTrack.quizzes.length) * 100;
    setQuizScore(score);
    setShowQuizResults(true);

    // Adaptive feedback
    let feedback = '';
    if (score >= 90) {
      feedback = avatarFeedback.excellent[Math.floor(Math.random() * avatarFeedback.excellent.length)];
      // Suggest moving to higher level
      if (adaptiveMode && selectedLevel === 'Beginner') {
        feedback += ' Consider advancing to Novice level!';
      }
    } else if (score >= 70) {
      feedback = avatarFeedback.good[Math.floor(Math.random() * avatarFeedback.good.length)];
    } else {
      feedback = avatarFeedback.needsWork[Math.floor(Math.random() * avatarFeedback.needsWork.length)];
      // Suggest review
      if (adaptiveMode) {
        feedback += ' I recommend reviewing the previous modules.';
      }
    }

    setAvatarMessage(feedback);
    setShowAvatarMessage(true);

    // Mark quiz module as complete
    handleCompleteModule();
  };

  // Reset when changing role or level
  useEffect(() => {
    setCurrentModuleIndex(0);
    setCompletedModules(new Set());
    setQuizAnswers({});
    setShowQuizResults(false);
    setOverallProgress(0);
  }, [selectedRole, selectedLevel]);

  return (
    <>
      <Head>
        <title>Nested Objects Training Portal</title>
        <meta name="description" content="Dynamic training portal for property inspection professionals" />
      </Head>

      <div className="flex h-screen bg-gray-50">
        {/* Sidebar */}
        <div className="w-80 bg-gradient-to-b from-blue-900 to-blue-800 text-white p-6 overflow-y-auto shadow-2xl">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Nested Objects</h1>
            <p className="text-blue-200 text-sm">Training Portal</p>
          </div>

          {/* Role Selection */}
          <div className="mb-8">
            <label className="block text-sm font-semibold mb-3 text-blue-200">Your Role</label>
            <div className="space-y-2">
              {(['Notary', 'Existing Inspector', 'Gig Worker', 'Realtor'] as Role[]).map((role) => (
                <button
                  key={role}
                  onClick={() => setSelectedRole(role)}
                  className={`w-full text-left px-4 py-3 rounded-lg transition-all duration-200 ${
                    selectedRole === role
                      ? 'bg-white text-blue-900 shadow-lg font-semibold transform scale-105'
                      : 'bg-blue-800 hover:bg-blue-700 text-white'
                  }`}
                >
                  {role}
                </button>
              ))}
            </div>
          </div>

          {/* Experience Level */}
          <div className="mb-8">
            <label className="block text-sm font-semibold mb-3 text-blue-200">Experience Level</label>
            <div className="space-y-2">
              {(['Beginner', 'Novice', 'Veteran', 'Technically Advanced'] as ExperienceLevel[]).map((level) => (
                <button
                  key={level}
                  onClick={() => setSelectedLevel(level)}
                  disabled={!trainingData[selectedRole]?.[level]}
                  className={`w-full text-left px-4 py-3 rounded-lg transition-all duration-200 ${
                    selectedLevel === level
                      ? 'bg-white text-blue-900 shadow-lg font-semibold'
                      : trainingData[selectedRole]?.[level]
                      ? 'bg-blue-800 hover:bg-blue-700 text-white'
                      : 'bg-blue-900 text-blue-500 cursor-not-allowed opacity-50'
                  }`}
                >
                  {level}
                  {!trainingData[selectedRole]?.[level] && (
                    <span className="text-xs block text-blue-400 mt-1">Coming Soon</span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Progress Overview */}
          <div className="bg-blue-800 rounded-lg p-4 mb-6">
            <h3 className="text-sm font-semibold mb-3 text-blue-200">Overall Progress</h3>
            <div className="bg-blue-900 rounded-full h-3 mb-2 overflow-hidden">
              <div
                className="bg-gradient-to-r from-green-400 to-green-500 h-full transition-all duration-500 rounded-full"
                style={{ width: `${overallProgress}%` }}
              />
            </div>
            <p className="text-xs text-blue-200">
              {completedModules.size} of {currentTrack?.modules.length || 0} modules completed
            </p>
          </div>

          {/* Adaptive Learning Toggle */}
          <div className="bg-blue-800 rounded-lg p-4">
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={adaptiveMode}
                onChange={(e) => setAdaptiveMode(e.target.checked)}
                className="mr-3 h-5 w-5 rounded border-blue-600 text-green-500 focus:ring-green-500"
              />
              <div>
                <span className="text-sm font-semibold">Adaptive Learning</span>
                <p className="text-xs text-blue-200 mt-1">
                  Curriculum adjusts based on your performance
                </p>
              </div>
            </label>
          </div>

          {/* Module List */}
          <div className="mt-8">
            <h3 className="text-sm font-semibold mb-3 text-blue-200">Module Checklist</h3>
            <div className="space-y-2">
              {currentTrack?.modules.map((module, index) => (
                <div
                  key={module.id}
                  onClick={() => setCurrentModuleIndex(index)}
                  className={`p-3 rounded-lg cursor-pointer transition-all duration-200 ${
                    index === currentModuleIndex
                      ? 'bg-white text-blue-900 shadow-lg'
                      : completedModules.has(module.id)
                      ? 'bg-green-800 text-white'
                      : 'bg-blue-800 text-blue-200 hover:bg-blue-700'
                  }`}
                >
                  <div className="flex items-center">
                    <div className="flex-shrink-0 mr-3">
                      {completedModules.has(module.id) ? (
                        <svg className="h-5 w-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      ) : (
                        <div className={`h-5 w-5 rounded-full border-2 ${
                          index === currentModuleIndex ? 'border-blue-900' : 'border-blue-400'
                        }`} />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{module.title}</p>
                      <p className="text-xs opacity-75">{module.duration} min</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-5xl mx-auto p-8">
            {/* Header */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-4xl font-bold text-gray-900 mb-2">
                    {selectedRole} Training
                  </h2>
                  <p className="text-gray-600 text-lg">
                    {selectedLevel} Level • Module {currentModuleIndex + 1} of {currentTrack?.modules.length || 0}
                  </p>
                </div>
                <div className="text-right">
                  <div className="inline-block bg-blue-100 px-4 py-2 rounded-lg">
                    <p className="text-sm text-blue-600 font-semibold">Progress</p>
                    <p className="text-2xl font-bold text-blue-900">{Math.round(overallProgress)}%</p>
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="bg-gray-200 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-blue-500 to-blue-600 h-full transition-all duration-500"
                  style={{ width: `${overallProgress}%` }}
                />
              </div>
            </div>

            {/* AI Avatar Feedback */}
            {showAvatarMessage && (
              <div className="mb-6 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl shadow-xl p-6 text-white animate-fade-in">
                <div className="flex items-start">
                  <div className="flex-shrink-0 mr-4">
                    <div className="h-16 w-16 rounded-full bg-white bg-opacity-20 flex items-center justify-center text-4xl animate-bounce">
                      🤖
                    </div>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-lg mb-1">AI Learning Assistant</h4>
                    <p className="text-lg">{avatarMessage}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Module Content */}
            {currentModule && (
              <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-6">
                {/* Module Header */}
                <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6">
                  <div className="flex items-center mb-3">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-white bg-opacity-20 mr-3">
                      {currentModule.type.toUpperCase()}
                    </span>
                    <span className="text-sm opacity-90">
                      ⏱️ {currentModule.duration} minutes
                    </span>
                  </div>
                  <h3 className="text-3xl font-bold mb-2">{currentModule.title}</h3>
                  <p className="text-blue-100 text-lg">{currentModule.description}</p>
                </div>

                {/* Module Content Body */}
                <div className="p-8">
                  {currentModule.type === 'video' && currentModule.content.youtubeId && (
                    <div className="mb-6">
                      <div className="aspect-w-16 aspect-h-9 bg-gray-900 rounded-lg overflow-hidden shadow-inner">
                        <iframe
                          src={`https://www.youtube.com/embed/${currentModule.content.youtubeId}`}
                          className="w-full h-96"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        />
                      </div>
                    </div>
                  )}

                  {currentModule.type === 'audio' && (
                    <div className="mb-6 bg-gradient-to-r from-purple-100 to-pink-100 rounded-lg p-6">
                      <div className="flex items-center space-x-4">
                        <button className="h-16 w-16 rounded-full bg-purple-600 text-white flex items-center justify-center text-2xl hover:bg-purple-700 transition">
                          ▶️
                        </button>
                        <div className="flex-1">
                          <div className="bg-white rounded-full h-2 overflow-hidden">
                            <div className="bg-purple-600 h-full w-1/3" />
                          </div>
                          <p className="text-sm text-gray-600 mt-2">Audio Lesson</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {currentModule.content.text && (
                    <div className="prose prose-lg max-w-none mb-6">
                      <p className="text-gray-700 leading-relaxed text-lg">
                        {currentModule.content.text}
                      </p>
                    </div>
                  )}

                  {currentModule.content.infographic && (
                    <div className="mb-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-8 border-2 border-blue-200">
                      <div className="text-center">
                        <div className="inline-block bg-white rounded-lg p-8 shadow-md">
                          <svg className="h-48 w-48 text-blue-400 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M2 6a2 2 0 012-2h12a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zm2 0v8h12V6H4zm2 2h8v4H6V8z" />
                          </svg>
                          <p className="text-gray-600 mt-4 font-semibold">Infographic: {currentModule.title}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {currentModule.type === 'interactive' && (
                    <div className="bg-gradient-to-br from-green-50 to-teal-50 rounded-xl p-8 border-2 border-green-200 mb-6">
                      <div className="text-center">
                        <div className="inline-block bg-green-600 text-white rounded-full p-6 mb-4">
                          <svg className="h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                          </svg>
                        </div>
                        <h4 className="text-2xl font-bold text-gray-900 mb-3">Interactive Learning Module</h4>
                        <p className="text-gray-700 mb-6 text-lg">{currentModule.content.text}</p>
                        <button className="bg-green-600 text-white px-8 py-3 rounded-lg hover:bg-green-700 transition font-semibold text-lg shadow-lg">
                          Launch Interactive Demo
                        </button>
                      </div>
                    </div>
                  )}

                  {currentModule.type === 'quiz' && (
                    <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-xl p-8 border-2 border-yellow-200">
                      <h4 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                        <span className="text-3xl mr-3">📝</span>
                        Knowledge Check Quiz
                      </h4>

                      {!showQuizResults ? (
                        <div className="space-y-6">
                          {currentTrack.quizzes.map((quiz, quizIndex) => (
                            <div key={quizIndex} className="bg-white rounded-lg p-6 shadow-md">
                              <p className="font-semibold text-gray-900 mb-4 text-lg">
                                {quizIndex + 1}. {quiz.question}
                              </p>
                              <div className="space-y-3">
                                {quiz.options.map((option, optionIndex) => (
                                  <label
                                    key={optionIndex}
                                    className={`flex items-center p-4 rounded-lg border-2 cursor-pointer transition-all ${
                                      quizAnswers[quizIndex] === optionIndex
                                        ? 'border-blue-500 bg-blue-50'
                                        : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                                    }`}
                                  >
                                    <input
                                      type="radio"
                                      name={`quiz-${quizIndex}`}
                                      checked={quizAnswers[quizIndex] === optionIndex}
                                      onChange={() => setQuizAnswers({ ...quizAnswers, [quizIndex]: optionIndex })}
                                      className="mr-3 h-5 w-5 text-blue-600"
                                    />
                                    <span className="text-gray-800">{option}</span>
                                  </label>
                                ))}
                              </div>
                            </div>
                          ))}

                          <button
                            onClick={handleSubmitQuiz}
                            disabled={Object.keys(quizAnswers).length < currentTrack.quizzes.length}
                            className={`w-full py-4 rounded-lg font-bold text-lg transition-all shadow-lg ${
                              Object.keys(quizAnswers).length < currentTrack.quizzes.length
                                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                : 'bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700'
                            }`}
                          >
                            Submit Quiz
                          </button>
                        </div>
                      ) : (
                        <div className="text-center">
                          <div className={`inline-block rounded-full p-8 mb-6 ${
                            quizScore >= 90 ? 'bg-green-100' : quizScore >= 70 ? 'bg-yellow-100' : 'bg-red-100'
                          }`}>
                            <p className={`text-6xl font-bold ${
                              quizScore >= 90 ? 'text-green-600' : quizScore >= 70 ? 'text-yellow-600' : 'text-red-600'
                            }`}>
                              {Math.round(quizScore)}%
                            </p>
                          </div>
                          <h5 className="text-2xl font-bold text-gray-900 mb-4">
                            {quizScore >= 90 ? '🎉 Excellent!' : quizScore >= 70 ? '👍 Good Job!' : '📚 Keep Learning!'}
                          </h5>

                          {/* Quiz Explanations */}
                          <div className="mt-8 space-y-4 text-left">
                            {currentTrack.quizzes.map((quiz, index) => (
                              <div key={index} className={`p-4 rounded-lg ${
                                quizAnswers[index] === quiz.correctAnswer ? 'bg-green-50 border-2 border-green-200' : 'bg-red-50 border-2 border-red-200'
                              }`}>
                                <p className="font-semibold mb-2">
                                  {quizAnswers[index] === quiz.correctAnswer ? '✅' : '❌'} Question {index + 1}
                                </p>
                                <p className="text-sm text-gray-700 mb-2">{quiz.explanation}</p>
                                {quizAnswers[index] !== quiz.correctAnswer && (
                                  <p className="text-sm">
                                    <span className="font-semibold">Correct answer:</span> {quiz.options[quiz.correctAnswer]}
                                  </p>
                                )}
                              </div>
                            ))}
                          </div>

                          <button
                            onClick={() => {
                              setShowQuizResults(false);
                              setQuizAnswers({});
                            }}
                            className="mt-6 bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition font-semibold"
                          >
                            Retake Quiz
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Action Buttons */}
                  {currentModule.type !== 'quiz' && (
                    <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-200">
                      <button
                        onClick={() => setCurrentModuleIndex(Math.max(0, currentModuleIndex - 1))}
                        disabled={currentModuleIndex === 0}
                        className={`px-6 py-3 rounded-lg font-semibold transition ${
                          currentModuleIndex === 0
                            ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                            : 'bg-gray-300 text-gray-700 hover:bg-gray-400'
                        }`}
                      >
                        ← Previous
                      </button>

                      {!completedModules.has(currentModule.id) && (
                        <button
                          onClick={handleCompleteModule}
                          className="bg-gradient-to-r from-green-500 to-green-600 text-white px-8 py-3 rounded-lg hover:from-green-600 hover:to-green-700 transition font-bold shadow-lg"
                        >
                          ✓ Mark as Complete
                        </button>
                      )}

                      <button
                        onClick={() => setCurrentModuleIndex(Math.min(currentTrack.modules.length - 1, currentModuleIndex + 1))}
                        disabled={currentModuleIndex === currentTrack.modules.length - 1}
                        className={`px-6 py-3 rounded-lg font-semibold transition ${
                          currentModuleIndex === currentTrack.modules.length - 1
                            ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                            : 'bg-blue-600 text-white hover:bg-blue-700'
                        }`}
                      >
                        Next →
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Completion Certificate */}
            {overallProgress === 100 && (
              <div className="bg-gradient-to-br from-yellow-400 via-yellow-500 to-orange-500 rounded-xl shadow-2xl p-12 text-white text-center border-8 border-yellow-600">
                <div className="text-8xl mb-4">🏆</div>
                <h3 className="text-4xl font-bold mb-4">Congratulations!</h3>
                <p className="text-2xl mb-6">
                  You've completed the {selectedRole} - {selectedLevel} training track!
                </p>
                <div className="bg-white text-gray-900 rounded-lg p-6 inline-block mb-6">
                  <p className="text-lg font-semibold mb-2">Certificate of Completion</p>
                  <p className="text-sm text-gray-600">Nested Objects Training Portal</p>
                  <p className="text-xl font-bold mt-4">{selectedRole} Track</p>
                  <p className="text-gray-600">{selectedLevel} Level</p>
                </div>
                <div className="space-x-4">
                  <button className="bg-white text-orange-600 px-8 py-3 rounded-lg hover:bg-gray-100 transition font-bold shadow-lg">
                    Download Certificate
                  </button>
                  <button
                    onClick={() => {
                      setCompletedModules(new Set());
                      setCurrentModuleIndex(0);
                    }}
                    className="bg-orange-700 text-white px-8 py-3 rounded-lg hover:bg-orange-800 transition font-bold"
                  >
                    Restart Course
                  </button>
                </div>
              </div>
            )}

            {/* Gamification Elements */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
              <div className="bg-white rounded-lg shadow-md p-6 text-center">
                <div className="text-4xl mb-2">🎯</div>
                <p className="text-gray-600 text-sm mb-1">Modules Completed</p>
                <p className="text-3xl font-bold text-blue-600">{completedModules.size}</p>
              </div>
              <div className="bg-white rounded-lg shadow-md p-6 text-center">
                <div className="text-4xl mb-2">⏱️</div>
                <p className="text-gray-600 text-sm mb-1">Time Invested</p>
                <p className="text-3xl font-bold text-green-600">
                  {currentTrack?.modules
                    .filter(m => completedModules.has(m.id))
                    .reduce((acc, m) => acc + m.duration, 0) || 0} min
                </p>
              </div>
              <div className="bg-white rounded-lg shadow-md p-6 text-center">
                <div className="text-4xl mb-2">🔥</div>
                <p className="text-gray-600 text-sm mb-1">Learning Streak</p>
                <p className="text-3xl font-bold text-orange-600">{completedModules.size} days</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.5s ease-out;
        }
      `}</style>
    </>
  );
}
