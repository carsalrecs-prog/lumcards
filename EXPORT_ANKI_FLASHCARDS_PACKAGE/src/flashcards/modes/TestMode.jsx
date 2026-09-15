import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Check, X as XIcon, Send, ChevronDown, ChevronUp } from 'lucide-react';
import { fuzzyMatch } from '../hooks/useStudySession';

function shuffleArray(arr) {
    const s = [...arr];
    for (let i = s.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [s[i], s[j]] = [s[j], s[i]];
    }
    return s;
}

/**
 * Generate test questions from cards.
 * Mix of: multiple choice (40%), true/false (30%), written (30%)
 */
function generateQuestions(cards) {
    const shuffled = shuffleArray(cards);
    const questions = shuffled.map((card, idx) => {
        const total = shuffled.length;
        const ratio = idx / total;
        let type;

        if (ratio < 0.4) type = 'multiple';
        else if (ratio < 0.7) type = 'trueFalse';
        else type = 'written';

        // For true/false, randomly decide if statement is correct or swapped
        if (type === 'trueFalse') {
            const isTrue = Math.random() > 0.5;
            const wrongCard = shuffled.find(c => c.id !== card.id);
            return {
                id: card.id,
                type,
                prompt: card.front,
                shownAnswer: isTrue ? card.back : (wrongCard?.back || card.back),
                correctAnswer: card.back,
                isTrue,
                userAnswer: null
            };
        }

        if (type === 'multiple') {
            const others = shuffled.filter(c => c.id !== card.id);
            const distractors = shuffleArray(others).slice(0, 3).map(c => c.back);
            const options = shuffleArray([card.back, ...distractors]);
            return {
                id: card.id,
                type,
                prompt: card.front,
                correctAnswer: card.back,
                options,
                userAnswer: null
            };
        }

        // Written
        return {
            id: card.id,
            type,
            prompt: card.front,
            correctAnswer: card.back,
            userAnswer: ''
        };
    });

    return shuffleArray(questions);
}

