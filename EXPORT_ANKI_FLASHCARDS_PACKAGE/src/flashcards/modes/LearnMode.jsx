import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, Check, X as XIcon, ArrowRight } from 'lucide-react';

function shuffleArray(arr) {
    const s = [...arr];
    for (let i = s.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [s[i], s[j]] = [s[j], s[i]];
    }
    return s;
}

export default function LearnMode({ session, onComplete }) {
    const { currentCard, currentIndex, queue, isComplete, submitAnswer, getProgress, getDistractors } = session;
    const progress = getProgress();

    const [options, setOptions] = useState([]);
    const [selectedOption, setSelectedOption] = useState(null);
    const [isCorrect, setIsCorrect] = useState(null); // null = not answered, true/false
    const [showNext, setShowNext] = useState(false);

    useEffect(() => {
        if (isComplete) onComplete();
    }, [isComplete, onComplete]);

    // Generate options when card changes
    useEffect(() => {
        if (!currentCard) return;
        const distractors = getDistractors(currentCard, 3);
        const allOptions = shuffleArray([
            { id: currentCard.id, text: currentCard.back, isCorrect: true },
            ...distractors.map(d => ({ id: d.id, text: d.back, isCorrect: false }))
        ]);
        setOptions(allOptions);
        setSelectedOption(null);
        setIsCorrect(null);
        setShowNext(false);
    }, [currentCard, currentIndex, getDistractors]);

    const handleSelect = useCallback((option) => {
        if (selectedOption !== null) return; // Already answered
        setSelectedOption(option.id);
        setIsCorrect(option.isCorrect);
        setShowNext(true);
    }, [selectedOption]);

    const handleNext = useCallback(() => {
        if (!currentCard) return;
        submitAnswer(currentCard.id, isCorrect ? 2 : 0);
    }, [currentCard, submitAnswer, isCorrect]);

    // Keyboard: 1-4 to select, Enter/Space to continue
    useEffect(() => {
        const handler = (e) => {
            if (showNext && (e.key === 'Enter' || e.key === ' ')) {
                e.preventDefault();
                handleNext();
                return;
            }
            const num = parseInt(e.key);
            if (num >= 1 && num <= options.length && selectedOption === null) {
                handleSelect(options[num - 1]);
            }
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [showNext, handleNext, options, selectedOption, handleSelect]);

    if (!currentCard) return null;

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            {/* Progress */}
            <div className="space-y-2">
                <div className="flex justify-between text-xs text-gray-400 font-bold">
                    <span className="flex items-center gap-2">
                        <Brain size={14} className="text-blue-400" />
                        {progress.answered} / {progress.total}
                    </span>
                    <span>
                        {progress.correct} ✓ · {progress.incorrect} ✗
                    </span>
                </div>
                <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <motion.div
                        className="h-full bg-gradient-to-r from-blue-600 to-cyan-500 rounded-full"
                        animate={{ width: `${progress.percentage}%` }}
                        transition={{ duration: 0.3 }}
                    />
                </div>
            </div>

            {/* Question Card */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={currentCard.id}
                    initial={{ opacity: 0, x: 30 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -30 }}
                    transition={{ duration: 0.25 }}
                    className="glass-panel rounded-3xl p-8 md:p-10 text-center border border-white/10"
                >
                    <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest mb-4 block">
                        ¿Cuál es la definición de...?
                    </span>
                    <h2 className={`font-bold text-white leading-relaxed ${
                        currentCard.front.length > 80 ? 'text-xl' : 'text-2xl md:text-3xl'
                    }`}>
                        {currentCard.front}
                    </h2>
                </motion.div>
            </AnimatePresence>

            {/* Options */}
            <div className="grid gap-3">
                {options.map((option, idx) => {
                    const isSelected = selectedOption === option.id;
                    const isAnswered = selectedOption !== null;
                    let borderColor = 'border-white/10';
                    let bgColor = 'bg-transparent hover:bg-white/5';
                    let textColor = 'text-white';

                    if (isAnswered) {
                        if (option.isCorrect) {
                            borderColor = 'border-emerald-500/50';
                            bgColor = 'bg-emerald-900/20';
                            textColor = 'text-emerald-200';
                        } else if (isSelected && !option.isCorrect) {
                            borderColor = 'border-red-500/50';
                            bgColor = 'bg-red-900/20';
                            textColor = 'text-red-200';
                        } else {
                            bgColor = 'bg-transparent opacity-40';
                        }
                    }

                    return (
                        <motion.button
                            key={option.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{
                                opacity: 1, y: 0,
                                x: isSelected && !option.isCorrect ? [0, -8, 8, -8, 0] : 0
                            }}
                            transition={{
                                delay: idx * 0.05,
                                x: { duration: 0.4, ease: 'easeInOut' }
                            }}
                            onClick={() => handleSelect(option)}
                            disabled={isAnswered}
                            className={`p-4 md:p-5 rounded-2xl glass-panel border ${borderColor} ${bgColor} ${textColor} text-left font-medium transition-all cursor-pointer flex items-center gap-3 ${
                                isAnswered ? 'cursor-default' : 'active:scale-[0.98]'
                            }`}
                        >
                            <span className="text-xs text-gray-500 font-mono w-5 shrink-0">{idx + 1}</span>
                            <span className="flex-1 text-sm md:text-base">{option.text}</span>
                            {isAnswered && option.isCorrect && (
                                <Check size={20} className="text-emerald-400 shrink-0" />
                            )}
                            {isSelected && !option.isCorrect && (
                                <XIcon size={20} className="text-red-400 shrink-0" />
                            )}
                        </motion.button>
                    );
                })}
            </div>

            {/* Next Button */}
            <AnimatePresence>
                {showNext && (
                    <motion.button
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        onClick={handleNext}
                        className={`w-full py-4 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg transition-all active:scale-[0.98] ${
                            isCorrect
                                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white'
                                : 'bg-gradient-to-r from-red-600 to-orange-600 text-white'
                        }`}
                    >
                        {isCorrect ? '¡Correcto!' : 'Siguiente'}
                        <ArrowRight size={18} />
                    </motion.button>
                )}
            </AnimatePresence>

            <p className="text-center text-[10px] text-gray-600 hidden md:block">
                1-4 para elegir · Enter para continuar
            </p>
        </div>
    );
}
