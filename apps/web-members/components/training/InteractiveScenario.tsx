import React, { useState } from 'react';
import {
  AlertTriangle, CheckCircle2, XCircle, ChevronRight,
  RotateCcw, BookOpen, User, Briefcase, Car, Home,
  MessageSquare, Camera, FileText, Award, ArrowRight
} from 'lucide-react';

/**
 * NESTED OBJECTS - INTERACTIVE SCENARIO TRAINER
 * Module 1: Orientation & Quick Start
 * 
 * Converts static PDF scenarios into branching decision trees
 * with immediate feedback and learning reinforcement.
 */

// Scenario Data Structure
const scenarios = {
  'career-transition-trap': {
    id: 'career-transition-trap',
    title: 'The Career Transition Trap',
    subtitle: 'The "Helpful" Realtor',
    audienceType: 'realtor',
    icon: Home,
    accentColor: 'amber',
    situation: {
      character: 'Sarah',
      background: 'A seasoned Realtor diversifying her income with property condition reports (PCRs)',
      context: 'Sarah arrives at a property 90 days delinquent. While performing her exterior walk-around, she notices a massive horizontal crack in the west foundation wall and water stains on the living room ceiling visible through a window.',
      complication: 'The homeowner, visibly distraught, meets Sarah in the driveway. Knowing Sarah is a "real estate professional," the owner begs for an assessment: "Is the house falling apart? How much will it cost to fix? Am I going to lose everything?"',
      instinct: 'Sarah\'s realtor instincts kick in—she wants to provide a repair estimate and a professional diagnosis to ease the owner\'s mind.',
    },
    decisions: [
      {
        id: 'diagnosis',
        question: 'The homeowner asks about the foundation. What does Sarah say?',
        options: [
          {
            id: 'a',
            text: 'Tell the owner the foundation is "failing" and needs a $15,000 piering job',
            isCorrect: false,
            feedback: {
              title: 'VIOLATION: Professional Overreach',
              message: 'As a field inspector, you are a documentarian, not a consultant. Providing repair estimates or diagnoses exceeds your professional authority and creates liability for both you and the lender.',
              consequence: 'The homeowner calls the lender citing your "expert opinion," triggering an FDCPA review.',
            }
          },
          {
            id: 'b',
            text: 'Say "I can\'t give you that assessment, but I can document what I see"',
            isCorrect: true,
            feedback: {
              title: 'CORRECT: Maintaining Boundaries',
              message: 'You correctly maintained the "bright line" between a home inspection and a field inspection. Your role is to document facts, not provide professional conclusions.',
              consequence: 'The homeowner may be frustrated, but you\'ve protected yourself and the lender from liability.',
            }
          },
          {
            id: 'c',
            text: 'Avoid the question and quickly finish the inspection',
            isCorrect: false,
            feedback: {
              title: 'PARTIAL: Unprofessional Exit',
              message: 'While avoiding the diagnosis is correct, rushing away without explanation damages your professional reputation and doesn\'t help the homeowner understand the process.',
              consequence: 'The homeowner may complain about your conduct, even if your report is technically correct.',
            }
          }
        ]
      },
      {
        id: 'vocabulary',
        question: 'The homeowner asks why you\'re there. What language do you use?',
        options: [
          {
            id: 'a',
            text: 'Explain that the house is in "foreclosure" and the bank sent you',
            isCorrect: false,
            feedback: {
              title: 'VIOLATION: FDCPA Trigger Words',
              message: 'Using terms like "foreclosure" or "default" with homeowners violates the Fair Debt Collection Practices Act. You are not authorized to communicate the status of their loan.',
              consequence: 'The lender flags you for FDCPA violation. Your contract is under review.',
            }
          },
          {
            id: 'b',
            text: 'Say you\'re conducting a "property condition report" for the servicer',
            isCorrect: true,
            feedback: {
              title: 'CORRECT: Neutral Language',
              message: 'Using neutral terms like "property condition report" and "servicer" communicates your purpose without making statements about the homeowner\'s loan status.',
              consequence: 'The homeowner understands your role without receiving debt collection information.',
            }
          },
          {
            id: 'c',
            text: 'Refuse to explain why you\'re there',
            isCorrect: false,
            feedback: {
              title: 'PARTIAL: Creates Suspicion',
              message: 'While protecting information is important, refusing to explain your presence entirely may escalate the situation or cause the homeowner to call police.',
              consequence: 'The interaction becomes confrontational, making documentation difficult.',
            }
          }
        ]
      },
      {
        id: 'report',
        question: 'How do you describe the foundation damage in your report?',
        options: [
          {
            id: 'a',
            text: '"Property is in terrible condition with major structural damage"',
            isCorrect: false,
            feedback: {
              title: 'VIOLATION: Subjective Language',
              message: '"Terrible" and "major" are subjective terms. Your report should contain only observable facts, not interpretations or emotional language.',
              consequence: 'Report rejected for subjective language. You must resubmit with objective prose.',
            }
          },
          {
            id: 'b',
            text: '"The foundation needs immediate repair to prevent collapse"',
            isCorrect: false,
            feedback: {
              title: 'VIOLATION: Professional Diagnosis',
              message: 'Stating something "needs repair" or predicting "collapse" is a professional diagnosis. You are not qualified to make structural assessments.',
              consequence: 'Report flagged for scope violation. Potential contract termination.',
            }
          },
          {
            id: 'c',
            text: '"A horizontal crack approximately 8 feet in length is visible on the west foundation wall"',
            isCorrect: true,
            feedback: {
              title: 'CORRECT: Objective Documentation',
              message: 'This describes exactly what you observed with measurable details. The lender\'s risk team can interpret the significance—that\'s their job, not yours.',
              consequence: 'Report accepted. Your professional, factual documentation is exactly what the lender needs.',
            }
          }
        ]
      }
    ],
    debrief: {
      keyLesson: 'Maintain the "bright line" between field inspection and home inspection.',
      coreRule: 'You are a documentarian, not a consultant. Document facts, not diagnoses.',
      audienceWarning: 'Realtors: Your instinct to help with professional advice is your biggest liability in this role.',
    }
  },
  'gig-worker-mindset': {
    id: 'gig-worker-mindset',
    title: 'The Gig Worker Mindset',
    subtitle: 'Speed vs. Quality',
    audienceType: 'gig-worker',
    icon: Car,
    accentColor: 'blue',
    situation: {
      character: 'Marcus',
      background: 'A former delivery driver used to a high-volume/low-pay model where speed is the only metric that matters',
      context: 'Marcus has a "batch" of 10 occupancy checks to complete before a 5:00 PM SLA deadline. It is raining, and he is behind schedule.',
      complication: 'At his fourth stop, Marcus considers staying in his dry car. He can see the front of the house from here. The grass is cut and a car is in the driveway.',
      instinct: 'Marcus assumes that as long as the photos show the house, he\'ll get paid his $50 fee. Speed has always been the key to his income.',
    },
    decisions: [
      {
        id: 'six-angle',
        question: 'It\'s raining. Does Marcus exit the vehicle to capture the full 6-angle sequence?',
        options: [
          {
            id: 'a',
            text: 'Stay in the car and take photos through the window to save time',
            isCorrect: false,
            feedback: {
              title: 'VIOLATION: "Car Parts" in Frame',
              message: 'Photos with visible mirrors, dashboards, or window frames are automatically rejected. They prove you didn\'t conduct the required physical survey.',
              consequence: 'Report rejected. "Car parts" visible in Front Elevation shot.',
            }
          },
          {
            id: 'b',
            text: 'Exit quickly, snap 2-3 photos of just the front, and move on',
            isCorrect: false,
            feedback: {
              title: 'INCOMPLETE: Missing Required Angles',
              message: 'The 6-angle sequence exists for a reason—it provides complete documentation of the property\'s exterior condition. Partial coverage is incomplete documentation.',
              consequence: 'Report flagged for missing angles. Return trip required at your expense.',
            }
          },
          {
            id: 'c',
            text: 'Exit the vehicle and complete the full 6-angle sequence despite the rain',
            isCorrect: true,
            feedback: {
              title: 'CORRECT: Professional Standards',
              message: 'Weather doesn\'t change the requirements. Proper gear (umbrella, rain jacket) is part of being a professional. The 6-angle sequence must be completed from outside the vehicle.',
              consequence: 'Report meets technical standards. Payment confirmed.',
            }
          }
        ]
      },
      {
        id: 'verification',
        question: 'There\'s a car in the driveway and the grass is cut. How does Marcus determine occupancy?',
        options: [
          {
            id: 'a',
            text: 'Mark it "Occupied" based on the car and grass maintenance',
            isCorrect: false,
            feedback: {
              title: 'VIOLATION: The "Hamburger Without Meat"',
              message: 'A car in a driveway could belong to a neighbor. Cut grass could be HOA maintenance. "Guessing" occupancy based on assumptions provides useless information to the lender.',
              consequence: 'The homeowner actually moved out 2 days ago. The car belongs to a neighbor. Your "Occupied" determination is wrong.',
            }
          },
          {
            id: 'b',
            text: 'Check utility meters and look for signs of life before making a determination',
            isCorrect: true,
            feedback: {
              title: 'CORRECT: The Occupancy Hierarchy',
              message: 'Signs of life: spinning electric meter, lit windows, mail being collected, trash cans at curb, pets, personal items. These are the indicators that prove occupancy—not assumptions.',
              consequence: 'You discover the electric meter is stopped and mail is piling up. You correctly determine "First-Time Vacant."',
            }
          },
          {
            id: 'c',
            text: 'Mark it "Unknown" since no one answered the door',
            isCorrect: false,
            feedback: {
              title: 'VIOLATION: The Useless Report',
              message: '"Unknown" is unacceptable. Lenders pay for a definitive determination based on visual cues. "No answer" is not the same as "unknown"—you can still observe signs of life.',
              consequence: 'Report rejected as incomplete. "Unknown" provides zero value to the lender.',
            }
          }
        ]
      },
      {
        id: 'quality',
        question: 'Marcus is behind schedule. How does he handle photo quality in the rain?',
        options: [
          {
            id: 'a',
            text: 'Upload whatever he got—the lender will understand it was raining',
            isCorrect: false,
            feedback: {
              title: 'REJECTION: Technical Standards Apply',
              message: 'Blurry, rain-streaked, or dark photos are rejected regardless of weather. Weather conditions don\'t excuse poor documentation.',
              consequence: 'Multiple photos rejected for quality. Return trip required.',
            }
          },
          {
            id: 'b',
            text: 'Review each photo before leaving the property and retake any that are unclear',
            isCorrect: true,
            feedback: {
              title: 'CORRECT: First-Time Pass Rate',
              message: 'Success in field services comes from the "First-Time Pass" rate. Taking 30 extra seconds to verify quality saves the 30+ minutes of a return trip.',
              consequence: 'All photos meet technical standards. Report accepted on first submission.',
            }
          },
          {
            id: 'c',
            text: 'Skip this property entirely and come back tomorrow when it\'s sunny',
            isCorrect: false,
            feedback: {
              title: 'VIOLATION: SLA Deadline',
              message: 'Missing an SLA deadline means the report may be reassigned and your payment forfeited. Professional inspectors work in all weather conditions.',
              consequence: 'You miss the 5:00 PM SLA. Report reassigned to another inspector.',
            }
          }
        ]
      }
    ],
    debrief: {
      keyLesson: 'Field services rewards routing efficiency, not cutting technical corners.',
      coreRule: 'A report without high-quality, verifiable photos is considered incomplete or fraudulent.',
      audienceWarning: 'Gig Workers: Speed got you here, but quality keeps you earning. This is forensic data collection, not pizza delivery.',
    }
  }
};

