'use client'

import { useState, useEffect } from 'react'
import { TrainingFlashcard } from '@/types/training'
import { ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react'

type FlashcardDeckProps = {
    flashcards: TrainingFlashcard[]
}

export default function FlashcardDeck({ flashcards }: FlashcardDeckProps) {
    const [currentIndex, setCurrentIndex] = useState(0)
    const [isFlipped, setIsFlipped] = useState(false)
    const [cards, setCards] = useState<TrainingFlashcard[]>(flashcards)

    // Reset when flashcards prop changes
    useEffect(() => {
        setCards(flashcards)
        setCurrentIndex(0)
        setIsFlipped(false)
    }, [flashcards])

    if (!cards || cards.length === 0) {
        return (
            <div className="bg-slate-100 rounded-xl p-8 text-center border border-dashed border-slate-300">
                <p className="text-slate-500 italic">No flashcards available for this module yet.</p>
            </div>
        )
    }

    const currentCard = cards[currentIndex]

    const handleNext = () => {
        setIsFlipped(false)
        setTimeout(() => {
            setCurrentIndex((prev) => (prev + 1) % cards.length)
        }, 150)
    }

    const handlePrev = () => {
        setIsFlipped(false)
        setTimeout(() => {
            setCurrentIndex((prev) => (prev - 1 + cards.length) % cards.length)
        }, 150)
    }

    const handleFlip = () => {
        setIsFlipped(!isFlipped)
    }

    const handleShuffle = () => {
        const shuffled = [...cards].sort(() => Math.random() - 0.5)
        setCards(shuffled)
        setCurrentIndex(0)
        setIsFlipped(false)
    }

    return (
        <div className="max-w-2xl mx-auto select-none">
            {/* Progress & Controls */}
            <div className="flex items-center justify-between mb-4 text-sm text-slate-500">
                <span>Card {currentIndex + 1} of {cards.length}</span>
                <button
                    onClick={handleShuffle}
                    className="flex items-center gap-1 hover:text-brand-copper transition-colors"
                >
                    <RotateCcw className="w-3 h-3" /> Shuffle
                </button>
            </div>

            {/* Card Area */}
            <div
                className="group relative w-full aspect-[3/2] cursor-pointer perspective-1000"
                onClick={handleFlip}
            >
                <div className={`relative w-full h-full text-center transition-all duration-500 transform-style-3d shadow-xl rounded-2xl ${isFlipped ? 'rotate-y-180' : ''}`}>

                    {/* Front */}
                    <div className="absolute w-full h-full backface-hidden bg-white border border-slate-200 rounded-2xl p-8 flex flex-col items-center justify-center shadow-sm group-hover:shadow-md transition-shadow">
                        <span className="text-xs uppercase tracking-widest text-slate-400 font-bold mb-4">Question</span>
                        <h3 className="text-xl md:text-2xl font-bold text-slate-800">
                            {currentCard.front_content}
                        </h3>
                        <p className="absolute bottom-6 text-xs text-brand-copper font-medium animate-pulse">
                            Tap to flip
                        </p>
                    </div>

                    {/* Back */}
                    <div className="absolute w-full h-full backface-hidden rotate-y-180 bg-slate-900 rounded-2xl p-8 flex flex-col items-center justify-center text-white shadow-sm">
                        <span className="text-xs uppercase tracking-widest text-slate-400 font-bold mb-4">Answer</span>
                        <p className="text-lg md:text-xl font-medium leading-relaxed">
                            {currentCard.back_content}
                        </p>
                    </div>
                </div>
            </div>

            {/* Navigation Buttons */}
            <div className="flex items-center justify-center gap-4 mt-8">
                <button
                    onClick={handlePrev}
                    className="p-3 rounded-full bg-white border border-slate-200 text-slate-600 hover:border-brand-copper hover:text-brand-copper hover:shadow-md transition-all disabled:opacity-50"
                >
                    <ChevronLeft className="w-6 h-6" />
                </button>

                <div className="h-1 w-32 bg-slate-100 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-brand-copper transition-all duration-300"
                        style={{ width: `${((currentIndex + 1) / cards.length) * 100}%` }}
                    />
                </div>

                <button
                    onClick={handleNext}
                    className="p-3 rounded-full bg-white border border-slate-200 text-slate-600 hover:border-brand-copper hover:text-brand-copper hover:shadow-md transition-all"
                >
                    <ChevronRight className="w-6 h-6" />
                </button>
            </div>
        </div>
    )
}
