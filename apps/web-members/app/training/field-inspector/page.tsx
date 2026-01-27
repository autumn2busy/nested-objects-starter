'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  BookOpen, Brain, Calculator, GitBranch, Play, Award,
  ChevronRight, Clock, Target, CheckCircle2, Lock,
  FileText, Camera, AlertTriangle, ArrowRight, Users
} from 'lucide-react';

// Import training components
import IncomeCalculator from '@/components/training/IncomeCalculator';
import FlashcardDeck from '@/components/training/FlashcardDeck';
import InteractiveScenario from '@/components/training/InteractiveScenario';
import LessonViewer from '@/components/training/LessonViewer';
import Module1Quiz from '@/components/training/Module1Quiz';

/**
 * NESTED OBJECTS - FIELD INSPECTOR CERTIFICATION
 * Module 1: Orientation & Quick Start
 */

// Module structure
const moduleSections = [
  {
    id: 'overview',
    type: 'video',
    title: 'Module Overview',
    duration: '5:30',
    icon: Play,
    description: 'Introduction to field services and what you\'ll learn'
  },
  {
    id: 'lesson-1',
    type: 'lesson',
    title: 'Field Services as High-Velocity Income',
    duration: '12 min',
    icon: BookOpen,
    description: 'Shift from gig work to professional services'
  },
  {
    id: 'calculator',
    type: 'tool',
    title: 'Income Calculator',
    duration: '5 min',
    icon: Calculator,
    description: 'Calculate your earning potential'
  },
  {
    id: 'lesson-2',
    type: 'lesson',
    title: 'Mastering Industry Terminology',
    duration: '10 min',
    icon: BookOpen,
    description: 'PCR, SLA, REO, and essential terms'
  },
  {
    id: 'flashcards',
    type: 'flashcards',
    title: 'Terminology Flashcards',
    duration: '15 min',
    icon: Brain,
    description: '74 key terms to master'
  },
  {
    id: 'lesson-3',
    type: 'lesson',
    title: 'Scope of Practice',
    duration: '8 min',
    icon: BookOpen,
    description: 'Field Inspector vs. Home Inspector'
  },
  {
    id: 'lesson-4',
    type: 'lesson',
    title: 'The 6-Angle Rule',
    duration: '15 min',
    icon: Camera,
    description: 'Technical photography standards'
  },
  {
    id: 'lesson-5',
    type: 'lesson',
    title: 'The Workflow',
    duration: '12 min',
    icon: BookOpen,
    description: 'From work order to payment'
  },
  {
    id: 'lesson-6',
    type: 'lesson',
    title: 'Avoiding Beginner Mistakes',
    duration: '10 min',
    icon: AlertTriangle,
    description: 'Common pitfalls by background'
  },
  {
    id: 'scenario-1',
    type: 'scenario',
    title: 'Scenario: The Career Transition Trap',
    duration: '10 min',
    icon: GitBranch,
    description: 'Interactive decision training (Realtor)'
  },
  {
    id: 'scenario-2',
    type: 'scenario',
    title: 'Scenario: The Gig Worker Mindset',
    duration: '10 min',
    icon: GitBranch,
    description: 'Interactive decision training (Gig Worker)'
  },
  {
    id: 'quiz',
    type: 'quiz',
    title: 'Module 1 Assessment',
    duration: '15 min',
    icon: Target,
    description: '15 questions, 80% to pass'
  },
];

