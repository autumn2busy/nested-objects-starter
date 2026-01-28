import React, { useState } from 'react';
import {
  Target, CheckCircle2, XCircle, ChevronRight,
  Award, RotateCcw, Clock, AlertTriangle, BookOpen,
  ArrowRight, Home, Car, FileText, Users
} from 'lucide-react';

/**
 * NESTED OBJECTS - MODULE 1 QUIZ
 * 15 Questions from Quiz.pdf
 * - 8 Multiple Choice
 * - 3 True/False
 * - 4 Scenario-Based
 * 
 * Passing Score: 80% (12/15)
 */

const quizQuestions = [
  // MULTIPLE CHOICE (1-8)
  {
    id: 1,
    type: 'multiple-choice',
    category: 'Core Concepts',
    question: 'What is the primary purpose of a Property Condition Report (PCR) in the mortgage field services industry?',
    options: [
      { id: 'a', text: 'To provide a diagnostic evaluation of structural systems for a homebuyer.' },
      { id: 'b', text: 'To document observable facts about an asset\'s condition for a lender.' },
      { id: 'c', text: 'To estimate the cost of necessary repairs to increase property value.' },
      { id: 'd', text: 'To verify that a property meets all local building and safety codes.' },
    ],
    correctAnswer: 'b',
    explanation: 'A field inspector is a specialized documentarian providing empirical data for lenders to manage risk.',
    incorrectFeedback: {
      a: 'This describes a home inspection for a consumer.',
      c: 'Field inspectors never provide repair estimates; they only document what is seen.',
      d: 'Code compliance is the job of a government building inspector, not a mortgage field inspector.',
    }
  },
  {
    id: 2,
    type: 'multiple-choice',
    category: 'Business Operations',
    question: 'As an independent contractor in this field, how is your income typically structured?',
    options: [
      { id: 'a', text: 'An hourly wage with a guaranteed minimum of 40 hours per week.' },
      { id: 'b', text: 'A per-inspection fee with no taxes or Medicare deducted from your pay.' },
      { id: 'c', text: 'A commission based on the final sale price of the foreclosed property.' },
      { id: 'd', text: 'A flat monthly salary provided by a single regional firm.' },
    ],
    correctAnswer: 'b',
    explanation: 'You are self-employed and paid on a per-job basis, allowing you to scale income by increasing efficiency.',
    incorrectFeedback: {
      a: 'Field work is volume-based, not a traditional hourly employee role.',
      c: 'Income is not tied to property value or sales; it is tied to the completion of the report.',
      d: 'Independent contractors often work for multiple clients to maximize volume and income.',
    }
  },
  {
    id: 3,
    type: 'multiple-choice',
    category: 'Photography',
    question: 'Which of the following is a mandatory component of the "6-Angle Rule" for exterior inspections?',
    options: [
      { id: 'a', text: 'A photo of the inspector standing in front of the property to prove presence.' },
      { id: 'b', text: 'A photo of the nearest street sign to verify the location within the neighborhood.' },
      { id: 'c', text: 'An interior shot of the furnace and water heater.' },
      { id: 'd', text: 'A photo taken through the windshield to show the approach to the house.' },
    ],
    correctAnswer: 'b',
    explanation: 'The street sign proves the inspector is in the correct location and neighborhood.',
    incorrectFeedback: {
      a: 'Inspectors must never be visible in their own photos.',
      c: 'While required for interior inspections, this is not part of the standard 6-Angle exterior rule.',
      d: 'Photos must never be taken through a car window or windshield.',
    }
  },
  {
    id: 4,
    type: 'multiple-choice',
    category: 'Terminology',
    question: 'What does the term SLA (Service Level Agreement) refer to in your work order?',
    options: [
      { id: 'a', text: 'The amount of insurance coverage the inspector must carry.' },
      { id: 'b', text: 'The specific code used to enter a lockbox.' },
      { id: 'c', text: 'The contractual deadline for the completion and submission of your report.' },
      { id: 'd', text: 'The legal agreement between the homeowner and the mortgage lender.' },
    ],
    correctAnswer: 'c',
    explanation: 'SLAs are the deadlines (typically 3–7 days) that govern the delivery of an inspection.',
    incorrectFeedback: {
      a: 'While insurance is required, it is not what "SLA" stands for.',
      b: 'Lockbox codes are usually found in the "Info/Comments" tab.',
      d: 'The SLA is the agreement between the inspector/vendor and the client regarding performance.',
    }
  },
  {
    id: 5,
    type: 'multiple-choice',
    category: 'Equipment',
    question: 'Which tool is essential for checking the presence of electricity at a vacant property without touching potentially live wires?',
    options: [
      { id: 'a', text: 'A digital multimeter.' },
      { id: 'b', text: 'A non-contact volt stick (voltage tester).' },
      { id: 'c', text: 'A standard HUD key set.' },
      { id: 'd', text: 'A thermal imaging camera.' },
    ],
    correctAnswer: 'b',
    explanation: 'A $10 volt stick allows you to safely check for active power at an exterior outlet.',
    incorrectFeedback: {
      a: 'Multimeters require contact with wires, which is invasive and outside your scope.',
      c: 'HUD keys are for access, not for testing utilities.',
      d: 'Thermal cameras are advanced diagnostic tools used by home inspectors, not required for basic field work.',
    }
  },
  {
    id: 6,
    type: 'multiple-choice',
    category: 'Safety',
    question: 'If you encounter a dog while on a property, what is the recommended safety protocol?',
    options: [
      { id: 'a', text: 'Run back to your vehicle as quickly as possible to trigger the dog\'s retreat.' },
      { id: 'b', text: 'Make direct eye contact to establish dominance over the animal.' },
      { id: 'c', text: 'Stand still and remain calm with the side of your body facing the dog.' },
      { id: 'd', text: 'Shout loudly to alert the neighbors and scare the dog away.' },
    ],
    correctAnswer: 'c',
    explanation: 'Remaining still and avoiding direct eye contact prevents triggering the dog\'s prey instinct.',
    incorrectFeedback: {
      a: 'Running triggers a "prey instinct," making a chase and bite more likely.',
      b: 'Direct eye contact can be perceived as a challenge or threat by an aggressive dog.',
      d: 'Loud noises and panic can escalate a dog\'s aggression.',
    }
  },
  {
    id: 7,
    type: 'multiple-choice',
    category: 'Occupancy',
    question: 'Which of these is considered a "Primary Indicator" that a property is occupied?',
    options: [
      { id: 'a', text: 'The lawn is freshly mowed and manicured.' },
      { id: 'b', text: 'An electric meter with a spinning dial or digital readout.' },
      { id: 'c', text: 'Personal property like a grill or patio furniture is visible.' },
      { id: 'd', text: 'The occupant answers the door and confirms residency.' },
    ],
    correctAnswer: 'd',
    explanation: 'Direct confirmation from an occupant is the highest level of occupancy evidence.',
    incorrectFeedback: {
      a: 'This is a "Secondary Indicator" as it could be maintained by a preservation company.',
      b: 'A spinning meter is a strong technical cue, but direct confirmation or "signs of life" are preferred.',
      c: 'Furniture indicates property, but "Furniture does not occupy property. People occupy property."',
    }
  },
  {
    id: 8,
    type: 'multiple-choice',
    category: 'Photography',
    question: 'What is the standard technical requirement for all inspection photos?',
    options: [
      { id: 'a', text: 'High-resolution Portrait mode to capture tall buildings.' },
      { id: 'b', text: 'Landscape mode (horizontal) to fit standard lender viewing portals.' },
      { id: 'c', text: 'Black and white filters to highlight structural cracks.' },
      { id: 'd', text: 'Zoomed-in shots only to save on file size.' },
    ],
    correctAnswer: 'b',
    explanation: 'Landscape mode is the industry standard; portrait shots are frequently rejected.',
    incorrectFeedback: {
      a: 'Portrait mode is specifically cited as a common reason for report rejection.',
      c: 'Photos must be clear and represent actual conditions, requiring standard color.',
      d: 'The "Front Elevation" shot must show the entire roofline with space on all sides for context.',
    }
  },
  // TRUE/FALSE (9-11)
  {
    id: 9,
    type: 'true-false',
    category: 'Compliance',
    question: 'Because you represent the lender, you are authorized to discuss the borrower\'s late payments or foreclosure status during a door knock.',
    correctAnswer: false,
    explanation: 'Discussing delinquency is a violation of the Fair Debt Collection Practices Act (FDCPA). You are a documentarian, not a debt collector.',
    detailedExplanation: 'Using "trigger words" like arrears or foreclosure can lead to severe legal penalties for you and the firm.',
  },
  {
    id: 10,
    type: 'true-false',
    category: 'Business Operations',
    question: 'As an independent contractor, you are responsible for your own online security, vehicle maintenance, and fuel costs.',
    correctAnswer: true,
    explanation: 'You operate as a "mobile office" and must maintain your own equipment, though these are often tax-deductible.',
    detailedExplanation: 'You are a sole proprietor entitled to tax write-offs for mileage, phone bills, and home office space.',
  },
  {
    id: 11,
    type: 'true-false',
    category: 'Photography',
    question: 'A photo containing a portion of your car\'s dashboard or side-mirror is acceptable as long as the house is clearly visible.',
    correctAnswer: false,
    explanation: 'The presence of car parts indicates a "drive-by" inspection, which violates contracts requiring a full visual survey.',
    detailedExplanation: 'Reports with "car parts" are rejected immediately because they fail to prove you exited the vehicle.',
  },
  // SCENARIO-BASED (12-15)
  {
    id: 12,
    type: 'scenario',
    category: 'Realtor Transition',
    audienceType: 'realtor',
    scenario: 'You are inspecting a home with a visible crack in the foundation. The homeowner asks you, "Is my house safe to live in?"',
    question: 'How do you respond in your report?',
    options: [
      { id: 'a', text: '"Property is in poor condition; foundation is failing and unsafe for occupancy."' },
      { id: 'b', text: '"A horizontal crack is visible on the west foundation wall."' },
      { id: 'c', text: '"Foundation requires immediate repair by a licensed contractor."' },
      { id: 'd', text: '"I told the homeowner the house appears stable but needs a professional check."' },
    ],
    correctAnswer: 'b',
    explanation: 'This is objective documentation of an observable fact.',
    incorrectFeedback: {
      a: 'This is a diagnostic conclusion, which is outside your scope and a liability risk.',
      c: 'You are prohibited from recommending repairs or contractors.',
      d: 'You should never provide verbal assessments to homeowners; it exceeds your expertise.',
    }
  },
  {
    id: 13,
    type: 'scenario',
    category: 'Notary Transition',
    audienceType: 'notary',
    scenario: 'You arrive at a property where the utilities are off, the grass is long, and no one answers the door. However, there is a brand-new package on the porch and the doorbell is lit.',
    question: 'What is your occupancy determination?',
    options: [
      { id: 'a', text: 'Vacant, because the utilities are disconnected and the yard is neglected.' },
      { id: 'b', text: 'Unknown, because you did not speak to a person.' },
      { id: 'c', text: 'Occupied, based on "signs of life" like the new delivery and lit doorbell.' },
      { id: 'd', text: 'Vacant, but with personal property remaining.' },
    ],
    correctAnswer: 'c',
    explanation: 'A lit doorbell and new deliveries are strong indicators of active residency, even if maintenance is deferred.',
    incorrectFeedback: {
      a: 'Utilities and yard condition are secondary; "signs of life" take precedence.',
      b: 'Reporting "Unknown" is useless to the lender (like "a hamburger without the meat").',
      d: 'If someone is collecting mail/packages, the property is not vacant.',
    }
  },
  {
    id: 14,
    type: 'scenario',
    category: 'Gig Worker Transition',
    audienceType: 'gig-worker',
    scenario: 'You have 10 "Rush" inspections due by 5 PM. To save time, you decide to take the "Side of House" photos from the sidewalk rather than walking to the rear.',
    question: 'Is this acceptable?',
    options: [
      { id: 'a', text: 'Yes, as long as you can see the side of the house clearly.' },
      { id: 'b', text: 'No, because you must conduct a full visual walk-around to check for "waste" or hazards like unsecured pools.' },
      { id: 'c', text: 'Yes, if the grass is too tall to walk through safely.' },
      { id: 'd', text: 'No, because you must always use a monopod for side shots.' },
    ],
    correctAnswer: 'b',
    explanation: 'You are the "eyes and ears" for the lender; skipping the walk-around might miss critical liabilities like an open back door or a hole in the roof.',
    incorrectFeedback: {
      a: 'Most contracts require you to exit the vehicle and survey the entire property.',
      c: 'While safety is a priority, you must still document that you attempted the full survey or report the area as inaccessible.',
      d: 'Monopods are typically only required for specific roof photos, not standard side views.',
    }
  },
  {
    id: 15,
    type: 'scenario',
    category: 'Interior Inspection',
    audienceType: 'inspector',
    scenario: 'You are performing an interior inspection of a vacant home. You notice a TV and a laptop on a table.',
    question: 'What is the correct protocol?',
    options: [
      { id: 'a', text: 'Remove the items for safekeeping and notify your account manager.' },
      { id: 'b', text: 'Take photos of the items and estimate their "Garage Sale Value" if over $100.' },
      { id: 'c', text: 'Move the items to a more secure location inside the house, such as a closet.' },
      { id: 'd', text: 'Ignore the items as they are not "real estate" and don\'t affect the lender.' },
    ],
    correctAnswer: 'b',
    explanation: 'Personal property items with significant value must be documented to help the lender assess the "trash out" or preservation needs.',
    incorrectFeedback: {
      a: 'Removing anything from a property is grounds for immediate dismissal and potential criminal charges.',
      c: 'You must never move personal property; you are there only to document its presence.',
      d: 'Lenders need to know if personal property remains to determine if the property is truly "abandoned" vs. just "vacant".',
    }
  },
];

