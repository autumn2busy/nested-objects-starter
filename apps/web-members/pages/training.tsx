import React, { useState, useEffect } from 'react';
import { 
  PlayCircle, 
  CheckCircle, 
  Award, 
  BookOpen, 
  Headphones, 
  Video, 
  Brain,
  TrendingUp,
  Star,
  Lock,
  ChevronRight,
  BarChart3,
  Trophy
} from 'lucide-react';

// Types
type Role = 'Notary' | 'Existing Inspector' | 'Gig Worker' | 'Realtor';
type ExperienceLevel = 'Beginner' | 'Novice' | 'Veteran' | 'Technically Advanced';
type ModuleType = 'video' | 'audio' | 'reading' | 'interactive' | 'quiz';

interface Module {
  id: string;
  title: string;
  type: ModuleType;
  duration: string;
  content: string;
  videoUrl?: string;
  audioUrl?: string;
  completed: boolean;
  locked: boolean;
  quiz?: Quiz;
}

interface Quiz {
  questions: Question[];
}

interface Question {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
}

interface TrainingTrack {
  role: Role;
  experienceLevel: ExperienceLevel;
  modules: Module[];
  description: string;
}

// Mock Data
const trainingData: Record<Role, Record<ExperienceLevel, TrainingTrack>> = {
  'Notary': {
    'Beginner': {
      role: 'Notary',
      experienceLevel: 'Beginner',
      description: 'Start your journey as a Notary with Nested Objects. Learn the fundamentals of property inspection documentation.',
      modules: [
        {
          id: 'notary-b-1',
          title: 'Introduction to Nested Objects Platform',
          type: 'video',
          duration: '12 min',
          content: 'Welcome to Nested Objects! This module introduces you to our platform and how notaries play a crucial role in property verification.',
          videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
          completed: false,
          locked: false,
          quiz: {
            questions: [
              {
                id: 'q1',
                question: 'What is the primary role of a notary in the Nested Objects ecosystem?',
                options: [
                  'To repair properties',
                  'To verify and authenticate property documentation',
                  'To sell properties',
                  'To design properties'
                ],
                correctAnswer: 1
              },
              {
                id: 'q2',
                question: 'How many days do you have to complete a notarization request?',
                options: ['1 day', '3 days', '7 days', '14 days'],
                correctAnswer: 1
              }
            ]
          }
        },
        {
          id: 'notary-b-2',
          title: 'Document Authentication Basics',
          type: 'reading',
          duration: '15 min',
          content: 'Learn the essential principles of document authentication, including signature verification, seal application, and record keeping.',
          completed: false,
          locked: true
        },
        {
          id: 'notary-b-3',
          title: 'Using the Mobile Notary App',
          type: 'interactive',
          duration: '20 min',
          content: 'Hands-on tutorial: Navigate the Nested Objects mobile app, schedule appointments, and complete your first notarization.',
          completed: false,
          locked: true,
          quiz: {
            questions: [
              {
                id: 'q3',
                question: 'Where can you find your scheduled appointments in the app?',
                options: [
                  'Dashboard > Calendar',
                  'Settings > Schedule',
                  'Profile > Appointments',
                  'Menu > Tasks'
                ],
                correctAnswer: 0
              }
            ]
          }
        },
        {
          id: 'notary-b-4',
          title: 'Legal Compliance and Ethics',
          type: 'video',
          duration: '18 min',
          content: 'Understanding your legal obligations, privacy requirements, and ethical standards as a notary professional.',
          videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
          completed: false,
          locked: true
        },
        {
          id: 'notary-b-5',
          title: 'Final Assessment',
          type: 'quiz',
          duration: '10 min',
          content: 'Complete this assessment to earn your Beginner Notary certification.',
          completed: false,
          locked: true,
          quiz: {
            questions: [
              {
                id: 'q4',
                question: 'What should you do if a signer refuses to show proper ID?',
                options: [
                  'Proceed with the notarization anyway',
                  'Refuse to notarize the document',
                  'Call your supervisor',
                  'Accept a photocopy of their ID'
                ],
                correctAnswer: 1
              },
              {
                id: 'q5',
                question: 'How long must you retain notary records?',
                options: ['1 year', '3 years', '5 years', '10 years'],
                correctAnswer: 3
              }
            ]
          }
        }
      ]
    },
    'Novice': {
      role: 'Notary',
      experienceLevel: 'Novice',
      description: 'Advance your notary skills with complex scenarios and multi-party transactions.',
      modules: [
        {
          id: 'notary-n-1',
          title: 'Advanced Document Types',
          type: 'video',
          duration: '22 min',
          content: 'Master complex property documents including deeds, affidavits, and power of attorney forms.',
          videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
          completed: false,
          locked: false
        },
        {
          id: 'notary-n-2',
          title: 'Multi-Party Transactions',
          type: 'interactive',
          duration: '25 min',
          content: 'Learn to handle transactions involving multiple signers, witnesses, and stakeholders.',
          completed: false,
          locked: true
        }
      ]
    },
    'Veteran': {
      role: 'Notary',
      experienceLevel: 'Veteran',
      description: 'Expert-level training for seasoned notaries handling complex commercial transactions.',
      modules: [
        {
          id: 'notary-v-1',
          title: 'Commercial Real Estate Notarizations',
          type: 'video',
          duration: '30 min',
          content: 'Navigate the complexities of commercial property transactions and corporate signers.',
          videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
          completed: false,
          locked: false
        }
      ]
    },
    'Technically Advanced': {
      role: 'Notary',
      experienceLevel: 'Technically Advanced',
      description: 'Cutting-edge digital notarization techniques and blockchain integration.',
      modules: [
        {
          id: 'notary-t-1',
          title: 'Remote Online Notarization (RON)',
          type: 'video',
          duration: '35 min',
          content: 'Master remote notarization technology, video conferencing protocols, and digital signatures.',
          videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
          completed: false,
          locked: false
        }
      ]
    }
  },
  'Existing Inspector': {
    'Beginner': {
      role: 'Existing Inspector',
      experienceLevel: 'Beginner',
      description: 'Transition to the Nested Objects platform with our comprehensive onboarding for experienced inspectors.',
      modules: [
        {
          id: 'inspector-b-1',
          title: 'Platform Overview for Inspectors',
          type: 'video',
          duration: '15 min',
          content: 'Learn how Nested Objects streamlines your inspection workflow with cutting-edge technology.',
          videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
          completed: false,
          locked: false,
          quiz: {
            questions: [
              {
                id: 'iq1',
                question: 'What makes Nested Objects different from traditional inspection platforms?',
                options: [
                  'Lower fees',
                  'AI-assisted reporting and real-time collaboration',
                  'Fewer inspections required',
                  'No certification needed'
                ],
                correctAnswer: 1
              }
            ]
          }
        },
        {
          id: 'inspector-b-2',
          title: 'Digital Inspection Tools',
          type: 'interactive',
          duration: '20 min',
          content: 'Hands-on practice with our mobile inspection app, photo annotation tools, and voice-to-text features.',
          completed: false,
          locked: true
        },
        {
          id: 'inspector-b-3',
          title: 'Report Generation and Templates',
          type: 'reading',
          duration: '18 min',
          content: 'Create professional inspection reports using our customizable templates and automated insights.',
          completed: false,
          locked: true
        }
      ]
    },
    'Novice': {
      role: 'Existing Inspector',
      experienceLevel: 'Novice',
      description: 'Enhance your inspection capabilities with advanced diagnostic techniques.',
      modules: [
        {
          id: 'inspector-n-1',
          title: 'Advanced HVAC Inspection',
          type: 'video',
          duration: '28 min',
          content: 'Deep dive into heating, ventilation, and air conditioning systems inspection and diagnostics.',
          videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
          completed: false,
          locked: false
        }
      ]
    },
    'Veteran': {
      role: 'Existing Inspector',
      experienceLevel: 'Veteran',
      description: 'Specialized training for complex properties and advanced building systems.',
      modules: [
        {
          id: 'inspector-v-1',
          title: 'Commercial Building Systems',
          type: 'video',
          duration: '40 min',
          content: 'Master the inspection of complex commercial properties, including industrial systems.',
          videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
          completed: false,
          locked: false
        }
      ]
    },
    'Technically Advanced': {
      role: 'Existing Inspector',
      experienceLevel: 'Technically Advanced',
      description: 'Leverage AI, thermal imaging, and IoT sensors for next-generation inspections.',
      modules: [
        {
          id: 'inspector-t-1',
          title: 'AI-Powered Defect Detection',
          type: 'interactive',
          duration: '30 min',
          content: 'Use machine learning algorithms to identify structural issues, mold, and hidden defects.',
          completed: false,
          locked: false
        }
      ]
    }
  },
  'Gig Worker': {
    'Beginner': {
      role: 'Gig Worker',
      experienceLevel: 'Beginner',
      description: 'Start earning as a flexible property services professional with Nested Objects.',
      modules: [
        {
          id: 'gig-b-1',
          title: 'Welcome to Gig-Based Property Services',
          type: 'video',
          duration: '10 min',
          content: 'Discover how to earn money on your schedule by completing property-related tasks.',
          videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
          completed: false,
          locked: false,
          quiz: {
            questions: [
              {
                id: 'gq1',
                question: 'What types of tasks can gig workers complete?',
                options: [
                  'Only photography',
                  'Photography, measurements, and basic inspections',
                  'Full property inspections only',
                  'Legal document signing'
                ],
                correctAnswer: 1
              }
            ]
          }
        },
        {
          id: 'gig-b-2',
          title: 'Task Selection and Bidding',
          type: 'interactive',
          duration: '12 min',
          content: 'Learn how to browse available tasks, submit competitive bids, and win assignments.',
          completed: false,
          locked: true
        },
        {
          id: 'gig-b-3',
          title: 'Photography Best Practices',
          type: 'audio',
          duration: '15 min',
          content: 'Capture high-quality property photos that meet client requirements and industry standards.',
          audioUrl: 'https://example.com/audio/photography-basics.mp3',
          completed: false,
          locked: true
        },
        {
          id: 'gig-b-4',
          title: 'Measurement and Documentation',
          type: 'video',
          duration: '18 min',
          content: 'Accurate property measurements using laser tools and mobile apps.',
          videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
          completed: false,
          locked: true
        }
      ]
    },
    'Novice': {
      role: 'Gig Worker',
      experienceLevel: 'Novice',
      description: 'Expand your service offerings and increase your earning potential.',
      modules: [
        {
          id: 'gig-n-1',
          title: 'Advanced Photography Techniques',
          type: 'video',
          duration: '25 min',
          content: 'Master HDR photography, drone shots, and twilight exterior photography.',
          videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
          completed: false,
          locked: false
        }
      ]
    },
    'Veteran': {
      role: 'Gig Worker',
      experienceLevel: 'Veteran',
      description: 'Become a premium service provider with specialized skills.',
      modules: [
        {
          id: 'gig-v-1',
          title: 'Video Walkthrough Production',
          type: 'video',
          duration: '35 min',
          content: 'Create professional video tours with scripting, stabilization, and editing.',
          videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
          completed: false,
          locked: false
        }
      ]
    },
    'Technically Advanced': {
      role: 'Gig Worker',
      experienceLevel: 'Technically Advanced',
      description: 'Leverage cutting-edge technology for premium property services.',
      modules: [
        {
          id: 'gig-t-1',
          title: '3D Scanning and Virtual Tours',
          type: 'interactive',
          duration: '40 min',
          content: 'Create immersive 3D property models using Matterport and LiDAR technology.',
          completed: false,
          locked: false
        }
      ]
    }
  },
  'Realtor': {
    'Beginner': {
      role: 'Realtor',
      experienceLevel: 'Beginner',
      description: 'Integrate Nested Objects into your real estate practice for competitive advantage.',
      modules: [
        {
          id: 'realtor-b-1',
          title: 'Nested Objects for Real Estate Professionals',
          type: 'video',
          duration: '14 min',
          content: 'How our platform helps you close deals faster with comprehensive property intelligence.',
          videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
          completed: false,
          locked: false,
          quiz: {
            questions: [
              {
                id: 'rq1',
                question: 'How can Nested Objects help realtors close deals faster?',
                options: [
                  'By reducing property prices',
                  'By providing instant inspection reports and verified property data',
                  'By eliminating the need for showings',
                  'By removing the need for inspections'
                ],
                correctAnswer: 1
              }
            ]
          }
        },
        {
          id: 'realtor-b-2',
          title: 'Ordering Inspections and Reports',
          type: 'interactive',
          duration: '16 min',
          content: 'Step-by-step guide to requesting property inspections and accessing detailed reports.',
          completed: false,
          locked: true
        },
        {
          id: 'realtor-b-3',
          title: 'Sharing Reports with Clients',
          type: 'reading',
          duration: '10 min',
          content: 'Best practices for presenting inspection findings to buyers and sellers.',
          completed: false,
          locked: true
        },
        {
          id: 'realtor-b-4',
          title: 'Pre-Listing Inspections Strategy',
          type: 'audio',
          duration: '20 min',
          content: 'Use pre-listing inspections to price properties accurately and reduce negotiation surprises.',
          audioUrl: 'https://example.com/audio/pre-listing.mp3',
          completed: false,
          locked: true
        }
      ]
    },
    'Novice': {
      role: 'Realtor',
      experienceLevel: 'Novice',
      description: 'Advanced strategies for leveraging property data in negotiations.',
      modules: [
        {
          id: 'realtor-n-1',
          title: 'Data-Driven Pricing Strategies',
          type: 'video',
          duration: '22 min',
          content: 'Use inspection data and market analytics to price properties competitively.',
          videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
          completed: false,
          locked: false
        }
      ]
    },
    'Veteran': {
      role: 'Realtor',
      experienceLevel: 'Veteran',
      description: 'Master commercial real estate transactions and investment property analysis.',
      modules: [
        {
          id: 'realtor-v-1',
          title: 'Commercial Property Due Diligence',
          type: 'video',
          duration: '38 min',
          content: 'Comprehensive inspection strategies for commercial real estate transactions.',
          videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
          completed: false,
          locked: false
        }
      ]
    },
    'Technically Advanced': {
      role: 'Realtor',
      experienceLevel: 'Technically Advanced',
      description: 'Integrate API access, custom dashboards, and automated workflows.',
      modules: [
        {
          id: 'realtor-t-1',
          title: 'API Integration and Custom Workflows',
          type: 'interactive',
          duration: '45 min',
          content: 'Connect Nested Objects to your CRM and automate inspection ordering and report delivery.',
          completed: false,
          locked: false
        }
      ]
    }
  }
};

