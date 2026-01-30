'use client';

import React, { useState, useMemo } from 'react';
import {
  Award, CheckCircle, XCircle, ChevronRight, ChevronLeft,
  RotateCcw, Target, AlertTriangle, Trophy, Clock
} from 'lucide-react';

interface QuizQuestion {
  id: number;
  type: 'multiple-choice' | 'true-false' | 'scenario';
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  category: string;
}

interface Module1QuizProps {
  onComplete?: (passed: boolean) => void;
}

const quizQuestions: QuizQuestion[] = [
  {
    id: 1,
    type: 'multiple-choice',
    question: "What are the minimum and preferred photo resolutions for inspection photos?",
    options: [
      "800x600 minimum, 1024x768 preferred",
      "1024x768 minimum, 1600x1200 preferred",
      "1600x1200 minimum, 2048x1536 preferred",
      "640x480 minimum, 800x600 preferred"
    ],
    correctAnswer: 1,
    explanation: "The industry standard requires a minimum of 1024x768 pixels, with 1600x1200 preferred for clarity in documentation.",
    category: "Photography"
  },
  {
    id: 2,
    type: 'multiple-choice',
    question: "What is the required aspect ratio for all inspection photos?",
    options: ["16:9", "4:3", "1:1", "3:2"],
    correctAnswer: 1,
    explanation: "A 4:3 aspect ratio is required as it provides the best balance for property documentation.",
    category: "Photography"
  },
  {
    id: 3,
    type: 'multiple-choice',
    question: "How many different mapping programs must be used before marking a property as 'Unable to Locate'?",
    options: ["One", "Two", "Three", "Four"],
    correctAnswer: 2,
    explanation: "Three different mapping programs must be consulted to verify the address cannot be found.",
    category: "Property Location"
  },
  {
    id: 4,
    type: 'multiple-choice',
    question: "What is the maximum allowable baluster spacing before it is considered a safety hazard?",
    options: ["2 inches", "4 inches", "6 inches", "8 inches"],
    correctAnswer: 1,
    explanation: "Baluster spacing greater than 4 inches is considered a hazard per building codes.",
    category: "Safety & Hazards"
  },
  {
    id: 5,
    type: 'multiple-choice',
    question: "When should you begin taking photos at a property?",
    options: [
      "Immediately upon arrival",
      "After parking in the driveway",
      "After knocking on the door to check if someone is home",
      "After completing the full exterior walk"
    ],
    correctAnswer: 2,
    explanation: "You should not take any photos until after you have knocked on the door to see if the insured is present.",
    category: "Client Interaction"
  },
  {
    id: 6,
    type: 'multiple-choice',
    question: "What items must NEVER appear in inspection photos?",
    options: [
      "Vehicles and landscaping",
      "People and time/date stamps",
      "Street signs and house numbers",
      "Fences and outbuildings"
    ],
    correctAnswer: 1,
    explanation: "Photos must never include people (privacy/liability) or burned-in time/date stamps.",
    category: "Photography"
  },
  {
    id: 7,
    type: 'multiple-choice',
    question: "What is the recommended sequence for exterior photos?",
    options: [
      "Random order based on obstacles",
      "Start at back, move to front",
      "Start at front with address, then clockwise or counter-clockwise",
      "Start at the roof, work down"
    ],
    correctAnswer: 2,
    explanation: "Start at the front for the address shot, then move systematically clockwise or counter-clockwise.",
    category: "Photography"
  },
  {
    id: 8,
    type: 'multiple-choice',
    question: "What does PCR stand for in field services?",
    options: [
      "Property Condition Report",
      "Professional Certified Review",
      "Primary Client Request",
      "Pre-Closing Review"
    ],
    correctAnswer: 0,
    explanation: "PCR stands for Property Condition Report, a standardized form documenting property status.",
    category: "Industry Terms"
  },
  {
    id: 9,
    type: 'true-false',
    question: "Vertical (portrait) orientation photos are acceptable if they better capture a tall structure.",
    options: ["True", "False"],
    correctAnswer: 1,
    explanation: "ALL photos must be horizontal (landscape). Vertical photos are the #1 reason for rejected reports.",
    category: "Photography"
  },
  {
    id: 10,
    type: 'true-false',
    question: "If an occupant asks you to leave, you should explain the importance of the inspection and continue.",
    options: ["True", "False"],
    correctAnswer: 1,
    explanation: "If someone asks you to leave, you must apologize and leave immediately. Never argue or continue.",
    category: "Client Interaction"
  },
  {
    id: 11,
    type: 'true-false',
    question: "Field inspectors should diagnose the cause of damage they observe.",
    options: ["True", "False"],
    correctAnswer: 1,
    explanation: "Field inspectors document WHAT they see, not WHY. Diagnosing causes is outside your scope.",
    category: "Scope of Practice"
  },
  {
    id: 12,
    type: 'scenario',
    question: "You arrive at a property and an aggressive dog is loose in the yard. What should you do?",
    options: [
      "Try to make friends with the dog using treats",
      "Take photos from the public sidewalk if possible, note 'dog on property' in your report",
      "Climb the fence to complete the inspection",
      "Call animal control to have the dog removed"
    ],
    correctAnswer: 1,
    explanation: "Never put yourself at risk. Document what you can from a safe distance and contact your client.",
    category: "Safety & Hazards"
  },
  {
    id: 13,
    type: 'scenario',
    question: "Your photos are blurry and the SLA is in 4 hours. What is your best course of action?",
    options: [
      "Submit the blurry photos",
      "Return to the property immediately to retake the photos",
      "Contact the client and request a 24-hour extension",
      "Mark the case as 'unable to complete'"
    ],
    correctAnswer: 1,
    explanation: "If time permits, return immediately to retake photos. Quality matters more than excuses.",
    category: "Quality Control"
  },
  {
    id: 14,
    type: 'scenario',
    question: "You observe water staining on a ceiling. How should you document this?",
    options: [
      "Water damage caused by roof leak",
      "Staining observed on ceiling - appears to be water damage",
      "Roof needs replacement due to leaking",
      "Plumbing failure has caused ceiling damage"
    ],
    correctAnswer: 1,
    explanation: "Document what you SEE, not what you THINK caused it. Use qualifiers like 'appears to be'.",
    category: "Scope of Practice"
  },
  {
    id: 15,
    type: 'scenario',
    question: "GPS took you to a property that doesn't match the description. The address is not visible. What should you do?",
    options: [
      "Submit the inspection anyway",
      "Leave without documenting anything",
      "Do NOT proceed - verify using multiple mapping sources and contact client",
      "Take photos of whatever house you are at"
    ],
    correctAnswer: 2,
    explanation: "Wrong address inspections are a top chargeback reason. Always verify before proceeding.",
    category: "Property Location"
  }
];

