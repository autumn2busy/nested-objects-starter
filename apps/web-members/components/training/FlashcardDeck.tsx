import React, { useState, useEffect } from 'react';
import {
  ChevronLeft, ChevronRight, RotateCcw,
  CheckCircle2, XCircle, BrainCircuit,
  Lightbulb, Layers, Shuffle, Trophy
} from 'lucide-react';

/**
 * NESTED OBJECTS - DYNAMIC FLASHCARD DECK
 * Accepts flashcard data from parent component (Supabase)
 */

export interface Flashcard {
  id: string;
  front: string;
  back: string;
  category: string;
  difficulty?: number;
}

interface FlashcardDeckProps {
  cards: Flashcard[];
  title?: string;
  description?: string;
}

const FlashcardDeck = ({ cards, title = "Flashcard Deck", description = "Test your knowledge." }: FlashcardDeckProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [masteredCards, setMasteredCards] = useState<string[]>([]);
  const [shuffledCards, setShuffledCards] = useState<Flashcard[]>([]);
  const [streak, setStreak] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);

  // Initialize and shuffle cards on mount or when props change
  useEffect(() => {
    if (cards && cards.length > 0) {
      setShuffledCards([...cards]);
    }
  }, [cards]);

  const currentCard = shuffledCards[currentIndex];
  // Calculate progress based on mastered cards vs total original cards
  const progress = cards.length > 0 ? Math.round((masteredCards.length / cards.length) * 100) : 0;

  const handleNext = () => {
    setIsFlipped(false);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % shuffledCards.length);
    }, 200);
  };

  const handlePrev = () => {
    setIsFlipped(false);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev - 1 + shuffledCards.length) % shuffledCards.length);
    }, 200);
  };

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  const handleMastery = (isMastered: boolean) => {
    if (isMastered) {
      if (!masteredCards.includes(currentCard.id)) {
        setMasteredCards([...masteredCards, currentCard.id]);
        setStreak(streak + 1);
        if (streak + 1 >= 5) setShowConfetti(true);
      }
      handleNext();
    } else {
      setStreak(0);
      setShowConfetti(false);
      handleNext();
    }
  };

  const handleShuffle = () => {
    setIsFlipped(false);
    setTimeout(() => {
      const newShuffled = [...shuffledCards].sort(() => Math.random() - 0.5);
      setShuffledCards(newShuffled);
      setCurrentIndex(0);
    }, 200);
  };

  const handleReset = () => {
    setMasteredCards([]);
    setStreak(0);
    setCurrentIndex(0);
    setIsFlipped(false);
  };

  if (!cards || cards.length === 0) {
    return (
      <div className="p-8 text-center bg-slate-800 rounded-xl border border-slate-700">
        <Layers className="w-12 h-12 text-slate-600 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-white">No Flashcards Available</h3>
        <p className="text-slate-400 mt-2">Check back later for content updates.</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Header Info */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <BrainCircuit className="w-6 h-6 text-emerald-400" />
            {title}
          </h2>
          <p className="text-slate-400 text-sm mt-1">
            {description} • {cards.length} cards
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex flex-col items-end">
            <div className="text-xs font-semibold uppercase text-slate-500 tracking-wider">Mastery</div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-24 bg-slate-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 transition-all duration-500 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <span className="text-emerald-400 font-bold">{progress}%</span>
            </div>
          </div>

          <div className={`flex flex-col items-end transition-opacity ${streak > 1 ? 'opacity-100' : 'opacity-0'}`}>
            <div className="text-xs font-semibold uppercase text-amber-500 tracking-wider flex items-center gap-1">
              <Trophy className="w-3 h-3" /> Streak
            </div>
            <div className="text-amber-400 font-bold">{streak}x</div>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-12 gap-6">
        {/* Main Flashcard Area */}
        <div className="lg:col-span-8 space-y-6">
          <div className="relative group perspective-1000 h-96">
            <div
              onClick={handleFlip}
              className={`w-full h-full relative preserve-3d transition-all duration-500 cursor-pointer ${isFlipped ? 'rotate-y-180' : ''
                }`}
            >
              {/* Front Side */}
              <div className="absolute inset-0 backface-hidden">
                <div className="w-full h-full bg-slate-800 rounded-2xl border-2 border-slate-700 shadow-xl p-8 flex flex-col justify-between group-hover:border-emerald-500/50 transition-colors">
                  <div className="flex justify-between items-start">
                    <span className="px-3 py-1 bg-slate-900/50 rounded-full text-xs font-medium text-slate-400 border border-slate-700">
                      {currentCard?.category || 'General'}
                    </span>
                    <span className="text-slate-600 text-xs font-mono">
                      {currentIndex + 1} / {shuffledCards.length}
                    </span>
                  </div>

                  <div className="flex-1 flex items-center justify-center text-center p-4">
                    <h3 className="text-2xl md:text-3xl font-medium text-white leading-relaxed">
                      {currentCard?.front}
                    </h3>
                  </div>

                  <div className="flex items-center justify-center gap-2 text-slate-500 text-sm">
                    <RotateCcw className="w-4 h-4" />
                    Click to flip
                  </div>
                </div>
              </div>

              {/* Back Side */}
              <div className="absolute inset-0 backface-hidden rotate-y-180">
                <div className="w-full h-full bg-slate-900 rounded-2xl border-2 border-emerald-500/30 shadow-xl shadow-emerald-500/10 p-8 flex flex-col justify-between">
                  {/* Decorative corner accent */}
                  <div className="absolute top-0 right-0 p-6">
                    <Lightbulb className="w-8 h-8 text-emerald-500/20" />
                  </div>

                  <div className="flex justify-between items-start">
                    <span className="text-emerald-500 text-xs font-bold uppercase tracking-wider">
                      Answer
                    </span>
                  </div>

                  <div className="flex-1 flex items-center justify-center text-center p-4">
                    <p className="text-xl md:text-2xl text-slate-200 leading-relaxed font-light">
                      {currentCard?.back}
                    </p>
                  </div>

                  {/* Rating Buttons */}
                  <div className="grid grid-cols-2 gap-4 mt-4" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => handleMastery(false)}
                      className="flex items-center justify-center gap-2 p-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition border border-slate-700"
                    >
                      <XCircle className="w-5 h-5 text-red-500" />
                      <span className="font-medium">Still Learning</span>
                    </button>
                    <button
                      onClick={() => handleMastery(true)}
                      className="flex items-center justify-center gap-2 p-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white transition shadow-lg shadow-emerald-500/25"
                    >
                      <CheckCircle2 className="w-5 h-5" />
                      <span className="font-medium">Got It!</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation Controls */}
          <div className="flex items-center justify-between px-4">
            <button
              onClick={handleShuffle}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
              title="Shuffle Deck"
            >
              <Shuffle className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-4">
              <button
                onClick={handlePrev}
                className="p-3 bg-slate-800 hover:bg-slate-700 rounded-full text-slate-200 transition border border-slate-700"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button
                onClick={handleNext}
                className="p-3 bg-slate-800 hover:bg-slate-700 rounded-full text-slate-200 transition border border-slate-700"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </div>

            <button
              onClick={handleReset}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
              title="Reset Progress"
            >
              <RotateCcw className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Sidebar / Stats */}
        <div className="lg:col-span-4 space-y-6">
          {/* Progress Card */}
          <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-6">
            <h4 className="text-white font-semibold mb-4 flex items-center gap-2">
              <Trophy className="w-4 h-4 text-emerald-400" />
              Session Stats
            </h4>
            <div className="space-y-4">
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-400">Cards Mastered</span>
                <span className="text-white font-mono">{masteredCards.length} / {cards.length}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-400">Current Streak</span>
                <span className="text-emerald-400 font-mono font-bold">+{streak}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-400">Remaining</span>
                <span className="text-slate-300 font-mono">{cards.length - masteredCards.length}</span>
              </div>
            </div>
          </div>

          {/* Quick Tips */}
          <div className="bg-emerald-900/10 rounded-xl border border-emerald-500/20 p-6">
            <h4 className="text-emerald-400 font-semibold mb-2 text-sm uppercase tracking-wider flex items-center gap-2">
              <Lightbulb className="w-4 h-4" />
              Study Tip
            </h4>
            <p className="text-slate-400 text-sm leading-relaxed">
              Active recall is the most efficient way to learn. Try to say the answer out loud before flipping the card!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FlashcardDeck;