// AI Avatar responses based on performance
const aiAvatarResponses = {
  excellent: {
    message: "Outstanding work! You&apos;ve demonstrated exceptional understanding of the material.",
    avatar: '🌟',
    color: 'text-green-600'
  },
  good: {
    message: "Great job! You&apos;re making solid progress. Keep up the excellent work!",
    avatar: '👍',
    color: 'text-blue-600'
  },
  needsImprovement: {
    message: "You&apos;re on the right track, but let&apos;s review some concepts. Don&apos;t give up!",
    avatar: '💡',
    color: 'text-yellow-600'
  },
  retry: {
    message: "Let&apos;s try that again. Review the module content and take your time with each question.",
    avatar: '🔄',
    color: 'text-orange-600'
  }
};

export default function TrainingPage() {
  const [selectedRole, setSelectedRole] = useState<Role>('Notary');
  const [selectedLevel, setSelectedLevel] = useState<ExperienceLevel>('Beginner');
  const [currentModuleId, setCurrentModuleId] = useState<string>('');
  const [userProgress, setUserProgress] = useState<Record<string, boolean>>({});
  const [quizAnswers, setQuizAnswers] = useState<Record<string, number>>({});
  const [showQuizResults, setShowQuizResults] = useState(false);
  const [quizScore, setQuizScore] = useState(0);
  const [aiResponse, setAiResponse] = useState<typeof aiAvatarResponses.excellent | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);

  const currentTrack = trainingData[selectedRole][selectedLevel];
  const currentModule = currentTrack.modules.find(m => m.id === currentModuleId);

  useEffect(() => {
    // Auto-select first module when role or level changes
    if (currentTrack.modules.length > 0) {
      setCurrentModuleId(currentTrack.modules[0].id);
    }
    setQuizAnswers({});
    setShowQuizResults(false);
    setAiResponse(null);
  }, [selectedRole, selectedLevel, currentTrack]);

  useEffect(() => {
    // Unlock next module when current is completed
    const currentIndex = currentTrack.modules.findIndex(m => m.id === currentModuleId);
    if (currentIndex >= 0 && currentIndex < currentTrack.modules.length - 1) {
      if (userProgress[currentModuleId]) {
        currentTrack.modules[currentIndex + 1].locked = false;
      }
    }
  }, [userProgress, currentModuleId, currentTrack]);

  const handleCompleteModule = () => {
    setUserProgress(prev => ({
      ...prev,
      [currentModuleId]: true
    }));
    
    setShowCelebration(true);
    setTimeout(() => setShowCelebration(false), 3000);

    // Auto-advance to next module
    const currentIndex = currentTrack.modules.findIndex(m => m.id === currentModuleId);
    if (currentIndex < currentTrack.modules.length - 1) {
      setTimeout(() => {
        setCurrentModuleId(currentTrack.modules[currentIndex + 1].id);
      }, 1500);
    }
  };

  const handleQuizSubmit = () => {
    if (!currentModule?.quiz) return;

    let correct = 0;
    currentModule.quiz.questions.forEach(q => {
      if (quizAnswers[q.id] === q.correctAnswer) {
        correct++;
      }
    });

    const score = (correct / currentModule.quiz.questions.length) * 100;
    setQuizScore(score);
    setShowQuizResults(true);

    // AI Avatar feedback
    if (score >= 90) {
      setAiResponse(aiAvatarResponses.excellent);
      handleCompleteModule();
    } else if (score >= 70) {
      setAiResponse(aiAvatarResponses.good);
      handleCompleteModule();
    } else if (score >= 50) {
      setAiResponse(aiAvatarResponses.needsImprovement);
    } else {
      setAiResponse(aiAvatarResponses.retry);
    }
  };

  const handleRetakeQuiz = () => {
    setQuizAnswers({});
    setShowQuizResults(false);
    setAiResponse(null);
  };

  const calculateProgress = () => {
    const completed = currentTrack.modules.filter(m => userProgress[m.id]).length;
    return Math.round((completed / currentTrack.modules.length) * 100);
  };

  const totalModules = currentTrack.modules.length;
  const completedModules = currentTrack.modules.filter(m => userProgress[m.id]).length;
  const progressPercentage = calculateProgress();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-br from-blue-600 to-indigo-600 p-2 rounded-lg">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">Nested Objects Training Portal</h1>
                <p className="text-sm text-slate-600">Personalized learning for property professionals</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-xs text-slate-500 uppercase tracking-wide">Progress</p>
                <p className="text-2xl font-bold text-blue-600">{progressPercentage}%</p>
              </div>
              <Trophy className={`w-8 h-8 ${progressPercentage === 100 ? 'text-yellow-500' : 'text-slate-300'}`} />
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <aside className="lg:col-span-1 space-y-6">
            {/* Role Selection */}
            <div className="bg-white rounded-xl shadow-md p-6 border border-slate-200">
              <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center">
                <Star className="w-5 h-5 mr-2 text-blue-600" />
                Your Role
              </h2>
              <div className="space-y-2">
                {(['Notary', 'Existing Inspector', 'Gig Worker', 'Realtor'] as Role[]).map(role => (
                  <button
                    key={role}
                    onClick={() => setSelectedRole(role)}
                    className={`w-full text-left px-4 py-3 rounded-lg transition-all duration-200 ${
                      selectedRole === role
                        ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md'
                        : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <span className="font-medium">{role}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Experience Level */}
            <div className="bg-white rounded-xl shadow-md p-6 border border-slate-200">
              <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center">
                <TrendingUp className="w-5 h-5 mr-2 text-blue-600" />
                Experience Level
              </h2>
              <div className="space-y-2">
                {(['Beginner', 'Novice', 'Veteran', 'Technically Advanced'] as ExperienceLevel[]).map(level => (
                  <button
                    key={level}
                    onClick={() => setSelectedLevel(level)}
                    className={`w-full text-left px-4 py-3 rounded-lg transition-all duration-200 text-sm ${
                      selectedLevel === level
                        ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md'
                        : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <span className="font-medium">{level}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Module Checklist */}
            <div className="bg-white rounded-xl shadow-md p-6 border border-slate-200">
              <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center">
                <BarChart3 className="w-5 h-5 mr-2 text-blue-600" />
                Modules ({completedModules}/{totalModules})
              </h2>
              <div className="space-y-2">
                {currentTrack.modules.map((module, index) => (
                  <button
                    key={module.id}
                    onClick={() => !module.locked && setCurrentModuleId(module.id)}
                    disabled={module.locked}
                    className={`w-full text-left px-3 py-2 rounded-lg transition-all duration-200 text-sm flex items-center justify-between ${
                      currentModuleId === module.id
                        ? 'bg-blue-100 border-2 border-blue-600 text-blue-900'
                        : module.locked
                        ? 'bg-slate-50 text-slate-400 cursor-not-allowed'
                        : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <span className="flex items-center space-x-2">
                      {userProgress[module.id] ? (
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      ) : module.locked ? (
                        <Lock className="w-4 h-4" />
                      ) : (
                        <div className="w-4 h-4 rounded-full border-2 border-slate-300" />
                      )}
                      <span className="truncate">{index + 1}. {module.title}</span>
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Stats */}
            <div className="bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl shadow-md p-6 text-white">
              <h3 className="text-sm font-semibold uppercase tracking-wide mb-4">Your Stats</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-blue-100">Completed</span>
                  <span className="text-xl font-bold">{completedModules}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-blue-100">Remaining</span>
                  <span className="text-xl font-bold">{totalModules - completedModules}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-blue-100">Badges Earned</span>
                  <span className="text-xl font-bold">{completedModules > 0 ? Math.floor(completedModules / 2) : 0}</span>
                </div>
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <main className="lg:col-span-3 space-y-6">
            {/* Track Description */}
            <div className="bg-white rounded-xl shadow-md p-6 border border-slate-200">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 mb-2">
                    {selectedRole} - {selectedLevel}
                  </h2>
                  <p className="text-slate-600">{currentTrack.description}</p>
                </div>
                <Award className={`w-12 h-12 ${progressPercentage === 100 ? 'text-yellow-500' : 'text-slate-300'}`} />
              </div>
              
              {/* Progress Bar */}
              <div className="mt-6">
                <div className="flex justify-between text-sm text-slate-600 mb-2">
                  <span>Overall Progress</span>
                  <span className="font-semibold">{progressPercentage}%</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 h-full rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${progressPercentage}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Module Content */}
            {currentModule && (
              <div className="bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden">
                {/* Module Header */}
                <div className="bg-gradient-to-r from-slate-800 to-slate-900 text-white p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {currentModule.type === 'video' && <Video className="w-6 h-6" />}
                      {currentModule.type === 'audio' && <Headphones className="w-6 h-6" />}
                      {currentModule.type === 'reading' && <BookOpen className="w-6 h-6" />}
                      {currentModule.type === 'interactive' && <Brain className="w-6 h-6" />}
                      {currentModule.type === 'quiz' && <Award className="w-6 h-6" />}
                      <div>
                        <h3 className="text-2xl font-bold">{currentModule.title}</h3>
                        <p className="text-slate-300 text-sm mt-1">{currentModule.type.toUpperCase()} • {currentModule.duration}</p>
                      </div>
                    </div>
                    {userProgress[currentModule.id] && (
                      <CheckCircle className="w-8 h-8 text-green-400" />
                    )}
                  </div>
                </div>

                {/* Module Body */}
                <div className="p-6">
                  {/* Video Content */}
                  {currentModule.type === 'video' && currentModule.videoUrl && (
                    <div className="mb-6">
                      <div className="aspect-video bg-slate-900 rounded-lg overflow-hidden">
                        <iframe
                          width="100%"
                          height="100%"
                          src={currentModule.videoUrl}
                          title={currentModule.title}
                          frameBorder="0"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                          className="w-full h-full"
                        />
                      </div>
                    </div>
                  )}

                  {/* Audio Content */}
                  {currentModule.type === 'audio' && (
                    <div className="mb-6 bg-gradient-to-r from-purple-100 to-pink-100 p-6 rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="bg-purple-600 p-4 rounded-full">
                          <Headphones className="w-8 h-8 text-white" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm text-slate-600 mb-2">Audio Lesson</p>
                          <div className="w-full bg-white rounded-full h-2 mb-2">
                            <div className="bg-purple-600 h-full rounded-full" style={{ width: '0%' }} />
                          </div>
                          <div className="flex justify-between text-xs text-slate-600">
                            <span>0:00</span>
                            <span>{currentModule.duration}</span>
                          </div>
                        </div>
                        <button className="bg-purple-600 hover:bg-purple-700 text-white p-3 rounded-full transition-colors">
                          <PlayCircle className="w-6 h-6" />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Interactive Demo */}
                  {currentModule.type === 'interactive' && (
                    <div className="mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 p-8 rounded-lg border-2 border-blue-200">
                      <div className="text-center">
                        <Brain className="w-16 h-16 text-blue-600 mx-auto mb-4" />
                        <h4 className="text-xl font-bold text-slate-900 mb-2">Interactive Learning Module</h4>
                        <p className="text-slate-600 mb-4">This module includes hands-on practice with real scenarios</p>
                        <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors">
                          Launch Interactive Demo
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Content Description */}
                  <div className="prose max-w-none mb-6">
                    <p className="text-slate-700 leading-relaxed">{currentModule.content}</p>
                  </div>

                  {/* Quiz Section */}
                  {currentModule.quiz && (
                    <div className="mt-8 border-t border-slate-200 pt-6">
                      <h4 className="text-xl font-bold text-slate-900 mb-4 flex items-center">
                        <Award className="w-6 h-6 mr-2 text-yellow-500" />
                        Knowledge Check
                      </h4>
                      
                      {!showQuizResults ? (
                        <div className="space-y-6">
                          {currentModule.quiz.questions.map((question, qIndex) => (
                            <div key={question.id} className="bg-slate-50 p-5 rounded-lg">
                              <p className="font-semibold text-slate-900 mb-3">
                                {qIndex + 1}. {question.question}
                              </p>
                              <div className="space-y-2">
                                {question.options.map((option, oIndex) => (
                                  <label
                                    key={oIndex}
                                    className={`flex items-center p-3 rounded-lg border-2 cursor-pointer transition-all ${
                                      quizAnswers[question.id] === oIndex
                                        ? 'border-blue-600 bg-blue-50'
                                        : 'border-slate-200 hover:border-slate-300 bg-white'
                                    }`}
                                  >
                                    <input
                                      type="radio"
                                      name={question.id}
                                      value={oIndex}
                                      checked={quizAnswers[question.id] === oIndex}
                                      onChange={() => setQuizAnswers(prev => ({
                                        ...prev,
                                        [question.id]: oIndex
                                      }))}
                                      className="mr-3"
                                    />
                                    <span className="text-slate-700">{option}</span>
                                  </label>
                                ))}
                              </div>
                            </div>
                          ))}
                          
                          <button
                            onClick={handleQuizSubmit}
                            disabled={Object.keys(quizAnswers).length !== currentModule.quiz.questions.length}
                            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:from-slate-300 disabled:to-slate-400 text-white py-4 rounded-lg font-semibold transition-all disabled:cursor-not-allowed"
                          >
                            Submit Quiz
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {/* Quiz Results */}
                          <div className={`p-6 rounded-lg border-2 ${
                            quizScore >= 70 ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'
                          }`}>
                            <div className="text-center">
                              <div className="text-6xl mb-2">
                                {quizScore >= 90 ? '🌟' : quizScore >= 70 ? '👍' : quizScore >= 50 ? '💡' : '🔄'}
                              </div>
                              <h5 className="text-2xl font-bold text-slate-900 mb-2">
                                Your Score: {quizScore}%
                              </h5>
                              <p className="text-slate-700">
                                {quizScore >= 70 ? 'Congratulations! You passed!' : 'Keep trying! Review the material and try again.'}
                              </p>
                            </div>
                          </div>

                          {/* AI Avatar Feedback */}
                          {aiResponse && (
                            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-6 rounded-lg border-2 border-indigo-200">
                              <div className="flex items-start space-x-4">
                                <div className="text-4xl">{aiResponse.avatar}</div>
                                <div>
                                  <h6 className="font-semibold text-slate-900 mb-1">AI Learning Coach</h6>
                                  <p className={`${aiResponse.color} font-medium`}>{aiResponse.message}</p>
                                </div>
                              </div>
                            </div>
                          )}

                          {quizScore < 70 && (
                            <button
                              onClick={handleRetakeQuiz}
                              className="w-full bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700 text-white py-4 rounded-lg font-semibold transition-all"
                            >
                              Retake Quiz
                            </button>
                          )}

                          {quizScore >= 70 && (
                            <div className="flex space-x-3">
                              <button
                                onClick={handleRetakeQuiz}
                                className="flex-1 bg-slate-200 hover:bg-slate-300 text-slate-700 py-3 rounded-lg font-semibold transition-all"
                              >
                                Review Quiz
                              </button>
                              <button
                                onClick={() => {
                                  const currentIndex = currentTrack.modules.findIndex(m => m.id === currentModuleId);
                                  if (currentIndex < currentTrack.modules.length - 1) {
                                    setCurrentModuleId(currentTrack.modules[currentIndex + 1].id);
                                    setShowQuizResults(false);
                                    setQuizAnswers({});
                                  }
                                }}
                                className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white py-3 rounded-lg font-semibold transition-all flex items-center justify-center"
                              >
                                Next Module <ChevronRight className="w-5 h-5 ml-1" />
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Complete Module Button (for non-quiz modules) */}
                  {!currentModule.quiz && !userProgress[currentModule.id] && (
                    <button
                      onClick={handleCompleteModule}
                      className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white py-4 rounded-lg font-semibold transition-all flex items-center justify-center mt-6"
                    >
                      <CheckCircle className="w-5 h-5 mr-2" />
                      Mark as Complete
                    </button>
                  )}

                  {/* Navigation */}
                  <div className="flex justify-between mt-6 pt-6 border-t border-slate-200">
                    <button
                      onClick={() => {
                        const currentIndex = currentTrack.modules.findIndex(m => m.id === currentModuleId);
                        if (currentIndex > 0) {
                          setCurrentModuleId(currentTrack.modules[currentIndex - 1].id);
                        }
                      }}
                      disabled={currentTrack.modules.findIndex(m => m.id === currentModuleId) === 0}
                      className="px-6 py-2 bg-slate-100 hover:bg-slate-200 disabled:bg-slate-50 disabled:text-slate-400 text-slate-700 rounded-lg font-medium transition-all disabled:cursor-not-allowed"
                    >
                      ← Previous
                    </button>
                    <button
                      onClick={() => {
                        const currentIndex = currentTrack.modules.findIndex(m => m.id === currentModuleId);
                        if (currentIndex < currentTrack.modules.length - 1 && !currentTrack.modules[currentIndex + 1].locked) {
                          setCurrentModuleId(currentTrack.modules[currentIndex + 1].id);
                        }
                      }}
                      disabled={
                        currentTrack.modules.findIndex(m => m.id === currentModuleId) === currentTrack.modules.length - 1 ||
                        currentTrack.modules[currentTrack.modules.findIndex(m => m.id === currentModuleId) + 1]?.locked
                      }
                      className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white rounded-lg font-medium transition-all disabled:cursor-not-allowed"
                    >
                      Next →
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Celebration Animation */}
            {showCelebration && (
              <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-50">
                <div className="bg-white rounded-2xl shadow-2xl p-8 transform animate-bounce">
                  <div className="text-center">
                    <div className="text-6xl mb-4">🎉</div>
                    <h3 className="text-2xl font-bold text-slate-900">Module Complete!</h3>
                    <p className="text-slate-600 mt-2">Great job! Keep up the momentum!</p>
                  </div>
                </div>
              </div>
            )}

            {/* Completion Certificate */}
            {progressPercentage === 100 && (
              <div className="bg-gradient-to-br from-yellow-50 to-orange-50 border-4 border-yellow-400 rounded-xl p-8 text-center">
                <Trophy className="w-20 h-20 text-yellow-500 mx-auto mb-4" />
                <h3 className="text-3xl font-bold text-slate-900 mb-2">🎓 Congratulations!</h3>
                <p className="text-xl text-slate-700 mb-4">
                  You&apos;ve completed the {selectedRole} - {selectedLevel} training track!
                </p>
                <button className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white px-8 py-4 rounded-lg font-bold text-lg transition-all shadow-lg">
                  Download Certificate
                </button>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