const typeColors: Record<string, { bg: string; text: string; border: string }> = {
  video: { bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-200' },
  lesson: { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-200' },
  tool: { bg: 'bg-emerald-100', text: 'text-emerald-700', border: 'border-emerald-200' },
  flashcards: { bg: 'bg-amber-100', text: 'text-amber-700', border: 'border-amber-200' },
  scenario: { bg: 'bg-pink-100', text: 'text-pink-700', border: 'border-pink-200' },
  quiz: { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-200' },
};

export default function FieldInspectorTrainingPage() {
  const [activeSection, setActiveSection] = useState('overview');
  const [completedSections, setCompletedSections] = useState<Set<string>>(new Set());

  const completedCount = completedSections.size;
  const totalCount = moduleSections.length;
  const progress = Math.round((completedCount / totalCount) * 100);

  const currentSection = moduleSections.find(s => s.id === activeSection);

  const markComplete = (sectionId: string) => {
    setCompletedSections(prev => new Set([...prev, sectionId]));
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Module Header */}
      <header className="bg-slate-950 text-white">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <nav className="flex items-center gap-2 text-sm text-slate-400 mb-4">
            <Link href="/training" className="hover:text-white">Training</Link>
            <ChevronRight className="w-4 h-4" />
            <span className="text-emerald-400">Field Inspector Certification</span>
          </nav>

          <div className="grid lg:grid-cols-[1fr_300px] gap-8 items-start">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-semibold">
                  MODULE 1
                </span>
                <span className="px-3 py-1 rounded-full bg-slate-800 text-slate-300 text-xs">
                  Basic Track
                </span>
              </div>
              <h1 className="text-3xl font-bold tracking-tight mb-3">
                Orientation & Quick Start
              </h1>
              <p className="text-slate-300 max-w-xl">
                Fast-track your transition into the mortgage field services industry.
                You already possess 60% of the required skills—this module teaches you
                the remaining 40%.
              </p>

              <div className="flex items-center gap-6 mt-4 text-sm text-slate-400">
                <span className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  2-4 hours
                </span>
                <span className="flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  {totalCount} sections
                </span>
                <span className="flex items-center gap-2">
                  <Award className="w-4 h-4" />
                  Certificate
                </span>
              </div>
            </div>

            {/* Progress Card */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-slate-400">Your Progress</span>
                <span className="text-xl font-bold">{progress}%</span>
              </div>
              <div className="h-2 bg-slate-800 rounded-full overflow-hidden mb-4">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="text-sm text-slate-400 mb-4">
                {completedCount} of {totalCount} sections complete
              </div>
              <button
                onClick={() => {
                  // Find first incomplete section
                  const nextSection = moduleSections.find(s => !completedSections.has(s.id));
                  if (nextSection) setActiveSection(nextSection.id);
                }}
                className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold rounded-lg transition flex items-center justify-center gap-2"
              >
                <Play className="w-4 h-4" fill="currentColor" />
                Continue Learning
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Content Area */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="grid lg:grid-cols-[280px_1fr] gap-8">
          {/* Sidebar Navigation */}
          <nav className="space-y-2">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-3 mb-3">
              Module Contents
            </h3>
            {moduleSections.map((section) => {
              const colors = typeColors[section.type];
              const isComplete = completedSections.has(section.id);
              const isActive = activeSection === section.id;
              const IconComponent = section.icon;

              return (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`w-full text-left p-3 rounded-xl transition flex items-start gap-3 ${isActive
                      ? 'bg-white border-2 border-emerald-500 shadow-sm'
                      : 'bg-white border border-slate-200 hover:border-slate-300'
                    }`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${isComplete ? 'bg-emerald-100' : colors.bg
                    }`}>
                    {isComplete ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <IconComponent className={`w-4 h-4 ${colors.text}`} />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-medium truncate ${isActive ? 'text-emerald-700' : 'text-slate-900'
                        }`}>
                        {section.title}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className={`text-xs px-1.5 py-0.5 rounded ${colors.bg} ${colors.text}`}>
                        {section.type}
                      </span>
                      <span className="text-xs text-slate-400">{section.duration}</span>
                    </div>
                  </div>
                </button>
              );
            })}
          </nav>

          {/* Main Content */}
          <main className="min-h-[600px]">
            {/* Content Header */}
            {currentSection && (
              <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className={`w-14 h-14 rounded-xl ${typeColors[currentSection.type].bg} flex items-center justify-center`}>
                      <currentSection.icon className={`w-7 h-7 ${typeColors[currentSection.type].text}`} />
                    </div>
                    <div>
                      <span className={`text-xs font-semibold uppercase tracking-wider ${typeColors[currentSection.type].text}`}>
                        {currentSection.type}
                      </span>
                      <h2 className="text-xl font-bold text-slate-900 mt-1">{currentSection.title}</h2>
                      <p className="text-sm text-slate-500 mt-1">{currentSection.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-slate-400" />
                    <span className="text-sm text-slate-500">{currentSection.duration}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Dynamic Content Based on Active Section */}
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
              {activeSection === 'overview' && (
                <div className="p-8 text-center">
                  <div className="w-24 h-24 mx-auto rounded-full bg-purple-100 flex items-center justify-center mb-6">
                    <Play className="w-10 h-10 text-purple-600" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-2">Welcome Video</h3>
                  <p className="text-slate-500 max-w-md mx-auto mb-6">
                    This 5-minute introduction explains the field services industry
                    and what you&apos;ll master in this certification program.
                  </p>
                  <button
                    onClick={() => markComplete('overview')}
                    className="px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white font-semibold rounded-xl transition"
                  >
                    Play Video (5:30)
                  </button>
                </div>
              )}

              {activeSection === 'calculator' && (
                <div className="p-6">
                  <IncomeCalculator />
                  <div className="mt-6 flex justify-end">
                    <button
                      onClick={() => markComplete('calculator')}
                      className="px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-white font-semibold rounded-xl transition flex items-center gap-2"
                    >
                      Mark Complete
                      <CheckCircle2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {activeSection === 'flashcards' && (
                <div className="p-6">
                  <FlashcardDeck />
                  <div className="mt-6 flex justify-end">
                    <button
                      onClick={() => markComplete('flashcards')}
                      className="px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-white font-semibold rounded-xl transition flex items-center gap-2"
                    >
                      Mark Complete
                      <CheckCircle2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {(activeSection === 'scenario-1') && (
                <div className="p-6">
                  <InteractiveScenario scenarioId="career-transition-trap" />
                  <div className="mt-6 flex justify-end">
                    <button
                      onClick={() => markComplete('scenario-1')}
                      className="px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-white font-semibold rounded-xl transition flex items-center gap-2"
                    >
                      Mark Complete
                      <CheckCircle2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {(activeSection === 'scenario-2') && (
                <div className="p-6">
                  <InteractiveScenario scenarioId="gig-worker-mindset" />
                  <div className="mt-6 flex justify-end">
                    <button
                      onClick={() => markComplete('scenario-2')}
                      className="px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-white font-semibold rounded-xl transition flex items-center gap-2"
                    >
                      Mark Complete
                      <CheckCircle2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* Dynamic Lesson Viewer for ALL lessons */}
              {activeSection.startsWith('lesson-') && (
                <div className="p-6">
                  <LessonViewer lessonId={parseInt(activeSection.split('-')[1])} />
                  <div className="mt-6 flex justify-end">
                    <button
                      onClick={() => markComplete(activeSection)}
                      className="px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-white font-semibold rounded-xl transition flex items-center gap-2"
                    >
                      Mark Complete
                      <CheckCircle2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {activeSection === 'quiz' && (
                <div className="p-6">
                  <Module1Quiz />
                </div>
              )}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
