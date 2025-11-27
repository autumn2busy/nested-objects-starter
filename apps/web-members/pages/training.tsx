import Image from "next/image";
import { useEffect, useMemo, useState } from "react";

const roles = ["Notary", "Existing Inspector", "Gig Worker", "Realtor"] as const;
const experienceLevels = ["Beginner", "Novice", "Veteran", "Technically Advanced"] as const;

type Role = (typeof roles)[number];
type ExperienceLevel = (typeof experienceLevels)[number];

type MediaType = "video" | "audio" | "youtube" | "infographic";

type Quiz = {
  question: string;
  options: string[];
  answer: string;
};

type Module = {
  id: string;
  title: string;
  duration: string;
  description: string;
  media: { type: MediaType; url: string; label: string }[];
  checkpoints: string[];
  quiz: Quiz;
  recertification: string;
  adaptiveCue: string;
};

type Track = {
  overview: string;
  objectives: string[];
  modules: Module[];
};

type TrainingCatalog = Record<Role, Record<ExperienceLevel, Track>>;

const baseTracks: Record<ExperienceLevel, {
  overview: (role: Role) => string;
  objectives: (role: Role) => string[];
  modules: Omit<Module, "id">[];
}> = {
  Beginner: {
    overview: (role) =>
      `Start with the fundamentals for ${role.toLowerCase()}s using video, audio, and avatar guidance to master the basics quickly.`,
    objectives: (role) => [
      `Complete your first ${role.toLowerCase()} mission`,
      "Pass an AI avatar-led safety check",
      "Collect badges for module completions",
    ],
    modules: [
      {
        title: "Foundations & Orientation",
        duration: "12 min",
        description:
          "Video and YouTube walkthroughs paired with interactive overlays to set up your workspace and workflows.",
        media: [
          {
            type: "video",
            url: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4",
            label: "Orientation Video",
          },
          {
            type: "youtube",
            url: "https://www.youtube.com/embed/dQw4w9WgXcQ",
            label: "Platform Tour",
          },
        ],
        checkpoints: [
          "Launch a mock session",
          "Toggle progress meters",
          "Save your first checkpoint",
        ],
        quiz: {
          question: "What unlocks your next lesson?",
          options: [
            "Ignoring checkpoints",
            "Completing checkpoints and passing the knowledge check",
            "Closing the browser",
            "Skipping videos",
          ],
          answer: "Completing checkpoints and passing the knowledge check",
        },
        recertification: "Triggered every 12 months or after three failed quizzes.",
        adaptiveCue: "Low scores open extra avatar feedback before advancing.",
      },
      {
        title: "Safety & Compliance",
        duration: "9 min",
        description:
          "Infographics and audio explain privacy, data retention, and how to record compliant sessions.",
        media: [
          {
            type: "infographic",
            url: "https://dummyimage.com/900x400/0ea5e9/ffffff&text=Safety+Checklist",
            label: "Safety Infographic",
          },
          {
            type: "audio",
            url: "https://www.w3schools.com/html/horse.mp3",
            label: "Compliance Audio Brief",
          },
        ],
        checkpoints: [
          "Acknowledge privacy pledge",
          "Record a mock audit trail",
          "Trigger a re-certification reminder",
        ],
        quiz: {
          question: "How do you protect customer data?",
          options: [
            "Download to personal drives",
            "Use encrypted uploads with audit trails",
            "Share via text",
            "Skip verification",
          ],
          answer: "Use encrypted uploads with audit trails",
        },
        recertification: "Auto-triggered when policies change or every 6 months.",
        adaptiveCue: "Missed quiz answers surface a compliance refresher micro-lesson.",
      },
    ],
  },
  Novice: {
    overview: (role) =>
      `Level up with scenario drills and gamified quizzes tailored to ${role.toLowerCase()} workflows and client needs.`,
    objectives: () => [
      "Handle tricky scenarios",
      "Track momentum with progress meters",
      "Collect AI avatar feedback",
    ],
    modules: [
      {
        title: "Scenario Lab",
        duration: "14 min",
        description:
          "Avatar-driven simulations react to your choices, including embedded audio and YouTube commentary.",
        media: [
          {
            type: "youtube",
            url: "https://www.youtube.com/embed/ysz5S6PUM-U",
            label: "Live Simulation",
          },
          {
            type: "audio",
            url: "https://www.w3schools.com/html/horse.mp3",
            label: "Avatar Dialogue",
          },
        ],
        checkpoints: [
          "Log escalation decisions",
          "Capture client feedback",
          "Submit a scenario summary",
        ],
        quiz: {
          question: "When should you pause the workflow?",
          options: [
            "When identity is uncertain",
            "When a meeting runs long",
            "Whenever you feel bored",
            "When battery is full",
          ],
          answer: "When identity is uncertain",
        },
        recertification: "Triggered after incident reports or annually.",
        adaptiveCue: "Low quiz scores unlock deeper avatar simulations.",
      },
      {
        title: "Reporting & Workflows",
        duration: "10 min",
        description:
          "Video tutorials and infographics show how to finalize reports, automate steps, and stay on schedule.",
        media: [
          {
            type: "video",
            url: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4",
            label: "Workflow Video",
          },
          {
            type: "infographic",
            url: "https://dummyimage.com/900x400/6366f1/ffffff&text=Workflow+Map",
            label: "Workflow Map",
          },
        ],
        checkpoints: [
          "Submit a templated report",
          "Set automation triggers",
          "Review progress meter history",
        ],
        quiz: {
          question: "What keeps reports consistent?",
          options: [
            "Skipping templates",
            "Standard templates plus validation checks",
            "Random formatting",
            "Avoiding reviews",
          ],
          answer: "Standard templates plus validation checks",
        },
        recertification: "Every 9 months or when templates change.",
        adaptiveCue: "Strong scores unlock veteran-only workflow challenges.",
      },
    ],
  },
  Veteran: {
    overview: (role) =>
      `${role}s coach others, automate quality checks, and maintain high certification streaks with avatar co-pilots.`,
    objectives: () => [
      "Coach with AI avatars",
      "Automate quality and safety",
      "Monitor team KPIs",
    ],
    modules: [
      {
        title: "Mentor & Analytics",
        duration: "13 min",
        description: "Use analytics dashboards, avatar coaching, and infographics to support teammates.",
        media: [
          {
            type: "video",
            url: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4",
            label: "Analytics Tour",
          },
          {
            type: "infographic",
            url: "https://dummyimage.com/900x400/22c55e/ffffff&text=Mentor+Metrics",
            label: "Mentor Metrics",
          },
        ],
        checkpoints: [
          "Assign avatar coaches",
          "Review two sessions",
          "Publish a re-cert schedule",
        ],
        quiz: {
          question: "Which KPI best signals readiness?",
          options: [
            "Random luck",
            "Identity accuracy and checkpoint streaks",
            "Number of logins",
            "Longest videos",
          ],
          answer: "Identity accuracy and checkpoint streaks",
        },
        recertification: "Triggered when team accuracy dips below 90%.",
        adaptiveCue: "High accuracy unlocks leadership labs; low accuracy adds remediation quests.",
      },
      {
        title: "Automation Lab",
        duration: "11 min",
        description: "Configure automation rules, badge renewals, and escalation paths with adaptive prompts.",
        media: [
          {
            type: "youtube",
            url: "https://www.youtube.com/embed/ysz5S6PUM-U",
            label: "Automation Walkthrough",
          },
          {
            type: "audio",
            url: "https://www.w3schools.com/html/horse.mp3",
            label: "Automation Coach",
          },
        ],
        checkpoints: [
          "Publish an escalation rule",
          "Connect badge renewal",
          "Schedule weekly QA",
        ],
        quiz: {
          question: "What should trigger a badge renewal?",
          options: [
            "Weekend logins",
            "Expiring credentials or compliance timers",
            "Random times",
            "Color preference",
          ],
          answer: "Expiring credentials or compliance timers",
        },
        recertification: "Quarterly checks or after workflow edits.",
        adaptiveCue: "Missed renewals unlock extra automation templates.",
      },
    ],
  },
  "Technically Advanced": {
    overview: (role) =>
      `${role}s design integrations, adaptive quests, and progressive challenges with advanced media-rich modules.`,
    objectives: () => [
      "Ship integrations",
      "Design adaptive quests",
      "Monitor advanced KPIs",
    ],
    modules: [
      {
        title: "Integration Studio",
        duration: "16 min",
        description:
          "Video and infographics guide you through webhooks, API signatures, and automated compliance triggers.",
        media: [
          {
            type: "video",
            url: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4",
            label: "Integration Demo",
          },
          {
            type: "infographic",
            url: "https://dummyimage.com/900x400/f97316/ffffff&text=Webhook+Flow",
            label: "Webhook Flow",
          },
        ],
        checkpoints: [
          "Attach a webhook",
          "Validate signatures",
          "Trigger an automated re-cert",
        ],
        quiz: {
          question: "How do you secure webhooks?",
          options: [
            "Unauthenticated endpoints",
            "Shared secrets and signature validation",
            "Public spreadsheets",
            "Luck",
          ],
          answer: "Shared secrets and signature validation",
        },
        recertification: "After version upgrades or failed callbacks.",
        adaptiveCue: "Signature failures open a troubleshooting micro-lesson.",
      },
      {
        title: "Adaptive Quest Builder",
        duration: "13 min",
        description:
          "Embed YouTube, audio, and progress meters to craft branching quests tied to quiz performance.",
        media: [
          {
            type: "youtube",
            url: "https://www.youtube.com/embed/dQw4w9WgXcQ",
            label: "Quest Walkthrough",
          },
          {
            type: "audio",
            url: "https://www.w3schools.com/html/horse.mp3",
            label: "Quest Narration",
          },
        ],
        checkpoints: [
          "Publish a branching quest",
          "Add remediation for low scores",
          "Unlock bonus challenges",
        ],
        quiz: {
          question: "How do quests adapt to learners?",
          options: [
            "Randomly",
            "By inserting remediation after low scores and accelerating high performers",
            "By skipping checkpoints",
            "By hiding feedback",
          ],
          answer: "By inserting remediation after low scores and accelerating high performers",
        },
        recertification: "Every 120 days or after curriculum updates.",
        adaptiveCue: "Fast completions unlock expert-only quests.",
      },
    ],
  },
};

