import React, { useState } from 'react';
import { 
  BookOpen, CheckCircle2, ChevronRight, ChevronDown,
  AlertTriangle, Lightbulb, Target, Users, Clock,
  Play, ArrowRight, Award, Camera, FileText
} from 'lucide-react';

/**
 * NESTED OBJECTS - INTERACTIVE LESSON VIEWER
 * Module 1: Orientation & Quick Start
 */

const audienceTypes = [
  { id: 'gig-worker', label: 'Gig Worker', icon: '🚗', color: 'blue' },
  { id: 'notary', label: 'Notary', icon: '📝', color: 'purple' },
  { id: 'realtor', label: 'Realtor', icon: '🏠', color: 'amber' },
  { id: 'inspector', label: 'Existing Inspector', icon: '🔍', color: 'emerald' },
];

const LessonViewer = ({ lessonId = 4 }) => {
  const [completedSteps, setCompletedSteps] = useState(new Set());
  const [selectedAudience, setSelectedAudience] = useState('gig-worker');
  const [expandedSections, setExpandedSections] = useState(new Set(['core-concept', 'steps']));

  // Lesson 4: The 6-Angle Rule (most visual, great for demo)
  const lesson = {
    id: 4,
    title: "The 6-Angle Rule and Technical Photography",
    subtitle: "Lesson 4 of 6",
    duration: "15 min",
    coreConcept: "Photographs are the primary unit of value; a report without forensic-quality photos is considered fraudulent.",
    
    sixAngleSequence: [
      { 
        angle: 1, 
        name: "Street Sign", 
        purpose: "Proves you are in the correct neighborhood",
        tip: "Include the full street name and any cross-street if visible"
      },
      { 
        angle: 2, 
        name: "House Number", 
        purpose: "Direct verification of the collateral address",
        tip: "Get close enough to read clearly, but include some context"
      },
      { 
        angle: 3, 
        name: "Front Elevation", 
        purpose: "Straight-on shot including the entire roofline",
        tip: "Capture with 5% open space on all sides for full context"
      },
      { 
        angle: 4, 
        name: "Front Left Angle", 
        purpose: "Perspective showing the front and left side",
        tip: "Step back far enough to show roof overhang and gutters"
      },
      { 
        angle: 5, 
        name: "Front Right Angle", 
        purpose: "Perspective showing the front and right side",
        tip: "Mirror the left angle for consistency"
      },
      { 
        angle: 6, 
        name: "Street Views (L&R)", 
        purpose: "Documents the neighborhood context",
        tip: "Show at least 2-3 neighboring properties in each direction"
      },
    ],

    steps: [
      {
        id: 'step-1',
        title: "Disable Orientation Lock",
        content: "All photos must be taken in landscape mode. Go to Settings > Display and turn off orientation lock.",
        critical: true,
      },
      {
        id: 'step-2',
        title: "Exit the Vehicle",
        content: "Never take photos through a windshield. Car parts (mirrors/dashboards) in a shot trigger immediate rejection.",
        critical: true,
      },
      {
        id: 'step-3',
        title: "Sync Metadata",
        content: "Ensure your app is embedding GPS, date/time stamps, and your Inspector ID in every photo.",
        critical: false,
      },
    ],

    quickWin: 'Capture the "Front Elevation" with 5% open space on all sides to provide full context.',
    
    warningSign: "Blurry images, fingers in the frame, or shadows of the inspector.",

    audienceWarnings: {
      'gig-worker': {
        mistake: "Taking photos from the driver's seat to save time",
        correct: "Exit the vehicle for every property, even in bad weather",
      },
      'realtor': {
        mistake: "Using your real estate listing photo style",
        correct: "This is documentation, not marketing. Straight-on, no staging",
      },
      'notary': {
        mistake: "Rushing through photos to get to the signature",
        correct: "Photos ARE the product here, not paperwork",
      },
      'inspector': {
        mistake: "Adding artistic angles or close-ups not required",
        correct: "Stick to the 6-angle sequence. Extra shots slow review",
      },
    },
  };

  const toggleSection = (sectionId) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId);
      } else {
        newSet.add(sectionId);
      }
      return newSet;
    });
  };

  const toggleStep = (stepId) => {
    setCompletedSteps(prev => {
      const newSet = new Set(prev);
      if (newSet.has(stepId)) {
        newSet.delete(stepId);
      } else {
        newSet.add(stepId);
      }
      return newSet;
    });
  };

  const progress = (completedSteps.size / lesson.steps.length) * 100;
  const audienceWarning = lesson.audienceWarnings[selectedAudience];

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white px-6 py-6">
        <div className="flex items-center gap-2 text-emerald-400 text-sm font-medium mb-2">
          <BookOpen className="w-4 h-4" />
          {lesson.subtitle}
        </div>
        <h1 className="text-2xl font-bold tracking-tight mb-2">{lesson.title}</h1>
        <div className="flex items-center gap-4 text-sm text-slate-300">
          <span className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            {lesson.duration}
          </span>
          <span className="flex items-center gap-1">
            <Camera className="w-4 h-4" />
            Photography Standards
          </span>
        </div>

        {/* Progress Bar */}
        <div className="mt-4">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Lesson Progress</span>
            <span>{Math.round(progress)}% Complete</span>
          </div>
          <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
            <div 
              className="h-full bg-emerald-500 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Audience Selector */}
        <div className="p-4 bg-slate-50 rounded-xl">
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 block">
            <Users className="w-4 h-4 inline mr-1" />
            I'm coming from...
          </label>
          <div className="flex flex-wrap gap-2">
            {audienceTypes.map((type) => (
              <button
                key={type.id}
                onClick={() => setSelectedAudience(type.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                  selectedAudience === type.id
                    ? 'bg-slate-900 text-white'
                    : 'bg-white border border-slate-200 text-slate-600 hover:border-slate-300'
                }`}
              >
                {type.icon} {type.label}
              </button>
            ))}
          </div>
        </div>

        {/* Core Concept */}
        <section>
          <button
            onClick={() => toggleSection('core-concept')}
            className="w-full flex items-center justify-between p-4 bg-emerald-50 rounded-xl border border-emerald-200 hover:bg-emerald-100 transition"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-500 flex items-center justify-center">
                <Target className="w-5 h-5 text-white" />
              </div>
              <span className="font-semibold text-emerald-900">Core Concept</span>
            </div>
            <ChevronDown className={`w-5 h-5 text-emerald-600 transition-transform ${
              expandedSections.has('core-concept') ? 'rotate-180' : ''
            }`} />
          </button>
          {expandedSections.has('core-concept') && (
            <div className="mt-3 p-4 bg-slate-50 rounded-xl">
              <p className="text-slate-700 leading-relaxed text-lg">
                {lesson.coreConcept}
              </p>
            </div>
          )}
        </section>

        {/* The 6-Angle Sequence */}
        <section>
          <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <Camera className="w-5 h-5 text-slate-600" />
            The 6-Angle Sequence
          </h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {lesson.sixAngleSequence.map((angle) => (
              <div 
                key={angle.angle}
                className="p-4 bg-white border border-slate-200 rounded-xl hover:border-emerald-300 hover:shadow-md transition group"
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-lg flex-shrink-0">
                    {angle.angle}
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900 group-hover:text-emerald-700 transition">
                      {angle.name}
                    </h4>
                    <p className="text-sm text-slate-500 mt-1">{angle.purpose}</p>
                    <p className="text-xs text-emerald-600 mt-2 flex items-start gap-1">
                      <Lightbulb className="w-3 h-3 mt-0.5 flex-shrink-0" />
                      {angle.tip}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Step-by-Step Instructions */}
        <section>
          <button
            onClick={() => toggleSection('steps')}
            className="w-full flex items-center justify-between p-4 bg-slate-100 rounded-xl hover:bg-slate-200 transition"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-slate-900 flex items-center justify-center">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <div className="text-left">
                <span className="font-semibold text-slate-900">Step-by-Step Instructions</span>
                <span className="text-sm text-slate-500 ml-2">
                  {completedSteps.size}/{lesson.steps.length} completed
                </span>
              </div>
            </div>
            <ChevronDown className={`w-5 h-5 text-slate-600 transition-transform ${
              expandedSections.has('steps') ? 'rotate-180' : ''
            }`} />
          </button>
          {expandedSections.has('steps') && (
            <div className="mt-3 space-y-2">
              {lesson.steps.map((step, index) => (
                <div
                  key={step.id}
                  className={`p-4 rounded-xl border transition ${
                    completedSteps.has(step.id)
                      ? 'bg-emerald-50 border-emerald-200'
                      : 'bg-white border-slate-200'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <button
                      onClick={() => toggleStep(step.id)}
                      className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 transition ${
                        completedSteps.has(step.id)
                          ? 'bg-emerald-500 text-white'
                          : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                      }`}
                    >
                      {completedSteps.has(step.id) ? (
                        <CheckCircle2 className="w-4 h-4" />
                      ) : (
                        <span className="text-sm font-bold">{index + 1}</span>
                      )}
                    </button>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className={`font-semibold ${
                          completedSteps.has(step.id) ? 'text-emerald-800' : 'text-slate-900'
                        }`}>
                          {step.title}
                        </h4>
                        {step.critical && (
                          <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs font-semibold rounded">
                            CRITICAL
                          </span>
                        )}
                      </div>
                      <p className={`text-sm mt-1 ${
                        completedSteps.has(step.id) ? 'text-emerald-700' : 'text-slate-600'
                      }`}>
                        {step.content}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Audience-Specific Warning */}
        {audienceWarning && (
          <section className="p-5 bg-amber-50 border border-amber-200 rounded-xl">
            <h4 className="font-semibold text-amber-900 flex items-center gap-2 mb-3">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
              Warning for {audienceTypes.find(a => a.id === selectedAudience)?.label}s
            </h4>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="p-3 bg-red-100 rounded-lg">
                <div className="text-xs font-semibold text-red-700 uppercase tracking-wider mb-1">
                  ❌ The Mistake
                </div>
                <p className="text-sm text-red-800">{audienceWarning.mistake}</p>
              </div>
              <div className="p-3 bg-emerald-100 rounded-lg">
                <div className="text-xs font-semibold text-emerald-700 uppercase tracking-wider mb-1">
                  ✓ The Correct Way
                </div>
                <p className="text-sm text-emerald-800">{audienceWarning.correct}</p>
              </div>
            </div>
          </section>
        )}

        {/* Quick Win & Warning */}
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
            <div className="flex items-center gap-2 mb-2">
              <Award className="w-5 h-5 text-emerald-600" />
              <span className="font-semibold text-emerald-900">Quick Win</span>
            </div>
            <p className="text-sm text-emerald-800">{lesson.quickWin}</p>
          </div>
          
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              <span className="font-semibold text-red-900">Warning Signs</span>
            </div>
            <p className="text-sm text-red-800">{lesson.warningSign}</p>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-200">
          <button className="px-4 py-2 text-slate-600 hover:text-slate-900 font-medium transition">
            ← Previous Lesson
          </button>
          <button className="px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-white font-semibold rounded-xl transition flex items-center gap-2">
            {progress === 100 ? 'Complete Lesson' : 'Next Lesson'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default LessonViewer;