export default function TestMode({ cards, onComplete, session }) {
    const [questions, setQuestions] = useState([]);
    const [submitted, setSubmitted] = useState(false);
    const [score, setScore] = useState(null);
    const [expandedReview, setExpandedReview] = useState(new Set());

    useEffect(() => {
        setQuestions(generateQuestions(cards));
        setSubmitted(false);
        setScore(null);
    }, [cards]);

    const updateAnswer = (idx, answer) => {
        if (submitted) return;
        setQuestions(prev => {
            const updated = [...prev];
            updated[idx] = { ...updated[idx], userAnswer: answer };
            return updated;
        });
    };

    const handleSubmit = () => {
        let correct = 0;
        const results = questions.map(q => {
            let isCorrect = false;

            if (q.type === 'multiple') {
                isCorrect = q.userAnswer === q.correctAnswer;
            } else if (q.type === 'trueFalse') {
                const userSaysTrue = q.userAnswer === true;
                isCorrect = userSaysTrue === q.isTrue;
            } else if (q.type === 'written') {
                const match = fuzzyMatch(q.userAnswer || '', q.correctAnswer);
                isCorrect = match.match === 'exact' || match.match === 'close';
            }

            if (isCorrect) correct++;

            // Submit to session for stats
            session?.submitAnswer?.(q.id, isCorrect ? 2 : 0);

            return { ...q, isCorrect };
        });

        setQuestions(results);
        setScore(Math.round((correct / questions.length) * 100));
        setSubmitted(true);
    };

    const answeredCount = questions.filter(q => q.userAnswer !== null && q.userAnswer !== '').length;
    const correctCount = submitted ? questions.filter(q => q.isCorrect).length : 0;

    const toggleReview = (idx) => {
        setExpandedReview(prev => {
            const next = new Set(prev);
            if (next.has(idx)) next.delete(idx);
            else next.add(idx);
            return next;
        });
    };

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <FileText size={22} className="text-rose-400" /> Test
                </h2>
                {!submitted && (
                    <span className="text-xs text-gray-400">
                        {answeredCount} / {questions.length} respondidas
                    </span>
                )}
            </div>

            {/* Score Banner */}
            {submitted && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className={`glass-panel rounded-3xl p-8 text-center border ${
                        score >= 80 ? 'border-emerald-500/20' : score >= 50 ? 'border-amber-500/20' : 'border-red-500/20'
                    }`}
                >
                    <motion.p
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', stiffness: 200 }}
                        className={`text-6xl font-bold mb-2 ${
                            score >= 80 ? 'text-emerald-400' : score >= 50 ? 'text-amber-400' : 'text-red-400'
                        }`}
                    >
                        {score}%
                    </motion.p>
                    <p className="text-gray-400 text-sm">
                        {correctCount} de {questions.length} correctas
                    </p>
                    <p className="text-lg font-bold text-white mt-2">
                        {score >= 90 ? '¡Excelente! 🌟' : score >= 70 ? '¡Muy bien! 👏' : score >= 50 ? 'Puedes mejorar 💪' : 'Sigue practicando 📚'}
                    </p>
                    <div className="flex gap-3 justify-center mt-6">
                        <button
                            onClick={() => {
                                setQuestions(generateQuestions(cards));
                                setSubmitted(false);
                                setScore(null);
                                setExpandedReview(new Set());
                            }}
                            className="px-6 py-3 rounded-2xl bg-white/5 text-gray-300 font-bold border border-white/10 hover:bg-white/10 transition-all"
                        >
                            Repetir Test
                        </button>
                        <button
                            onClick={onComplete}
                            className="px-6 py-3 rounded-2xl bg-gradient-to-r from-rose-600 to-pink-600 text-white font-bold shadow-lg active:scale-95 transition-all"
                        >
                            Finalizar
                        </button>
                    </div>
                </motion.div>
            )}

            {/* Questions */}
            <div className="space-y-4">
                {questions.map((q, idx) => (
                    <motion.div
                        key={q.id + idx}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: Math.min(idx * 0.03, 0.5) }}
                        className={`glass-panel rounded-2xl p-5 border transition-colors ${
                            submitted
                                ? q.isCorrect
                                    ? 'border-emerald-500/20'
                                    : 'border-red-500/20'
                                : 'border-white/5'
                        }`}
                    >
                        {/* Question header */}
                        <div className="flex items-start justify-between gap-2 mb-3">
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-mono text-gray-600">{idx + 1}</span>
                                <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                                    q.type === 'multiple' ? 'bg-blue-500/10 text-blue-400'
                                    : q.type === 'trueFalse' ? 'bg-purple-500/10 text-purple-400'
                                    : 'bg-emerald-500/10 text-emerald-400'
                                }`}>
                                    {q.type === 'multiple' ? 'Opción múltiple' : q.type === 'trueFalse' ? 'V/F' : 'Escribir'}
                                </span>
                            </div>
                            {submitted && (
                                q.isCorrect
                                    ? <Check size={18} className="text-emerald-400 shrink-0" />
                                    : <XIcon size={18} className="text-red-400 shrink-0" />
                            )}
                        </div>

                        {/* Prompt */}
                        <p className="font-bold text-white mb-4">{q.prompt}</p>

                        {/* Answer area depends on type */}
                        {q.type === 'multiple' && (
                            <div className="grid gap-2">
                                {q.options.map((opt, optIdx) => {
                                    const isSelected = q.userAnswer === opt;
                                    const isCorrectOpt = opt === q.correctAnswer;
                                    let optClass = 'bg-white/5 border-white/5 text-gray-300 hover:bg-white/10';

                                    if (submitted) {
                                        if (isCorrectOpt) optClass = 'bg-emerald-900/20 border-emerald-500/30 text-emerald-200';
                                        else if (isSelected) optClass = 'bg-red-900/20 border-red-500/30 text-red-200';
                                        else optClass = 'bg-white/5 border-white/5 text-gray-500 opacity-50';
                                    } else if (isSelected) {
                                        optClass = 'bg-violet-900/30 border-violet-500/30 text-white';
                                    }

                                    return (
                                        <button
                                            key={optIdx}
                                            onClick={() => updateAnswer(idx, opt)}
                                            disabled={submitted}
                                            className={`p-3 rounded-xl border text-left text-sm font-medium transition-all ${optClass}`}
                                        >
                                            <span className="text-xs text-gray-500 mr-2">{String.fromCharCode(65 + optIdx)}</span>
                                            {opt}
                                        </button>
                                    );
                                })}
                            </div>
                        )}

                        {q.type === 'trueFalse' && (
                            <div>
                                <p className="text-gray-300 text-sm mb-3 italic">"{q.shownAnswer}"</p>
                                <div className="flex gap-3">
                                    {[true, false].map(val => {
                                        const isSelected = q.userAnswer === val;
                                        const isCorrectChoice = submitted && (val === q.isTrue);
                                        let btnClass = 'bg-white/5 border-white/10 text-gray-400';

                                        if (submitted) {
                                            if (isCorrectChoice) btnClass = 'bg-emerald-900/20 border-emerald-500/30 text-emerald-300';
                                            else if (isSelected) btnClass = 'bg-red-900/20 border-red-500/30 text-red-300';
                                        } else if (isSelected) {
                                            btnClass = 'bg-violet-900/30 border-violet-500/30 text-white';
                                        }

                                        return (
                                            <button
                                                key={String(val)}
                                                onClick={() => updateAnswer(idx, val)}
                                                disabled={submitted}
                                                className={`flex-1 py-3 rounded-xl border font-bold text-sm transition-all ${btnClass}`}
                                            >
                                                {val ? 'Verdadero' : 'Falso'}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {q.type === 'written' && (
                            <div>
                                <input
                                    value={q.userAnswer || ''}
                                    onChange={e => updateAnswer(idx, e.target.value)}
                                    disabled={submitted}
                                    placeholder="Escribe tu respuesta..."
                                    className={`w-full p-3 rounded-xl border outline-none text-sm ${
                                        submitted
                                            ? q.isCorrect
                                                ? 'border-emerald-500/30 text-emerald-300 bg-emerald-900/10'
                                                : 'border-red-500/30 text-red-300 bg-red-900/10'
                                            : 'border-white/10 text-white bg-black/30'
                                    }`}
                                />
                                {submitted && !q.isCorrect && (
                                    <p className="text-xs text-gray-400 mt-2">
                                        Correcta: <span className="text-emerald-300 font-bold">{q.correctAnswer}</span>
                                    </p>
                                )}
                            </div>
                        )}

                        {/* Review details for wrong answers */}
                        {submitted && !q.isCorrect && (
                            <button
                                onClick={() => toggleReview(idx)}
                                className="mt-2 text-xs text-gray-500 hover:text-gray-300 flex items-center gap-1 transition-colors"
                            >
                                {expandedReview.has(idx) ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                                {expandedReview.has(idx) ? 'Ocultar' : 'Ver respuesta correcta'}
                            </button>
                        )}
                        {submitted && !q.isCorrect && expandedReview.has(idx) && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                className="mt-2 p-3 bg-emerald-900/10 rounded-xl border border-emerald-500/10"
                            >
                                <p className="text-sm text-emerald-300">
                                    <span className="font-bold">Correcta:</span> {q.correctAnswer}
                                </p>
                            </motion.div>
                        )}
                    </motion.div>
                ))}
            </div>

            {/* Submit Button */}
            {!submitted && (
                <motion.button
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    onClick={handleSubmit}
                    className="w-full py-4 rounded-2xl bg-gradient-to-r from-rose-600 to-pink-600 text-white font-bold shadow-lg flex items-center justify-center gap-2 active:scale-[0.98] transition-all sticky bottom-20 md:bottom-4 z-10"
                >
                    <Send size={18} /> Entregar Examen ({answeredCount}/{questions.length})
                </motion.button>
            )}
        </div>
    );
}