const slugify = (value: string) => value.toLowerCase().replace(/\s+/g, "-");

const trainingCatalog: TrainingCatalog = roles.reduce((roleAcc, role) => {
  const levelTracks = experienceLevels.reduce((levelAcc, level) => {
    const base = baseTracks[level];
    levelAcc[level] = {
      overview: base.overview(role),
      objectives: base.objectives(role),
      modules: base.modules.map((module, index) => ({
        ...module,
        id: `${slugify(role)}-${slugify(level)}-${index + 1}`,
      })),
    };
    return levelAcc;
  }, {} as Record<ExperienceLevel, Track>);

  roleAcc[role] = levelTracks;
  return roleAcc;
}, {} as TrainingCatalog);

const mediaRenderer = (media: Module["media"][number]) => {
  switch (media.type) {
    case "video":
      return (
        <video
          key={media.label}
          controls
          className="w-full rounded-xl border border-slate-200 shadow-sm"
          src={media.url}
        >
          Your browser does not support the video tag.
        </video>
      );
    case "audio":
      return (
        <audio key={media.label} controls className="w-full">
          <source src={media.url} />
          Your browser does not support the audio element.
        </audio>
      );
    case "youtube":
      return (
        <div key={media.label} className="aspect-video w-full overflow-hidden rounded-xl border border-slate-200 shadow-sm">
          <iframe
            className="h-full w-full"
            src={media.url}
            title={media.label}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      );
    case "infographic":
      return (
        <Image
          key={media.label}
          src={media.url}
          alt={media.label}
          width={900}
          height={400}
          className="h-auto w-full rounded-xl border border-slate-200 shadow-sm"
        />
      );
    default:
      return null;
  }
};

