import React, { useState, useEffect } from 'react';
import {
  AlertTriangle, CheckCircle2, XCircle, ChevronRight,
  RotateCcw, BookOpen, User, Briefcase, Car, Home,
  MessageSquare, Camera, FileText, Award, ArrowRight,
  Map as MapIcon
} from 'lucide-react';

/**
 * NESTED OBJECTS - INTERACTIVE SCENARIO TRAINER
 * Dynamic Version: Accepts scenarios from props
 */

// Define interfaces for the props
export interface ScenarioDecisionOption {
  id: string;
  text: string;
  isCorrect: boolean;
  feedback: {
    title: string;
    message: string;
    consequence: string;
  };
}

export interface ScenarioDecision {
  id: string;
  question: string;
  options: ScenarioDecisionOption[];
}

export interface Scenario {
  id: string;
  title: string;
  subtitle: string;
  audienceType: string;
  iconName?: string; // e.g. 'Home', 'Car'
  accentColor: string; // 'amber', 'blue'
  situation: {
    character: string;
    background: string;
    context: string;
    complication: string;
    instinct: string;
  };
  decisions: ScenarioDecision[];
  debrief: {
    keyLesson: string;
    coreRule: string;
    audienceWarning: string;
  };
}

interface InteractiveScenarioProps {
  scenarios: Scenario[];
}

const iconMap: Record<string, any> = {
  Home,
  Car,
  User,
  Map: MapIcon,
  Briefcase,
  AlertTriangle,
  Camera,
  FileText
};