const PASS_THRESHOLD = 0.8;

const Module1Quiz: React.FC<Module1QuizProps> = ({ onComplete }) => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [showResults, setShowResults] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);
  const [quizStarted, setQuizStarted] = useState(false);

  const question = quizQuestions[currentQuestion];
  const totalQuestions = quizQuestions.length;

  const score = useMemo(() => {
    let correct = 0;
    Object.entries(selectedAnswers).forEach(([qId, answer]) => {
      const q = quizQuestions.find(q => q.id === parseInt(qId));
      if (q && q.correctAnswer === answer) {
        correct++;
      }
    });
    return correct;
  }, [selectedAnswers]);

  const percentage = Math.round((score / totalQuestions) * 100);
  const passed = percentage >= PASS_THRESHOLD * 100;

  const handleSelectAnswer = (answerIndex: number) => {
    if (showResults) return;
    setSelectedAnswers(prev => ({
      ...prev,
      [question.id]: answerIndex
    }));
    setShowExplanation(true);
  };

  const handleNext = () => {
    setShowExplanation(false);
    if (currentQuestion < totalQuestions - 1) {
      setCurrentQuestion(prev => prev + 1);
    } else {
      setShowResults(true);
      if (onComplete) {
        onComplete(passed);
      }
    }
  };

  const handlePrev = () => {
    setShowExplanation(false);
    if (currentQuestion > 0) {
      setCurrentQuestion(prev => prev - 1);
    }
  };

  const handleRestart = () => {
    setCurrentQuestion(0);
    setSelectedAnswers({});
    setShowResults(false);
    setShowExplanation(false);
    setQuizStarted(false);
  };

  const getQuestionTypeLabel = (type: string) => {
    switch (type) {
      case 'multiple-choice': return 'Multiple Choice';
      case 'true-false': return 'True or False';
      case 'scenario': return 'Scenario';
      default: return type;
    }
  };

  const getQuestionTypeColor = (type: string) => {
    switch (type) {
      case 'multiple-choice': return 'bg-blue-100 text-blue-700';
      case 'true-false': return 'bg-purple-100 text-purple-700';
      case 'scenario': return 'bg-amber-100 text-amber-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  if (!quizStarted) {
    return (
      <div className="text-center py-8">
        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <Award className="w-10 h-10 text-red-600" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Module 1 Assessment</h2>
        <p className="text-slate-600 mb-6 max-w-md mx-auto">
          Test your knowledge of field inspection fundamentals. You need 80% (12/15) to pass.
        </p>
        
        <div className="bg-slate-50 rounded-xl p-6 max-w-sm mx-auto mb-8">
          <div className="space-y-3 text-left">
            <div className="flex items-center gap-3">
              <Target className="w-5 h-5 text-slate-400" />
              <span className="text-slate-700">15 Questions</span>
            </div>
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-slate-400" />
              <span className="text-slate-700">~10-15 minutes</span>
            </div>
            <div className="flex items-center gap-3">
              <Award className="w-5 h-5 text-slate-400" />
              <span className="text-slate-700">80% to pass</span>
            </div>
          </div>
        </div>

        <button
          onClick={() => setQuizStarted(true)}
          className="px-8 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl transition"
        >
          Start Assessment
        </button>
      </div>
    );
  }

  if (showResults) {
    return (
      <div className="text-center py-8">
        <div className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 ${
          passed ? 'bg-emerald-100' : 'bg-red-100'
        }`}>
          {passed ? (
            <Trophy className="w-12 h-12 text-emerald-600" />
          ) : (
            <AlertTriangle className="w-12 h-12 text-red-600" />
          )}
        </div>

        <h2 className="text-3xl font-bold text-slate-900 mb-2">
          {passed ? 'Congratulations!' : 'Keep Practicing'}
        </h2>
        <p className="text-slate-600 mb-6">
          {passed 
            ? 'You passed the Module 1 Assessment!' 
            : 'You need 80% to pass. Review the material and try again.'}
        </p>

        <div className="bg-slate-50 rounded-2xl p-8 max-w-sm mx-auto mb-8">
          <div className="text-5xl font-bold text-slate-900 mb-2">{percentage}%</div>
          <div className="text-slate-500">{score} of {totalQuestions} correct</div>
          
          <div className="w-full h-3 bg-slate-200 rounded-full mt-4 overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all duration-1000 ${
                passed ? 'bg-emerald-500' : 'bg-red-500'
              }`}
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>

        <div className="flex items-center justify-center gap-4">
          <button
            onClick={handleRestart}
            className="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl transition flex items-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const selectedAnswer = selectedAnswers[question.id];
  const isCorrect = selectedAnswer === question.correctAnswer;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
          <div 
            className="h-full bg-emerald-500 transition-all duration-300"
            style={{ width: `${((currentQuestion + 1) / totalQuestions) * 100}%` }}
          />
        </div>
        <span className="text-sm font-medium text-slate-500">
          {currentQuestion + 1} / {totalQuestions}
        </span>
      </div>

      <div className="bg-slate-50 rounded-2xl p-8">
        <div className="flex items-center gap-2 mb-4">
          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getQuestionTypeColor(question.type)}`}>
            {getQuestionTypeLabel(question.type)}
          </span>
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-200 text-slate-600">
            {question.category}
          </span>
        </div>

        <h3 className="text-xl font-semibold text-slate-900 mb-6 leading-relaxed">
          {question.question}
        </h3>

        <div className="space-y-3">
          {question.options.map((option, index) => {
            const isSelected = selectedAnswer === index;
            const isCorrectAnswer = index === question.correctAnswer;
            const showFeedback = showExplanation && selectedAnswer !== undefined;

            let optionStyle = 'bg-white border-slate-200 hover:border-slate-300';
            if (showFeedback) {
              if (isCorrectAnswer) {
                optionStyle = 'bg-emerald-50 border-emerald-500 ring-2 ring-emerald-500/20';
              } else if (isSelected && !isCorrectAnswer) {
                optionStyle = 'bg-red-50 border-red-500 ring-2 ring-red-500/20';
              }
            } else if (isSelected) {
              optionStyle = 'bg-emerald-50 border-emerald-500 ring-2 ring-emerald-500/20';
            }

            return (
              <button
                key={index}
                onClick={() => handleSelectAnswer(index)}
                disabled={showExplanation}
                className={`w-full p-4 rounded-xl border-2 text-left transition flex items-start gap-3 ${optionStyle}`}
              >
                <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0 ${
                  showFeedback && isCorrectAnswer
                    ? 'bg-emerald-500 text-white'
                    : showFeedback && isSelected && !isCorrectAnswer
                      ? 'bg-red-500 text-white'
                      : isSelected
                        ? 'bg-emerald-500 text-white'
                        : 'bg-slate-100 text-slate-600'
                }`}>
                  {showFeedback && isCorrectAnswer ? (
                    <CheckCircle className="w-5 h-5" />
                  ) : showFeedback && isSelected && !isCorrectAnswer ? (
                    <XCircle className="w-5 h-5" />
                  ) : (
                    String.fromCharCode(65 + index)
                  )}
                </span>
                <span className="text-slate-700 pt-1">{option}</span>
              </button>
            );
          })}
        </div>

        {showExplanation && selectedAnswer !== undefined && (
          <div className={`mt-6 p-4 rounded-xl ${isCorrect ? 'bg-emerald-100' : 'bg-amber-100'}`}>
            <div className="flex items-start gap-3">
              {isCorrect ? (
                <CheckCircle className="w-5 h-5 text-emerald-600 mt-0.5" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
              )}
              <div>
                <p className={`font-semibold ${isCorrect ? 'text-emerald-800' : 'text-amber-800'}`}>
                  {isCorrect ? 'Correct!' : 'Not quite right'}
                </p>
                <p className={`text-sm mt-1 ${isCorrect ? 'text-emerald-700' : 'text-amber-700'}`}>
                  {question.explanation}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between">
        <button
          onClick={handlePrev}
          disabled={currentQuestion === 0}
          className="px-4 py-2 text-slate-600 hover:text-slate-900 disabled:opacity-50 flex items-center gap-2"
        >
          <ChevronLeft className="w-4 h-4" />
          Previous
        </button>

        {showExplanation ? (
          <button
            onClick={handleNext}
            className="px-6 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-lg transition flex items-center gap-2"
          >
            {currentQuestion === totalQuestions - 1 ? 'View Results' : 'Next'}
            <ChevronRight className="w-4 h-4" />
          </button>
        ) : (
          <div className="px-6 py-2 text-slate-400 text-sm">
            Select an answer to continue
          </div>
        )}
      </div>
    </div>
  );
};

export default Module1Quiz;