type ModuleState = {
  completed: boolean;
  checkpointsCompleted: number;
  quizScore: number | null;
};

export default function TrainingPage() {
  const [selectedRole, setSelectedRole] = useState<Role>("Notary");
  const [selectedLevel, setSelectedLevel] = useState<ExperienceLevel>("Beginner");
  const [activeModuleId, setActiveModuleId] = useState<string | null>(null);
  const [moduleState, setModuleState] = useState<Record<string, ModuleState>>({});
  const [globalCheckpoint, setGlobalCheckpoint] = useState(0);

  const track = trainingCatalog[selectedRole][selectedLevel];
  const totalModules = track.modules.length;

  useEffect(() => {
    const initialState: Record<string, ModuleState> = {};
    track.modules.forEach((module) => {
      initialState[module.id] = {
        completed: false,
        checkpointsCompleted: 0,
        quizScore: null,
      };
    });
    setModuleState(initialState);
    setActiveModuleId(track.modules[0]?.id ?? null);
    setGlobalCheckpoint(0);
  }, [selectedRole, selectedLevel, track.modules]);

  const activeModule = useMemo(
    () => track.modules.find((module) => module.id === activeModuleId) ?? track.modules[0],
    [activeModuleId, track.modules]
  );

  const progressPercent = useMemo(() => {
    const completedModules = Object.values(moduleState).filter((state) => state.completed).length;
    const totalCheckpoints = track.modules.reduce((sum, module) => sum + module.checkpoints.length, 0);
    const completedCheckpoints = Object.values(moduleState).reduce(
      (sum, state) => sum + state.checkpointsCompleted,
      0
    );

    const moduleWeight = totalModules > 0 ? completedModules / totalModules : 0;
    const checkpointWeight = totalCheckpoints > 0 ? completedCheckpoints / totalCheckpoints : 0;
    return Math.round(((moduleWeight + checkpointWeight) / 2) * 100);
  }, [moduleState, totalModules, track.modules]);

  const handleCheckpoint = (moduleId: string) => {
    setModuleState((prev) => {
      const moduleEntry = track.modules.find((m) => m.id === moduleId);
      const total = moduleEntry?.checkpoints.length ?? 0;
      const current = prev[moduleId]?.checkpointsCompleted ?? 0;
      const nextCount = Math.min(current + 1, total);
      const completed = nextCount === total && (prev[moduleId]?.completed ?? false);

      return {
        ...prev,
        [moduleId]: {
          completed,
          checkpointsCompleted: nextCount,
          quizScore: prev[moduleId]?.quizScore ?? null,
        },
      };
    });
    setGlobalCheckpoint((value) => value + 1);
  };

  const handleCompleteModule = (moduleId: string) => {
    setModuleState((prev) => ({
      ...prev,
      [moduleId]: {
        ...prev[moduleId],
        completed: true,
      },
    }));
  };

  const handleQuizSubmit = (moduleId: string, selectedOption: string) => {
    const moduleEntry = track.modules.find((item) => item.id === moduleId);
    if (!moduleEntry) return;

    const score = selectedOption === moduleEntry.quiz.answer ? 100 : 50;
    setModuleState((prev) => ({
      ...prev,
      [moduleId]: {
        ...prev[moduleId],
        quizScore: score,
        completed: score === 100 ? true : prev[moduleId]?.completed ?? false,
      },
    }));
  };

  const adaptiveSummary = useMemo(() => {
    const lowScores = Object.values(moduleState).filter((state) => (state.quizScore ?? 100) < 80).length;
    const completed = Object.values(moduleState).filter((state) => state.completed).length;

    if (lowScores > 0) {
      return "AI Avatar recommends remediation quests before your next certification.";
    }
    if (completed === totalModules) {
      return "Great work! You unlocked advanced simulations and a re-certification rehearsal.";
    }
    return "Complete checkpoints to unlock avatar-driven coaching and bonus quests.";
  }, [moduleState, totalModules]);

  const recommendedModule = useMemo(() => {
    return (
      track.modules.find((module) => {
        const state = moduleState[module.id];
        return !state?.completed || (state.quizScore ?? 0) < 80;
      }) ?? track.modules[0]
    );
  }, [moduleState, track.modules]);

  const completedCount = useMemo(
    () => Object.values(moduleState).filter((state) => state.completed).length,
    [moduleState]
  );

  const checkpointTotals = useMemo(
    () => track.modules.reduce((sum, module) => sum + module.checkpoints.length, 0),
    [track.modules]
  );

  const completedCheckpoints = useMemo(
    () => Object.values(moduleState).reduce((sum, state) => sum + state.checkpointsCompleted, 0),
    [moduleState]
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl px-6 py-10 lg:px-10">
        <div className="mb-8 grid gap-4 lg:grid-cols-[320px,1fr]">
          <aside className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <h1 className="text-2xl font-semibold text-slate-900">Nested Objects Training</h1>
            <p className="mt-2 text-sm text-slate-600">
              Select a role and experience level to load a personalized track with adaptive modules, media, and AI avatar
              feedback.
            </p>

            <div className="mt-6">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Role</h2>
              <div className="mt-3 grid grid-cols-2 gap-2">
                {roles.map((role) => (
                  <button
                    key={role}
                    onClick={() => setSelectedRole(role)}
                    className={`rounded-lg border px-3 py-2 text-sm font-semibold transition hover:border-indigo-400 hover:text-indigo-600 ${
                      selectedRole === role
                        ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                        : "border-slate-200 bg-white text-slate-700"
                    }`}
                  >
                    {role}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-6">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Experience</h2>
              <div className="mt-3 grid grid-cols-2 gap-2">
                {experienceLevels.map((level) => (
                  <button
                    key={level}
                    onClick={() => setSelectedLevel(level)}
                    className={`rounded-lg border px-3 py-2 text-sm font-semibold transition hover:border-emerald-400 hover:text-emerald-600 ${
                      selectedLevel === level
                        ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                        : "border-slate-200 bg-white text-slate-700"
                    }`}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-8 rounded-xl bg-gradient-to-br from-indigo-50 via-white to-emerald-50 p-4 ring-1 ring-indigo-100">
              <div className="flex items-center justify-between text-sm font-semibold text-slate-900">
                <span>Progress</span>
                <span>{progressPercent}%</span>
              </div>
              <div className="mt-2 h-2 rounded-full bg-slate-100">
                <div
                  className="h-2 rounded-full bg-indigo-500 transition-all"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <p className="mt-3 text-xs text-slate-600">
                Track module completion, checkpoints, and re-certification triggers as you progress.
              </p>
            </div>
          </aside>

          <main className="space-y-6">
            <header className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-wide text-indigo-600">Personalized track</p>
                  <h2 className="text-2xl font-bold text-slate-900">
                    {selectedRole} • {selectedLevel}
                  </h2>
                  <p className="mt-2 max-w-3xl text-sm text-slate-700">{track.overview}</p>
                </div>
                <div className="rounded-xl bg-indigo-50 px-4 py-3 text-sm font-semibold text-indigo-700 ring-1 ring-indigo-100">
                  Next up: {recommendedModule.title}
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {track.objectives.map((objective) => (
                  <span
                    key={objective}
                    className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700"
                  >
                    {objective}
                  </span>
                ))}
              </div>
            </header>

            <section className="grid gap-4 lg:grid-cols-[2fr,1fr]">
              <div className="space-y-4">
                <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Interactive Module</p>
                      <h3 className="text-xl font-bold text-slate-900">{activeModule?.title}</h3>
                      <p className="mt-1 text-sm text-slate-600">{activeModule?.description}</p>
                    </div>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                      {activeModule?.duration}
                    </span>
                  </div>

                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                    {activeModule?.media.map((media) => (
                      <div key={media.label} className="space-y-2 rounded-xl bg-slate-50 p-3 ring-1 ring-slate-100">
                        <div className="text-sm font-semibold text-slate-800">{media.label}</div>
                        {mediaRenderer(media)}
                      </div>
                    ))}
                  </div>

                  <div className="mt-6 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-semibold text-slate-800">Knowledge Check</div>
                      <div className="text-xs text-slate-500">AI avatar feedback</div>
                    </div>
                    <div className="rounded-xl bg-gradient-to-br from-white via-slate-50 to-indigo-50 p-4 ring-1 ring-indigo-100">
                      <p className="text-sm font-semibold text-slate-900">{activeModule?.quiz.question}</p>
                      <div className="mt-3 grid gap-2 md:grid-cols-2">
                        {activeModule?.quiz.options.map((option) => (
                          <button
                            key={option}
                            onClick={() => activeModule && handleQuizSubmit(activeModule.id, option)}
                            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-left text-sm font-semibold text-slate-700 transition hover:border-indigo-400 hover:text-indigo-700"
                          >
                            {option}
                          </button>
                        ))}
                      </div>
                      <p className="mt-3 text-xs text-slate-600">
                        {(moduleState[activeModule?.id ?? ""]?.quizScore ?? 0) >= 100
                          ? "Great job! Avatar approves and unlocks the next simulation."
                          : "Submit your best answer to trigger tailored avatar feedback."}
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 grid gap-3 md:grid-cols-2">
                    <div className="rounded-xl bg-white p-4 ring-1 ring-slate-200">
                      <h4 className="text-sm font-semibold text-slate-800">Checkpoints</h4>
                      <ol className="mt-2 space-y-2 text-sm text-slate-700">
                        {activeModule?.checkpoints.map((checkpoint, index) => {
                          const completed =
                            (moduleState[activeModule.id]?.checkpointsCompleted ?? 0) > index;
                          return (
                            <li key={checkpoint} className="flex items-start gap-2">
                              <button
                                onClick={() => activeModule && handleCheckpoint(activeModule.id)}
                                className={`mt-0.5 h-5 w-5 rounded-full border ${
                                  completed
                                    ? "border-emerald-500 bg-emerald-500 text-white"
                                    : "border-slate-300 bg-white text-slate-400"
                                }`}
                                aria-label={`Mark checkpoint ${index + 1}`}
                              >
                                ✓
                              </button>
                              <span className={completed ? "text-slate-500 line-through" : ""}>{checkpoint}</span>
                            </li>
                          );
                        })}
                      </ol>
                      <p className="mt-3 text-xs text-slate-500">
                        Global checkpoints hit: {globalCheckpoint} • Re-cert triggers: {activeModule?.recertification}
                      </p>
                    </div>

                    <div className="rounded-xl bg-white p-4 ring-1 ring-slate-200">
                      <h4 className="text-sm font-semibold text-slate-800">Adaptive Coaching</h4>
                      <p className="mt-2 text-sm text-slate-700">{activeModule?.adaptiveCue}</p>
                      <div className="mt-3 rounded-lg bg-indigo-50 p-3 text-xs font-semibold text-indigo-800 ring-1 ring-indigo-100">
                        {adaptiveSummary}
                      </div>
                      <div className="mt-4 flex items-center justify-between">
                        <button
                          onClick={() => activeModule && handleCompleteModule(activeModule.id)}
                          className="rounded-lg bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow hover:bg-indigo-500"
                        >
                          Mark Module Complete
                        </button>
                        <div className="text-xs text-slate-500">
                          Score: {moduleState[activeModule?.id ?? ""]?.quizScore ?? "Pending"}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold text-slate-900">Module Playlist</h3>
                    <span className="text-xs font-semibold text-slate-500">Carousel scroll</span>
                  </div>
                  <div className="mt-4 flex gap-3 overflow-x-auto pb-3">
                    {track.modules.map((module) => {
                      const state = moduleState[module.id];
                      return (
                        <button
                          key={module.id}
                          onClick={() => setActiveModuleId(module.id)}
                          className={`min-w-[240px] flex-1 rounded-xl border p-4 text-left shadow-sm transition ${
                            activeModule?.id === module.id
                              ? "border-indigo-500 bg-indigo-50"
                              : "border-slate-200 bg-white"
                          }`}
                        >
                          <div className="flex items-center justify-between text-xs text-slate-500">
                            <span>{module.duration}</span>
                            <span>{state?.quizScore ? `${state.quizScore}%` : "Quiz pending"}</span>
                          </div>
                          <h4 className="mt-2 text-sm font-semibold text-slate-900">{module.title}</h4>
                          <p className="mt-1 text-xs text-slate-600 line-clamp-3">{module.description}</p>
                          <div className="mt-3 flex items-center gap-2 text-[11px] font-semibold">
                            <span
                              className={`rounded-full px-2 py-1 ${
                                state?.completed ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-700"
                              }`}
                            >
                              {state?.completed ? "Completed" : "In progress"}
                            </span>
                            <span className="rounded-full bg-slate-50 px-2 py-1 text-slate-600">
                              {state?.checkpointsCompleted ?? 0}/{module.checkpoints.length} checkpoints
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold text-slate-900">AI Avatar Feedback</h3>
                    <span className="rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold text-indigo-700">
                      Adaptive
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-slate-700">
                    Dynamic coaching based on quiz scores, checkpoint streaks, and completion speed. Modules adapt to
                    focus on your growth areas.
                  </p>
                  <ul className="mt-3 space-y-2 text-sm text-slate-700">
                    <li>• Personalized prompts after each quiz and checkpoint.</li>
                    <li>• Avatar celebrates streaks and recommends re-certification rehearsals.</li>
                    <li>• Gamified challenges unlock when you maintain high accuracy.</li>
                  </ul>
                </div>

                <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold text-slate-900">Progress Meter</h3>
                    <span className="text-xs font-semibold text-slate-500">Modules: {totalModules}</span>
                  </div>
                  <div className="mt-4 space-y-3">
                    <div className="flex items-center justify-between text-sm font-semibold text-slate-700">
                      <span>Module completion</span>
                      <span>
                        {completedCount}/{totalModules}
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-100">
                      <div
                        className="h-2 rounded-full bg-emerald-500 transition-all"
                        style={{ width: `${totalModules > 0 ? (completedCount / totalModules) * 100 : 0}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-sm font-semibold text-slate-700">
                      <span>Checkpoint momentum</span>
                      <span>
                        {completedCheckpoints}/{checkpointTotals}
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-100">
                      <div
                        className="h-2 rounded-full bg-indigo-500 transition-all"
                        style={{
                          width: `${
                            checkpointTotals > 0 ? (completedCheckpoints / checkpointTotals) * 100 : 0
                          }%`,
                        }}
                      />
                    </div>
                  </div>

                  <div className="mt-4 rounded-xl bg-gradient-to-br from-indigo-50 via-white to-emerald-50 p-4 ring-1 ring-indigo-100">
                    <p className="text-sm font-semibold text-slate-900">Re-certification cadence</p>
                    <p className="mt-1 text-xs text-slate-600">
                      Trackers reset when quizzes fall below thresholds or when modules reach their cadence windows.
                    </p>
                    <div className="mt-3 grid grid-cols-2 gap-3 text-xs text-slate-700">
                      <div className="rounded-lg bg-white p-3 ring-1 ring-slate-200">
                        <p className="font-semibold text-slate-900">Quiz triggers</p>
                        <p className="mt-1">Scores below 80% unlock remediation quests.</p>
                      </div>
                      <div className="rounded-lg bg-white p-3 ring-1 ring-slate-200">
                        <p className="font-semibold text-slate-900">Schedule</p>
                        <p className="mt-1">Annual, semi-annual, or policy-based recertifications per module.</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold text-slate-900">Adaptive Track Notes</h3>
                    <span className="text-xs font-semibold text-slate-500">Live</span>
                  </div>
                  <p className="mt-2 text-sm text-slate-700">
                    {adaptiveSummary} Based on your selections, the curriculum prioritizes quizzes, gamified challenges,
                    and avatar responses that target your skill gaps.
                  </p>
                  <div className="mt-4 grid grid-cols-2 gap-3 text-xs text-slate-700">
                    <div className="rounded-lg bg-slate-50 p-3 ring-1 ring-slate-200">
                      <p className="font-semibold text-slate-900">Media engagement</p>
                      <p className="mt-1">Toggle between video, audio, and YouTube embeds inside each module.</p>
                    </div>
                    <div className="rounded-lg bg-slate-50 p-3 ring-1 ring-slate-200">
                      <p className="font-semibold text-slate-900">Gamified checkpoints</p>
                      <p className="mt-1">Carousels and badges reward streaks while progress meters track momentum.</p>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </main>
        </div>
      </div>
    </div>
  );
}