const InteractiveScenario = ({ scenarios }: InteractiveScenarioProps) => {
  const [activeScenarioId, setActiveScenarioId] = useState<string | null>(null);

  // Set first scenario as active by default if available
  useEffect(() => {
    if (scenarios && scenarios.length > 0 && !activeScenarioId) {
      setActiveScenarioId(scenarios[0].id);
    }
  }, [scenarios]);

  // Reset scenario state when activeScenarioId changes
  // Note: The variables setCurrentNodeId, initialNodeId, setHistory, setFeedback,
  // setShowFeedback, setScenarioCompleted are not defined in the provided context.
  // This useEffect block is added as per the instruction, assuming these states
  // would be defined elsewhere or are placeholders for future implementation.
  useEffect(() => {
    // Reset scenario state when scenario ID changes
    // setCurrentNodeId(initialNodeId) // Undefined in current context
    // setHistory([]) // Undefined in current context
    // setFeedback(null) // Undefined in current context
    // setShowFeedback(false) // This one is defined below, but its reset logic is handled by handleRestart
    // setScenarioCompleted(false) // Undefined in current context
    // For now, we'll call handleRestart to reset the relevant states
    handleRestart();
  }, [activeScenarioId]); // eslint-disable-line react-hooks/exhaustive-deps

  const activeScenario = scenarios.find(s => s.id === activeScenarioId) || scenarios[0];

  const [currentStage, setCurrentStage] = useState('intro'); // intro, decision, feedback, debrief
  const [currentDecisionIndex, setCurrentDecisionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<ScenarioDecisionOption | null>(null);
  const [answers, setAnswers] = useState<{ decisionId: string; optionId: string; isCorrect: boolean }[]>([]);
  const [showFeedback, setShowFeedback] = useState(false);

  // If no scenarios loaded yet
  if (!scenarios || scenarios.length === 0) {
    return (
      <div className="p-8 text-center bg-slate-50 rounded-xl border border-slate-200">
        <p className="text-slate-500">No scenarios available for this module yet.</p>
      </div>
    );
  }

  const currentDecision = activeScenario.decisions[currentDecisionIndex];
  const correctAnswers = answers.filter(a => a.isCorrect).length;
  const totalDecisions = activeScenario.decisions.length;

  const accentColors = {
    amber: {
      bg: 'bg-amber-500/20',
      border: 'border-amber-500/30',
      text: 'text-amber-400',
      ring: 'ring-amber-500/20',
      solid: 'bg-amber-500'
    },
    blue: {
      bg: 'bg-blue-500/20',
      border: 'border-blue-500/30',
      text: 'text-blue-400',
      ring: 'ring-blue-500/20',
      solid: 'bg-blue-500'
    },
    emerald: {
      bg: 'bg-emerald-500/20',
      border: 'border-emerald-500/30',
      text: 'text-emerald-400',
      ring: 'ring-emerald-500/20',
      solid: 'bg-emerald-500'
    }
  };

  const colors = accentColors[activeScenario.accentColor as keyof typeof accentColors] || accentColors.blue;

  const handleOptionSelect = (option: ScenarioDecisionOption) => {
    setSelectedOption(option);
    setShowFeedback(true);
    setAnswers([...answers, { decisionId: currentDecision.id, optionId: option.id, isCorrect: option.isCorrect }]);
  };

  const handleContinue = () => {
    if (currentDecisionIndex < activeScenario.decisions.length - 1) {
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

  const handleSelectScenario = (id: string) => {
    setActiveScenarioId(id);
    handleRestart();
  }

  const IconComponent = iconMap[activeScenario.iconName || 'Home'] || Home;

  return (
    <div className="space-y-6">
      {/* Scenario Selector Tabs */}
      {scenarios.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2">
          {scenarios.map(s => {
            const SIcon = iconMap[s.iconName || 'Home'] || Home;
            return (
              <button
                key={s.id}
                onClick={() => handleSelectScenario(s.id)}
                className={`flex items-center gap-2 px-4 py-3 rounded-lg border transition whitespace-nowrap ${activeScenarioId === s.id
                  ? 'bg-slate-800 border-slate-700 text-white'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
              >
                <SIcon className={`w-4 h-4 ${activeScenarioId === s.id ? 'text-emerald-400' : 'text-slate-400'}`} />
                <span className="text-sm font-medium">{s.title}</span>
              </button>
            )
          })}
        </div>
      )}

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
              <h2 className="text-lg font-bold text-slate-900">{activeScenario.title}</h2>
            </div>
          </div>
          <p className="text-sm text-slate-600">{activeScenario.subtitle}</p>

          {/* Progress Dots */}
          {currentStage === 'decision' && (
            <div className="flex items-center gap-2 mt-4">
              {activeScenario.decisions.map((_, index) => (
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
                  <h3 className="font-semibold text-slate-900">{activeScenario.situation.character}</h3>
                  <p className="text-sm text-slate-600">{activeScenario.situation.background}</p>
                </div>
              </div>

              {/* Situation */}
              <div>
                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  The Situation
                </h4>
                <p className="text-slate-700 leading-relaxed">
                  {activeScenario.situation.context}
                </p>
              </div>

              {/* Complication */}
              <div className={`p-4 ${colors.bg} ${colors.border} border rounded-xl`}>
                <h4 className={`text-xs font-semibold ${colors.text} uppercase tracking-wider mb-2`}>
                  The Complication
                </h4>
                <p className="text-slate-700 leading-relaxed">
                  {activeScenario.situation.complication}
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
                    {activeScenario.situation.instinct}
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
          {currentStage === 'decision' && currentDecision && (
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
                  {activeScenario.debrief.keyLesson}
                </p>
              </div>

              {/* Core Rule */}
              <div className="flex items-start gap-3 p-4 bg-emerald-50 rounded-xl border border-emerald-200">
                <BookOpen className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-semibold text-emerald-800">The Core Rule</h4>
                  <p className="text-sm text-emerald-700 mt-1">{activeScenario.debrief.coreRule}</p>
                </div>
              </div>

              {/* Audience Warning */}
              <div className={`flex items-start gap-3 p-4 ${colors.bg} rounded-xl ${colors.border} border`}>
                <AlertTriangle className={`w-5 h-5 ${colors.text} flex-shrink-0 mt-0.5`} />
                <div>
                  <h4 className={`text-sm font-semibold ${colors.text}`}>Audience-Specific Warning</h4>
                  <p className="text-sm text-slate-700 mt-1">{activeScenario.debrief.audienceWarning}</p>
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
    </div>
  );
};

export default InteractiveScenario;