const InteractiveScenario = ({ scenarioId = 'career-transition-trap' }: { scenarioId?: keyof typeof scenarios }) => {
  const scenario = scenarios[scenarioId];
  const [currentStage, setCurrentStage] = useState('intro'); // intro, decision, feedback, debrief
  const [currentDecisionIndex, setCurrentDecisionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<any>(null);
  const [answers, setAnswers] = useState<{ decisionId: string; optionId: string; isCorrect: boolean }[]>([]);
  const [showFeedback, setShowFeedback] = useState(false);

  const currentDecision = scenario.decisions[currentDecisionIndex];
  const correctAnswers = answers.filter(a => a.isCorrect).length;
  const totalDecisions = scenario.decisions.length;

  const accentColors = {
    amber: {
      bg: 'bg-amber-500/20',
      border: 'border-amber-500/30',
      text: 'text-amber-400',
      ring: 'ring-amber-500/20',
    },
    blue: {
      bg: 'bg-blue-500/20',
      border: 'border-blue-500/30',
      text: 'text-blue-400',
      ring: 'ring-blue-500/20',
    },
  };

  const colors = accentColors[scenario.accentColor as keyof typeof accentColors];

  const handleOptionSelect = (option: any) => {
    setSelectedOption(option);
    setShowFeedback(true);
    setAnswers([...answers, { decisionId: currentDecision.id, optionId: option.id, isCorrect: option.isCorrect }]);
  };

  const handleContinue = () => {
    if (currentDecisionIndex < scenario.decisions.length - 1) {
      setCurrentDecisionIndex(currentDecisionIndex + 1);
      setSelectedOption(null);
      setShowFeedback(false);
    } else {
      setCurrentStage('debrief');
    }
  };

  const handleRestart = () => {
    setCurrentStage('intro');
    setCurrentDecisionIndex(0);
    setSelectedOption(null);
    setAnswers([]);
    setShowFeedback(false);
  };

  const IconComponent = scenario.icon;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
      {/* Header */}
      <div className={`${colors.bg} ${colors.border} border-b px-6 py-5`}>
        <div className="flex items-center gap-3 mb-2">
          <div className={`w-10 h-10 rounded-xl ${colors.bg} ${colors.border} border flex items-center justify-center`}>
            <IconComponent className={`w-5 h-5 ${colors.text}`} />
          </div>
          <div>
            <div className={`text-xs font-semibold uppercase tracking-wider ${colors.text}`}>
              Interactive Scenario
            </div>
            <h2 className="text-lg font-bold text-slate-900">{scenario.title}</h2>
          </div>
        </div>
        <p className="text-sm text-slate-600">{scenario.subtitle}</p>

        {/* Progress Dots */}
        {currentStage === 'decision' && (
          <div className="flex items-center gap-2 mt-4">
            {scenario.decisions.map((_, index) => (
              <div
                key={index}
                className={`h-2 rounded-full transition-all ${index < currentDecisionIndex
                  ? 'w-8 bg-emerald-500'
                  : index === currentDecisionIndex
                    ? 'w-8 bg-slate-900'
                    : 'w-2 bg-slate-300'
                  }`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-6">
        {/* INTRO STAGE */}
        {currentStage === 'intro' && (
          <div className="space-y-6">
            {/* Character Card */}
            <div className="flex items-start gap-4 p-4 bg-slate-50 rounded-xl">
              <div className="w-12 h-12 rounded-full bg-slate-200 flex items-center justify-center">
                <User className="w-6 h-6 text-slate-600" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900">{scenario.situation.character}</h3>
                <p className="text-sm text-slate-600">{scenario.situation.background}</p>
              </div>
            </div>

            {/* Situation */}
            <div>
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                The Situation
              </h4>
              <p className="text-slate-700 leading-relaxed">
                {scenario.situation.context}
              </p>
            </div>

            {/* Complication */}
            <div className={`p-4 ${colors.bg} ${colors.border} border rounded-xl`}>
              <h4 className={`text-xs font-semibold ${colors.text} uppercase tracking-wider mb-2`}>
                The Complication
              </h4>
              <p className="text-slate-700 leading-relaxed">
                {scenario.situation.complication}
              </p>
            </div>

            {/* Instinct */}
            <div className="flex items-start gap-3 p-4 bg-slate-100 rounded-xl">
              <MessageSquare className="w-5 h-5 text-slate-500 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                  The Instinct
                </h4>
                <p className="text-sm text-slate-600 italic">
                  {scenario.situation.instinct}
                </p>
              </div>
            </div>

            {/* Start Button */}
            <button
              onClick={() => setCurrentStage('decision')}
              className="w-full py-4 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-xl transition flex items-center justify-center gap-2"
            >
              Begin Scenario
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* DECISION STAGE */}
        {currentStage === 'decision' && (
          <div className="space-y-6">
            {/* Decision Counter */}
            <div className="text-sm text-slate-500">
              Decision {currentDecisionIndex + 1} of {totalDecisions}
            </div>

            {/* Question */}
            <div className="p-4 bg-slate-900 text-white rounded-xl">
              <h3 className="font-semibold text-lg">
                {currentDecision.question}
              </h3>
            </div>

            {/* Options */}
            <div className="space-y-3">
              {currentDecision.options.map((option) => {
                const isSelected = selectedOption?.id === option.id;
                const showResult = showFeedback && isSelected;

                return (
                  <button
                    key={option.id}
                    onClick={() => !showFeedback && handleOptionSelect(option)}
                    disabled={showFeedback}
                    className={`w-full p-4 rounded-xl border text-left transition ${showResult
                      ? option.isCorrect
                        ? 'bg-emerald-50 border-emerald-500 ring-2 ring-emerald-500/20'
                        : 'bg-red-50 border-red-500 ring-2 ring-red-500/20'
                      : showFeedback
                        ? 'bg-slate-50 border-slate-200 opacity-50'
                        : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${showResult
                        ? option.isCorrect
                          ? 'bg-emerald-500 text-white'
                          : 'bg-red-500 text-white'
                        : 'bg-slate-100 text-slate-600'
                        }`}>
                        {showResult ? (
                          option.isCorrect ? <CheckCircle2 className="w-5 h-5" /> : <XCircle className="w-5 h-5" />
                        ) : (
                          option.id.toUpperCase()
                        )}
                      </div>
                      <p className="text-slate-700 flex-1">{option.text}</p>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Feedback */}
            {showFeedback && selectedOption && (
              <div className={`p-5 rounded-xl ${selectedOption.isCorrect ? 'bg-emerald-50 border border-emerald-200' : 'bg-red-50 border border-red-200'
                }`}>
                <div className="flex items-start gap-3">
                  {selectedOption.isCorrect ? (
                    <CheckCircle2 className="w-6 h-6 text-emerald-600 flex-shrink-0" />
                  ) : (
                    <XCircle className="w-6 h-6 text-red-600 flex-shrink-0" />
                  )}
                  <div>
                    <h4 className={`font-bold ${selectedOption.isCorrect ? 'text-emerald-800' : 'text-red-800'}`}>
                      {selectedOption.feedback.title}
                    </h4>
                    <p className="text-sm text-slate-700 mt-1">
                      {selectedOption.feedback.message}
                    </p>
                    <p className={`text-sm font-medium mt-2 ${selectedOption.isCorrect ? 'text-emerald-700' : 'text-red-700'}`}>
                      Consequence: {selectedOption.feedback.consequence}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Continue Button */}
            {showFeedback && (
              <button
                onClick={handleContinue}
                className="w-full py-4 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-xl transition flex items-center justify-center gap-2"
              >
                {currentDecisionIndex < totalDecisions - 1 ? 'Next Decision' : 'View Debrief'}
                <ArrowRight className="w-5 h-5" />
              </button>
            )}
          </div>
        )}

        {/* DEBRIEF STAGE */}
        {currentStage === 'debrief' && (
          <div className="space-y-6">
            {/* Score */}
            <div className="text-center p-6 bg-slate-50 rounded-xl">
              <div className={`text-5xl font-bold ${correctAnswers === totalDecisions ? 'text-emerald-600' :
                correctAnswers >= totalDecisions / 2 ? 'text-amber-600' : 'text-red-600'
                }`}>
                {correctAnswers}/{totalDecisions}
              </div>
              <p className="text-slate-600 mt-2">Correct Decisions</p>
              {correctAnswers === totalDecisions && (
                <div className="mt-3 flex items-center justify-center gap-2 text-emerald-600">
                  <Award className="w-5 h-5" />
                  <span className="font-semibold">Perfect Score!</span>
                </div>
              )}
            </div>

            {/* Key Lesson */}
            <div className="p-5 bg-slate-900 text-white rounded-xl">
              <h4 className="text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-2">
                Key Lesson
              </h4>
              <p className="text-lg font-medium">
                {scenario.debrief.keyLesson}
              </p>
            </div>

            {/* Core Rule */}
            <div className="flex items-start gap-3 p-4 bg-emerald-50 rounded-xl border border-emerald-200">
              <BookOpen className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-semibold text-emerald-800">The Core Rule</h4>
                <p className="text-sm text-emerald-700 mt-1">{scenario.debrief.coreRule}</p>
              </div>
            </div>

            {/* Audience Warning */}
            <div className={`flex items-start gap-3 p-4 ${colors.bg} rounded-xl ${colors.border} border`}>
              <AlertTriangle className={`w-5 h-5 ${colors.text} flex-shrink-0 mt-0.5`} />
              <div>
                <h4 className={`text-sm font-semibold ${colors.text}`}>Audience-Specific Warning</h4>
                <p className="text-sm text-slate-700 mt-1">{scenario.debrief.audienceWarning}</p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={handleRestart}
                className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl transition flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                Try Again
              </button>
              <button
                className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-400 text-white font-semibold rounded-xl transition flex items-center justify-center gap-2"
              >
                Continue to Next Lesson
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Scenario Selector Component
export const ScenarioSelector = ({ onSelect }: { onSelect: (id: string) => void }) => {
  return (
    <div className="grid md:grid-cols-2 gap-4">
      {Object.values(scenarios).map((scenario) => {
        const IconComponent = scenario.icon;
        const colors = scenario.accentColor === 'amber'
          ? { bg: 'bg-amber-50', border: 'border-amber-200', icon: 'bg-amber-100', iconColor: 'text-amber-600' }
          : { bg: 'bg-blue-50', border: 'border-blue-200', icon: 'bg-blue-100', iconColor: 'text-blue-600' };

        return (
          <button
            key={scenario.id}
            onClick={() => onSelect(scenario.id)}
            className={`p-5 ${colors.bg} ${colors.border} border rounded-xl text-left hover:shadow-md transition group`}
          >
            <div className="flex items-start gap-4">
              <div className={`w-12 h-12 rounded-xl ${colors.icon} flex items-center justify-center group-hover:scale-105 transition`}>
                <IconComponent className={`w-6 h-6 ${colors.iconColor}`} />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-slate-900 group-hover:text-slate-700">
                  {scenario.title}
                </h3>
                <p className="text-sm text-slate-600 mt-1">{scenario.subtitle}</p>
                <div className="flex items-center gap-2 mt-3 text-xs text-slate-500">
                  <span className="px-2 py-0.5 bg-white rounded-full">{scenario.decisions.length} decisions</span>
                  <span className="px-2 py-0.5 bg-white rounded-full capitalize">{scenario.audienceType.replace('-', ' ')}</span>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-slate-600 transition" />
            </div>
          </button>
        );
      })}
    </div>
  );
};

export default InteractiveScenario;
