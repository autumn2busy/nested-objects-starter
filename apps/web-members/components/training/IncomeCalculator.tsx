import React, { useState, useMemo } from 'react';
import {
  DollarSign, TrendingUp, Calendar, Clock,
  Car, Smartphone, Shield, ChevronDown, ChevronUp,
  Zap, Target, Info, CheckCircle2
} from 'lucide-react';

/**
 * NESTED OBJECTS - INTERACTIVE INCOME CALCULATOR
 * Module 1: Orientation & Quick Start
 * 
 * Converts the static PDF calculator into a dynamic tool that helps
 * learners visualize their income potential in field services.
 */

const IncomeCalculator = () => {
  // User inputs
  const [inspectionsPerDay, setInspectionsPerDay] = useState(6);
  const [daysPerMonth, setDaysPerMonth] = useState(20);
  const [avgPayPerInspection, setAvgPayPerInspection] = useState(75);
  const [showStartupCosts, setShowStartupCosts] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState('full-time');

  // Presets from the PDF
  const presets = {
    'part-time': { inspections: 4, days: 10, label: 'Part-Time (Side Hustle)', description: '10 days/month, 4 inspections/day' },
    'full-time': { inspections: 6, days: 20, label: 'Full-Time (Efficient)', description: '20 days/month, 6 inspections/day' },
    'high-volume': { inspections: 8, days: 22, label: 'High-Volume Pro', description: '22 days/month, 8 inspections/day' },
  };

  // Startup costs from the PDF
  const startupCosts = [
    { item: 'ABC# Background Check', cost: 50, note: 'Via Shield Hub - required by most lenders', annual: true },
    { item: 'Smartphone + Computer', cost: 0, note: 'You likely already have this', annual: false },
    { item: 'Volt Stick', cost: 10, note: 'Non-contact voltage tester for vacant properties', annual: false },
    { item: 'HUD Key Set', cost: 25, note: 'Universal keys for REO properties', annual: false },
    { item: 'Blue Painter\'s Tape', cost: 5, note: 'For marking and photos', annual: false },
  ];

  // Gig comparison data from PDF
  const gigComparison = {
    avgPay: '$5-10',
    efficiency: '2-3 deliveries/hr',
    dailyPotential: '$120-180',
    paymentFrequency: 'Weekly/Instant',
    timeToFirstJob: '1-3 days',
  };

  // Calculations
  const calculations = useMemo(() => {
    const monthlyIncome = inspectionsPerDay * daysPerMonth * avgPayPerInspection;
    const dailyIncome = inspectionsPerDay * avgPayPerInspection;
    const hourlyEquivalent = (inspectionsPerDay * avgPayPerInspection) / 8; // Assuming 8-hour day
    const yearlyIncome = monthlyIncome * 12;

    // Compare to gig work (assuming $7.50 avg per delivery, 2.5 deliveries/hr, 8 hr day)
    const gigDailyIncome = 7.5 * 2.5 * 8;
    const gigMonthlyIncome = gigDailyIncome * daysPerMonth;
    const incomeIncrease = ((monthlyIncome - gigMonthlyIncome) / gigMonthlyIncome * 100).toFixed(0);

    const totalStartupCost = startupCosts.reduce((sum, item) => sum + item.cost, 0);
    const daysToRecoup = Math.ceil(totalStartupCost / dailyIncome);

    return {
      monthlyIncome,
      dailyIncome,
      hourlyEquivalent,
      yearlyIncome,
      gigMonthlyIncome,
      incomeIncrease,
      totalStartupCost,
      daysToRecoup,
    };
  }, [inspectionsPerDay, daysPerMonth, avgPayPerInspection]);

  // Apply preset
  const applyPreset = (presetKey) => {
    setSelectedPreset(presetKey);
    setInspectionsPerDay(presets[presetKey].inspections);
    setDaysPerMonth(presets[presetKey].days);
  };

  return (
    <div className="bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="relative px-6 py-8 border-b border-slate-800">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(16,185,129,0.15),transparent_70%)]" />
        <div className="relative">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
              <DollarSign className="w-4 h-4 text-emerald-400" />
            </div>
            <span className="text-emerald-400 text-sm font-semibold uppercase tracking-wider">
              Module 1 Tool
            </span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight mb-2">
            Quick Start Income Calculator
          </h2>
          <p className="text-slate-400 text-sm max-w-xl">
            Visualize your income potential transitioning from gig work to professional field services.
            Adjust the sliders to match your availability.
          </p>
        </div>
      </div>

      <div className="p-6 space-y-8">
        {/* Preset Buttons */}
        <div className="space-y-3">
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Quick Presets
          </label>
          <div className="grid grid-cols-3 gap-3">
            {Object.entries(presets).map(([key, preset]) => (
              <button
                key={key}
                onClick={() => applyPreset(key)}
                className={`p-4 rounded-xl border transition-all text-left ${selectedPreset === key
                    ? 'bg-emerald-500/20 border-emerald-500/50 ring-2 ring-emerald-500/20'
                    : 'bg-slate-800/50 border-slate-700 hover:border-slate-600'
                  }`}
              >
                <div className="text-sm font-semibold text-white mb-1">{preset.label}</div>
                <div className="text-xs text-slate-400">{preset.description}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Sliders */}
        <div className="grid md:grid-cols-3 gap-6">
          {/* Inspections Per Day */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
                <Target className="w-4 h-4 text-emerald-400" />
                Inspections/Day
              </label>
              <span className="text-lg font-bold text-emerald-400">{inspectionsPerDay}</span>
            </div>
            <input
              type="range"
              min="2"
              max="12"
              value={inspectionsPerDay}
              onChange={(e) => {
                setInspectionsPerDay(Number(e.target.value));
                setSelectedPreset(null);
              }}
              className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer
                         [&::-webkit-slider-thumb]:appearance-none
                         [&::-webkit-slider-thumb]:w-5
                         [&::-webkit-slider-thumb]:h-5
                         [&::-webkit-slider-thumb]:rounded-full
                         [&::-webkit-slider-thumb]:bg-emerald-500
                         [&::-webkit-slider-thumb]:cursor-pointer
                         [&::-webkit-slider-thumb]:shadow-lg
                         [&::-webkit-slider-thumb]:shadow-emerald-500/30"
            />
            <div className="flex justify-between text-xs text-slate-500">
              <span>2</span>
              <span>12</span>
            </div>
          </div>

          {/* Days Per Month */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-emerald-400" />
                Days/Month
              </label>
              <span className="text-lg font-bold text-emerald-400">{daysPerMonth}</span>
            </div>
            <input
              type="range"
              min="5"
              max="26"
              value={daysPerMonth}
              onChange={(e) => {
                setDaysPerMonth(Number(e.target.value));
                setSelectedPreset(null);
              }}
              className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer
                         [&::-webkit-slider-thumb]:appearance-none
                         [&::-webkit-slider-thumb]:w-5
                         [&::-webkit-slider-thumb]:h-5
                         [&::-webkit-slider-thumb]:rounded-full
                         [&::-webkit-slider-thumb]:bg-emerald-500
                         [&::-webkit-slider-thumb]:cursor-pointer
                         [&::-webkit-slider-thumb]:shadow-lg
                         [&::-webkit-slider-thumb]:shadow-emerald-500/30"
            />
            <div className="flex justify-between text-xs text-slate-500">
              <span>5</span>
              <span>26</span>
            </div>
          </div>

          {/* Average Pay */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-emerald-400" />
                Avg Pay/Inspection
              </label>
              <span className="text-lg font-bold text-emerald-400">${avgPayPerInspection}</span>
            </div>
            <input
              type="range"
              min="50"
              max="150"
              step="5"
              value={avgPayPerInspection}
              onChange={(e) => setAvgPayPerInspection(Number(e.target.value))}
              className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer
                         [&::-webkit-slider-thumb]:appearance-none
                         [&::-webkit-slider-thumb]:w-5
                         [&::-webkit-slider-thumb]:h-5
                         [&::-webkit-slider-thumb]:rounded-full
                         [&::-webkit-slider-thumb]:bg-emerald-500
                         [&::-webkit-slider-thumb]:cursor-pointer
                         [&::-webkit-slider-thumb]:shadow-lg
                         [&::-webkit-slider-thumb]:shadow-emerald-500/30"
            />
            <div className="flex justify-between text-xs text-slate-500">
              <span>$50</span>
              <span>$150</span>
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="grid md:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 rounded-xl p-5 border border-emerald-500/30">
            <div className="text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-2">
              Monthly Income
            </div>
            <div className="text-3xl font-bold text-white">
              ${calculations.monthlyIncome.toLocaleString()}
            </div>
            <div className="text-xs text-slate-400 mt-1">
              {calculations.incomeIncrease > 0 ? '+' : ''}{calculations.incomeIncrease}% vs gig work
            </div>
          </div>

          <div className="bg-slate-800/50 rounded-xl p-5 border border-slate-700">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Daily Income
            </div>
            <div className="text-2xl font-bold text-white">
              ${calculations.dailyIncome.toLocaleString()}
            </div>
            <div className="text-xs text-slate-500 mt-1">
              {inspectionsPerDay} inspections × ${avgPayPerInspection}
            </div>
          </div>

          <div className="bg-slate-800/50 rounded-xl p-5 border border-slate-700">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Hourly Equivalent
            </div>
            <div className="text-2xl font-bold text-white">
              ${calculations.hourlyEquivalent.toFixed(0)}/hr
            </div>
            <div className="text-xs text-slate-500 mt-1">
              Based on 8-hour workday
            </div>
          </div>

          <div className="bg-slate-800/50 rounded-xl p-5 border border-slate-700">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Yearly Potential
            </div>
            <div className="text-2xl font-bold text-white">
              ${calculations.yearlyIncome.toLocaleString()}
            </div>
            <div className="text-xs text-slate-500 mt-1">
              12 months at this rate
            </div>
          </div>
        </div>

        {/* Comparison Section */}
        <div className="bg-slate-800/30 rounded-xl border border-slate-700 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-700 flex items-center justify-between">
            <h3 className="font-semibold text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              Income Comparison: Field Services vs. Gig Delivery
            </h3>
          </div>
          <div className="p-5">
            <div className="grid md:grid-cols-2 gap-4">
              {/* Field Services Column */}
              <div className="bg-emerald-500/10 rounded-xl p-4 border border-emerald-500/30">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center">
                    <Shield className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <div className="font-semibold text-white">Mortgage Field Services</div>
                    <div className="text-xs text-emerald-400">Professional Service</div>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Avg Pay/Job</span>
                    <span className="text-white font-semibold">${avgPayPerInspection}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Efficiency Goal</span>
                    <span className="text-white font-semibold">4-6 inspections/hr</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Daily Potential</span>
                    <span className="text-emerald-400 font-bold">${calculations.dailyIncome}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Payment</span>
                    <span className="text-white font-semibold">Bi-weekly (Direct)</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Time to First Job</span>
                    <span className="text-white font-semibold">3-7 days</span>
                  </div>
                </div>
              </div>

              {/* Gig Delivery Column */}
              <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-full bg-slate-600 flex items-center justify-center">
                    <Car className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <div className="font-semibold text-white">Standard Gig Delivery</div>
                    <div className="text-xs text-slate-400">Delivery/Task</div>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Avg Pay/Job</span>
                    <span className="text-slate-300">$5-10</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Efficiency</span>
                    <span className="text-slate-300">2-3 deliveries/hr</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Daily Potential</span>
                    <span className="text-slate-300">$120-180</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Payment</span>
                    <span className="text-slate-300">Weekly/Instant</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Time to First Job</span>
                    <span className="text-slate-300">1-3 days</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Startup Costs Accordion */}
        <div className="bg-slate-800/30 rounded-xl border border-slate-700 overflow-hidden">
          <button
            onClick={() => setShowStartupCosts(!showStartupCosts)}
            className="w-full px-5 py-4 flex items-center justify-between hover:bg-slate-800/50 transition"
          >
            <h3 className="font-semibold text-white flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400" />
              Startup Costs (The &quot;Professional Kit&quot;)
            </h3>
            <div className="flex items-center gap-3">
              <span className="text-emerald-400 font-bold">${calculations.totalStartupCost}</span>
              {showStartupCosts ? (
                <ChevronUp className="w-5 h-5 text-slate-400" />
              ) : (
                <ChevronDown className="w-5 h-5 text-slate-400" />
              )}
            </div>
          </button>

          {showStartupCosts && (
            <div className="px-5 pb-5 space-y-3">
              {startupCosts.map((item, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between py-3 border-b border-slate-700 last:border-0"
                >
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 mt-0.5" />
                    <div>
                      <div className="text-sm font-medium text-white">
                        {item.item}
                        {item.annual && (
                          <span className="ml-2 text-xs bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded">
                            Annual
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5">{item.note}</div>
                    </div>
                  </div>
                  <div className={`text-sm font-semibold ${item.cost === 0 ? 'text-emerald-400' : 'text-white'}`}>
                    {item.cost === 0 ? 'FREE' : `$${item.cost}`}
                  </div>
                </div>
              ))}

              <div className="mt-4 p-4 bg-emerald-500/10 rounded-lg border border-emerald-500/30">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-semibold text-emerald-400">Recoup Your Investment</div>
                    <div className="text-xs text-slate-400">Based on your current settings</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold text-white">{calculations.daysToRecoup} {calculations.daysToRecoup === 1 ? 'day' : 'days'}</div>
                    <div className="text-xs text-slate-400">of work</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Reality Check */}
        <div className="flex items-start gap-4 p-4 bg-amber-500/10 rounded-xl border border-amber-500/30">
          <Info className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
          <div>
            <div className="text-sm font-semibold text-amber-400 mb-1">The Reality Check</div>
            <p className="text-sm text-slate-300">
              Your income is tied to <strong>efficiency and routing</strong>, not just speed.
              Quality inspections = consistent work = long-term income. Cutting corners leads to
              rejected reports and lost pay.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IncomeCalculator;
