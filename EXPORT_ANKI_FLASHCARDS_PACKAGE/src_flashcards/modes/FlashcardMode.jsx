import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RotateCcw, ChevronLeft, ChevronRight, Check, X as XIcon, Minus } from 'lucide-react';

export default function FlashcardMode({ session, onComplete }) {
    const [isFlipped, setIsFlipped] = useState(false);
    const [exitDirection, setExitDirection] = useState(0);

    const { currentCard, currentIndex, queue, isComplete, submitAnswer, getProgress } = session;
    const progress = getProgress();

    useEffect(() => {
        if (isComplete) onComplete();
    }, [isComplete, onComplete]);

    // Reset flip on card change
    useEffect(() => {
        setIsFlipped(false);
    }, [currentIndex]);

    const handleAnswer = useCallback((quality) => {
        if (!currentCard) return;
        setExitDirection(quality >= 2 ? 1 : quality === 0 ? -1 : 0);
        setTimeout(() => {
            submitAnswer(currentCard.id, quality);
        }, 150);
    }, [currentCard, submitAnswer]);

    // Keyboard shortcuts
    useEffect(() => {
        const handler = (e) => {
            if (e.key === ' ' || e.key === 'Enter') {
                e.preventDefault();
                if (!isFlipped) setIsFlipped(true);
            }
            if (isFlipped) {
                if (e.key === 'ArrowRight' || e.key === '3') handleAnswer(3); // Easy
                else if (e.key === 'ArrowUp' || e.key === '2') handleAnswer(2);   // Good
                else if (e.key === 'ArrowDown' || e.key === '1') handleAnswer(1);  // Hard
                else if (e.key === 'ArrowLeft' || e.key === '0') handleAnswer(0);  // Wrong
            }
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [isFlipped, handleAnswer]);

    if (!currentCard) return null;

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            {/* Progress Bar */}
            <div className="space-y-2">
                <div className="flex justify-between text-xs text-gray-400 font-bold">
                    <span>{progress.answered} / {progress.total}</span>
                    <span className="flex items-center gap-1">
                        {progress.streak > 0 && (
                            <span className="text-amber-400 animate-pulse">🔥 {progress.streak}</span>
                        )}
                    </span>
                </div>
                <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <motion.div
                        className="h-full bg-gradient-to-r from-violet-600 to-indigo-500 rounded-full"
                        animate={{ width: `${progress.percentage}%` }}
                        transition={{ duration: 0.3 }}
                    />
                </div>
            </div>

            {/* Flashcard */}
            <div
                className="flashcard-3d cursor-pointer"
                onClick={() => !isFlipped && setIsFlipped(true)}
                style={{ perspective: '1200px', minHeight: '320px' }}
            >
                <AnimatePresence mode="wait" custom={exitDirection}>
                    <motion.div
                        key={currentCard.id + (isFlipped ? '-back' : '-front')}
                        custom={exitDirection}
                        initial={{ opacity: 0, rotateY: isFlipped ? -90 : 0, x: exitDirection * 50 }}
                        animate={{ opacity: 1, rotateY: 0, x: 0 }}
                        exit={{ opacity: 0, x: exitDirection * 200 }}
                        transition={{ duration: 0.35, type: 'spring', stiffness: 200, damping: 25 }}
                        className="glass-panel rounded-3xl p-8 md:p-12 flex flex-col items-center justify-center min-h-[320px] relative overflow-hidden border border-white/10"
                        style={{ transformStyle: 'preserve-3d' }}
                    >
                        {/* Front / Back label */}
                        <span className={`absolute top-4 left-4 text-[10px] font-bold uppercase tracking-widest ${
                            isFlipped ? 'text-emerald-400' : 'text-violet-400'
                        }`}>
                            {isFlipped ? 'Reverso' : 'Frente'}
                        </span>

                        {/* Card counter */}
                        <span className="absolute top-4 right-4 text-xs text-gray-600 font-mono">
                            {currentIndex + 1}/{queue.length}
                        </span>

                        {/* Content */}
                        <div className="text-center w-full">
                            <p className={`font-bold leading-relaxed ${
                                (isFlipped ? currentCard.back : currentCard.front).length > 100
                                    ? 'text-lg md:text-xl'
                                    : 'text-2xl md:text-3xl'
                            } text-white`}>
                                {isFlipped ? currentCard.back : currentCard.front}
                            </p>
                        </div>

                        {/* Tap hint */}
                        {!isFlipped && (
                            <motion.p
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 1 }}
                                className="absolute bottom-4 text-[11px] text-gray-500 flex items-center gap-1"
                            >
                                <RotateCcw size={12} /> Toca para voltear
                            </motion.p>
                        )}

                        {/* Background accent */}
                        <div className={`absolute -bottom-20 -right-20 w-60 h-60 rounded-full blur-3xl opacity-5 ${
                            isFlipped ? 'bg-emerald-500' : 'bg-violet-500'
                        }`} />
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Answer Buttons (show after flip) */}
            <AnimatePresence>
                {isFlipped && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="grid grid-cols-4 gap-3"
                    >
                        <motion.button
                            whileTap={{ scale: 0.9 }}
                            onClick={() => handleAnswer(0)}
                            className="py-4 rounded-2xl bg-red-900/30 border border-red-500/20 text-red-300 font-bold flex flex-col items-center gap-1 hover:bg-red-900/50 transition-all"
                        >
                            <XIcon size={20} />
                            <span className="text-xs">No sé</span>
                        </motion.button>
                        <motion.button
                            whileTap={{ scale: 0.9 }}
                            onClick={() => handleAnswer(1)}
                            className="py-4 rounded-2xl bg-orange-900/30 border border-orange-500/20 text-orange-300 font-bold flex flex-col items-center gap-1 hover:bg-orange-900/50 transition-all"
                        >
                            <Minus size={20} />
                            <span className="text-xs">Difícil</span>
                        </motion.button>
                        <motion.button
                            whileTap={{ scale: 0.9 }}
                            onClick={() => handleAnswer(2)}
                            className="py-4 rounded-2xl bg-blue-900/30 border border-blue-500/20 text-blue-300 font-bold flex flex-col items-center gap-1 hover:bg-blue-900/50 transition-all"
                        >
                            <Check size={20} />
                            <span className="text-xs">Bien</span>
                        </motion.button>
                        <motion.button
                            whileTap={{ scale: 0.9 }}
                            onClick={() => handleAnswer(3)}
                            className="py-4 rounded-2xl bg-emerald-900/30 border border-emerald-500/20 text-emerald-300 font-bold flex flex-col items-center gap-1 hover:bg-emerald-900/50 transition-all"
                        >
                            <Check size={20} className="stroke-[3]" />
                            <span className="text-xs">Fácil</span>
                        </motion.button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Keyboard hint */}
            <p className="text-center text-[10px] text-gray-600 hidden md:block">
                Espacio = voltear · ← No sé · ↓ Difícil · ↑ Bien · → Fácil
            </p>
        </div>
    );
}
