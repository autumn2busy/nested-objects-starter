import React, { useState } from 'react';
import {
  CheckCircle2, XCircle, AlertCircle,
  ChevronRight, RotateCcw, Award
} from 'lucide-react';

/**
 * NESTED OBJECTS - DYNAMIC QUIZ 
 * Accepts questions from parent component
 */

export interface QuizQuestion {
  id: string;
  question_number: number;
  question_type: 'multiple-choice' | 'true-false' | 'scenario';
  question_text: string;
  options: string[]; // For multiple choice
  correct_answer: string; // Index as string '0', '1', etc.
  explanation: string;
}

interface DynamicQuizProps {
  questions: QuizQuestion[];
  passingScore?: number;
  onComplete?: (score: number, passed: boolean) => void;
}

const DynamicQuiz = ({ questions, passingScore = 80, onComplete }: DynamicQuizProps) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [showExplanation, setShowExplanation] = useState(false);
  const [quizCompleted, setQuizCompleted] = useState(false);

  // Parse options if they are strings (JSON)
  const getOptions = (q: QuizQuestion) => {
    if (Array.isArray(q.options)) return q.options;
    try {
      return JSON.parse(q.options as any);
    } catch {
      return [];
    }
  };

  const currentQuestion = questions[currentQuestionIndex];

  if (!questions || questions.length === 0) {
    return (
      <div className="p-8 text-center bg-slate-50 rounded-xl border border-slate-200">
        <p className="text-slate-500">No quiz questions available for this module yet.</p>
      </div>
    );
  }

  const handleOptionSelect = (optionIndex: number) => {
    if (showExplanation) return;

    setAnswers(prev => ({
      ...prev,
      [currentQuestion.id]: optionIndex.toString()
    }));
    setShowExplanation(true);
  };

  const handleNext = () => {
    setShowExplanation(false);
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      setQuizCompleted(true);
      const score = calculateScore();
      const passed = score >= passingScore;
      if (onComplete) onComplete(score, passed);
    }
  };

  const handleRetake = () => {
    setAnswers({});
    setCurrentQuestionIndex(0);
    setShowExplanation(false);
    setQuizCompleted(false);
  };

  const calculateScore = () => {
    let correctCount = 0;
    questions.forEach(q => {
      if (answers[q.id] === q.correct_answer) correctCount++;
    });
    return Math.round((correctCount / questions.length) * 100);
  };

  if (quizCompleted) {
    const finalScore = calculateScore();
    const passed = finalScore >= passingScore;

    return (
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm p-8 text-center">
        <div className={`w-20 h-20 rounded-full mx-auto flex items-center justify-center mb-6 ${passed ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'
          }`}>
          {passed ? <Award className="w-10 h-10" /> : <RotateCcw className="w-10 h-10" />}
        </div>

        <h2 className="text-2xl font-bold text-slate-900 mb-2">
          {passed ? 'Module Passed!' : 'Try Again'}
        </h2>

        <div className="text-4xl font-bold mb-6 text-slate-900">
          {finalScore}%
        </div>

        <p className="text-slate-600 max-w-md mx-auto mb-8">
          {passed
            ? "Great job! You demonstrate a solid understanding of the material."
            : `You need ${passingScore}% to pass. Review the material and try again.`}
        </p>

        <button
          onClick={handleRetake}
          className="px-8 py-3 bg-slate-900 text-white font-semibold rounded-xl hover:bg-slate-800 transition flex items-center gap-2 mx-auto"
        >
          <RotateCcw className="w-4 h-4" />
          Retake Quiz
        </button>
      </div>
    );
  }

  const currentOptions = getOptions(currentQuestion);
  const selectedAnswer = answers[currentQuestion.id];
  const isCorrect = selectedAnswer === currentQuestion.correct_answer;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
      {/* Progress Bar */}
      <div className="h-2 bg-slate-100 w-full">
        <div
          className="h-full bg-emerald-500 transition-all duration-300"
          style={{ width: `${((currentQuestionIndex) / questions.length) * 100}%` }}
        />
      </div>

      <div className="p-8">
        {/* Header */}
        <div className="flex justify-between items-start mb-6">
          <span className="text-sm font-semibold text-slate-400 uppercase tracking-wider">
            Question {currentQuestion.question_number} of {questions.length}
          </span>
          <span className="px-3 py-1 bg-slate-100 rounded-full text-xs font-medium text-slate-600">
            {currentQuestion.question_type}
          </span>
        </div>

        {/* Question */}
        <h3 className="text-xl font-bold text-slate-900 mb-8 leading-relaxed">
          {currentQuestion.question_text}
        </h3>

        {/* Options */}
        <div className="space-y-3 mb-8">
          {currentOptions.map((option: string, index: number) => {
            const isSelected = selectedAnswer === index.toString();
            // Styles based on selection and correctness (if revealed)
            let styles = "border-slate-200 hover:bg-slate-50";
            if (showExplanation) {
              if (index.toString() === currentQuestion.correct_answer) {
                styles = "bg-emerald-50 border-emerald-500 ring-1 ring-emerald-500";
              } else if (isSelected) {
                styles = "bg-red-50 border-red-500 ring-1 ring-red-500";
              } else {
                styles = "opacity-50";
              }
            } else if (isSelected) {
              styles = "bg-slate-900 text-white border-slate-900";
            }

            return (
              <button
                key={index}
                onClick={() => handleOptionSelect(index)}
                disabled={showExplanation}
                className={`w-full text-left p-4 rounded-xl border-2 transition-all duration-200 flex items-center gap-4 group ${styles}`}
              >
                <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center font-bold text-sm flex-shrink-0 transition-colors ${showExplanation && index.toString() === currentQuestion.correct_answer
                    ? "bg-emerald-500 border-emerald-500 text-white"
                    : showExplanation && isSelected && index.toString() !== currentQuestion.correct_answer
                      ? "bg-red-500 border-red-500 text-white"
                      : isSelected
                        ? "bg-white border-white text-slate-900"
                        : "border-slate-300 text-slate-400 group-hover:border-slate-400"

                  }`}>
                  {String.fromCharCode(65 + index)}
                </div>
                <span className={`font-medium ${isSelected && !showExplanation ? 'text-white' : 'text-slate-700'}`}>
                  {option}
                </span>

                {showExplanation && index.toString() === currentQuestion.correct_answer && (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 ml-auto" />
                )}
                {showExplanation && isSelected && index.toString() !== currentQuestion.correct_answer && (
                  <XCircle className="w-5 h-5 text-red-600 ml-auto" />
                )}
              </button>
            )
          })}
        </div>

        {/* Explanation & Next Button */}
        {showExplanation && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className={`p-4 rounded-xl mb-6 flex gap-3 ${isCorrect ? 'bg-emerald-50 text-emerald-900' : 'bg-amber-50 text-amber-900'
              }`}>
              <AlertCircle className={`w-5 h-5 flex-shrink-0 mt-0.5 ${isCorrect ? 'text-emerald-600' : 'text-amber-600'
                }`} />
              <div>
                <p className="font-semibold mb-1">
                  {isCorrect ? 'Correct!' : 'Not quite right.'}
                </p>
                <p className="text-sm opacity-90 leading-relaxed">
                  {currentQuestion.explanation}
                </p>
              </div>
            </div>

            <button
              onClick={handleNext}
              className="w-full py-4 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-xl transition flex items-center justify-center gap-2 shadow-lg shadow-slate-900/10"
            >
              {currentQuestionIndex < questions.length - 1 ? 'Next Question' : 'View Results'}
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default DynamicQuiz;