const Module1Quiz = () => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<any>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [answers, setAnswers] = useState<{ questionId: number; answer: any; isCorrect: boolean }[]>([]);
  const [quizComplete, setQuizComplete] = useState(false);
  const [startTime] = useState(Date.now());

  const question = quizQuestions[currentQuestion];
  const progress = ((currentQuestion + 1) / quizQuestions.length) * 100;

  const correctCount = answers.filter(a => a.isCorrect).length;
  const passingScore = Math.ceil(quizQuestions.length * 0.8); // 80%
  const passed = correctCount >= passingScore;

  const handleAnswer = (answerId: string | boolean) => {
    if (showFeedback) return;

    setSelectedAnswer(answerId);
    setShowFeedback(true);

    let isCorrect = false;
    if (question.type === 'true-false') {
      isCorrect = answerId === question.correctAnswer;
    } else {
      isCorrect = answerId === question.correctAnswer;
    }

    setAnswers([...answers, {
      questionId: question.id,
      answer: answerId,
      isCorrect,
    }]);
  };

  const handleNext = () => {
    if (currentQuestion < quizQuestions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
      setSelectedAnswer(null);
      setShowFeedback(false);
    } else {
      setQuizComplete(true);
    }
  };

  const handleRetry = () => {
    setCurrentQuestion(0);
    setSelectedAnswer(null);
    setShowFeedback(false);
    setAnswers([]);
    setQuizComplete(false);
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'scenario': return Users;
      case 'true-false': return CheckCircle2;
      default: return Target;
    }
  };

  const TypeIcon = getTypeIcon(question?.type);

  // Quiz Complete Screen
  if (quizComplete) {
    const timeSpent = Math.round((Date.now() - startTime) / 1000 / 60);

    return (
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className={`p-8 text-center ${passed ? 'bg-emerald-50' : 'bg-red-50'}`}>
          <div className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center ${passed ? 'bg-emerald-500' : 'bg-red-500'
            }`}>
            {passed ? (
              <Award className="w-10 h-10 text-white" />
            ) : (
              <XCircle className="w-10 h-10 text-white" />
            )}
          </div>

          <h2 className={`text-2xl font-bold mt-4 ${passed ? 'text-emerald-900' : 'text-red-900'}`}>
            {passed ? 'Congratulations!' : 'Not Quite There'}
          </h2>

          <p className={`text-lg mt-2 ${passed ? 'text-emerald-700' : 'text-red-700'}`}>
            You scored {correctCount} out of {quizQuestions.length} ({Math.round(correctCount / quizQuestions.length * 100)}%)
          </p>

          <p className="text-sm text-slate-500 mt-2">
            Passing score: {passingScore}/{quizQuestions.length} (80%) • Time: {timeSpent} minutes
          </p>
        </div>

        <div className="p-6 space-y-4">
          {passed ? (
            <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200">
              <h3 className="font-semibold text-emerald-900 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5" />
                Module 1 Complete!
              </h3>
              <p className="text-sm text-emerald-700 mt-1">
                You&apos;ve demonstrated mastery of the orientation material. You&apos;re ready to move on to Module 2: Field Kit & Photo Standards.
              </p>
            </div>
          ) : (
            <div className="p-4 bg-amber-50 rounded-xl border border-amber-200">
              <h3 className="font-semibold text-amber-900 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                Review Recommended
              </h3>
              <p className="text-sm text-amber-700 mt-1">
                You need {passingScore - correctCount} more correct answers to pass. Review the lessons and flashcards, then try again.
              </p>
            </div>
          )}

          {/* Question Review */}
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <div className="px-4 py-3 bg-slate-50 border-b border-slate-200">
              <h3 className="font-semibold text-slate-900">Answer Review</h3>
            </div>
            <div className="max-h-64 overflow-y-auto">
              {quizQuestions.map((q, i) => {
                const answer = answers[i];
                return (
                  <div key={q.id} className={`px-4 py-3 border-b border-slate-100 last:border-0 flex items-center gap-3 ${answer?.isCorrect ? 'bg-emerald-50/50' : 'bg-red-50/50'
                    }`}>
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${answer?.isCorrect ? 'bg-emerald-500' : 'bg-red-500'
                      }`}>
                      {answer?.isCorrect ? (
                        <CheckCircle2 className="w-4 h-4 text-white" />
                      ) : (
                        <XCircle className="w-4 h-4 text-white" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-slate-700 truncate">
                        Q{q.id}: {q.question.substring(0, 60)}...
                      </p>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded ${q.type === 'scenario' ? 'bg-pink-100 text-pink-700' :
                      q.type === 'true-false' ? 'bg-purple-100 text-purple-700' :
                        'bg-blue-100 text-blue-700'
                      }`}>
                      {q.type}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={handleRetry}
              className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl transition flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              {passed ? 'Retake Quiz' : 'Try Again'}
            </button>
            {passed && (
              <button className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-400 text-white font-semibold rounded-xl transition flex items-center justify-center gap-2">
                Continue to Module 2
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
      {/* Header */}
      <div className="bg-slate-900 text-white px-6 py-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Target className="w-5 h-5 text-emerald-400" />
            <span className="text-sm font-medium text-emerald-400">Module 1 Assessment</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <Clock className="w-4 h-4" />
            <span>~15 min</span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm text-slate-400">
            Question {currentQuestion + 1} of {quizQuestions.length}
          </span>
          <span className="text-sm text-slate-400">
            {correctCount} correct so far
          </span>
        </div>

        <div className="mt-3 h-2 bg-slate-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-emerald-500 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Question Type Badge */}
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${question.type === 'scenario' ? 'bg-pink-100' :
            question.type === 'true-false' ? 'bg-purple-100' :
              'bg-blue-100'
            }`}>
            <TypeIcon className={`w-5 h-5 ${question.type === 'scenario' ? 'text-pink-600' :
              question.type === 'true-false' ? 'text-purple-600' :
                'text-blue-600'
              }`} />
          </div>
          <div>
            <span className={`text-xs font-semibold uppercase tracking-wider ${question.type === 'scenario' ? 'text-pink-600' :
              question.type === 'true-false' ? 'text-purple-600' :
                'text-blue-600'
              }`}>
              {question.type === 'scenario' ? `Scenario: ${question.category}` :
                question.type === 'true-false' ? 'True or False' :
                  question.category}
            </span>
          </div>
        </div>

        {/* Scenario Context (if applicable) */}
        {question.type === 'scenario' && question.scenario && (
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
            <p className="text-slate-700 italic">{question.scenario}</p>
          </div>
        )}

        {/* Question */}
        <div className="p-4 bg-slate-900 text-white rounded-xl">
          <h3 className="font-semibold text-lg leading-relaxed">
            {question.question}
          </h3>
        </div>

        {/* Options */}
        <div className="space-y-3">
          {question.type === 'true-false' ? (
            // True/False Options
            <>
              {[true, false].map((value) => {
                const isSelected = selectedAnswer === value;
                const isCorrect = value === question.correctAnswer;
                const showResult = showFeedback && isSelected;

                return (
                  <button
                    key={String(value)}
                    onClick={() => handleAnswer(value)}
                    disabled={showFeedback}
                    className={`w-full p-4 rounded-xl border text-left transition ${showResult
                      ? isCorrect
                        ? 'bg-emerald-50 border-emerald-500 ring-2 ring-emerald-500/20'
                        : 'bg-red-50 border-red-500 ring-2 ring-red-500/20'
                      : showFeedback && isCorrect
                        ? 'bg-emerald-50 border-emerald-300'
                        : showFeedback
                          ? 'bg-slate-50 border-slate-200 opacity-50'
                          : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${showResult
                        ? isCorrect ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'
                        : showFeedback && isCorrect
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-slate-100 text-slate-600'
                        }`}>
                        {showResult ? (
                          isCorrect ? <CheckCircle2 className="w-5 h-5" /> : <XCircle className="w-5 h-5" />
                        ) : (
                          value ? 'T' : 'F'
                        )}
                      </div>
                      <span className="font-medium text-slate-700">
                        {value ? 'True' : 'False'}
                      </span>
                    </div>
                  </button>
                );
              })}
            </>
          ) : (
            // Multiple Choice / Scenario Options
            question.options.map((option) => {
              const isSelected = selectedAnswer === option.id;
              const isCorrect = option.id === question.correctAnswer;
              const showResult = showFeedback && isSelected;

              return (
                <button
                  key={option.id}
                  onClick={() => handleAnswer(option.id)}
                  disabled={showFeedback}
                  className={`w-full p-4 rounded-xl border text-left transition ${showResult
                    ? isCorrect
                      ? 'bg-emerald-50 border-emerald-500 ring-2 ring-emerald-500/20'
                      : 'bg-red-50 border-red-500 ring-2 ring-red-500/20'
                    : showFeedback && isCorrect
                      ? 'bg-emerald-50 border-emerald-300'
                      : showFeedback
                        ? 'bg-slate-50 border-slate-200 opacity-50'
                        : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${showResult
                      ? isCorrect ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'
                      : showFeedback && isCorrect
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-slate-100 text-slate-600'
                      }`}>
                      {showResult ? (
                        isCorrect ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />
                      ) : (
                        option.id.toUpperCase()
                      )}
                    </div>
                    <p className="text-slate-700">{option.text}</p>
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Feedback */}
        {showFeedback && (
          <div className={`p-5 rounded-xl ${(question.type === 'true-false' ? selectedAnswer === question.correctAnswer : selectedAnswer === question.correctAnswer)
            ? 'bg-emerald-50 border border-emerald-200'
            : 'bg-red-50 border border-red-200'
            }`}>
            <div className="flex items-start gap-3">
              {(question.type === 'true-false' ? selectedAnswer === question.correctAnswer : selectedAnswer === question.correctAnswer) ? (
                <CheckCircle2 className="w-6 h-6 text-emerald-600 flex-shrink-0" />
              ) : (
                <XCircle className="w-6 h-6 text-red-600 flex-shrink-0" />
              )}
              <div>
                <h4 className={`font-bold ${(question.type === 'true-false' ? selectedAnswer === question.correctAnswer : selectedAnswer === question.correctAnswer)
                  ? 'text-emerald-800'
                  : 'text-red-800'
                  }`}>
                  {(question.type === 'true-false' ? selectedAnswer === question.correctAnswer : selectedAnswer === question.correctAnswer)
                    ? 'Correct!'
                    : 'Incorrect'}
                </h4>
                <p className="text-sm text-slate-700 mt-1">{question.explanation}</p>
                {question.detailedExplanation && (
                  <p className="text-sm text-slate-600 mt-2 italic">{question.detailedExplanation}</p>
                )}
                {!question.type !== 'true-false' && question.incorrectFeedback && selectedAnswer !== question.correctAnswer && (
                  <p className="text-sm text-red-700 mt-2">
                    <strong>Why {selectedAnswer.toUpperCase()} is wrong:</strong> {question.incorrectFeedback[selectedAnswer]}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Next Button */}
        {showFeedback && (
          <button
            onClick={handleNext}
            className="w-full py-4 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-xl transition flex items-center justify-center gap-2"
          >
            {currentQuestion < quizQuestions.length - 1 ? 'Next Question' : 'View Results'}
            <ChevronRight className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  );
};

export default Module1Quiz;
