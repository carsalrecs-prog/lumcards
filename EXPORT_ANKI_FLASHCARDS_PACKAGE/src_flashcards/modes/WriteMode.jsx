import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PenTool, Check, X as XIcon, ArrowRight, Eye } from 'lucide-react';
import { fuzzyMatch } from '../hooks/useStudySession';

export default function WriteMode({ session, onComplete }) {
    const { currentCard, currentIndex, queue, isComplete, submitAnswer, getProgress } = session;
    const progress = getProgress();

    const [userInput, setUserInput] = useState('');
    const [result, setResult] = useState(null); // null | { match, score }
    const [overrideCorrect, setOverrideCorrect] = useState(false);
    const [showAnswer, setShowAnswer] = useState(false);
    const inputRef = useRef(null);

    useEffect(() => {
        if (isComplete) onComplete();
    }, [isComplete, onComplete]);

    // Reset state on card change
    useEffect(() => {
        setUserInput('');
        setResult(null);
        setOverrideCorrect(false);
        setShowAnswer(false);
        setTimeout(() => inputRef.current?.focus(), 100);
    }, [currentIndex]);

    const handleSubmit = useCallback((e) => {
        e?.preventDefault();
        if (!currentCard || !userInput.trim()) return;
        if (result !== null) return; // Already submitted

        const matchResult = fuzzyMatch(userInput, currentCard.back);
        setResult(matchResult);
        setShowAnswer(true);
    }, [currentCard, userInput, result]);

    const handleNext = useCallback(() => {
        if (!currentCard) return;
        const isCorrect = result?.match === 'exact' || result?.match === 'close' || overrideCorrect;
        submitAnswer(currentCard.id, isCorrect ? 2 : 0);
    }, [currentCard, result, overrideCorrect, submitAnswer]);

    const handleSkip = useCallback(() => {
        if (!currentCard) return;
        setResult({ match: 'wrong', score: 0 });
        setShowAnswer(true);
    }, [currentCard]);

    // Keyboard: Enter to submit/continue
    useEffect(() => {
        const handler = (e) => {
            if (e.key === 'Enter' && result !== null) {
                e.preventDefault();
                handleNext();
            }
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [result, handleNext]);

    if (!currentCard) return null;

    const isCorrect = result?.match === 'exact' || result?.match === 'close' || overrideCorrect;

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            {/* Progress */}
            <div className="space-y-2">
                <div className="flex justify-between text-xs text-gray-400 font-bold">
                    <span className="flex items-center gap-2">
                        <PenTool size={14} className="text-emerald-400" />
                        {progress.answered} / {progress.total}
                    </span>
                    {progress.streak > 0 && (
                        <span className="text-amber-400 animate-pulse">🔥 {progress.streak} racha</span>
                    )}
                </div>
                <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <motion.div
                        className="h-full bg-gradient-to-r from-emerald-600 to-teal-500 rounded-full"
                        animate={{ width: `${progress.percentage}%` }}
                        transition={{ duration: 0.3 }}
                    />
                </div>
            </div>

            {/* Question */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={currentCard.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="glass-panel rounded-3xl p-8 md:p-10 text-center border border-white/10"
                >
                    <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest mb-4 block">
                        Escribe la respuesta para:
                    </span>
                    <h2 className={`font-bold text-white leading-relaxed ${
                        currentCard.front.length > 80 ? 'text-xl' : 'text-2xl md:text-3xl'
                    }`}>
                        {currentCard.front}
                    </h2>
                </motion.div>
            </AnimatePresence>

            {/* Input Area */}
            <form onSubmit={handleSubmit}>
                <div className={`glass-panel rounded-2xl overflow-hidden border transition-colors ${
                    result === null
                        ? 'border-white/10'
                        : isCorrect
                            ? 'border-emerald-500/30'
                            : 'border-red-500/30'
                }`}>
                    <input
                        ref={inputRef}
                        value={userInput}
                        onChange={e => result === null && setUserInput(e.target.value)}
                        placeholder="Escribe tu respuesta..."
                        disabled={result !== null}
                        className={`w-full p-5 text-lg outline-none bg-transparent ${
                            result === null ? 'text-white' : isCorrect ? 'text-emerald-300' : 'text-red-300'
                        }`}
                    />
                    {result === null && (
                        <div className="flex gap-2 p-3 pt-0">
                            <button
                                type="button"
                                onClick={handleSkip}
                                className="px-4 py-2 text-xs text-gray-500 hover:text-gray-300 transition-colors flex items-center gap-1"
                            >
                                <Eye size={12} /> No sé
                            </button>
                            <div className="flex-1" />
                            <button
                                type="submit"
                                disabled={!userInput.trim()}
                                className="px-6 py-2 bg-emerald-600 text-white rounded-xl font-bold text-sm disabled:opacity-30 active:scale-95 transition-all"
                            >
                                Comprobar
                            </button>
                        </div>
                    )}
                </div>
            </form>

            {/* Feedback */}
            <AnimatePresence>
                {showAnswer && (
                    <motion.div
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="space-y-4"
                    >
                        {/* Result indicator */}
                        <div className={`p-5 rounded-2xl border flex items-start gap-3 ${
                            isCorrect
                                ? 'bg-emerald-900/20 border-emerald-500/20'
                                : 'bg-red-900/20 border-red-500/20'
                        }`}>
                            <div className={`p-2 rounded-full shrink-0 ${isCorrect ? 'bg-emerald-500/20' : 'bg-red-500/20'}`}>
                                {isCorrect
                                    ? <Check size={18} className="text-emerald-400" />
                                    : <XIcon size={18} className="text-red-400" />
                                }
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className={`font-bold text-sm ${isCorrect ? 'text-emerald-300' : 'text-red-300'}`}>
                                    {result?.match === 'exact' ? '¡Perfecto!' :
                                     result?.match === 'close' ? '¡Casi exacto!' :
                                     overrideCorrect ? 'Marcada como correcta' :
                                     'Incorrecto'}
                                </p>
                                <p className="text-sm text-white mt-1">
                                    <span className="text-gray-400">Respuesta correcta: </span>
                                    <span className="font-bold">{currentCard.back}</span>
                                </p>
                                {result?.match === 'close' && (
                                    <p className="text-xs text-gray-400 mt-1">
                                        Tu respuesta: "{userInput}" ({Math.round(result.score * 100)}% similar)
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Override button */}
                        {!isCorrect && !overrideCorrect && (
                            <button
                                onClick={() => setOverrideCorrect(true)}
                                className="w-full py-2 text-xs text-gray-500 hover:text-emerald-400 transition-colors"
                            >
                                Mi respuesta era correcta (sinónimo/variación)
                            </button>
                        )}

                        {/* Next */}
                        <motion.button
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            onClick={handleNext}
                            className={`w-full py-4 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg active:scale-[0.98] transition-all ${
                                isCorrect
                                    ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white'
                                    : 'bg-gradient-to-r from-red-600 to-orange-600 text-white'
                            }`}
                        >
                            Siguiente <ArrowRight size={18} />
                        </motion.button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
